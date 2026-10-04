import { prisma } from "../db";
import { todayUtc } from "../dates";
import type { KitchenMeal, DailyStats, NutritionValues } from "./types";

/**
 * Analytics service — all metrics computed on-the-fly from occurrences/completions.
 * No pre-aggregation tables needed for 2 users.
 */
export const analyticsService = {
  /**
   * Compute daily stats in-memory from loaded occurrences (0 DB roundtrips).
   */
  computeDailyStatsFromOccurrences(date: Date, occurrences: any[]): DailyStats {
    const total = occurrences.length;
    const completed = occurrences.filter((o) => o.status === "COMPLETED").length;
    const skipped = occurrences.filter((o) => o.status === "SKIPPED").length;
    const missed = occurrences.filter((o) => o.status === "MISSED").length;
    const replaced = occurrences.filter((o) => o.status === "REPLACED").length;

    // Sum nutrition from actual snapshots, fall back to planned
    const nutrition = occurrences.reduce<NutritionValues>((acc, occ) => {
      const snap =
        occ.nutritionSnapshots?.[0] || occ.routineItem?.nutritionSnapshots?.[0];
      if (snap) {
        acc.calories = (acc.calories || 0) + (snap.calories || 0);
        acc.protein = (acc.protein || 0) + (snap.protein || 0);
        acc.carbs = (acc.carbs || 0) + (snap.carbs || 0);
        acc.fat = (acc.fat || 0) + (snap.fat || 0);
        acc.fiber = (acc.fiber || 0) + (snap.fiber || 0);
      }
      return acc;
    }, {});

    return {
      date: date.toISOString(),
      total,
      completed,
      skipped,
      missed,
      replaced,
      completionRate: total > 0 ? completed / total : 0,
      nutrition,
    };
  },

  /**
   * Get daily stats for a specific date (queries DB if occurrences not pre-fetched).
   */
  async getDailyStats(date: Date): Promise<DailyStats> {
    const occurrences = await prisma.occurrence.findMany({
      where: { scheduledDate: date },
      include: {
        completion: true,
        nutritionSnapshots: { where: { source: "ACTUAL" } },
        routineItem: {
          include: { nutritionSnapshots: { where: { source: "PLANNED" } } },
        },
      },
    });

    return this.computeDailyStatsFromOccurrences(date, occurrences);
  },

  /**
   * Get today's nutrition summary.
   */
  async getTodayNutrition(): Promise<NutritionValues> {
    const stats = await this.getDailyStats(todayUtc());
    return stats.nutrition;
  },
};

/**
 * Kitchen service — Mom's view. Simplest possible query.
 */
export const kitchenService = {
  async getTodayMeals(): Promise<KitchenMeal[]> {
    const today = todayUtc();
    const occurrences = await prisma.occurrence.findMany({
      where: {
        scheduledDate: today,
        routineItem: { category: "MEAL" },
      },
      include: {
        routineItem: {
          include: {
            meal: { include: { components: { orderBy: { sortOrder: "asc" } } } },
            nutritionSnapshots: { where: { source: "PLANNED" } },
          },
        },
      },
      orderBy: { scheduledTime: "asc" },
    });

    return occurrences.map((occ) => ({
      time: occ.scheduledTime,
      mealType: occ.routineItem.meal?.mealType || "OTHER",
      title: occ.routineItem.title,
      components:
        occ.routineItem.meal?.components.map((c) => ({
          name: c.name,
          quantity: c.quantity || undefined,
          unit: c.unit || undefined,
        })) || [],
      nutrition: occ.routineItem.nutritionSnapshots[0]
        ? {
            calories: occ.routineItem.nutritionSnapshots[0].calories || undefined,
            protein: occ.routineItem.nutritionSnapshots[0].protein || undefined,
            carbs: occ.routineItem.nutritionSnapshots[0].carbs || undefined,
            fat: occ.routineItem.nutritionSnapshots[0].fat || undefined,
          }
        : undefined,
    }));
  },
};
