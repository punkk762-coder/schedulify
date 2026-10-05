"use client";

import React from "react";
import { InteractiveTrendChart } from "./InteractiveTrendChart";
import { NutritionMatrixCard } from "./NutritionMatrixCard";
import { CategoryAdherenceList } from "./CategoryAdherenceList";
import { AiCoachingInsights } from "./AiCoachingInsights";
import { DailyGoalsAndBodyStatus } from "./DailyGoalsAndBodyStatus";
import { MonthlyEvolutionCard } from "./MonthlyEvolutionCard";
import { WinterArcCockpit } from "./WinterArcCockpit";

interface AnalyticsResponse {
  summary: {
    total: number;
    completed: number;
    skipped: number;
    missed: number;
    replaced: number;
    adherence: number;
    streak: number;
    grade?: string;
    bestDay?: string;
  };
  timeRange?: {
    daysCount: number;
    startDate: string;
    endDate: string;
  };
  averageNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  macroDistribution?: {
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };
  dailyTrend: Array<{
    date: string;
    day: string;
    completed: number;
    total: number;
    rate: number;
    calories?: number;
    protein?: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    completed: number;
    rate: number;
  }>;
  insights?: string[];
  bodyStatus?: {
    metabolicState: string;
    proteinAdherencePct: number;
    proteinTarget: number;
    averageProtein: number;
    hydrationTargetMl: number;
    estimatedWeeklyDeficitKcal: number;
    monthlyProjection: string;
  };
  dailyGoals?: Array<{
    name: string;
    target: number;
    unit: string;
    current: number;
    status: string;
  }>;
  routineEvolution?: {
    unchanged: Array<{
      title: string;
      category: string;
      status: string;
      adherencePct: number;
      notes: string;
    }>;
    changed: Array<{
      title: string;
      category: string;
      status: string;
      adherencePct: number;
      notes: string;
    }>;
  };
  activityTelemetry?: {
    totalSteps: number;
    totalDistanceKm: number;
    averageStepsPerDay: number;
  };
  monthlyMilestone?: {
    currentMonth: string;
    targetWeightKg: number;
    currentWeightKg: number;
    status: string;
    velocityNotes: string;
    previousMonth?: {
      month: string;
      targetWeightKg?: number;
      status?: string;
      velocityNotes?: string;
    } | null;
  };
  winterArc?: any;
}

interface AnalyticsDesktopViewProps {
  data: AnalyticsResponse;
  daysCount: number;
  onSelectDays: (days: number) => void;
  onRefresh?: () => void;
}

export function AnalyticsDesktopView({
  data,
  daysCount,
  onSelectDays,
  onRefresh,
}: AnalyticsDesktopViewProps) {
  const { summary, averageNutrition, dailyTrend, categoryBreakdown, insights, bodyStatus, dailyGoals, routineEvolution, monthlyMilestone, activityTelemetry } = data;

  return (
    <div className="w-full space-y-6">
      {/* ─── Clean Header & Timeframe Switcher ─── */}
      <header className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              Biometrics &amp; Telemetry
            </span>
            <span className="text-xs font-mono text-[#8b716a]">• High-Precision Longitudinal Engine</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1f1b14]">Protocol Analytics</h1>
          <p className="text-xs text-[#58423c] mt-0.5">
            Real-time biometric trends, macro fulfillment, and immutable monthly routine stability.
          </p>
        </div>

        {/* Range Selector & Overall Grade */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-[#fcf2e6] p-1.5 rounded-xl border border-[#dfc0b7] text-xs font-semibold">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onSelectDays(d)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  daysCount === d
                    ? "bg-[#a43716] text-white shadow-xs font-bold"
                    : "text-[#58423c] hover:text-[#1f1b14]"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 bg-[#fcf2e6] px-4 py-2 rounded-xl border border-[#dfc0b7]">
            <span className="text-2xl font-serif font-bold text-[#a43716]">
              {summary.grade || (summary.adherence >= 80 ? "A" : "B+")}
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">Protocol Grade</span>
              <span className="text-xs font-bold text-[#1f1b14]">{summary.adherence}% Execution</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── 4 Clean Top Metric Tiles ─── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#dfc0b7] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Overall Adherence
          </span>
          <span className="text-2xl font-serif font-bold text-[#1f1b14] mt-1 block">
            {summary.adherence}%
          </span>
          <span className="text-[11px] text-[#52652a] font-medium mt-0.5 block">
            {summary.completed} of {summary.total} occurrences completed
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#dfc0b7] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Average Daily Intake
          </span>
          <span className="text-2xl font-serif font-bold text-[#1f1b14] mt-1 block">
            {averageNutrition.calories} <span className="text-xs font-sans font-normal text-[#8b716a]">kcal</span>
          </span>
          <span className="text-[11px] text-[#58423c] font-medium mt-0.5 block">
            Target: 1,800 kcal / day
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#dfc0b7] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Muscle Protein Synthesis
          </span>
          <span className="text-2xl font-serif font-bold text-[#52652a] mt-1 block">
            {averageNutrition.protein}g <span className="text-xs font-sans font-normal text-[#8b716a]">/ 150g</span>
          </span>
          <span className="text-[11px] text-[#52652a] font-medium mt-0.5 block">
            {Math.min(100, Math.round(((averageNutrition.protein || 0) / 150) * 100))}% Protein Fulfillment
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#dfc0b7] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Streak Velocity
          </span>
          <span className="text-2xl font-serif font-bold text-[#a43716] mt-1 block">
            {summary.streak} {summary.streak === 1 ? "Day" : "Days"}
          </span>
          <span className="text-[11px] text-[#8b716a] font-medium mt-0.5 block">
            Best day: {summary.bestDay || "Consistent"}
          </span>
        </div>
      </div>

      {/* ─── Winter Arc 5-Phase Physique Command Center & AI Transition ─── */}
      <WinterArcCockpit winterArc={data.winterArc} onRefresh={onRefresh} />

      {/* ─── Middle Section: Trend Chart & Daily Goals ─── */}
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-7 space-y-6">
          <InteractiveTrendChart dailyTrend={dailyTrend} daysCount={daysCount} />
          <CategoryAdherenceList categoryBreakdown={categoryBreakdown} />
        </div>

        <div className="col-span-5 space-y-6">
          <NutritionMatrixCard
            averageNutrition={averageNutrition}
            macroDistribution={data.macroDistribution}
          />
          <AiCoachingInsights insights={insights} adherence={summary.adherence} />
        </div>
      </div>

      {/* ─── Monthly Milestone Progression & Longitudinal Velocity ─── */}
      {monthlyMilestone && (
        <div className="bg-gradient-to-r from-[#fcf2e6] via-white to-[#fcf2e6] rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                Monthly Goal Progression • {monthlyMilestone.currentMonth}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${monthlyMilestone.status === "ACHIEVED" ? "bg-[#d4eca2] text-[#3b4d14]" : "bg-[#ffdbd1] text-[#a43716]"}`}>
                {monthlyMilestone.status === "ACHIEVED" ? "Goal Achieved ✓" : "In Progress"}
              </span>
              {activityTelemetry?.totalSteps ? (
                <span className="text-[10px] font-mono text-[#52652a] font-bold bg-[#d4eca2]/60 px-2 py-0.5 rounded-full">
                  🚶 {activityTelemetry.totalSteps.toLocaleString()} steps tracked
                </span>
              ) : null}
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1f1b14]">
              Target: {monthlyMilestone.targetWeightKg} kg • Current Metric: {monthlyMilestone.currentWeightKg} kg
            </h3>
            <p className="text-xs text-[#58423c] leading-relaxed">
              {monthlyMilestone.velocityNotes}
            </p>
          </div>
          {monthlyMilestone.previousMonth && (
            <div className="bg-white/80 p-3.5 rounded-xl border border-[#dfc0b7] text-xs space-y-1 sm:max-w-xs shrink-0 shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-[#8b716a] block uppercase">
                Prior Month Baseline ({monthlyMilestone.previousMonth.month})
              </span>
              <p className="text-[#1f1b14] font-medium text-[11px]">
                {monthlyMilestone.previousMonth.velocityNotes || `Target: ${monthlyMilestone.previousMonth.targetWeightKg}kg`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Bottom Section: Goals, Body Status & Monthly Evolution ─── */}
      <DailyGoalsAndBodyStatus dailyGoals={dailyGoals} bodyStatus={bodyStatus} />

      <MonthlyEvolutionCard
        unchanged={routineEvolution?.unchanged}
        changed={routineEvolution?.changed}
      />
    </div>
  );
}
