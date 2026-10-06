import { Router, type Request, type Response } from "express";
import { occurrenceService, analyticsService, type TodayOccurrence } from "../domain";
import { todayUtc, formatInTz, dateKeyInTz } from "../dates";
import { requireUserMiddleware } from "../auth";
import { cache } from "../cache";
import { prisma } from "../db";


const router = Router();

router.get("/today", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = todayUtc();
    const dateKey = dateKeyInTz(today);
    const cacheKey = `today_payload:${dateKey}`;

    // Set HTTP performance headers: connection keep-alive & stale-while-revalidate
    res.setHeader("Cache-Control", "private, max-age=5, stale-while-revalidate=30");

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
    const [todayActivityLogs, currentMonthGoal, phaseSetting, lastWeightSetting] = await Promise.all([
      prisma.activityLog.findMany({
        where: { date: today },
        orderBy: { createdAt: "desc" },
      }),
      cache.wrap(`goal:${monthKey}`, 120, () =>
        prisma.monthlyGoal.findUnique({
          where: { month: monthKey },
        })
      ),
      cache.wrap("setting:current_phase", 120, () =>
        prisma.systemSetting.findUnique({
          where: { key: "current_phase" },
        })
      ),
      cache.wrap("setting:last_weight", 120, () =>
        prisma.systemSetting.findUnique({
          where: { key: "last_weight" },
        })
      ),
    ]);

    // Extract off-plan / different meals logged for today
    const differentMealsLogs = todayActivityLogs.filter(
      (l) => l.activityType === "OFF_PLAN_MEAL" || l.activityType === "DIFFERENT_MEAL"
    );

    const differentMeals = differentMealsLogs.map((l) => {
      let extra = { calories: l.caloriesBurned || 0, protein: 0, carbs: 0, fat: 0, mealSlot: "Extra", notes: "" };
      try {
        if (l.notes) extra = { ...extra, ...JSON.parse(l.notes) };
      } catch {}
      return {
        id: l.id,
        title: l.title,
        calories: Number(extra.calories) || Number(l.caloriesBurned) || 0,
        protein: Number(extra.protein) || 0,
        carbs: Number(extra.carbs) || 0,
        fat: Number(extra.fat) || 0,
        mealSlot: extra.mealSlot || "Extra",
        notes: extra.notes || "",
        time: formatInTz(l.createdAt, "HH:mm"),
      };
    });

    const offPlanCalories = differentMeals.reduce((acc, m) => acc + m.calories, 0);
    const offPlanProtein = differentMeals.reduce((acc, m) => acc + m.protein, 0);
    const offPlanCarbs = differentMeals.reduce((acc, m) => acc + m.carbs, 0);
    const offPlanFat = differentMeals.reduce((acc, m) => acc + m.fat, 0);

    // Extract daily body weight log
    const todayWeightLog = todayActivityLogs.find((l) => l.activityType === "WEIGHT");
    let recordedWeight: number | null = null;
    if (todayWeightLog) {
      if (todayWeightLog.distanceKm) {
        recordedWeight = todayWeightLog.distanceKm;
      } else if (todayWeightLog.notes) {
        try {
          const parsed = JSON.parse(todayWeightLog.notes);
          recordedWeight = parsed.weightKg;
        } catch {}
      }
    }

    const defaultWeight = lastWeightSetting?.value
      ? parseFloat(lastWeightSetting.value)
      : (currentMonthGoal?.currentWeightKg || 74);

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

    const defaultEndDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    let phaseConfig = {
      name: currentMonthGoal?.velocityNotes || "Phase 1 — Winter Arc",
      subtitle: `${formatInTz(today, "MMMM yyyy")} Foundation`,
      theme: "Consistency & Discipline",
      startDate: formatInTz(today, "yyyy-MM-01"),
      endDate: formatInTz(defaultEndDate, "yyyy-MM-dd"),
      targetWeightKg: currentMonthGoal?.targetWeightKg || 72,
      currentWeightKg: currentMonthGoal?.currentWeightKg || 74,
      dailyStepsTarget: currentMonthGoal?.dailyStepsTarget || 8000,
      dailyWaterTargetMl: currentMonthGoal?.dailyWaterTargetMl || 3000,
      targetCalories: 1600,
      isConfigured: false,
    };

    if (phaseSetting?.value) {
      try {
        const parsed = JSON.parse(phaseSetting.value);
        phaseConfig = { ...phaseConfig, ...parsed, isConfigured: true };
      } catch (err) {
        console.warn("Failed to parse current_phase setting:", err);
      }
    }

    const targetEndDate = new Date(`${phaseConfig.endDate}T23:59:59.999Z`);
    const targetStartDate = new Date(`${phaseConfig.startDate || formatInTz(today, "yyyy-MM-01")}T00:00:00.000Z`);
    const diffMs = targetEndDate.getTime() - today.getTime();
    const daysRemainingInPhase = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const totalDurationDays = Math.max(1, Math.ceil((targetEndDate.getTime() - targetStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.min(totalDurationDays, totalDurationDays - daysRemainingInPhase));
    const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDurationDays) * 100)));

    const winterArc = {
      phase: 1,
      totalPhases: 1,
      phaseTitle: phaseConfig.name,
      phaseSubtitle: phaseConfig.subtitle,
      theme: phaseConfig.theme,
      targetWeightKg: phaseConfig.targetWeightKg,
      currentWeightKg: phaseConfig.currentWeightKg,
      targetCalories: phaseConfig.targetCalories || 1600,
      startDate: phaseConfig.startDate,
      endDate: phaseConfig.endDate,
      daysRemainingInPhase,
      totalDurationDays,
      progressPercent,
      dailyStepsTarget: phaseConfig.dailyStepsTarget,
      dailyWaterTargetMl: phaseConfig.dailyWaterTargetMl,
      weeklyWorkoutsTarget: currentMonthGoal?.weeklyWorkoutsTarget || 5,
      isConfigured: phaseConfig.isConfigured,
      isPhaseTransitionDue: false,
      nextPhasePreview: null,
    };

    const enrichedStats = {
      ...stats,
      plannedCalories: stats.plannedNutrition?.calories || winterArc.targetCalories || 1600,
      consumedCalories: (stats.nutrition?.calories || 0) + offPlanCalories,
      offPlanCalories,
      totalCalories: (stats.nutrition?.calories || 0) + offPlanCalories,
      offPlanProtein,
      offPlanCarbs,
      offPlanFat,
      hasDifferentFood: differentMeals.length > 0,
    };

    const payload = {
      date: formatInTz(today, "EEEE, MMMM d, yyyy"),
      isoDate: today.toISOString(),
      occurrences,
      stats: enrichedStats,
      waterIntakeMl,
      recovery: recoveryData,
      winterArc,
      differentMeals,
      weightInfo: {
        todayWeight: recordedWeight,
        defaultWeight: defaultWeight || 74,
        isLoggedToday: recordedWeight !== null,
      },
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

    // Cache payload for 60s (invalidated automatically on complete/skip/replace/plan import)
    await cache.set(cacheKey, payload, 60);

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

// Unified Day-End Telemetry Submit (Drag Sliders for Steps, Water, Creatine/Electrolytes + Auto/Manual Lock)
router.post("/today/telemetry-submit", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const today = todayUtc();
    const dateKey = today.toISOString().split("T")[0];
    const {
      steps = 0,
      stepsTimeOfDay = "EVENING",
      waterIntakeMl = 0,
      waterTimeOfDay = "AFTERNOON",
      recovery = {},
      isManualSubmit = false,
    } = req.body || {};

    // 1. Upsert or update today's steps in ActivityLog
    if (steps > 0) {
      const distanceKm = parseFloat((steps * 0.000762).toFixed(2));
      const caloriesBurned = Math.round(steps * 0.04);
      const title = `${steps.toLocaleString()} Steps (${stepsTimeOfDay.toLowerCase()})`;

      const existingStepLog = await prisma.activityLog.findFirst({
        where: { date: today, activityType: "STEPS" },
      });

      if (existingStepLog) {
        await prisma.activityLog.update({
          where: { id: existingStepLog.id },
          data: {
            steps,
            distanceKm,
            caloriesBurned,
            title,
            notes: `${stepsTimeOfDay} logged • ${distanceKm} km • ${caloriesBurned} kcal`,
          },
        });
      } else {
        await prisma.activityLog.create({
          data: {
            date: today,
            activityType: "STEPS",
            title,
            steps,
            distanceKm,
            caloriesBurned,
            notes: `${stepsTimeOfDay} logged • ${distanceKm} km • ${caloriesBurned} kcal`,
          },
        });
      }
    }

    // 2. Update water intake in DB occurrence
    if (waterIntakeMl > 0) {
      let rawOccurrences = await occurrenceService.getForDate(today);
      let hydrationOcc = rawOccurrences.find((o) => o.routineItem.category === "HYDRATION");
      if (!hydrationOcc) {
        let plan = await prisma.plan.findFirst({ where: { status: "ACTIVE" } }) || await prisma.plan.findFirst();
        if (plan) {
          let item = await prisma.routineItem.findFirst({ where: { planId: plan.id, category: "HYDRATION" } });
          if (!item) {
            item = await prisma.routineItem.create({
              data: { planId: plan.id, title: "Hydration Protocol (3L Target)", category: "HYDRATION" },
            });
          }
          let sched = await prisma.schedule.findFirst({ where: { routineItemId: item.id } });
          if (!sched) {
            sched = await prisma.schedule.create({
              data: { routineItemId: item.id, recurrenceRule: "DAILY", scheduledTime: "08:00", effectiveFrom: today },
            });
          }
          hydrationOcc = await prisma.occurrence.upsert({
            where: { scheduleId_scheduledDate: { scheduleId: sched.id, scheduledDate: today } },
            update: {},
            create: { scheduleId: sched.id, routineItemId: item.id, scheduledDate: today, scheduledTime: "08:00", status: "PENDING" },
            include: { completion: true, routineItem: true },
          }) as any;
        }
      }

      if (hydrationOcc) {
        const nextStatus = waterIntakeMl >= 3000 ? "COMPLETED" : "PARTIAL";
        await prisma.occurrence.update({
          where: { id: hydrationOcc.id },
          data: { status: nextStatus },
        });
        await prisma.completion.upsert({
          where: { occurrenceId: hydrationOcc.id },
          update: {
            status: nextStatus,
            notes: waterIntakeMl.toString(),
            completedAt: new Date(),
          },
          create: {
            occurrenceId: hydrationOcc.id,
            status: nextStatus,
            notes: waterIntakeMl.toString(),
          },
        });
      }
    }

    // 3. Upsert or update recovery telemetry
    let recoveryLog = await prisma.activityLog.findFirst({
      where: { date: today, activityType: "RECOVERY" },
    });

    let currentRec = {
      sleepHours: 7.5,
      sleepQuality: "OPTIMAL",
      sorenessLevel: "LOW",
      electrolytesTaken: false,
      electrolytesTimeOfDay: "MORNING",
      creatineTaken: false,
      creatineTimeOfDay: "MORNING",
      magnesiumTaken: false,
      magnesiumTimeOfDay: "NIGHT",
      morningMobilityDone: false,
      postMealWalksCount: 0,
      recoveryScore: 85,
    };

    if (recoveryLog?.notes) {
      try {
        currentRec = { ...currentRec, ...JSON.parse(recoveryLog.notes) };
      } catch {}
    }

    const mergedRec = { ...currentRec, ...recovery };
    let score = 0;
    if (mergedRec.sleepHours >= 7.5) score += 35;
    else if (mergedRec.sleepHours >= 6.5) score += 25;
    else score += 15;

    if (mergedRec.sorenessLevel === "NONE") score += 20;
    else if (mergedRec.sorenessLevel === "LOW") score += 18;
    else if (mergedRec.sorenessLevel === "MILD") score += 12;
    else score += 5;

    if (mergedRec.electrolytesTaken) score += 10;
    if (mergedRec.creatineTaken) score += 10;
    if (mergedRec.magnesiumTaken) score += 10;
    if (mergedRec.morningMobilityDone) score += 15;

    mergedRec.recoveryScore = Math.min(100, score);

    if (recoveryLog) {
      await prisma.activityLog.update({
        where: { id: recoveryLog.id },
        data: {
          notes: JSON.stringify(mergedRec),
          title: `Recovery Readiness (${mergedRec.recoveryScore}%)`,
        },
      });
    } else {
      await prisma.activityLog.create({
        data: {
          date: today,
          activityType: "RECOVERY",
          title: `Recovery Readiness (${mergedRec.recoveryScore}%)`,
          notes: JSON.stringify(mergedRec),
        },
      });
    }

    // Invalidate caches
    await cache.del(`today_payload:${dateKey}`);
    await cache.del(`occurrences:${dateKey}`);
    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("occurrences:");
    await cache.invalidatePattern("analytics:");

    res.json({
      success: true,
      message: isManualSubmit
        ? "Day end telemetry locked in database successfully!"
        : "Auto-synced telemetry to database.",
      committedAt: new Date().toISOString(),
      recovery: mergedRec,
    });
  } catch (err) {
    console.error("POST /api/today/telemetry-submit error:", err);
    res.status(500).json({ error: "Failed to submit day telemetry" });
  }
});

// ─── User-Defined Active Phase Management ───
// GET /api/phase — Fetch current running phase configuration
router.get(["/phase", "/today/phase"], requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = todayUtc();
    const monthKey = formatInTz(today, "yyyy-MM");
    const [phaseSetting, monthlyGoal] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "current_phase" } }),
      prisma.monthlyGoal.findUnique({ where: { month: monthKey } }),
    ]);

    const defaultEndDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    let phase = {
      name: monthlyGoal?.velocityNotes || "Phase 1 — Winter Arc",
      subtitle: `${formatInTz(today, "MMMM yyyy")} Foundation`,
      theme: "Consistency & Discipline",
      startDate: formatInTz(today, "yyyy-MM-01"),
      endDate: formatInTz(defaultEndDate, "yyyy-MM-dd"),
      targetWeightKg: monthlyGoal?.targetWeightKg || 72,
      currentWeightKg: monthlyGoal?.currentWeightKg || 74,
      dailyStepsTarget: monthlyGoal?.dailyStepsTarget || 8000,
      dailyWaterTargetMl: monthlyGoal?.dailyWaterTargetMl || 3000,
      targetCalories: 1600,
      isConfigured: false,
    };

    if (phaseSetting?.value) {
      try {
        const parsed = JSON.parse(phaseSetting.value);
        phase = { ...phase, ...parsed, isConfigured: true };
      } catch (err) {
        console.warn("Error parsing current_phase:", err);
      }
    }

    const targetEndDate = new Date(`${phase.endDate}T23:59:59.999Z`);
    const targetStartDate = new Date(`${phase.startDate || formatInTz(today, "yyyy-MM-01")}T00:00:00.000Z`);
    const diffMs = targetEndDate.getTime() - today.getTime();
    const daysRemainingInPhase = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const totalDurationDays = Math.max(1, Math.ceil((targetEndDate.getTime() - targetStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.min(totalDurationDays, totalDurationDays - daysRemainingInPhase));
    const progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDurationDays) * 100)));

    res.json({
      ...phase,
      daysRemainingInPhase,
      totalDurationDays,
      progressPercent,
    });
  } catch (err) {
    console.error("GET /api/phase error:", err);
    res.status(500).json({ error: "Failed to retrieve active phase" });
  }
});

// POST /api/phase — User sets or changes active phase
router.post(["/phase", "/today/phase"], requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      subtitle,
      theme,
      startDate,
      endDate,
      targetWeightKg,
      currentWeightKg,
      dailyStepsTarget,
      dailyWaterTargetMl,
      targetCalories,
    } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Phase title / name is required." });
      return;
    }

    if (!endDate || typeof endDate !== "string") {
      res.status(400).json({ error: "Phase completion date is required." });
      return;
    }

    const today = todayUtc();
    const effectiveStartDate = startDate && typeof startDate === "string" ? startDate.trim() : formatInTz(today, "yyyy-MM-dd");
    const effectiveEndDate = endDate.trim();

    const phaseConfig = {
      name: name.trim(),
      subtitle: subtitle ? String(subtitle).trim() : "",
      theme: theme ? String(theme).trim() : "Consistency & Discipline",
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      targetWeightKg: targetWeightKg !== undefined ? Number(targetWeightKg) : 72,
      currentWeightKg: currentWeightKg !== undefined ? Number(currentWeightKg) : 74,
      dailyStepsTarget: dailyStepsTarget !== undefined ? Number(dailyStepsTarget) : 8000,
      dailyWaterTargetMl: dailyWaterTargetMl !== undefined ? Number(dailyWaterTargetMl) : 3000,
      targetCalories: targetCalories !== undefined ? Number(targetCalories) : 1600,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    };

    await prisma.systemSetting.upsert({
      where: { key: "current_phase" },
      create: { key: "current_phase", value: JSON.stringify(phaseConfig) },
      update: { value: JSON.stringify(phaseConfig) },
    });

    // Sync to MonthlyGoal for current month
    const monthKey = formatInTz(today, "yyyy-MM");
    await prisma.monthlyGoal.upsert({
      where: { month: monthKey },
      create: {
        month: monthKey,
        targetWeightKg: phaseConfig.targetWeightKg,
        currentWeightKg: phaseConfig.currentWeightKg,
        dailyStepsTarget: phaseConfig.dailyStepsTarget,
        dailyWaterTargetMl: phaseConfig.dailyWaterTargetMl,
        velocityNotes: phaseConfig.name,
      },
      update: {
        targetWeightKg: phaseConfig.targetWeightKg,
        currentWeightKg: phaseConfig.currentWeightKg,
        dailyStepsTarget: phaseConfig.dailyStepsTarget,
        dailyWaterTargetMl: phaseConfig.dailyWaterTargetMl,
        velocityNotes: phaseConfig.name,
      },
    });

    // Invalidate caches so UI sees new phase immediately
    const dateKey = dateKeyInTz(today);
    await cache.del(`today_payload:${dateKey}`);
    await cache.del("setting:current_phase");
    await cache.del(`goal:${monthKey}`);
    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("analytics:");

    res.json({
      success: true,
      message: `Active phase set to "${phaseConfig.name}"!`,
      phase: phaseConfig,
    });
  } catch (err) {
    console.error("POST /api/phase error:", err);
    res.status(500).json({ error: "Failed to save phase" });
  }
});

// ─── Off-Plan / Different Food Logging ───
// POST /api/today/different-meal — Log food consumed outside or different from the plan
router.post(["/today/different-meal", "/different-meal"], requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, calories, protein, carbs, fat, mealSlot, notes, replacesOccurrenceId } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "Item title / description is required." });
      return;
    }

    const today = todayUtc();
    const dateKey = today.toISOString().split("T")[0];

    const mealData = {
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      mealSlot: mealSlot || "Extra",
      notes: notes || "",
      isDifferent: true,
      loggedAt: new Date().toISOString(),
    };

    const log = await prisma.activityLog.create({
      data: {
        date: today,
        activityType: "OFF_PLAN_MEAL",
        title: title.trim(),
        caloriesBurned: mealData.calories,
        occurrenceId: replacesOccurrenceId || null,
        notes: JSON.stringify(mealData),
      },
    });

    if (replacesOccurrenceId) {
      try {
        await prisma.occurrence.update({
          where: { id: replacesOccurrenceId },
          data: { status: "REPLACED" },
        });
        await prisma.completion.upsert({
          where: { occurrenceId: replacesOccurrenceId },
          create: {
            occurrenceId: replacesOccurrenceId,
            status: "REPLACED",
            notes: `Substituted with off-plan: "${title.trim()}" (${mealData.calories} kcal)`,
          },
          update: {
            status: "REPLACED",
            notes: `Substituted with off-plan: "${title.trim()}" (${mealData.calories} kcal)`,
          },
        });
      } catch (e) {
        console.warn("Could not mark occurrence replaced:", e);
      }
    }

    // Invalidate caches
    await cache.del(`today_payload:${dateKey}`);
    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("analytics:");
    await cache.invalidatePattern("calendar:");

    res.json({
      success: true,
      message: `Off-plan item "${title.trim()}" (+${mealData.calories} kcal) logged!`,
      meal: {
        id: log.id,
        title: log.title,
        ...mealData,
        time: formatInTz(log.createdAt, "HH:mm"),
      },
    });
  } catch (err) {
    console.error("POST /api/today/different-meal error:", err);
    res.status(500).json({ error: "Failed to log off-plan meal" });
  }
});

// DELETE /api/today/different-meal/:id — Delete an off-plan log
router.delete(["/today/different-meal/:id", "/different-meal/:id"], requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const today = todayUtc();
    const dateKey = today.toISOString().split("T")[0];

    await prisma.activityLog.delete({
      where: { id },
    });

    await cache.del(`today_payload:${dateKey}`);
    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("analytics:");
    await cache.invalidatePattern("calendar:");

    res.json({ success: true, message: "Off-plan log removed." });
  } catch (err) {
    console.error("DELETE /api/today/different-meal error:", err);
    res.status(500).json({ error: "Failed to delete log" });
  }
});

// ─── Daily Weight Logging ───
// POST /api/today/weight — User confirms or logs today's weight
router.post(["/today/weight", "/weight"], requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { weightKg, date } = req.body || {};
    const weightNum = parseFloat(String(weightKg));

    if (isNaN(weightNum) || weightNum <= 20 || weightNum >= 300) {
      res.status(400).json({ error: "Valid body weight in kg is required." });
      return;
    }

    const today = todayUtc();
    const targetDate = date ? new Date(`${date}T00:00:00.000Z`) : today;
    const dateKey = today.toISOString().split("T")[0];
    const monthKey = formatInTz(today, "yyyy-MM");

    const existing = await prisma.activityLog.findFirst({
      where: {
        date: targetDate,
        activityType: "WEIGHT",
      },
    });

    if (existing) {
      await prisma.activityLog.update({
        where: { id: existing.id },
        data: {
          distanceKm: weightNum,
          title: `Weight: ${weightNum} kg`,
          notes: JSON.stringify({ weightKg: weightNum, recordedAt: new Date().toISOString() }),
        },
      });
    } else {
      await prisma.activityLog.create({
        data: {
          date: targetDate,
          activityType: "WEIGHT",
          distanceKm: weightNum,
          title: `Weight: ${weightNum} kg`,
          notes: JSON.stringify({ weightKg: weightNum, recordedAt: new Date().toISOString() }),
        },
      });
    }

    // Persist as last recorded weight default
    await prisma.systemSetting.upsert({
      where: { key: "last_weight" },
      create: { key: "last_weight", value: String(weightNum) },
      update: { value: String(weightNum) },
    });

    // Sync to MonthlyGoal currentWeightKg
    await prisma.monthlyGoal.upsert({
      where: { month: monthKey },
      create: { month: monthKey, currentWeightKg: weightNum },
      update: { currentWeightKg: weightNum },
    });

    await cache.del(`today_payload:${dateKey}`);
    await cache.del("setting:last_weight");
    await cache.del(`goal:${monthKey}`);
    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("analytics:");

    res.json({
      success: true,
      message: `Weight logged: ${weightNum} kg ✓`,
      weightKg: weightNum,
    });
  } catch (err) {
    console.error("POST /api/today/weight error:", err);
    res.status(500).json({ error: "Failed to record daily weight" });
  }
});

export default router;

