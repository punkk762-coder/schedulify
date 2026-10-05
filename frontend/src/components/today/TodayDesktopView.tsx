"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { TodayOccurrence, DailyStats } from "@/lib/domain/types";
import { OccurrenceCard } from "./OccurrenceCard";
import { MacroLedger } from "./MacroLedger";
import { HydrationWidget } from "./HydrationWidget";
import { MomKitchenHub } from "./MomKitchenHub";

interface TodayDesktopViewProps {
  occurrences: TodayOccurrence[];
  stats: DailyStats | null;
  dateStr: string;
  waterIntakeMl: number;
  activity?: {
    totalSteps: number;
    totalDistanceKm: number;
    totalCaloriesBurned: number;
    logs: Array<{ id: string; title: string; steps?: number; distanceKm?: number; caloriesBurned?: number; notes?: string; time?: string }>;
  } | null;
  monthlyGoal?: {
    month: string;
    targetWeightKg?: number;
    currentWeightKg?: number;
    dailyStepsTarget?: number;
    status: string;
    velocityNotes?: string;
  } | null;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenSwapModal: (item: TodayOccurrence) => void;
  onAddWater: (delta: number) => void;
  onQuickLog: (text: string) => void;
  quickText: string;
  setQuickText: (text: string) => void;
  submittingQuick: boolean;
}

export function TodayDesktopView({
  occurrences,
  stats,
  dateStr,
  waterIntakeMl,
  activity,
  monthlyGoal,
  activeCategory,
  setActiveCategory,
  onComplete,
  onUndo,
  onSkip,
  onOpenSwapModal,
  onAddWater,
  onQuickLog,
  quickText,
  setQuickText,
  submittingQuick,
}: TodayDesktopViewProps) {
  const [orderMode, setOrderMode] = useState<"smart" | "chrono">("smart");

  // Metrics
  const completedCount = occurrences.filter((o) => o.status === "COMPLETED").length;
  const totalCount = occurrences.length;
  const adherence = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const queuedMeals = occurrences.filter((o) => o.category === "MEAL" && o.status === "PENDING").length;

  // Filter items
  const filtered = occurrences.filter((item) => {
    if (activeCategory === "ALL") return true;
    if (activeCategory === "MEAL") return item.category === "MEAL";
    if (activeCategory === "MOVEMENT") return item.category === "WORKOUT" || item.category === "ACTIVITY";
    return item.category !== "MEAL" && item.category !== "WORKOUT" && item.category !== "ACTIVITY";
  });

  const pendingItems = filtered.filter((o) => o.status === "PENDING");
  const pastItems = filtered.filter((o) => o.status !== "PENDING");
  const nextUp = pendingItems[0] || null;
  const subsequent = pendingItems.slice(1);

  return (
    <div className="w-full space-y-6">
      {/* ─── Clean Executive Header ─── */}
      <header className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              Active Routine OS
            </span>
            <span className="text-xs font-mono text-[#8b716a]">• Live PostgreSQL Sync</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1f1b14]">{dateStr || "Today"}</h1>
          <p className="text-xs text-[#58423c] mt-0.5">
            Prescribed Mediterranean Protocol • High-Density Executive Cockpit
          </p>
          {monthlyGoal && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fcf2e6] border border-[#dfc0b7] text-[11px] font-mono">
              <span className="text-[#a43716] font-bold">🎯 October Milestone:</span>
              <span className="text-[#1f1b14] font-semibold">{monthlyGoal.targetWeightKg}kg Target</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${monthlyGoal.status === "ACHIEVED" ? "bg-[#d4eca2] text-[#3b4d14]" : "bg-[#ffdbd1] text-[#a43716]"}`}>
                {monthlyGoal.status === "ACHIEVED" ? "Goal Achieved ✓" : "In Progress"}
              </span>
            </div>
          )}
        </div>

        {/* Executive Telemetry Badges */}
        <div className="flex items-center gap-4">
          {/* Adherence Dial */}
          <div className="flex items-center gap-3 bg-[#fcf2e6] px-4 py-2.5 rounded-xl border border-[#dfc0b7]">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#dfc0b7" strokeWidth="3" opacity="0.6" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#a43716"
                  strokeWidth="3.5"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - adherence / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-[#1f1b14]">{adherence}%</span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
                Completion Rate
              </span>
              <span className="text-xs font-bold text-[#1f1b14]">
                {completedCount} of {totalCount} Completed
              </span>
            </div>
          </div>

          {/* Quick AI Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickText.trim()) onQuickLog(quickText.trim());
            }}
            className="flex items-center gap-2 bg-[#fcf2e6] px-3.5 py-2 rounded-xl border border-[#dfc0b7] focus-within:border-[#a43716] transition-all"
          >
            <span className="text-sm">⚡</span>
            <input
              type="text"
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="Quick log (e.g. 'ate 2 eggs', 'walked 45m')..."
              className="bg-transparent text-xs text-[#1f1b14] placeholder-[#8b716a] outline-none w-64 font-medium"
              disabled={submittingQuick}
            />
            <button
              type="submit"
              disabled={!quickText.trim() || submittingQuick}
              className="px-2.5 py-1 bg-[#a43716] hover:bg-[#862201] text-white text-[11px] font-semibold rounded-lg transition-all disabled:opacity-40"
            >
              Log
            </button>
          </form>
        </div>
      </header>

      {/* ─── 12-Column Desktop Grid ─── */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Clean Day Ledger (7 cols) */}
        <section className="col-span-7 space-y-4">
          {/* Controls Bar: Category Filter Pills + Order Mode Switch */}
          <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
            <div className="flex items-center gap-1.5 bg-[#fcf2e6] p-1 rounded-xl border border-[#dfc0b7] text-xs">
              {[
                { id: "ALL", label: `All (${occurrences.length})` },
                { id: "MEAL", label: `Meals (${occurrences.filter((o) => o.category === "MEAL").length})` },
                {
                  id: "MOVEMENT",
                  label: `Workouts (${occurrences.filter((o) => o.category === "WORKOUT" || o.category === "ACTIVITY").length})`,
                },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveCategory(pill.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === pill.id
                      ? "bg-white text-[#1f1b14] shadow-xs"
                      : "text-[#58423c] hover:text-[#1f1b14]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#fcf2e6] p-1 rounded-xl border border-[#dfc0b7] text-xs">
              <button
                type="button"
                onClick={() => setOrderMode("smart")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderMode === "smart"
                    ? "bg-[#a43716] text-white shadow-xs"
                    : "text-[#58423c] hover:text-[#1f1b14]"
                }`}
              >
                Focus Order
              </button>
              <button
                type="button"
                onClick={() => setOrderMode("chrono")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orderMode === "chrono"
                    ? "bg-white text-[#1f1b14] shadow-xs"
                    : "text-[#58423c] hover:text-[#1f1b14]"
                }`}
              >
                Timeline
              </button>
            </div>
          </div>

          {/* Routine Items List */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-[#dfc0b7]">
              <p className="text-sm font-serif font-semibold text-[#1f1b14]">No items found in this filter</p>
              <p className="text-xs text-[#58423c] mt-1">Switch to &apos;All&apos; to view complete daily schedule.</p>
            </div>
          ) : orderMode === "smart" ? (
            <div className="space-y-4">
              {/* Next Up Highlight */}
              {nextUp && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#a43716] animate-ping" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                      Next Scheduled Action
                    </span>
                  </div>
                  <OccurrenceCard
                    item={nextUp}
                    isNextUp={true}
                    onComplete={onComplete}
                    onUndo={onUndo}
                    onSkip={onSkip}
                    onOpenSwap={onOpenSwapModal}
                  />
                </div>
              )}

              {/* Subsequent Pending Items */}
              {subsequent.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
                    Upcoming Queue ({subsequent.length})
                  </span>
                  {subsequent.map((item) => (
                    <OccurrenceCard
                      key={item.id}
                      item={item}
                      onComplete={onComplete}
                      onUndo={onUndo}
                      onSkip={onSkip}
                      onOpenSwap={onOpenSwapModal}
                    />
                  ))}
                </div>
              )}

              {/* Past / Completed Items */}
              {pastItems.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#dfc0b7]/60">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#52652a] block">
                    Recorded Today ({pastItems.length})
                  </span>
                  {pastItems.map((item) => (
                    <OccurrenceCard
                      key={item.id}
                      item={item}
                      onComplete={onComplete}
                      onUndo={onUndo}
                      onSkip={onSkip}
                      onOpenSwap={onOpenSwapModal}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <OccurrenceCard
                  key={item.id}
                  item={item}
                  onComplete={onComplete}
                  onUndo={onUndo}
                  onSkip={onSkip}
                  onOpenSwap={onOpenSwapModal}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Clean Telemetry & Hearth (5 cols) */}
        <aside className="col-span-5 space-y-5 sticky top-24">
          {/* Daily Nutrition Ledger */}
          <MacroLedger
            currentCalories={stats?.nutrition?.calories || 0}
            targetCalories={1800}
            currentProtein={stats?.nutrition?.protein || 0}
            targetProtein={150}
            currentCarbs={stats?.nutrition?.carbs || 0}
            targetCarbs={160}
            currentFat={stats?.nutrition?.fat || 0}
            targetFat={45}
          />

          {/* Hydration Widget */}
          <HydrationWidget
            waterIntakeMl={waterIntakeMl}
            targetMl={3000}
            onAddWater={onAddWater}
          />

          {/* Daily Steps & Movement Telemetry */}
          <div className="bg-white rounded-2xl p-5 border border-[#dfc0b7] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52652a] block">
                  Movement Telemetry
                </span>
                <h4 className="text-sm font-serif font-bold text-[#1f1b14]">
                  Daily Steps &amp; Activity
                </h4>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#a43716] bg-[#ffdbd1] px-2.5 py-0.5 rounded-full">
                {activity?.totalSteps ? `${activity.totalSteps.toLocaleString()} steps` : "0 steps"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-[#fcf2e6] p-2.5 rounded-xl border border-[#dfc0b7]">
                <span className="text-[10px] text-[#58423c] block font-medium">Distance</span>
                <span className="font-mono font-bold text-sm text-[#1f1b14]">
                  {activity?.totalDistanceKm || 0} km
                </span>
              </div>
              <div className="bg-[#fcf2e6] p-2.5 rounded-xl border border-[#dfc0b7]">
                <span className="text-[10px] text-[#58423c] block font-medium">Est. Burn</span>
                <span className="font-mono font-bold text-sm text-[#a43716]">
                  {activity?.totalCaloriesBurned || 0} kcal
                </span>
              </div>
            </div>

            {activity?.logs && activity.logs.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">
                  Recorded Sessions ({activity.logs.length})
                </span>
                {activity.logs.map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-[#fcf2e6]/50 border border-[#dfc0b7] text-[11px] flex items-center justify-between">
                    <span className="font-semibold text-[#1f1b14] truncate">{log.title}</span>
                    <span className="font-mono text-[#52652a] shrink-0">{log.notes || `${log.steps} steps`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mom's Kitchen Hub Link */}
          <MomKitchenHub queuedCount={queuedMeals} />

          {/* Quick Links / Coach Quick Prompt */}
          <div className="bg-[#fcf2e6] rounded-2xl p-5 border border-[#dfc0b7] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#a43716]">AI Assistant Studio</span>
              <span className="text-xs">🤖</span>
            </div>
            <p className="text-xs text-[#58423c]">
              Need to alter tomorrow&apos;s macros or import a fresh training schedule? Consult the AI coach.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#a43716] hover:underline"
            >
              Open AI Routine Studio →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
