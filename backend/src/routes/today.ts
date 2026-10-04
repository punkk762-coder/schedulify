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

    const payload = {
      date: formatInTz(today, "EEEE, MMMM d, yyyy"),
      isoDate: today.toISOString(),
      occurrences,
      stats,
      waterIntakeMl,
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

export default router;

