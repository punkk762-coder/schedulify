"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { TodayOccurrence, DailyStats } from "@/lib/domain/types";
import { FitnessRecoveryCockpit, type FitnessRecoveryData } from "./FitnessRecoveryCockpit";
import { DailyWeightCard } from "./DailyWeightCard";
import { OffPlanMealsCard, type DifferentMealItem } from "./OffPlanMealsCard";
import { MacroLedger } from "./MacroLedger";
import { ThreeProgressHalo } from "@/components/3d/ThreeProgressHalo";

interface TodayMobileViewProps {
  occurrences: TodayOccurrence[];
  stats: DailyStats | null;
  dateStr: string;
  waterIntakeMl: number;
  recovery?: FitnessRecoveryData | null;
  onUpdateRecovery?: (data: Partial<FitnessRecoveryData>) => void;
  winterArc?: any;
  onRefresh?: () => void;
  differentMeals?: DifferentMealItem[];
  weightInfo?: {
    todayWeight: number | null;
    defaultWeight: number;
    isLoggedToday: boolean;
  };
  onOpenDifferentMealModal?: () => void;
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
  recentlyCompletedId?: string | null;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenSwapModal: (item: TodayOccurrence) => void;
  onAddWater: (delta: number) => void;
  onQuickLog: (text: string) => void;
  quickText: string;
  setQuickText: (text: string) => void;
  submittingQuick: boolean;
  pendingActionIds?: Set<string>;
  addingWater?: boolean;
}

const categoryIcons: Record<string, string> = {
  MEAL: "🍲",
  WORKOUT: "🏋️",
  SUPPLEMENT: "💊",
  HYDRATION: "💧",
  ACTIVITY: "🚶",
  OTHER: "✨",
};

export function TodayMobileView({
  occurrences,
  stats,
  dateStr,
  waterIntakeMl,
  recovery,
  onUpdateRecovery,
  winterArc,
  onRefresh,
  activity,
  monthlyGoal,
  activeCategory,
  setActiveCategory,
  recentlyCompletedId,
  onComplete,
  onUndo,
  onSkip,
  onOpenSwapModal,
  onAddWater,
  onQuickLog,
  quickText,
  setQuickText,
  submittingQuick,
  pendingActionIds,
  addingWater = false,
  differentMeals = [],
  weightInfo,
  onOpenDifferentMealModal,
}: TodayMobileViewProps) {
  const [showMacrosSheet, setShowMacrosSheet] = useState(false);

  // Counts
  const completedCount = occurrences.filter((o) => o.status === "COMPLETED").length;
  const totalCount = occurrences.length;
  const adherence = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const queuedMeals = occurrences.filter((o) => o.category === "MEAL" && o.status === "PENDING").length;

  // Filter
  const filtered = occurrences.filter((item) => {
    if (activeCategory === "ALL") return true;
    if (activeCategory === "MEAL") return item.category === "MEAL";
    if (activeCategory === "MOVEMENT") return item.category === "WORKOUT" || item.category === "ACTIVITY";
    return item.category !== "MEAL" && item.category !== "WORKOUT" && item.category !== "ACTIVITY";
  });

  const pendingItems = filtered.filter((o) => o.status === "PENDING");
  const pastItems = filtered.filter((o) => o.status !== "PENDING");

  // Dynamic Next Up: find next upcoming item closest to current time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const upcomingItems = pendingItems.filter((o) => {
    const [h, m] = (o.scheduledTime || "00:00").split(":").map(Number);
    return h * 60 + m >= currentMinutes - 30;
  });

  const nextUp = upcomingItems[0] || pendingItems[0] || null;
  const otherPending = nextUp ? pendingItems.filter((it) => it.id !== nextUp.id) : [];

  const calories = stats?.nutrition?.calories || 0;
  const protein = stats?.nutrition?.protein || 0;
  const calPercent = Math.min(100, Math.round((calories / 1800) * 100));
  const proteinPercent = Math.min(100, Math.round((protein / 150) * 100));

  return (
    <div className="w-full space-y-4 pb-32 animate-in fade-in duration-300">
      {/* ─── Magnificent Mobile Hero Pill / Header ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#a43716] via-[#c54f2c] to-[#7f260b] text-white rounded-3xl p-5 shadow-lg shadow-[#a43716]/20">
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#52652a]/20 rounded-full blur-xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#d4eca2] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#fcf2e6]/90 font-bold">
                Routine OS
              </span>
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-white">
              {dateStr ? dateStr.split(",")[0] : "Today"}
            </h1>
            <p className="text-[11px] text-[#fcf2e6]/80 font-medium">
              {completedCount} of {totalCount} completed • {adherence}% Adherence
            </p>
            {monthlyGoal && (
              <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-mono">
                <span className="text-[#ffdbd1]">🎯 Oct Target: {monthlyGoal.targetWeightKg}kg</span>
                <span className={`px-1 rounded-full text-[9px] font-bold ${monthlyGoal.status === "ACHIEVED" ? "bg-[#d4eca2] text-[#3b4d14]" : "text-[#d4eca2]"}`}>
                  {monthlyGoal.status === "ACHIEVED" ? "Achieved ✓" : "Active"}
                </span>
              </div>
            )}
          </div>

          {/* 3D Glowing Gyroscopic Progress Halo */}
          <div className="relative flex flex-col items-center justify-center shrink-0">
            <ThreeProgressHalo percentage={adherence} size={68} />
            <span className="text-[10px] font-mono font-black text-[#d4eca2] drop-shadow-md -mt-1">
              {adherence}%
            </span>
          </div>
        </div>

        {/* Quick Micro-Macro Strip */}
        <div className="mt-3.5 pt-3 border-t border-white/15 grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-white/10 rounded-xl py-1 px-0.5 backdrop-blur-xs">
            <span className="text-[8px] uppercase tracking-wider text-white/70 block">Calories</span>
            <span className="text-[11px] font-mono font-bold text-white">{calories}</span>
          </div>
          <div className="bg-white/10 rounded-xl py-1 px-0.5 backdrop-blur-xs">
            <span className="text-[8px] uppercase tracking-wider text-[#d4eca2] block font-bold">Protein</span>
            <span className="text-[11px] font-mono font-bold text-[#d4eca2]">{protein}g</span>
          </div>
          <div className="bg-white/10 rounded-xl py-1 px-0.5 backdrop-blur-xs">
            <span className="text-[8px] uppercase tracking-wider text-white/70 block">Hydration</span>
            <span className="text-[11px] font-mono font-bold text-white">{(waterIntakeMl / 1000).toFixed(1)}L</span>
          </div>
          <div className="bg-white/10 rounded-xl py-1 px-0.5 backdrop-blur-xs">
            <span className="text-[8px] uppercase tracking-wider text-[#ffdbd1] block font-bold">Steps</span>
            <span className="text-[11px] font-mono font-bold text-[#ffdbd1]">
              {activity?.totalSteps ? `${(activity.totalSteps / 1000).toFixed(1)}k` : "0"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Tactile Quick Action Bubbles Carousel ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
        <button
          type="button"
          disabled={submittingQuick}
          onClick={() => {
            setQuickText("walked 2k steps right now");
            onQuickLog("walked 2k steps right now");
          }}
          className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-2xl border border-[#a43716]/30 text-[#a43716] shadow-xs active:scale-95 transition-all text-xs font-bold whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submittingQuick ? (
            <>
              <span className="w-3 h-3 border-2 border-[#a43716] border-t-transparent rounded-full animate-spin" />
              <span>Logging steps...</span>
            </>
          ) : (
            <span>🚶 {activity?.totalSteps ? `${activity.totalSteps.toLocaleString()} steps (~${activity.totalDistanceKm}km)` : "+2k Steps Walk"}</span>
          )}
        </button>
        <button
          type="button"
          disabled={addingWater}
          onClick={() => onAddWater(250)}
          className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-2xl border border-[#0284c7]/30 text-[#0284c7] shadow-xs active:scale-95 transition-all text-xs font-bold whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addingWater ? (
            <>
              <span className="w-3 h-3 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin" />
              <span>+250ml...</span>
            </>
          ) : (
            <span>💧 +250ml</span>
          )}
        </button>
        <button
          type="button"
          disabled={addingWater}
          onClick={() => onAddWater(500)}
          className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-2xl border border-[#0284c7]/30 text-[#0284c7] shadow-xs active:scale-95 transition-all text-xs font-bold whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addingWater ? (
            <>
              <span className="w-3 h-3 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin" />
              <span>+500ml...</span>
            </>
          ) : (
            <span>💧 +500ml</span>
          )}
        </button>
        <Link
          href="/mom"
          className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-2xl border border-[#52652a]/30 text-[#52652a] shadow-xs active:scale-95 transition-all text-xs font-bold whitespace-nowrap shrink-0"
        >
          <span>🍲 Mom&apos;s Kitchen ({queuedMeals})</span>
        </Link>
        <Link
          href="/chat"
          className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-2xl border border-[#a43716]/30 text-[#a43716] shadow-xs active:scale-95 transition-all text-xs font-bold whitespace-nowrap shrink-0"
        >
          <span>⚡ AI Coach</span>
        </Link>
      </div>

      {/* ─── Setup Wizard Banner (Mobile) ─── */}
      {winterArc && !winterArc.isConfigured && (
        <div className="bg-gradient-to-r from-[#fcf2e6] via-[#ffede6] to-[#fcf2e6] rounded-3xl p-4 border border-[#a43716]/40 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h4 className="text-xs font-serif font-bold text-[#1f1b14]">
                Protocol Setup Required
              </h4>
              <p className="text-[10px] text-[#58423c]">
                Set Phase 1 finish date, weight &amp; routine.
              </p>
            </div>
          </div>
          <Link
            href="/setup"
            className="px-3 py-1.5 rounded-xl bg-[#a43716] text-white font-bold text-[11px] shadow-xs hover:bg-[#8e2e12] shrink-0"
          >
            Setup →
          </Link>
        </div>
      )}

      {/* ─── Magnificent "Next Up" Focus Card ─── */}
      {nextUp ? (
        <div className="bg-white rounded-3xl p-5 border-2 border-[#a43716]/40 shadow-md shadow-[#a43716]/5 relative overflow-hidden space-y-3.5">
          <div className="absolute top-0 right-0 bg-[#a43716] text-white text-[9px] font-mono font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            NEXT UP NOW
          </div>

          <div className="flex items-start gap-3 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdbd1] text-[#a43716] flex items-center justify-center text-2xl shrink-0 shadow-xs">
              {categoryIcons[nextUp.category] || "✨"}
            </div>
            <div className="flex-1 min-w-0 pr-16">
              <span className="text-xs font-mono font-extrabold text-[#a43716] block">
                {nextUp.scheduledTime}
              </span>
              <h2 className="text-base font-serif font-bold text-[#1f1b14] truncate leading-tight">
                {nextUp.title}
              </h2>
              {nextUp.meal?.components && nextUp.meal.components.length > 0 && (
                <p className="text-[11px] text-[#58423c] truncate mt-0.5">
                  {nextUp.meal.components.map((c) => c.name).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Macro Pill Indicators */}
          {nextUp.nutrition && (
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[#58423c]">
              {nextUp.nutrition.calories ? (
                <span className="px-2 py-0.5 rounded-lg bg-[#fcf2e6] border border-[#dfc0b7] font-semibold text-[#1f1b14]">
                  {nextUp.nutrition.calories} kcal
                </span>
              ) : null}
              {nextUp.nutrition.protein ? (
                <span className="px-2 py-0.5 rounded-lg bg-[#d4eca2] border border-[#52652a]/20 font-bold text-[#52652a]">
                  +{nextUp.nutrition.protein}g Protein
                </span>
              ) : null}
            </div>
          )}

          {/* Magnificent Tactile Action Buttons */}
          <div className="grid grid-cols-12 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onComplete(nextUp.id)}
              disabled={pendingActionIds?.has(nextUp.id)}
              className="col-span-8 py-3 rounded-2xl bg-[#52652a] hover:bg-[#3f4f20] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pendingActionIds?.has(nextUp.id) ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Mark Completed</span>
                </>
              )}
            </button>

            {nextUp.hasAlternatives ? (
              <button
                type="button"
                onClick={() => onOpenSwapModal(nextUp)}
                disabled={pendingActionIds?.has(nextUp.id)}
                className="col-span-4 py-3 rounded-2xl bg-[#fcf2e6] active:scale-95 text-[#a43716] border border-[#dfc0b7] font-bold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>⇄</span>
                <span>Swap</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSkip(nextUp.id)}
                disabled={pendingActionIds?.has(nextUp.id)}
                className="col-span-4 py-3 rounded-2xl bg-[#fcf2e6] active:scale-95 text-[#8b716a] border border-[#dfc0b7] font-bold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingActionIds?.has(nextUp.id) ? (
                  <>
                    <span className="w-3 h-3 border-2 border-[#8b716a] border-t-transparent rounded-full animate-spin" />
                    <span>Skip...</span>
                  </>
                ) : (
                  <>
                    <span>↷</span>
                    <span>Skip</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 text-center border border-[#dfc0b7] shadow-xs space-y-1.5">
          <span className="text-3xl block">🎉</span>
          <h3 className="font-serif font-bold text-base text-[#1f1b14]">All Set for Today!</h3>
          <p className="text-xs text-[#58423c]">You have conquered every routine action scheduled for today.</p>
        </div>
      )}

      {/* ─── Category Segmented Slider Pills ─── */}
      <div className="flex items-center gap-1.5 p-1 bg-[#fcf2e6] rounded-2xl border border-[#dfc0b7] text-xs">
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
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all text-center ${
              activeCategory === pill.id
                ? "bg-white text-[#1f1b14] shadow-xs"
                : "text-[#58423c] hover:text-[#1f1b14]"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ─── Mobile Timeline Card Stack ─── */}
      <div className="space-y-3">
        {otherPending.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block px-1">
              Later Today ({otherPending.length})
            </span>
            {otherPending.map((item) => (
              <MobileTimelineCard
                key={item.id}
                item={item}
                isRecentlyCompleted={recentlyCompletedId === item.id}
                isActionPending={pendingActionIds?.has(item.id)}
                onComplete={onComplete}
                onUndo={onUndo}
                onSkip={onSkip}
                onOpenSwap={onOpenSwapModal}
              />
            ))}
          </div>
        )}

        {pastItems.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52652a] block px-1">
              Recorded ({pastItems.length})
            </span>
            {pastItems.map((item) => (
              <MobileTimelineCard
                key={item.id}
                item={item}
                isRecentlyCompleted={recentlyCompletedId === item.id}
                isActionPending={pendingActionIds?.has(item.id)}
                onComplete={onComplete}
                onUndo={onUndo}
                onSkip={onSkip}
                onOpenSwap={onOpenSwapModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Daily Weight Check-In ─── */}
      <div className="pt-2">
        <DailyWeightCard
          todayWeight={weightInfo?.todayWeight ?? null}
          defaultWeight={weightInfo?.defaultWeight ?? 74}
          isLoggedToday={weightInfo?.isLoggedToday ?? false}
          onRefresh={onRefresh || (() => {})}
        />
      </div>

      {/* ─── Off-Plan / Different Food Logs ─── */}
      <div className="pt-2">
        <OffPlanMealsCard
          differentMeals={differentMeals}
          onOpenModal={onOpenDifferentMealModal || (() => {})}
          onRefresh={onRefresh || (() => {})}
        />
      </div>

      {/* ─── Daily Nutrition Ledger ─── */}
      <div className="pt-2">
        <MacroLedger
          currentCalories={stats?.totalCalories || stats?.nutrition?.calories || 0}
          targetCalories={winterArc?.targetCalories || 1600}
          offPlanCalories={stats?.offPlanCalories || 0}
          currentProtein={(stats?.nutrition?.protein || 0) + (stats?.offPlanProtein || 0)}
          targetProtein={winterArc?.proteinTarget || 140}
          currentCarbs={(stats?.nutrition?.carbs || 0) + (stats?.offPlanCarbs || 0)}
          targetCarbs={160}
          currentFat={(stats?.nutrition?.fat || 0) + (stats?.offPlanFat || 0)}
          targetFat={45}
        />
      </div>

      {/* ─── Fitness Beyond The Gym (Recovery, NEAT & Supplement Stack) ─── */}
      <div className="pt-2">
        <FitnessRecoveryCockpit
          recovery={recovery}
          initialSteps={activity?.totalSteps || 0}
          initialWater={waterIntakeMl || 0}
          winterArc={winterArc}
          onRefresh={onRefresh}
        />
      </div>

      {/* Quick Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (quickText.trim()) onQuickLog(quickText.trim());
        }}
        className="bg-white rounded-2xl p-2.5 border border-[#dfc0b7] shadow-xs flex items-center gap-2"
      >
        <span className="text-base pl-1">⚡</span>
        <input
          type="text"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder="Tell Schedulfy (e.g. 'had green tea')..."
          className="bg-transparent text-xs text-[#1f1b14] placeholder-[#8b716a] outline-none flex-1 font-medium"
          disabled={submittingQuick}
        />
        <button
          type="submit"
          disabled={!quickText.trim() || submittingQuick}
          className="px-3 py-1.5 bg-[#a43716] active:scale-95 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function MobileTimelineCard({
  item,
  isRecentlyCompleted,
  isActionPending = false,
  onComplete,
  onUndo,
  onSkip,
  onOpenSwap,
}: {
  item: TodayOccurrence;
  isRecentlyCompleted?: boolean;
  isActionPending?: boolean;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenSwap: (item: TodayOccurrence) => void;
}) {
  const isDone = item.status === "COMPLETED";
  const isSkipped = item.status === "SKIPPED";
  const isReplaced = item.status === "REPLACED";

  return (
    <div
      className={`rounded-2xl p-3.5 border transition-all duration-300 ${
        isDone
          ? isRecentlyCompleted
            ? "bg-[#f7faef] border-2 border-[#52652a] shadow-md shadow-[#52652a]/15"
            : "bg-[#f7faef] border-[#52652a]/30"
          : isSkipped
          ? "bg-gray-50 border-gray-200 opacity-60"
          : isReplaced
          ? "bg-[#fff5f2] border-[#a43716]/30"
          : "bg-white border-[#dfc0b7] shadow-2xs"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg shrink-0">{categoryIcons[item.category] || "✨"}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-[#a43716]">{item.scheduledTime}</span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                {item.category}
              </span>
              {isDone && isRecentlyCompleted && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#52652a] text-white animate-pulse shadow-2xs">
                  ✓ Just Completed
                </span>
              )}
            </div>
            <h4
              className={`text-xs font-serif font-bold text-[#1f1b14] truncate mt-0.5 ${
                isDone ? "line-through text-[#58423c]" : ""
              }`}
            >
              {item.title}
            </h4>
          </div>
        </div>

        {/* Micro actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isDone ? (
            <button
              type="button"
              onClick={() => onUndo(item.id)}
              disabled={isActionPending}
              className="text-[11px] font-bold text-[#52652a] px-2.5 py-1 rounded-xl bg-white border border-[#52652a]/30 shadow-2xs active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isActionPending ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-[#52652a] border-t-transparent rounded-full animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <span>✓ Done ↩</span>
              )}
            </button>
          ) : isSkipped ? (
            <button
              type="button"
              onClick={() => onUndo(item.id)}
              disabled={isActionPending}
              className="text-[11px] font-bold text-[#8b716a] px-2.5 py-1 rounded-xl bg-white border border-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isActionPending ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-[#8b716a] border-t-transparent rounded-full animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <span>Skipped ↩</span>
              )}
            </button>
          ) : (
            <>
              {item.hasAlternatives && (
                <button
                  type="button"
                  onClick={() => onOpenSwap(item)}
                  disabled={isActionPending}
                  className="w-7 h-7 rounded-xl bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] text-xs font-bold flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Swap meal"
                >
                  ⇄
                </button>
              )}
              <button
                type="button"
                onClick={() => onComplete(item.id)}
                disabled={isActionPending}
                className="w-8 h-8 rounded-xl bg-[#52652a] hover:bg-[#3f4f20] text-white text-xs font-bold flex items-center justify-center active:scale-95 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Mark complete"
              >
                {isActionPending ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "✓"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
