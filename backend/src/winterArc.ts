export interface WinterArcPhaseConfig {
  phaseNumber: number;
  monthKey: string; // e.g. "2026-10"
  monthName: string; // "October 2026"
  title: string; // "Phase 1: Metabolic Baseline & Habit Anchoring"
  subtitle: string;
  theme: string;
  targetWeightKg: number;
  dailyStepsTarget: number;
  dailyWaterTargetMl: number;
  weeklyWorkoutsTarget: number;
  expectedCaloricIntake: number;
  expectedProteinGrams: number;
  physiqueMilestone: string;
  aiFocusPrompt: string;
}

export const WINTER_ARC_PHASES: WinterArcPhaseConfig[] = [
  {
    phaseNumber: 1,
    monthKey: "2026-10",
    monthName: "October 2026",
    title: "Phase 1: Metabolic Baseline & Habit Anchoring",
    subtitle: "Lock morning sunlight, 1,800 kcal clean deficit, 150g protein, and 8,000 steps without fail",
    theme: "Habit Anchoring & Base Recomposition",
    targetWeightKg: 72.0,
    dailyStepsTarget: 8000,
    dailyWaterTargetMl: 3000,
    weeklyWorkoutsTarget: 5,
    expectedCaloricIntake: 1800,
    expectedProteinGrams: 150,
    physiqueMilestone: "Shed 2kg visceral bloating, establish muscle glycogen fullness with 5g creatine",
    aiFocusPrompt: "Solidify core habit compliance above 85%. Focus on evening walks to guarantee 8k steps.",
  },
  {
    phaseNumber: 2,
    monthKey: "2026-11",
    monthName: "November 2026",
    title: "Phase 2: Hypertrophy Velocity & Step Escalation",
    subtitle: "Ramp step volume to 10,000, creatine saturation locked, intensify progressive overload",
    theme: "Hypertrophy & Density",
    targetWeightKg: 71.0,
    dailyStepsTarget: 10000,
    dailyWaterTargetMl: 3200,
    weeklyWorkoutsTarget: 5,
    expectedCaloricIntake: 1850,
    expectedProteinGrams: 155,
    physiqueMilestone: "Chest and shoulder deltoid cap density visible; waist circumference drops to 31 inches",
    aiFocusPrompt: "Maintain high mechanical tension in gym. Scale step count without compromising recovery.",
  },
  {
    phaseNumber: 3,
    monthKey: "2026-12",
    monthName: "December 2026",
    title: "Phase 3: Metabolic Defense & Holiday Resilience",
    subtitle: "Anti-sabotage protocol: maintain 10k steps and zero missed hydration during winter holidays",
    theme: "Metabolic Resilience & Defense",
    targetWeightKg: 70.0,
    dailyStepsTarget: 10000,
    dailyWaterTargetMl: 3200,
    weeklyWorkoutsTarget: 5,
    expectedCaloricIntake: 1800,
    expectedProteinGrams: 155,
    physiqueMilestone: "Preserve lean muscle mass through holiday social events; zero fat rebound",
    aiFocusPrompt: "Utilize intermittent fasting buffers before social dinners. Daily hydration at 3.2L is mandatory.",
  },
  {
    phaseNumber: 4,
    monthKey: "2027-01",
    monthName: "January 2027",
    title: "Phase 4: Peak Recomposition & Body Fat Stripping",
    subtitle: "Accelerate fat burn with 12,000 daily steps, high NEAT, and strict nutrient timing",
    theme: "Fat Stripping & Core Vascularity",
    targetWeightKg: 69.0,
    dailyStepsTarget: 12000,
    dailyWaterTargetMl: 3500,
    weeklyWorkoutsTarget: 6,
    expectedCaloricIntake: 1750,
    expectedProteinGrams: 160,
    physiqueMilestone: "Upper abdominal definition sharp, lower belly fat mobilization, vascularity in forearms",
    aiFocusPrompt: "Morning fasted walk + post-dinner walk to easily clear 12k steps. Strict 160g protein preservation.",
  },
  {
    phaseNumber: 5,
    monthKey: "2027-02",
    monthName: "February 2027",
    title: "Phase 5: The Final Reveal & Dream Physique Peak",
    subtitle: "Culmination of 5 months: sub-12% body fat, full muscle bellies, aesthetic dream physique",
    theme: "Dream Physique Peak & Master Blueprint",
    targetWeightKg: 68.0,
    dailyStepsTarget: 12000,
    dailyWaterTargetMl: 3500,
    weeklyWorkoutsTarget: 5,
    expectedCaloricIntake: 1800,
    expectedProteinGrams: 160,
    physiqueMilestone: "Full 6-pack visibility, etched serratus, dense back definition, ultimate Winter Arc completion",
    aiFocusPrompt: "Final photoshoot readiness and transition to permanent aesthetic maintenance routine OS.",
  },
];

export function getWinterArcPhase(monthKey: string): WinterArcPhaseConfig {
  const found = WINTER_ARC_PHASES.find((p) => p.monthKey === monthKey);
  return found || WINTER_ARC_PHASES[0];
}

export function getNextWinterArcPhase(currentMonthKey: string): WinterArcPhaseConfig | null {
  const currentIndex = WINTER_ARC_PHASES.findIndex((p) => p.monthKey === currentMonthKey);
  if (currentIndex >= 0 && currentIndex < WINTER_ARC_PHASES.length - 1) {
    return WINTER_ARC_PHASES[currentIndex + 1];
  }
  return null;
}
