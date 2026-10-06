import { prisma } from "../db";
import { todayUtc, dateKeyInTz } from "../dates";
import { cache } from "../cache";
import type { KitchenMeal, DailyStats, NutritionValues, MealComponentInfo } from "./types";

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

    // Sum nutrition consumed from completed and replaced items
    const consumedOccs = occurrences.filter((o) => o.status === "COMPLETED" || o.status === "REPLACED");
    const nutrition = consumedOccs.reduce<NutritionValues>((acc, occ) => {
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

    // Planned nutrition across all scheduled items
    const plannedNutrition = occurrences.reduce<NutritionValues>((acc, occ) => {
      const snap =
        occ.routineItem?.nutritionSnapshots?.[0] || occ.nutritionSnapshots?.[0];
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
      plannedNutrition,
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

function parseKitchenComponents(
  rawComponents: { name: string; quantity: string | null; unit: string | null }[],
  mealTitle: string
): MealComponentInfo[] {
  const hasSpecifics = rawComponents.some((c) => c.quantity || c.unit);
  if (hasSpecifics && rawComponents.length > 1) {
    return rawComponents.map((c) => ({
      name: c.name,
      quantity: c.quantity || undefined,
      unit: c.unit || undefined,
    }));
  }

  const lowerTitle = mealTitle.toLowerCase();
  if (lowerTitle.includes("proat") || lowerTitle.includes("chocolate proats")) {
    return [
      { name: "Rolled Oats", quantity: "50", unit: "g" },
      { name: "Whey Protein (Chocolate)", quantity: "1", unit: "scoop" },
      { name: "Almond Milk", quantity: "200", unit: "ml" },
      { name: "Chia Seeds / Dry Fruit", quantity: "10", unit: "g" },
    ];
  }
  if (lowerTitle.includes("lunch") || (lowerTitle.includes("phulka") && !lowerTitle.includes("dinner") && !lowerTitle.includes("bhurji"))) {
    return [
      { name: "Fresh Phulkas / Rotis", quantity: "2", unit: "pcs" },
      { name: "Green Vegetable Sabzi (Low oil)", quantity: "150", unit: "g" },
      { name: "Fresh Cucumber & Tomato Salad", quantity: "1", unit: "bowl" },
      { name: "Fresh Curd / Dahi", quantity: "100", unit: "g" },
    ];
  }
  if (lowerTitle.includes("kala chana") || lowerTitle.includes("chana")) {
    return [
      { name: "Boiled Kala Chana", quantity: "150", unit: "g" },
      { name: "Finely Chopped Onion & Tomato", quantity: "1", unit: "small" },
      { name: "Fresh Lemon Wedge & Chaat Masala", quantity: "1", unit: "dash" },
    ];
  }
  if (lowerTitle.includes("paneer bhurji") || lowerTitle.includes("dinner")) {
    return [
      { name: "Fresh Paneer (Low-fat Bhurji)", quantity: "120", unit: "g" },
      { name: "Fresh Phulkas", quantity: "2", unit: "pcs" },
      { name: "Sliced Cucumber Salad", quantity: "1", unit: "plate" },
    ];
  }

  if (rawComponents.length > 0) {
    const list: MealComponentInfo[] = [];
    for (const comp of rawComponents) {
      const clean = comp.name.replace(/\s*-\s*\d+\s*kcal.*$/i, "").replace(/^(Breakfast|Lunch|Dinner|Snack):\s*/i, "");
      const parenMatch = clean.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const parts = parenMatch[1].split(",").map(p => p.trim());
        parts.forEach(p => list.push({ name: p }));
      } else {
        const parts = clean.split(",").map(p => p.trim());
        parts.forEach(p => {
          const numMatch = p.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*(.*)$/);
          if (numMatch && numMatch[1]) {
            list.push({
              name: numMatch[3] ? `${numMatch[2] || ""} ${numMatch[3]}`.trim() : numMatch[2] || p,
              quantity: numMatch[1],
              unit: numMatch[2] && ["g", "ml", "pcs", "scoop", "tbsp"].includes(numMatch[2].toLowerCase()) ? numMatch[2] : "pcs",
            });
          } else {
            list.push({ name: p });
          }
        });
      }
    }
    return list.length > 0 ? list : rawComponents.map((c) => ({ name: c.name }));
  }

  return [];
}

/**
 * Kitchen service — Mom's view. Simplest possible query.
 */
export const kitchenService = {
  async getMealsForDate(date: Date): Promise<KitchenMeal[]> {
    const dateKey = dateKeyInTz(date);
    const cacheKey = `kitchen_meals:${dateKey}`;

    return cache.wrap(cacheKey, 120, async () => {
      const occurrences = await prisma.occurrence.findMany({
        where: {
          scheduledDate: date,
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
        id: occ.id,
        time: occ.scheduledTime,
        mealType: occ.routineItem.meal?.mealType || "OTHER",
        title: occ.routineItem.title,
        status: occ.status,
        isPrepared: occ.status === "COMPLETED",
        components: parseKitchenComponents(occ.routineItem.meal?.components || [], occ.routineItem.title),
        nutrition: occ.routineItem.nutritionSnapshots[0]
          ? {
              calories: occ.routineItem.nutritionSnapshots[0].calories || undefined,
              protein: occ.routineItem.nutritionSnapshots[0].protein || undefined,
              carbs: occ.routineItem.nutritionSnapshots[0].carbs || undefined,
              fat: occ.routineItem.nutritionSnapshots[0].fat || undefined,
            }
          : undefined,
      }));
    });
  },

  async getTodayMeals(): Promise<KitchenMeal[]> {
    return this.getMealsForDate(todayUtc());
  },
};

