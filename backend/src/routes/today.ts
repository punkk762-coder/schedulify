import { Router, type Request, type Response } from "express";
import { occurrenceService, analyticsService, type TodayOccurrence } from "../domain";
import { todayUtc, formatInTz } from "../dates";
import { requireUserMiddleware } from "../auth";
import { cache } from "../cache";

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

    const payload = {
      date: formatInTz(today, "EEEE, MMMM d, yyyy"),
      isoDate: today.toISOString(),
      occurrences,
      stats,
    };

    // Cache payload for 30s (invalidated automatically on complete/skip/replace/plan import)
    await cache.set(cacheKey, payload, 30);

    res.json(payload);
  } catch (err) {
    console.error("GET /api/today error:", err);
    res.status(500).json({ error: "Failed to fetch today's routine" });
  }
});

export default router;

