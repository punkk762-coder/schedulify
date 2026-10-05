import { Router, type Request, type Response } from "express";
import { prisma } from "../db";
import { requireUserMiddleware } from "../auth";
import { todayUtc, formatInTz } from "../dates";
import { cache } from "../cache";
import { occurrenceService } from "../domain/occurrences";

const router = Router();

// GET /api/setup/status — Check whether user has finished setup and get current defaults
router.get("/setup/status", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as any).user;
    const today = todayUtc();
    const currentMonthKey = formatInTz(today, "yyyy-MM");

    let managedProfile: any = null;
    if (session?.userId) {
      managedProfile = await prisma.userProfile.findUnique({ where: { id: session.userId } });
    }

    const [onboardingSetting, adminSetting, lastWeightSetting, phaseSetting, monthlyGoal, planCount] =
      await Promise.all([
        managedProfile
          ? prisma.systemSetting.findUnique({ where: { key: `onboarding_${managedProfile.id}` } })
          : prisma.systemSetting.findUnique({ where: { key: "onboarding_completed" } }),
        prisma.systemSetting.findUnique({ where: { key: "admin_name" } }),
        prisma.systemSetting.findUnique({ where: { key: managedProfile ? `weight_${managedProfile.id}` : "last_weight" } }),
        prisma.systemSetting.findUnique({ where: { key: managedProfile ? `phase_${managedProfile.id}` : "current_phase" } }),
        prisma.monthlyGoal.findUnique({ where: { month: currentMonthKey } }),
        prisma.plan.count({ where: { status: "ACTIVE" } }),
      ]);

    const isCompleted = onboardingSetting?.value === "true";
    let phaseData: any = null;
    if (phaseSetting?.value) {
      try {
        phaseData = JSON.parse(phaseSetting.value);
      } catch {}
    }

    const userName = managedProfile?.name || adminSetting?.value || "Vrund";
    const userCalories = managedProfile?.calorieTarget || phaseData?.targetCalories || 1600;
    const userProtein = managedProfile?.proteinTarget || phaseData?.proteinTarget || 130;
    const userSteps = managedProfile?.stepsTarget || phaseData?.dailyStepsTarget || 8000;
    const userWater = managedProfile?.waterTargetMl || phaseData?.dailyWaterTargetMl || 3000;

    res.json({
      onboardingCompleted: isCompleted,
      isConfigured: Boolean(phaseData?.isConfigured || isCompleted),
      hasActivePlan: planCount > 0,
      user: {
        name: userName,
        currentWeightKg: lastWeightSetting?.value
          ? parseFloat(lastWeightSetting.value)
          : monthlyGoal?.currentWeightKg || 74,
        targetWeightKg: monthlyGoal?.targetWeightKg || 70,
        calorieTarget: userCalories,
        proteinTarget: userProtein,
        stepsTarget: userSteps,
        waterTargetMl: userWater,
      },
      phase: phaseData || {
        name: "Phase 1: Winter Arc",
        subtitle: `${formatInTz(today, "MMMM yyyy")} Foundation`,
        startDate: formatInTz(today, "yyyy-MM-01"),
        endDate: formatInTz(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)), "yyyy-MM-dd"),
        targetCalories: userCalories,
        proteinTarget: userProtein,
        dailyStepsTarget: userSteps,
        dailyWaterTargetMl: userWater,
        isConfigured: false,
      },
    });
  } catch (err) {
    console.error("GET /api/setup/status error:", err);
    res.status(500).json({ error: "Failed to read setup status" });
  }
});

// POST /api/setup/complete — Commit user setup, profile, phase dates, target calories, and customized daily routine
router.post("/setup/complete", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as any).user;
    let managedProfile: any = null;
    if (session?.userId) {
      managedProfile = await prisma.userProfile.findUnique({ where: { id: session.userId } });
    }

    const {
      name = "Vrund",
      currentWeightKg = 74,
      targetWeightKg = 70,
      phaseName = "Phase 1: Winter Arc",
      phaseSubtitle = "Lean Hypertrophy & Discipline",
      startDate,
      endDate,
      dailyCalories = 1600,
      proteinTarget = 140,
      dailySteps = 8000,
      dailyWaterMl = 3000,
      routineItems = [],
    } = req.body || {};

    const today = todayUtc();
    const todayStr = formatInTz(today, "yyyy-MM-dd");
    const defaultEndDateStr = formatInTz(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)),
      "yyyy-MM-dd"
    );

    const cleanStartDate = startDate || todayStr;
    const cleanEndDate = endDate || defaultEndDateStr;

    // 1. Persist User Profile / Name & Weight
    if (managedProfile) {
      await prisma.userProfile.update({
        where: { id: managedProfile.id },
        data: {
          name: String(name).trim() || managedProfile.name,
          calorieTarget: Number(dailyCalories) || 1600,
          proteinTarget: Number(proteinTarget) || 130,
          stepsTarget: Number(dailySteps) || 8000,
          waterTargetMl: Number(dailyWaterMl) || 3000,
        },
      });

      await prisma.systemSetting.upsert({
        where: { key: `onboarding_${managedProfile.id}` },
        create: { key: `onboarding_${managedProfile.id}`, value: "true" },
        update: { value: "true" },
      });

      await prisma.systemSetting.upsert({
        where: { key: `weight_${managedProfile.id}` },
        create: { key: `weight_${managedProfile.id}`, value: String(currentWeightKg) },
        update: { value: String(currentWeightKg) },
      });
    } else {
      await prisma.systemSetting.upsert({
        where: { key: "admin_name" },
        create: { key: "admin_name", value: String(name).trim() || "Vrund" },
        update: { value: String(name).trim() || "Vrund" },
      });

      await prisma.systemSetting.upsert({
        where: { key: "last_weight" },
        create: { key: "last_weight", value: String(currentWeightKg) },
        update: { value: String(currentWeightKg) },
      });
    }

    // 2. Persist Phase Configuration
    const phasePayload = {
      name: phaseName.trim() || "Phase 1: Winter Arc",
      subtitle: phaseSubtitle.trim() || "Foundation & Consistency",
      theme: "Discipline & Execution",
      startDate: cleanStartDate,
      endDate: cleanEndDate,
      targetWeightKg: Number(targetWeightKg) || 70,
      currentWeightKg: Number(currentWeightKg) || 74,
      dailyStepsTarget: Number(dailySteps) || 8000,
      dailyWaterTargetMl: Number(dailyWaterMl) || 3000,
      targetCalories: Number(dailyCalories) || 1600,
      proteinTarget: Number(proteinTarget) || 140,
      isConfigured: true,
    };

    if (managedProfile) {
      await prisma.systemSetting.upsert({
        where: { key: `phase_${managedProfile.id}` },
        create: { key: `phase_${managedProfile.id}`, value: JSON.stringify(phasePayload) },
        update: { value: JSON.stringify(phasePayload) },
      });
    }

    await prisma.systemSetting.upsert({
      where: { key: "current_phase" },
      create: { key: "current_phase", value: JSON.stringify(phasePayload) },
      update: { value: JSON.stringify(phasePayload) },
    });

    // 3. Update MonthlyGoal
    const currentMonthKey = formatInTz(today, "yyyy-MM");
    await prisma.monthlyGoal.upsert({
      where: { month: currentMonthKey },
      create: {
        month: currentMonthKey,
        targetWeightKg: Number(targetWeightKg) || 70,
        currentWeightKg: Number(currentWeightKg) || 74,
        dailyStepsTarget: Number(dailySteps) || 8000,
        dailyWaterTargetMl: Number(dailyWaterMl) || 3000,
        status: "IN_PROGRESS",
        velocityNotes: `${phasePayload.name}: ${phasePayload.targetCalories} kcal diet protocol active.`,
      },
      update: {
        targetWeightKg: Number(targetWeightKg) || 70,
        currentWeightKg: Number(currentWeightKg) || 74,
        dailyStepsTarget: Number(dailySteps) || 8000,
        dailyWaterTargetMl: Number(dailyWaterMl) || 3000,
        velocityNotes: `${phasePayload.name}: ${phasePayload.targetCalories} kcal diet protocol active.`,
      },
    });

    // 4. Mark Baseline Weight in ActivityLog
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const existingWeightLog = await prisma.activityLog.findFirst({
      where: {
        date: todayStart,
        activityType: "WEIGHT",
      },
    });

    if (existingWeightLog) {
      await prisma.activityLog.update({
        where: { id: existingWeightLog.id },
        data: {
          caloriesBurned: Number(currentWeightKg),
          notes: JSON.stringify({ weightKg: Number(currentWeightKg), isDefault: true, source: "SETUP" }),
        },
      });
    } else {
      await prisma.activityLog.create({
        data: {
          date: todayStart,
          activityType: "WEIGHT",
          title: "Baseline Setup Weight Log",
          caloriesBurned: Number(currentWeightKg),
          notes: JSON.stringify({ weightKg: Number(currentWeightKg), isDefault: true, source: "SETUP" }),
        },
      });
    }

    // 5. Build & Commit Daily Routine Blueprint (if provided or defaults)
    const itemsToCreate = Array.isArray(routineItems) && routineItems.length > 0
      ? routineItems
      : [
          {
            title: "Chocolate Proats",
            category: "MEAL",
            scheduledTime: "10:15",
            calories: 450,
            protein: 25,
            carbs: 55,
            fat: 10,
            mealType: "BREAKFAST",
          },
          {
            title: "2 Phulkas + Paneer/Dal",
            category: "MEAL",
            scheduledTime: "12:30",
            calories: 500,
            protein: 24,
            carbs: 65,
            fat: 12,
            mealType: "LUNCH",
          },
          {
            title: "Kala Chana / Roasted Makhana",
            category: "MEAL",
            scheduledTime: "17:30",
            calories: 200,
            protein: 10,
            carbs: 30,
            fat: 4,
            mealType: "SNACK",
          },
          {
            title: "Paneer Bhurji with 2 Phulkas",
            category: "MEAL",
            scheduledTime: "19:00",
            calories: 450,
            protein: 22,
            carbs: 40,
            fat: 16,
            mealType: "DINNER",
          },
          {
            title: "Evening Conditioning Walk (45 mins)",
            category: "WORKOUT",
            scheduledTime: "20:00",
            calories: 220,
            protein: 0,
            carbs: 0,
            fat: 0,
            mealType: "OTHER",
          },
          {
            title: "Cellular Hydration Protocol (3L)",
            category: "HYDRATION",
            scheduledTime: "08:00",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            mealType: "OTHER",
          },
        ];

    // Transactionally create Plan, RoutineItems, Schedules, and Nutrition Snapshots
    await prisma.$transaction(async (tx) => {
      // Archive existing active plans
      await tx.plan.updateMany({
        where: { status: "ACTIVE" },
        data: { status: "SUPERSEDED" },
      });

      // Delete pending occurrences for today and future from older plans to prevent duplicate cards
      const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      await tx.occurrence.deleteMany({
        where: {
          scheduledDate: { gte: todayDate },
          status: "PENDING",
        },
      });

      const newPlan = await tx.plan.create({
        data: {
          name: phasePayload.name,
          category: "NUTRITION_AND_FITNESS",
          status: "ACTIVE",
        },
      });

      for (let i = 0; i < itemsToCreate.length; i++) {
        const it = itemsToCreate[i];
        const category = (
          ["MEAL", "WORKOUT", "SUPPLEMENT", "ACTIVITY", "HYDRATION"].includes(it.category)
            ? it.category
            : "OTHER"
        ) as "MEAL" | "WORKOUT" | "SUPPLEMENT" | "ACTIVITY" | "HYDRATION" | "OTHER";

        const routineItem = await tx.routineItem.create({
          data: {
            planId: newPlan.id,
            title: it.title,
            category,
            sortOrder: i,
          },
        });

        await tx.schedule.create({
          data: {
            routineItemId: routineItem.id,
            recurrenceRule: "DAILY",
            scheduledTime: it.scheduledTime || "09:00",
            effectiveFrom: today,
          },
        });

        if (category === "MEAL") {
          const mealType = (
            ["BREAKFAST", "LUNCH", "SNACK", "DINNER", "PRE_WORKOUT", "POST_WORKOUT"].includes(it.mealType)
              ? it.mealType
              : "OTHER"
          ) as "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER" | "PRE_WORKOUT" | "POST_WORKOUT" | "OTHER";

          await tx.meal.create({
            data: {
              routineItemId: routineItem.id,
              mealType,
            },
          });
        }

        if (it.calories || it.protein || it.carbs || it.fat) {
          await tx.nutritionSnapshot.create({
            data: {
              routineItemId: routineItem.id,
              source: "PLANNED",
              calories: Number(it.calories) || 0,
              protein: Number(it.protein) || 0,
              carbs: Number(it.carbs) || 0,
              fat: Number(it.fat) || 0,
            },
          });
        }
      }
    });

    // 6. Generate occurrences for next 14 days
    const future14 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    await occurrenceService.generateForRange(today, future14);

    // 7. Mark onboarding as complete
    await prisma.systemSetting.upsert({
      where: { key: "onboarding_completed" },
      create: { key: "onboarding_completed", value: "true" },
      update: { value: "true" },
    });

    // Invalidate caches
    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("occurrences:");
    await cache.invalidatePattern("gen_range:");
    await cache.invalidatePattern("analytics:");
    await cache.invalidatePattern("calendar:");

    res.json({
      success: true,
      message: `Protocol "${phasePayload.name}" activated! All daily routines and biometrics are live.`,
      phase: phasePayload,
    });
  } catch (err) {
    console.error("POST /api/setup/complete error:", err);
    res.status(500).json({ error: "Failed to commit routine setup" });
  }
});

export default router;
