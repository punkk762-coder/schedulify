"use client";

import React, { useState } from "react";
import Link from "next/link";
import { InteractiveTrendChart } from "./InteractiveTrendChart";
import { NutritionMatrixCard } from "./NutritionMatrixCard";
import { CategoryAdherenceList } from "./CategoryAdherenceList";
import { DailyGoalsAndBodyStatus } from "./DailyGoalsAndBodyStatus";
import { MonthlyEvolutionCard } from "./MonthlyEvolutionCard";

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
}

interface AnalyticsMobileViewProps {
  data: AnalyticsResponse;
  daysCount: number;
  onSelectDays: (days: number) => void;
}

export function AnalyticsMobileView({
  data,
  daysCount,
  onSelectDays,
}: AnalyticsMobileViewProps) {
  const { summary, averageNutrition, dailyTrend, categoryBreakdown, insights, bodyStatus, dailyGoals, routineEvolution, monthlyMilestone, activityTelemetry } = data;

  return (
    <div className="w-full space-y-4 pb-20 animate-in fade-in duration-300">
      {/* ─── Magnificent Mobile Radial Scorecard ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1f1b14] via-[#2d271e] to-[#14120e] text-white rounded-3xl p-6 shadow-xl border border-[#dfc0b7]/20">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#a43716]/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#52652a]/20 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Days range selector pill */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/15 text-[11px] font-mono font-bold mb-4">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onSelectDays(d)}
                className={`px-3 py-1 rounded-full transition-all ${
                  daysCount === d
                    ? "bg-[#a43716] text-white shadow-xs"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          {/* Magnificent Glowing Radial Dial */}
          <div className="relative w-28 h-28 flex items-center justify-center my-1">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#d4eca2"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - summary.adherence / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-serif font-bold text-white leading-none">
                {summary.grade || (summary.adherence >= 80 ? "A" : "B+")}
              </span>
              <span className="text-[11px] font-mono font-bold text-[#d4eca2] mt-0.5">
                {summary.adherence}%
              </span>
            </div>
          </div>

          <h2 className="text-lg font-serif font-bold text-white mt-2">
            Execution Velocity
          </h2>
          <p className="text-xs text-white/70 max-w-xs mt-0.5">
            {summary.completed} of {summary.total} occurrences executed over {daysCount} days.
          </p>
        </div>

        {/* 4 Micro Metric Badges */}
        <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/60 block">Daily Fuel</span>
            <span className="text-sm font-mono font-bold text-white">{averageNutrition.calories} kcal</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#d4eca2] block font-bold">Protein</span>
            <span className="text-sm font-mono font-bold text-[#d4eca2]">{averageNutrition.protein}g / 150g</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/60 block">Best Streak</span>
            <span className="text-sm font-mono font-bold text-[#ffb5a0]">{summary.streak} Days Active</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/60 block">Peak Day</span>
            <span className="text-sm font-mono font-bold text-white">{summary.bestDay || "Steady"}</span>
          </div>
        </div>
      </div>

      {/* ─── Magnificent Monthly Goal & Milestone Card ─── */}
      {monthlyMilestone && (
        <div className="bg-white rounded-3xl p-5 border border-[#dfc0b7] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716] flex items-center gap-1.5">
              <span>🎯</span> Monthly Goal • {monthlyMilestone.currentMonth}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${monthlyMilestone.status === "ACHIEVED" ? "bg-[#d4eca2] text-[#3b4d14]" : "bg-[#ffdbd1] text-[#a43716]"}`}>
              {monthlyMilestone.status === "ACHIEVED" ? "Achieved ✓" : "In Progress"}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-base font-serif font-bold text-[#1f1b14]">
              Target: {monthlyMilestone.targetWeightKg} kg
            </h3>
            <span className="text-xs font-mono text-[#58423c]">Current: {monthlyMilestone.currentWeightKg} kg</span>
          </div>
          <p className="text-[11px] text-[#58423c] leading-relaxed">
            {monthlyMilestone.velocityNotes}
          </p>
          {activityTelemetry?.totalSteps ? (
            <div className="pt-2 border-t border-[#dfc0b7]/60 flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#52652a] font-bold">🚶 Steps Tracked:</span>
              <span className="text-[#1f1b14] font-bold">{activityTelemetry.totalSteps.toLocaleString()} steps ({activityTelemetry.totalDistanceKm}km)</span>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── Touch Interactive Trend Velocity ─── */}
      <InteractiveTrendChart dailyTrend={dailyTrend} daysCount={daysCount} />

      {/* ─── Nutritional Matrix ─── */}
      <NutritionMatrixCard
        averageNutrition={averageNutrition}
        macroDistribution={data.macroDistribution}
      />

      {/* ─── Category Adherence Breakdown ─── */}
      <CategoryAdherenceList categoryBreakdown={categoryBreakdown} />

      {/* ─── Daily Goals & Biometrics ─── */}
      <DailyGoalsAndBodyStatus dailyGoals={dailyGoals} bodyStatus={bodyStatus} />

      {/* ─── Longitudinal Routine Stability ─── */}
      <MonthlyEvolutionCard
        unchanged={routineEvolution?.unchanged}
        changed={routineEvolution?.changed}
      />

      {/* ─── AI Solstice Coach Floating Card ─── */}
      <div className="bg-[#fcf2e6] rounded-3xl p-5 border border-[#dfc0b7] space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h4 className="text-sm font-serif font-bold text-[#1f1b14]">AI Coach Advice</h4>
            <span className="text-[10px] font-mono text-[#52652a] font-bold">Pattern Intelligence Active</span>
          </div>
        </div>

        {insights && insights.length > 0 ? (
          <p className="text-xs text-[#58423c] leading-relaxed bg-white/80 p-3 rounded-2xl border border-[#dfc0b7]">
            {insights[0]}
          </p>
        ) : null}

        <Link
          href="/chat"
          className="w-full py-2.5 rounded-2xl bg-[#a43716] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
        >
          <span>Consult AI Coach in Studio</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
