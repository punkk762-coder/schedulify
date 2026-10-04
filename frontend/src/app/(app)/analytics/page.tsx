"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsHeroHeader } from "@/components/analytics/AnalyticsHeroHeader";
import { InteractiveTrendChart } from "@/components/analytics/InteractiveTrendChart";
import { NutritionMatrixCard } from "@/components/analytics/NutritionMatrixCard";
import { CategoryAdherenceList } from "@/components/analytics/CategoryAdherenceList";
import { AiCoachingInsights } from "@/components/analytics/AiCoachingInsights";
import { DailyGoalsAndBodyStatus } from "@/components/analytics/DailyGoalsAndBodyStatus";
import { MonthlyEvolutionCard } from "@/components/analytics/MonthlyEvolutionCard";

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
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [daysCount, setDaysCount] = useState<number>(7);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAnalytics(daysCount);
  }, [daysCount, fetchAnalytics]);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto px-1 sm:px-2 text-[#1f1b14]">
      {/* Hero Header with Key Gauges & Time Range Toggles */}
      <AnalyticsHeroHeader
        daysCount={daysCount}
        onSelectDays={(val) => setDaysCount(val)}
        adherence={data?.summary.adherence || 0}
        completed={data?.summary.completed || 0}
        total={data?.summary.total || 0}
        streak={data?.summary.streak || 0}
        grade={data?.summary.grade || "A"}
        bestDay={data?.summary.bestDay || "Tue (92%)"}
      />

      {loading && !data ? (
        <div className="space-y-4">
          <div className="h-44 rounded-2xl animate-pulse bg-white/70 border border-[#dfc0b7]" />
          <div className="h-40 rounded-2xl animate-pulse bg-white/70 border border-[#dfc0b7]" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Daily Goals & Current Status of Body */}
          <DailyGoalsAndBodyStatus
            dailyGoals={data.dailyGoals}
            bodyStatus={data.bodyStatus}
          />

          {/* Interactive Adherence Trend Chart */}
          <InteractiveTrendChart
            dailyTrend={data.dailyTrend}
            daysCount={daysCount}
          />

          {/* Monthly Schedule Evolution & Historical Immutability Ledger */}
          <MonthlyEvolutionCard
            unchanged={data.routineEvolution?.unchanged}
            changed={data.routineEvolution?.changed}
          />

          {/* Nutrition & Energy Matrix */}
          <NutritionMatrixCard
            averageNutrition={data.averageNutrition}
            macroDistribution={data.macroDistribution}
            targetCalories={1800}
            targetProtein={150}
            targetCarbs={160}
            targetFat={45}
          />

          {/* Category Adherence Breakdown */}
          <CategoryAdherenceList
            categoryBreakdown={data.categoryBreakdown}
          />

          {/* AI Solstice Behavioral Coaching Insights */}
          <AiCoachingInsights
            insights={data.insights}
            adherence={data.summary.adherence}
          />
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-[#dfc0b7] text-center space-y-3">
          <span className="text-3xl">📊</span>
          <h3 className="text-base font-serif font-bold text-[#1f1b14]">No telemetry recorded yet</h3>
          <p className="text-xs text-[#58423c]">
            Complete routine items on the Today dashboard to populate longitudinal biometrics.
          </p>
        </div>
      )}
    </div>
  );
}
