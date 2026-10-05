import { Router, type Request, type Response } from "express";
import { prisma } from "../db";
import { occurrenceService } from "../domain";
import { todayUtc, formatInTz, addDays } from "../dates";
import { processUserMessage } from "../ai/gemini";
import { requireUserMiddleware, type SessionData } from "../auth";
import { cacheService } from "../cache";
import { getAlarmSettings, type AlarmSettings } from "./settings";
import type { Prisma } from "@prisma/client";

const router = Router();

router.post("/chat", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as Request & { user: SessionData }).user;
    const { message, conversationId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message cannot be empty" });
      return;
    }

    const today = todayUtc();
    const rawOccurrences = await occurrenceService.getForDate(today);
    const todayOccurrences = rawOccurrences.map((o) => ({
      id: o.id,
      title: o.routineItem.title,
      category: o.routineItem.category,
      time: o.scheduledTime,
      status: o.status,
    }));

    let conv = conversationId
      ? await prisma.conversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conv) {
      let validUserId = session.userId;
      const userExists = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!userExists) {
        const primaryUser = await prisma.user.findFirst({ where: { role: "USER" } });
        if (primaryUser) validUserId = primaryUser.id;
      }

      conv = await prisma.conversation.create({
        data: {
          userId: validUserId,
          title: message.slice(0, 40),
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: "USER",
        content: message,
      },
    });

    const aiResult = await processUserMessage(message, {
      todayDate: formatInTz(today, "EEEE, MMMM d, yyyy"),
      timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
      todayOccurrences,
    });

    let actionStatus = "PROPOSED";
    if (aiResult.action) {
      const act = aiResult.action;
      if (act.intent === "COMPLETE" && act.target?.id) {
        try {
          await occurrenceService.complete(act.target.id);
          actionStatus = "EXECUTED";
        } catch {
          actionStatus = "FAILED";
        }
      } else if (act.intent === "SKIP" && act.target?.id) {
        try {
          await occurrenceService.skip(act.target.id);
          actionStatus = "EXECUTED";
        } catch {
          actionStatus = "FAILED";
        }
      } else if (act.intent === "LOG_ACTIVITY") {
        try {
          const data = (act.data || {}) as Record<string, unknown>;
          const steps = typeof data.steps === "number" ? data.steps : undefined;
          const distanceKm = typeof data.distanceKm === "number" ? data.distanceKm : (steps ? parseFloat((steps * 0.000762).toFixed(2)) : undefined);
          const caloriesBurned = typeof data.caloriesBurned === "number" ? data.caloriesBurned : (steps ? Math.round(steps * 0.04) : undefined);
          const durationMinutes = typeof data.durationMinutes === "number" ? data.durationMinutes : 25;
          const activityType = (data.activityType as string) || "WALK";
          const title = (data.title as string) || "Movement Session";
          const noteText = `${steps ? `${steps.toLocaleString()} steps • ` : ""}${distanceKm ? `${distanceKm} km • ` : ""}${caloriesBurned ? `${caloriesBurned} kcal` : ""}`.trim();

          let targetOccId = act.target?.id;
          if (!targetOccId) {
            const match = todayOccurrences.find((o) =>
              o.title.toLowerCase().includes("walk") ||
              o.title.toLowerCase().includes("run") ||
              o.title.toLowerCase().includes("workout") ||
              o.category === "WORKOUT" ||
              o.category === "ACTIVITY"
            );
            if (match && match.status === "PENDING") {
              targetOccId = match.id;
            }
          }

          if (targetOccId) {
            try {
              await occurrenceService.complete(targetOccId, noteText);
            } catch {
              // Ignore if already marked
            }
          }

          await prisma.activityLog.create({
            data: {
              date: today,
              activityType,
              title,
              steps,
              distanceKm,
              durationMinutes,
              caloriesBurned,
              notes: noteText,
              occurrenceId: targetOccId || null,
            },
          });

          await occurrenceService.invalidateDateCache(today);
          actionStatus = "EXECUTED";
        } catch (err) {
          console.error("LOG_ACTIVITY execution error:", err);
          actionStatus = "FAILED";
        }
      } else if (act.intent === "SET_GOAL") {
        try {
          const data = (act.data || {}) as Record<string, unknown>;
          const monthStr = (data.month as string) || formatInTz(today, "yyyy-MM");
          const targetWeightKg = typeof data.targetWeightKg === "number" ? data.targetWeightKg : 72;
          const status = (data.status as string) || "IN_PROGRESS";
          const dailyStepsTarget = typeof data.dailyStepsTarget === "number" ? data.dailyStepsTarget : 8000;
          const notes = (data.notes as string) || (status === "ACHIEVED" ? `Target weight ${targetWeightKg}kg achieved!` : `Target ${targetWeightKg}kg active for month.`);

          await prisma.monthlyGoal.upsert({
            where: { month: monthStr },
            update: {
              targetWeightKg,
              status,
              dailyStepsTarget,
              velocityNotes: notes,
            },
            create: {
              month: monthStr,
              targetWeightKg,
              status,
              dailyStepsTarget,
              velocityNotes: notes,
            },
          });

          await cacheService.invalidatePattern("analytics:");
          await cacheService.del(`today_payload:${formatInTz(today, "yyyy-MM-dd")}`);
          actionStatus = "EXECUTED";
        } catch (err) {
          console.error("SET_GOAL execution error:", err);
          actionStatus = "FAILED";
        }
      } else if (act.intent === "SET_ROUTINE") {
        try {
          const data = (act.data || {}) as Record<string, unknown>;
          const title = (data.title as string) || "Daily Routine Activity";
          const category = (data.category as "WORKOUT" | "ACTIVITY" | "MEAL" | "SUPPLEMENT" | "HYDRATION" | "OTHER") || "ACTIVITY";
          const scheduledTime = (data.scheduledTime as string) || "07:00";
          const effectiveDate = addDays(today, 1); // starts tomorrow, preserving past schedule in DB untouched!

          let plan = await prisma.plan.findFirst({ where: { status: "ACTIVE" } });
          if (!plan) {
            plan = await prisma.plan.create({ data: { name: "Personal Routine OS", status: "ACTIVE" } });
          }

          const routineItem = await prisma.routineItem.create({
            data: {
              planId: plan.id,
              title,
              category,
              type: category.toLowerCase(),
            },
          });

          await prisma.schedule.create({
            data: {
              routineItemId: routineItem.id,
              recurrenceRule: "DAILY",
              scheduledTime,
              effectiveFrom: effectiveDate,
            },
          });

          await cacheService.invalidatePattern("occurrences:");
          await cacheService.invalidatePattern("analytics:");
          actionStatus = "EXECUTED";
        } catch (err) {
          console.error("SET_ROUTINE execution error:", err);
          actionStatus = "FAILED";
        }
      } else if (act.intent === "LOG_RECOVERY") {
        try {
          const data = (act.data || {}) as Record<string, unknown>;
          const dateKey = today.toISOString().split("T")[0];

          let recoveryLog = await prisma.activityLog.findFirst({
            where: { date: today, activityType: "RECOVERY" },
          });

          let currentData = {
            sleepHours: 7.5,
            sleepQuality: "OPTIMAL",
            sorenessLevel: "LOW",
            electrolytesTaken: false,
            creatineTaken: false,
            magnesiumTaken: false,
            morningMobilityDone: false,
            postMealWalksCount: 0,
            recoveryScore: 85,
          };

          if (recoveryLog?.notes) {
            try {
              currentData = { ...currentData, ...JSON.parse(recoveryLog.notes) };
            } catch {}
          }

          const merged = { ...currentData, ...data };

          let score = 0;
          if (merged.sleepHours >= 7.5) score += 35;
          else if (merged.sleepHours >= 6.5) score += 25;
          else score += 15;

          if (merged.sorenessLevel === "NONE") score += 20;
          else if (merged.sorenessLevel === "LOW") score += 18;
          else if (merged.sorenessLevel === "MILD") score += 12;
          else score += 5;

          if (merged.electrolytesTaken) score += 10;
          if (merged.creatineTaken) score += 10;
          if (merged.magnesiumTaken) score += 10;
          if (merged.morningMobilityDone) score += 15;

          merged.recoveryScore = Math.min(100, score);

          if (recoveryLog) {
            await prisma.activityLog.update({
              where: { id: recoveryLog.id },
              data: {
                notes: JSON.stringify(merged),
                title: `Recovery Readiness (${merged.recoveryScore}%)`,
              },
            });
          } else {
            await prisma.activityLog.create({
              data: {
                date: today,
                activityType: "RECOVERY",
                title: `Recovery Readiness (${merged.recoveryScore}%)`,
                notes: JSON.stringify(merged),
              },
            });
          }

          await cacheService.del(`today_payload:${dateKey}`);
          await cacheService.invalidatePattern("today_payload:");
          await cacheService.invalidatePattern("analytics:");
          actionStatus = "EXECUTED";
        } catch (err) {
          console.error("LOG_RECOVERY execution error:", err);
          actionStatus = "FAILED";
        }
      } else if (act.intent === "CONFIGURE_ALARMS") {
        try {
          const data = (act.data || {}) as Record<string, unknown>;
          const current = await getAlarmSettings();

          const routineId = (data.routineId as string | undefined)?.toLowerCase();
          const time = data.time as string | undefined;
          const sound = (data.sound as any) || current.sound;
          const volume = typeof data.volume === "number" ? data.volume : current.volume;
          const enabled = typeof data.enabled === "boolean" ? data.enabled : true;

          let updatedRoutines = current.routines.map((r) => {
            if (routineId && (r.id.toLowerCase() === routineId || r.category.toLowerCase() === routineId)) {
              return {
                ...r,
                time: time || r.time,
                enabled,
              };
            }
            return r;
          });

          if (routineId && time && !updatedRoutines.some((r) => r.id.toLowerCase() === routineId)) {
            updatedRoutines.push({
              id: routineId,
              name: `${routineId.charAt(0).toUpperCase() + routineId.slice(1)} Protocol`,
              time,
              category: "OTHER",
              enabled: true,
            });
          }

          const merged: AlarmSettings = {
            ...current,
            sound,
            volume,
            routines: updatedRoutines,
          };

          await prisma.systemSetting.upsert({
            where: { key: "alarm_settings" },
            create: { key: "alarm_settings", value: JSON.stringify(merged) },
            update: { value: JSON.stringify(merged) },
          });

          actionStatus = "EXECUTED";
        } catch (err) {
          console.error("CONFIGURE_ALARMS execution error:", err);
          actionStatus = "FAILED";
        }
      }
    }

    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: "ASSISTANT",
        content: aiResult.reply,
        actionType: aiResult.action?.intent,
        actionPayload: (aiResult.action || null) as Prisma.InputJsonValue,
        actionStatus,
      },
    });

    res.json({
      conversationId: conv.id,
      messageId: assistantMsg.id,
      reply: aiResult.reply,
      action: aiResult.action,
      actionStatus,
    });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

router.get("/chat", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as Request & { user: SessionData }).user;
    const conversationId = req.query.conversationId as string | undefined;

    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });
      res.json({ messages });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    res.json({ conversations });
  } catch (err) {
    console.error("GET /api/chat error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

export default router;
