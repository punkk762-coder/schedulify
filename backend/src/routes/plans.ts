import { Router, type Request, type Response } from "express";
import { parsePlanText, commitPlanProposal, planService } from "../domain";
import { requireUserMiddleware } from "../auth";
import { cache } from "../cache";
import { prisma } from "../db";
import { todayUtc, formatInTz } from "../dates";

const router = Router();

// Clean / Reset existing protocol
router.post("/plans/reset", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.completion.deleteMany();
      await tx.nutritionSnapshot.deleteMany();
      await tx.occurrence.deleteMany();
      await tx.notification.deleteMany();
      await tx.alternative.deleteMany();
      await tx.mealComponent.deleteMany();
      await tx.meal.deleteMany();
      await tx.schedule.deleteMany();
      await tx.routineItem.deleteMany();
      await tx.plan.deleteMany();
    });

    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("occurrences:");
    await cache.invalidatePattern("gen_range:");
    await cache.invalidatePattern("analytics:");

    res.json({ success: true, message: "Protocol data cleared successfully. Ready for AI onboarding." });
  } catch (err) {
    console.error("POST /api/plans/reset error:", err);
    res.status(500).json({ error: "Failed to reset protocol" });
  }
});

// Intake analyze: parses pasted plan from another AI against calorie limit
router.post("/plans/intake-analyze", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rawText, calorieLimit = 1800, proteinTarget = 150 } = req.body || {};

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      res.status(400).json({ error: "Please paste your diet/routine plan text." });
      return;
    }

    const proposal = parsePlanText(rawText);

    let totalCalories = 0;
    let totalProtein = 0;
    for (const nut of proposal.nutrition) {
      totalCalories += nut.calories || 0;
      totalProtein += nut.protein || 0;
    }

    totalCalories = Math.round(totalCalories);
    totalProtein = Math.round(totalProtein);

    if (totalCalories === 0 && proposal.routineItems.length > 0) {
      totalCalories = proposal.routineItems.length * 350;
      totalProtein = proposal.routineItems.length * 20;
    }

    const calDiff = totalCalories - calorieLimit;

    const keptItems = proposal.routineItems.map((item) => {
      const nut = proposal.nutrition.find((n) => n.itemRef === item.tempId);
      const sched = proposal.schedules.find((s) => s.itemRef === item.tempId);
      return {
        id: item.tempId,
        title: item.title,
        category: item.category,
        scheduledTime: sched?.scheduledTime || "09:00",
        calories: nut?.calories || 0,
        protein: nut?.protein || 0,
      };
    });

    // Generate intelligent AI questions with suggested answers + custom write-in option
    const questions: Array<{
      id: string;
      title: string;
      description: string;
      options: string[];
      canCustomWrite: boolean;
      defaultSelected?: string;
    }> = [];

    // Calorie calibration question
    if (calDiff > 100) {
      questions.push({
        id: "q-calories",
        title: `Calorie Surplus Detected (+${calDiff} kcal over ${calorieLimit})`,
        description: `Your pasted plan totals ~${totalCalories} kcal, which is ${calDiff} kcal above your ${calorieLimit} kcal target limit. How would you like our AI to optimize this?`,
        options: [
          `Trim lunch portion (e.g. 1 less phulka, -150 kcal)`,
          `Adjust dinner oil & cheese portion (-120 kcal)`,
          `Keep all meals, add a 45-min evening walk (+220 kcal burn)`,
        ],
        canCustomWrite: true,
        defaultSelected: `Trim lunch portion (e.g. 1 less phulka, -150 kcal)`,
      });
    } else if (calDiff < -200) {
      questions.push({
        id: "q-calories-deficit",
        title: `Calorie Deficit Detected (${Math.abs(calDiff)} kcal below target)`,
        description: `Your plan totals ${totalCalories} kcal, which is below your daily ${calorieLimit} kcal threshold. Would you like to add a nourishing recovery component?`,
        options: [
          `Add mid-day Greek yogurt or roasted makhana (+150 kcal)`,
          `Add an extra scoop of whey protein / almond milk (+140 kcal)`,
          `Keep current deficit for active fat loss`,
        ],
        canCustomWrite: true,
        defaultSelected: `Keep current deficit for active fat loss`,
      });
    }

    // Protein standard question
    if (totalProtein < proteinTarget) {
      const protGap = proteinTarget - totalProtein;
      questions.push({
        id: "q-protein",
        title: `Protein Goal Optimization (-${protGap}g from ${proteinTarget}g)`,
        description: `Your current intake projects ~${totalProtein}g protein vs your ${proteinTarget}g target standard. Which source should we incorporate?`,
        options: [
          `Add 100g low-fat Paneer / Tofu to dinner (+18g protein)`,
          `Add 1 scoop Whey isolate to breakfast proats (+25g protein)`,
          `Add boiled Kala Chana / sprouts to evening snack (+12g protein)`,
        ],
        canCustomWrite: true,
        defaultSelected: `Add 1 scoop Whey isolate to breakfast proats (+25g protein)`,
      });
    }

    // Workout timing check
    const lateWorkout = proposal.routineItems.find((it) => {
      if (it.category !== "WORKOUT" && it.category !== "ACTIVITY") return false;
      const sc = proposal.schedules.find((s) => s.itemRef === it.tempId);
      if (!sc) return false;
      const [h] = sc.scheduledTime.split(":").map(Number);
      return h >= 20;
    });

    if (lateWorkout) {
      questions.push({
        id: "q-timing",
        title: `Late Workout Cadence (${lateWorkout.title})`,
        description: `Your plan has "${lateWorkout.title}" scheduled at night. Would you prefer shifting this for better sleep cadence?`,
        options: [
          `Shift workout to 6:30 PM (before dinner)`,
          `Shift to morning 7:00 AM movement`,
          `Keep at night as a low-intensity stroll`,
        ],
        canCustomWrite: true,
        defaultSelected: `Shift workout to 6:30 PM (before dinner)`,
      });
    }

    if (questions.length === 0) {
      questions.push({
        id: "q-routine-cadence",
        title: `Routine Cadence Confirmation`,
        description: `Your plan aligns smoothly with your ${calorieLimit} kcal limit and macro distribution. Which cadence should we initialize?`,
        options: [
          `Full Daily Consistency (Monday to Sunday)`,
          `Strict Weekdays with flexible weekend recovery`,
          `Workout days focused schedule`,
        ],
        canCustomWrite: true,
        defaultSelected: `Full Daily Consistency (Monday to Sunday)`,
      });
    }

    res.json({
      success: true,
      proposal,
      metrics: {
        totalCalories,
        calorieLimit,
        totalProtein,
        proteinTarget,
        itemsCount: proposal.routineItems.length,
      },
      keptItems,
      questions,
    });
  } catch (err) {
    console.error("POST /api/plans/intake-analyze error:", err);
    res.status(500).json({ error: "Failed to analyze intake plan" });
  }
});

// Intake commit: applies user answers and custom instructions, then commits plan
router.post("/plans/intake-commit", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposal, answers = {}, calorieLimit = 1800, proteinTarget = 150 } = req.body || {};

    if (!proposal || !proposal.routineItems || proposal.routineItems.length === 0) {
      res.status(400).json({ error: "Invalid proposal to commit" });
      return;
    }

    // Apply adjustments based on answers
    for (const [qId, answerText] of Object.entries(answers as Record<string, string>)) {
      if (!answerText || !answerText.trim()) continue;

      const lower = answerText.toLowerCase();

      if (qId === "q-calories" && lower.includes("walk")) {
        const tempId = `item-walk-offset-${Date.now()}`;
        proposal.routineItems.push({
          tempId,
          planRef: "plan-1",
          title: "Evening Burn Walk (45m)",
          category: "ACTIVITY",
        });
        proposal.schedules.push({
          itemRef: tempId,
          recurrenceRule: "DAILY",
          scheduledTime: "18:45",
          effectiveFrom: todayUtc().toISOString(),
        });
      } else if (qId === "q-calories" && lower.includes("trim")) {
        const lunch = proposal.routineItems.find((it) => it.title.toLowerCase().includes("lunch"));
        if (lunch) {
          lunch.title = `${lunch.title} (Trimmed portion)`;
        }
      } else if (qId === "q-protein" && lower.includes("whey")) {
        const breakfast = proposal.routineItems.find((it) => it.title.toLowerCase().includes("breakfast") || it.title.toLowerCase().includes("proats"));
        if (breakfast) {
          breakfast.title = `${breakfast.title} + 1 Scoop Whey`;
        }
      } else if (qId === "q-protein" && lower.includes("paneer")) {
        const dinner = proposal.routineItems.find((it) => it.title.toLowerCase().includes("dinner"));
        if (dinner) {
          dinner.title = `${dinner.title} + 100g Paneer/Tofu`;
        }
      } else if (qId === "q-timing" && answerText.includes("6:30 PM")) {
        const workoutSched = proposal.schedules.find((sc) => {
          const item = proposal.routineItems.find((it) => it.tempId === sc.itemRef);
          return item && (item.category === "WORKOUT" || item.category === "ACTIVITY");
        });
        if (workoutSched) {
          workoutSched.scheduledTime = "18:30";
        }
      } else if (lower.startsWith("custom:") || !["trim", "adjust", "keep", "add 1 scoop", "shift"].some((k) => lower.includes(k))) {
        // Custom write-in instruction from user
        const customTitle = answerText.replace(/^custom:\s*/i, "").trim();
        if (customTitle) {
          const tempId = `item-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          proposal.routineItems.push({
            tempId,
            planRef: "plan-1",
            title: customTitle.slice(0, 80),
            category: "ACTIVITY",
          });
          proposal.schedules.push({
            itemRef: tempId,
            recurrenceRule: "DAILY",
            scheduledTime: "12:00",
            effectiveFrom: todayUtc().toISOString(),
          });
        }
      }
    }

    const plan = await commitPlanProposal(proposal);

    // Save MonthlyGoal with calorie limit and protein target
    const currentMonthKey = formatInTz(todayUtc(), "yyyy-MM");
    await prisma.monthlyGoal.upsert({
      where: { month: currentMonthKey },
      update: {
        dailyStepsTarget: 8000,
        status: "IN_PROGRESS",
        velocityNotes: `Target ${calorieLimit} kcal and ${proteinTarget}g protein protocol activated.`,
      },
      create: {
        month: currentMonthKey,
        targetWeightKg: 72,
        currentWeightKg: 74,
        dailyStepsTarget: 8000,
        status: "IN_PROGRESS",
        velocityNotes: `Target ${calorieLimit} kcal and ${proteinTarget}g protein protocol activated.`,
      },
    });

    await cache.invalidatePattern("today_payload:");
    await cache.invalidatePattern("occurrences:");
    await cache.invalidatePattern("gen_range:");
    await cache.invalidatePattern("analytics:");

    res.json({ success: true, plan });
  } catch (err) {
    console.error("POST /api/plans/intake-commit error:", err);
    res.status(500).json({ error: "Failed to commit tailored routine" });
  }
});

router.post("/plans/import", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, text, proposal } = req.body || {};

    if (action === "commit") {
      if (!proposal) {
        res.status(400).json({ error: "Proposal object required for commit" });
        return;
      }
      const plan = await commitPlanProposal(proposal);
      await cache.invalidatePattern("today_payload:");
      await cache.invalidatePattern("occurrences:");
      await cache.invalidatePattern("gen_range:");
      await cache.invalidatePattern("analytics:");
      res.json({ success: true, plan });
      return;
    }

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text required to parse plan" });
      return;
    }

    const parsedProposal = parsePlanText(text);
    res.json({ success: true, proposal: parsedProposal });
  } catch (err) {
    console.error("POST /api/plans/import error:", err);
    res.status(500).json({ error: "Plan import failed" });
  }
});

router.get("/plans", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await planService.list();
    res.json({ plans });
  } catch (err) {
    console.error("GET /api/plans error:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

export default router;
