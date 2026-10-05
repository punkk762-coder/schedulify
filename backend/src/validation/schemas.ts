import { z } from "zod/v4";

// ─── Shared field schemas ───

export const cuid = z.string().min(1);
export const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format");

// ─── Auth ───

export const loginSchema = z.object({
  pin: z.string().min(4).max(10),
});

// ─── Occurrence actions ───

export const completeOccurrenceSchema = z.object({
  occurrenceId: cuid,
  notes: z.string().optional(),
});

export const skipOccurrenceSchema = z.object({
  occurrenceId: cuid,
  notes: z.string().optional(),
});

export const replaceOccurrenceSchema = z.object({
  occurrenceId: cuid,
  alternativeItemId: cuid,
  notes: z.string().optional(),
});

// ─── Plan / Routine creation ───

export const createPlanSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().optional(),
});

export const createRoutineItemSchema = z.object({
  planId: cuid,
  title: z.string().min(1).max(200),
  category: z.enum(["MEAL", "WORKOUT", "SUPPLEMENT", "ACTIVITY", "HYDRATION", "OTHER"]),
  type: z.string().optional(),
});

export const createScheduleSchema = z.object({
  routineItemId: cuid,
  recurrenceRule: z.string().min(1),
  scheduledTime: timeString,
  effectiveFrom: z.iso.datetime(),
  effectiveUntil: z.iso.datetime().optional(),
  reminderOffsetMinutes: z.number().int().min(0).optional(),
});

// ─── Meal ───

export const createMealSchema = z.object({
  routineItemId: cuid,
  mealType: z.enum([
    "BREAKFAST",
    "LUNCH",
    "SNACK",
    "DINNER",
    "PRE_WORKOUT",
    "POST_WORKOUT",
    "BEDTIME",
    "OTHER",
  ]),
  components: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.string().optional(),
        unit: z.string().optional(),
      })
    )
    .optional(),
});

// ─── Nutrition ───

export const nutritionSchema = z.object({
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
});

// ─── Alternative ───

export const createAlternativeSchema = z.object({
  primaryItemId: cuid,
  alternativeItemId: cuid,
  scope: z.string().optional(),
  conditions: z.string().optional(),
});

// ─── AI Action types (Phase 4, defined now for type safety) ───

export const aiActionTypes = [
  "ANSWER",
  "CREATE",
  "UPDATE",
  "COMPLETE",
  "SKIP",
  "REPLACE",
  "RESCHEDULE",
  "DELETE",
  "QUERY",
  "IMPORT",
  "ASK_CLARIFICATION",
  "LOG_ACTIVITY",
  "LOG_RECOVERY",
  "SET_ROUTINE",
  "SET_GOAL",
] as const;

export const aiActionSchema = z.object({
  intent: z.enum(aiActionTypes),
  effectiveDate: z.string().optional(),
  target: z
    .object({
      type: z.string(),
      name: z.string().optional(),
      id: z.string().optional(),
    })
    .optional(),
  replacement: z
    .object({
      type: z.string(),
      name: z.string().optional(),
      id: z.string().optional(),
    })
    .optional(),
  scope: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type AIAction = z.infer<typeof aiActionSchema>;
