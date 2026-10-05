import { Router, type Request, type Response } from "express";
import { occurrenceService, analyticsService, type TodayOccurrence } from "../domain";
import { todayUtc, formatInTz } from "../dates";
import { requireUserMiddleware } from "../auth";
import { cache } from "../cache";
import { prisma } from "../db";

const router = Router();

router.get("/today", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = todayUtc();
    const dateKey = today.toISOString().split("T")[0];
    const cacheKey = `today_payload:${dateKey}`;

    // Set HTTP performance headers: connection keep-alive & stale-while-revalidate
    res.setHeader("Cache-Control", "private, max-age=5, stale-while-revalidate=15");

    // Fast path: serve cached payload if fresh (<1ms latency)
    const cachedPayload = await cache.get(cacheKey);
    if (cachedPayload) {
      res.json(cachedPayload);
      return;
    }

    // Ensure occurrences exist for today (cached check inside)
    await occurrenceService.generateForRange(today, today);

    // Single DB query for occurrences
    const rawOccurrences = await occurrenceService.getForDate(today);

    // Transform occurrences in one pass
    const occurrences: TodayOccurrence[] = rawOccurrences.map((occ) => {
      const plannedNutrition = occ.routineItem.nutritionSnapshots[0];
      const actualNutrition = occ.nutritionSnapshots[0];
      const nutritionSnapshot = actualNutrition || plannedNutrition;

      return {
        id: occ.id,
        title: occ.routineItem.title,
        category: occ.routineItem.category,
        scheduledTime: occ.scheduledTime,
        status: occ.status,
        routineItemId: occ.routineItemId,
        nutrition: nutritionSnapshot
          ? {
              calories: nutritionSnapshot.calories ?? undefined,
              protein: nutritionSnapshot.protein ?? undefined,
              carbs: nutritionSnapshot.carbs ?? undefined,
              fat: nutritionSnapshot.fat ?? undefined,
              fiber: nutritionSnapshot.fiber ?? undefined,
            }
          : undefined,
        hasAlternatives: occ.routineItem.primaryAlternatives.length > 0,
        alternatives: occ.routineItem.primaryAlternatives.map((alt) => ({
          id: alt.id,
          itemId: alt.alternativeItemId,
          title: alt.alternativeItem.title,
        })),
        hasReminder: false,
        meal: occ.routineItem.meal
          ? {
              mealType: occ.routineItem.meal.mealType,
              components: occ.routineItem.meal.components.map((c) => ({
                name: c.name,
                quantity: c.quantity ?? undefined,
                unit: c.unit ?? undefined,
              })),
            }
          : undefined,
      };
    });

    // Zero-DB roundtrip: compute stats directly from rawOccurrences in memory
    const stats = analyticsService.computeDailyStatsFromOccurrences(today, rawOccurrences);

    // Extract hydration from DB occurrence
    const hydrationOcc = rawOccurrences.find((o) => o.routineItem.category === "HYDRATION");
    let waterIntakeMl = 0;
    if (hydrationOcc?.completion?.notes) {
      const parsed = parseInt(hydrationOcc.completion.notes, 10);
      if (!isNaN(parsed)) waterIntakeMl = parsed;
    } else if (hydrationOcc?.status === "COMPLETED") {
      waterIntakeMl = 3000;
    }

    const monthKey = formatInTz(today, "yyyy-MM");
    const [todayActivityLogs, currentMonthGoal] = await Promise.all([
      prisma.activityLog.findMany({
        where: { date: today },
        orderBy: { createdAt: "desc" },
      }),
      prisma.monthlyGoal.findUnique({
        where: { month: monthKey },
      }),
    ]);

    const totalSteps = todayActivityLogs.reduce((acc, log) => acc + (log.steps || 0), 0);
    const totalDistanceKm = parseFloat(todayActivityLogs.reduce((acc, log) => acc + (log.distanceKm || 0), 0).toFixed(2));
    const totalCaloriesBurned = todayActivityLogs.reduce((acc, log) => acc + (log.caloriesBurned || 0), 0);

    // Non-gym fitness & recovery metrics (Sleep, Soreness, Hydration/Electrolytes, Creatine, Mobility)
    const recoveryLog = todayActivityLogs.find((l) => l.activityType === "RECOVERY");
    let recoveryData = {
      sleepHours: 7.5,
      sleepQuality: "OPTIMAL" as "POOR" | "FAIR" | "GOOD" | "OPTIMAL",
      sorenessLevel: "LOW" as "NONE" | "LOW" | "MILD" | "HIGH",
      electrolytesTaken: false,
      creatineTaken: false,
      magnesiumTaken: false,
      morningMobilityDone: false,
      postMealWalksCount: todayActivityLogs.filter((l) => l.title?.toLowerCase().includes("walk") || l.title?.toLowerCase().includes("stroll")).length,
      recoveryScore: 85,
    };

    if (recoveryLog?.notes) {
      try {
        const parsed = JSON.parse(recoveryLog.notes);
        recoveryData = { ...recoveryData, ...parsed };
      } catch {
        // default
      }
    }

    const payload = {
      date: formatInTz(today, "EEEE, MMMM d, yyyy"),
      isoDate: today.toISOString(),
      occurrences,
      stats,
      waterIntakeMl,
      recovery: recoveryData,
      activity: {
        totalSteps,
        totalDistanceKm,
        totalCaloriesBurned,
        logs: todayActivityLogs.map((l) => ({
          id: l.id,
          title: l.title,
          steps: l.steps,
          distanceKm: l.distanceKm,
          caloriesBurned: l.caloriesBurned,
          notes: l.notes,
          time: formatInTz(l.createdAt, "HH:mm"),
        })),
      },
      monthlyGoal: currentMonthGoal
        ? {
            month: currentMonthGoal.month,
            targetWeightKg: currentMonthGoal.targetWeightKg,
            currentWeightKg: currentMonthGoal.currentWeightKg,
            dailyStepsTarget: currentMonthGoal.dailyStepsTarget,
            status: currentMonthGoal.status,
            velocityNotes: currentMonthGoal.velocityNotes,
          }
        : {
            month: monthKey,
            targetWeightKg: 72,
            currentWeightKg: 74,
            dailyStepsTarget: 8000,
            status: "IN_PROGRESS",
            velocityNotes: "October Goal: 72kg Target Weight. Tracked against daily adherence.",
          },
    };

    // Cache payload for 30s (invalidated automatically on complete/skip/replace/plan import)
    await cache.set(cacheKey, payload, 30);

    res.json(payload);
  } catch (err) {
    console.error("GET /api/today error:", err);
    res.status(500).json({ error: "Failed to fetch today's routine" });
  }
});

router.post("/today/hydration", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const deltaMl = Number(req.body?.deltaMl) || 250;
    const today = todayUtc();
    const dateKey = today.toISOString().split("T")[0];

    // Ensure occurrences exist
    await occurrenceService.generateForRange(today, today);
    const rawOccurrences = await occurrenceService.getForDate(today);
    let hydrationOcc = rawOccurrences.find((o) => o.routineItem.category === "HYDRATION");

    if (!hydrationOcc) {
      let plan = await prisma.plan.findFirst({ where: { status: "ACTIVE" } });
      if (!plan) plan = await prisma.plan.findFirst();
      if (!plan) {
        res.status(400).json({ error: "No active plan found" });
        return;
      }
      let item = await prisma.routineItem.findFirst({
        where: { planId: plan.id, category: "HYDRATION" },
      });
      if (!item) {
        item = await prisma.routineItem.create({
          data: {
            planId: plan.id,
            title: "Hydration Protocol (3L Target)",
            category: "HYDRATION",
          },
        });
      }
      let sched = await prisma.schedule.findFirst({
        where: { routineItemId: item.id },
      });
      if (!sched) {
        sched = await prisma.schedule.create({
          data: {
            routineItemId: item.id,
            recurrenceRule: "DAILY",
            scheduledTime: "08:00",
            effectiveFrom: today,
          },
        });
      }
      const createdOcc = await prisma.occurrence.upsert({
        where: {
          scheduleId_scheduledDate: {
            scheduleId: sched.id,
            scheduledDate: today,
          },
        },
        update: {},
        create: {
          scheduleId: sched.id,
          routineItemId: item.id,
          scheduledDate: today,
          scheduledTime: "08:00",
          status: "PENDING",
        },
        include: {
          routineItem: {
            include: {
              nutritionSnapshots: true,
              primaryAlternatives: { include: { alternativeItem: true } },
              meal: { include: { components: true } },
            },
          },
          completion: true,
          nutritionSnapshots: true,
        },
      });
      hydrationOcc = createdOcc;
    }

    let current = 0;
    if (hydrationOcc.completion?.notes) {
      const parsed = parseInt(hydrationOcc.completion.notes, 10);
      if (!isNaN(parsed)) current = parsed;
    } else if (hydrationOcc.status === "COMPLETED") {
      current = 3000;
    }

    const nextAmount = Math.min(6000, current + deltaMl);
    const nextStatus = nextAmount >= 3000 ? "COMPLETED" : "PARTIAL";

    await prisma.occurrence.update({
      where: { id: hydrationOcc.id },
      data: { status: nextStatus },
    });

    await prisma.completion.upsert({
      where: { occurrenceId: hydrationOcc.id },
      update: {
        status: nextStatus,
        notes: nextAmount.toString(),
        completedAt: new Date(),
      },
      create: {
        occurrenceId: hydrationOcc.id,
        status: nextStatus,
        notes: nextAmount.toString(),
      },
    });

    // Invalidate caches
    await cache.del(`today_payload:${dateKey}`);
    await cache.del(`occurrences:${dateKey}`);
    await cache.invalidatePattern("analytics:");

    res.json({ success: true, waterIntakeMl: nextAmount });
  } catch (err) {
    console.error("POST /api/today/hydration error:", err);
    res.status(500).json({ error: "Failed to log hydration" });
  }
});

// Non-Gym Fitness & Recovery updates (Sleep, Readiness, Soreness, Daily Supplements, Mobility)
router.post("/today/fitness-recovery", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const today = todayUtc();
    const dateKey = today.toISOString().split("T")[0];
    const updates = req.body || {};

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

    const merged = { ...currentData, ...updates };

    // Compute dynamic recovery readiness score
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

    await cache.del(`today_payload:${dateKey}`);
    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("analytics:");

    res.json({ success: true, recovery: merged });
  } catch (err) {
    console.error("POST /api/today/fitness-recovery error:", err);
    res.status(500).json({ error: "Failed to update fitness recovery" });
  }
});

export default router;

