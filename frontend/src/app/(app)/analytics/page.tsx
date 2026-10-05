"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsDesktopView } from "@/components/analytics/AnalyticsDesktopView";
import { AnalyticsMobileView } from "@/components/analytics/AnalyticsMobileView";

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
  deviations?: {
    totalCount: number;
    totalCalories: number;
    items: Array<{
      id: string;
      date: string;
      title: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      mealSlot: string;
      notes: string;
      time: string;
    }>;
  };
  caloriesSummary?: {
    totalPlanned: number;
    totalOffPlan: number;
    totalAll: number;
    averageDaily: number;
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
    <div className="w-full text-[#1f1b14]">
      {loading && !data ? (
        <div className="space-y-4 max-w-5xl mx-auto">
          <div className="h-44 rounded-2xl animate-pulse bg-white/70 border border-[#dfc0b7]" />
          <div className="h-40 rounded-2xl animate-pulse bg-white/70 border border-[#dfc0b7]" />
        </div>
      ) : data ? (
        <>
          {/* Desktop Clean Executive View (lg+) */}
          <div className="hidden lg:block">
            <AnalyticsDesktopView
              data={data}
              daysCount={daysCount}
              onSelectDays={(val) => setDaysCount(val)}
              onRefresh={() => fetchAnalytics(daysCount)}
            />
          </div>

          {/* Mobile Magnificent Story View (< lg) */}
          <div className="block lg:hidden">
            <AnalyticsMobileView
              data={data}
              daysCount={daysCount}
              onSelectDays={(val) => setDaysCount(val)}
              onRefresh={() => fetchAnalytics(daysCount)}
            />
          </div>
        </>
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
