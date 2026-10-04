import { prisma } from "../db";
import { todayUtc } from "../dates";
import { occurrenceService } from "./occurrences";
import type { PlanImportProposal } from "./types";

/**
 * Heuristic & AI plan text parser that turns pasted nutrition & routine plans into a structured proposal.
 */
export function parsePlanText(rawText: string): PlanImportProposal {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: PlanImportProposal["routineItems"] = [];
  const schedules: PlanImportProposal["schedules"] = [];
  const meals: PlanImportProposal["meals"] = [];
  const nutrition: PlanImportProposal["nutrition"] = [];
  const alternatives: PlanImportProposal["alternatives"] = [];
  const reminders: PlanImportProposal["reminders"] = [];
  const ambiguities: string[] = [];
  const warnings: string[] = [];

  const todayStr = todayUtc().toISOString();
  let itemCounter = 1;

  for (const line of lines) {
    // Detect time pattern: e.g. 10:15 AM or 10:15 or 12:30 PM
    const timeMatch = line.match(/(\d{1,2}:\d{2})\s*(AM|PM)?/i);
    let scheduledTime = "09:00";
    if (timeMatch) {
      const rawT = timeMatch[1];
      const meridiem = timeMatch[2]?.toUpperCase();
      const [rawH, m] = rawT.split(":").map(Number);
      let h = rawH;
      if (meridiem === "PM" && h < 12) h += 12;
      if (meridiem === "AM" && h === 12) h = 0;
      scheduledTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    // Clean title
    const title = line
      .replace(/(\d{1,2}:\d{2})\s*(AM|PM)?/i, "")
      .replace(/^[-•*–\d.)\s]+/, "")
      .trim();

    if (!title || title.length < 2) continue;

    // Check if category
    let category: "MEAL" | "WORKOUT" | "SUPPLEMENT" | "ACTIVITY" | "HYDRATION" | "OTHER" = "OTHER";
    const lower = title.toLowerCase();

    if (
      lower.includes("breakfast") ||
      lower.includes("lunch") ||
      lower.includes("dinner") ||
      lower.includes("snack") ||
      lower.includes("proats") ||
      lower.includes("meal") ||
      lower.includes("shake") ||
      lower.includes("chana") ||
      lower.includes("phulka")
    ) {
      category = "MEAL";
    } else if (
      lower.includes("workout") ||
      lower.includes("gym") ||
      lower.includes("walk") ||
      lower.includes("run") ||
      lower.includes("training")
    ) {
      category = "WORKOUT";
    } else if (
      lower.includes("whey") ||
      lower.includes("creatine") ||
      lower.includes("omega") ||
      lower.includes("vitamin") ||
      lower.includes("supplement")
    ) {
      category = "SUPPLEMENT";
    } else if (lower.includes("water") || lower.includes("hydration")) {
      category = "HYDRATION";
    }

    // Parse macro cues e.g. "350 kcal, 25g protein, 30g carbs, 10g fat"
    const calMatch = line.match(/(\d+)\s*(kcal|calories)/i);
    const protMatch = line.match(/(\d+)\s*g\s*protein/i);
    const carbsMatch = line.match(/(\d+)\s*g\s*carb/i);
    const fatMatch = line.match(/(\d+)\s*g\s*fat/i);

    const tempId = `item-${itemCounter++}`;

    items.push({
      tempId,
      planRef: "plan-1",
      title: title.split(/[,(]/)[0].trim(),
      category,
    });

    schedules.push({
      itemRef: tempId,
      recurrenceRule: "DAILY",
      scheduledTime,
      effectiveFrom: todayStr,
    });

    if (category === "MEAL") {
      let mealType = "OTHER";
      if (lower.includes("breakfast") || lower.includes("proats")) mealType = "BREAKFAST";
      else if (lower.includes("lunch")) mealType = "LUNCH";
      else if (lower.includes("dinner")) mealType = "DINNER";
      else if (lower.includes("snack") || lower.includes("chana")) mealType = "SNACK";
      else if (lower.includes("bedtime")) mealType = "BEDTIME";

      meals.push({
        itemRef: tempId,
        mealType,
        components: [{ name: title }],
      });
    }

    if (calMatch || protMatch || carbsMatch || fatMatch) {
      nutrition.push({
        itemRef: tempId,
        calories: calMatch ? parseInt(calMatch[1], 10) : undefined,
        protein: protMatch ? parseInt(protMatch[1], 10) : undefined,
        carbs: carbsMatch ? parseInt(carbsMatch[1], 10) : undefined,
        fat: fatMatch ? parseInt(fatMatch[1], 10) : undefined,
      });
    }

    // Ambiguity checks
    if (lower.includes("bowl") || lower.includes("piece") || lower.includes("some")) {
      ambiguities.push(`"${title}" has approximate portion quantity.`);
    }
  }

  if (items.length === 0) {
    warnings.push("No recognizable routine items could be extracted from input text.");
  }

  return {
    plans: [{ name: "Routine & Diet Plan", category: "DAILY_OS" }],
    routineItems: items,
    schedules,
    meals,
    nutrition,
    alternatives,
    reminders,
    assumptions: ["All scheduled items repeat DAILY starting today unless specified."],
    ambiguities,
    warnings,
  };
}

/**
 * Commit proposed plan into database transactionally.
 */
export async function commitPlanProposal(proposal: PlanImportProposal) {
  return prisma.$transaction(async (tx) => {
    // 1. Create Plan
    const plan = await tx.plan.create({
      data: {
        name: proposal.plans[0]?.name || "Imported Plan",
        category: proposal.plans[0]?.category || "NUTRITION",
        status: "ACTIVE",
      },
    });

    const idMap: Record<string, string> = {};

    // 2. Create Routine Items
    for (const item of proposal.routineItems) {
      const createdItem = await tx.routineItem.create({
        data: {
          planId: plan.id,
          title: item.title,
          category: item.category as
            | "MEAL"
            | "WORKOUT"
            | "SUPPLEMENT"
            | "ACTIVITY"
            | "HYDRATION"
            | "OTHER",
        },
      });
      idMap[item.tempId] = createdItem.id;
    }

    // 3. Create Schedules
    for (const sched of proposal.schedules) {
      const realItemId = idMap[sched.itemRef];
      if (!realItemId) continue;

      await tx.schedule.create({
        data: {
          routineItemId: realItemId,
          recurrenceRule: sched.recurrenceRule,
          scheduledTime: sched.scheduledTime,
          effectiveFrom: new Date(sched.effectiveFrom),
        },
      });
    }

    // 4. Create Meals
    for (const m of proposal.meals) {
      const realItemId = idMap[m.itemRef];
      if (!realItemId) continue;

      const createdMeal = await tx.meal.create({
        data: {
          routineItemId: realItemId,
          mealType: m.mealType as
            | "BREAKFAST"
            | "LUNCH"
            | "SNACK"
            | "DINNER"
            | "PRE_WORKOUT"
            | "POST_WORKOUT"
            | "BEDTIME"
            | "OTHER",
        },
      });

      for (let i = 0; i < m.components.length; i++) {
        const comp = m.components[i];
        await tx.mealComponent.create({
          data: {
            mealId: createdMeal.id,
            name: comp.name,
            quantity: comp.quantity,
            unit: comp.unit,
            sortOrder: i,
          },
        });
      }
    }

    // 5. Create Nutrition Snapshots
    for (const nut of proposal.nutrition) {
      const realItemId = idMap[nut.itemRef];
      if (!realItemId) continue;

      await tx.nutritionSnapshot.create({
        data: {
          routineItemId: realItemId,
          source: "PLANNED",
          calories: nut.calories,
          protein: nut.protein,
          carbs: nut.carbs,
          fat: nut.fat,
          fiber: nut.fiber,
        },
      });
    }

    // Generate occurrences for next 14 days
    const today = todayUtc();
    const future = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    await occurrenceService.generateForRange(today, future);

    return plan;
  });
}
