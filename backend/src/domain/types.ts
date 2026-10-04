/**
 * Domain types that extend/simplify Prisma types for business logic.
 * These types represent the shapes used in service layers and API responses.
 */

// ─── Today view ───

export type TodayOccurrence = {
  id: string;
  title: string;
  category: string;
  scheduledTime: string;
  status: "PENDING" | "COMPLETED" | "SKIPPED" | "MISSED" | "REPLACED" | "PARTIAL";
  routineItemId: string;
  nutrition?: NutritionValues;
  hasAlternatives: boolean;
  alternatives?: AlternativeInfo[];
  hasReminder: boolean;
  meal?: MealInfo;
};

export type NutritionValues = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
};

export type AlternativeInfo = {
  id: string;
  itemId: string;
  title: string;
};

export type MealInfo = {
  mealType: string;
  components: MealComponentInfo[];
};

export type MealComponentInfo = {
  name: string;
  quantity?: string;
  unit?: string;
};

// ─── Mom Kitchen view ───

export type KitchenMeal = {
  time: string;
  mealType: string;
  title: string;
  components: MealComponentInfo[];
  notes?: string;
  nutrition?: NutritionValues;
};

// ─── Analytics (computed on-the-fly) ───

export type DailyStats = {
  date: string;
  total: number;
  completed: number;
  skipped: number;
  missed: number;
  replaced: number;
  completionRate: number;
  nutrition: NutritionValues;
};

export type WeeklyStats = {
  weekStart: string;
  weekEnd: string;
  days: DailyStats[];
  averageCompletionRate: number;
  averageNutrition: NutritionValues;
  streaks: StreakInfo;
  missedItems: MissedItemRanking[];
};

export type StreakInfo = {
  current: number;
  longest: number;
};

export type MissedItemRanking = {
  routineItemId: string;
  title: string;
  missedCount: number;
};

// ─── Plan Import (Phase 4 types, defined now) ───

export type PlanImportProposal = {
  plans: ProposedPlan[];
  routineItems: ProposedRoutineItem[];
  schedules: ProposedSchedule[];
  meals: ProposedMeal[];
  nutrition: ProposedNutrition[];
  alternatives: ProposedAlternative[];
  reminders: ProposedReminder[];
  assumptions: string[];
  ambiguities: string[];
  warnings: string[];
};

export type ProposedPlan = {
  name: string;
  category?: string;
};

export type ProposedRoutineItem = {
  tempId: string;
  planRef: string;
  title: string;
  category: string;
  type?: string;
};

export type ProposedSchedule = {
  itemRef: string;
  recurrenceRule: string;
  scheduledTime: string;
  effectiveFrom: string;
};

export type ProposedMeal = {
  itemRef: string;
  mealType: string;
  components: MealComponentInfo[];
};

export type ProposedNutrition = {
  itemRef: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
};

export type ProposedAlternative = {
  primaryRef: string;
  alternativeRef: string;
  scope?: string;
  conditions?: string;
};

export type ProposedReminder = {
  itemRef: string;
  offsetMinutes: number;
};
