"use client";

import React from "react";
import Link from "next/link";
import type { KitchenMeal } from "@/lib/domain/types";
import { MomCalendarBar } from "./MomCalendarBar";

interface MomDesktopViewProps {
  meals: KitchenMeal[];
  dateStr: string;
  dateKey: string;
  isToday: boolean;
  isTomorrow: boolean;
  isYesterday: boolean;
  preparedMap: Record<string, boolean>;
  pendingPreparedKey?: string | null;
  onOpenConfirmMeal: (meal: KitchenMeal, index: number) => void;
  onSelectDate: (dateKey: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onTomorrow: () => void;
  onLogout: () => void;
}

export function MomDesktopView({
  meals,
  dateStr,
  dateKey,
  isToday,
  isTomorrow,
  isYesterday,
  preparedMap,
  pendingPreparedKey,
  onOpenConfirmMeal,
  onSelectDate,
  onPrevDay,
  onNextDay,
  onToday,
  onTomorrow,
  onLogout,
}: MomDesktopViewProps) {
  const preparedCount = meals.filter(
    (m, idx) => Boolean(preparedMap[m.id || String(idx)]) || m.isPrepared
  ).length;
  const progressPct = meals.length > 0 ? Math.round((preparedCount / meals.length) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      {/* ─── Clean Chef's Countertop Header ─── */}
      <header className="bg-white rounded-3xl p-6 border-2 border-[#dfc0b7] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              Household Hearth Sync
            </span>
            <span className="text-xs font-mono text-[#8b716a]">• Kitchen Prep Ledger</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#1f1b14]">
            Mom&apos;s Meal Preparation Deck
          </h1>
          <p className="text-xs sm:text-sm text-[#58423c] mt-0.5">
            {dateStr || "Today"} • Real-time schedule specs &amp; exact recipe portions
          </p>
        </div>

        {/* Clean Controls & Progress */}
        <div className="flex items-center gap-3">
          <div className="bg-[#fcf2e6] px-4 py-2.5 rounded-2xl border-2 border-[#dfc0b7] text-right">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">
              Prep Status
            </span>
            <span className="text-sm font-extrabold text-[#52652a]">
              {preparedCount} of {meals.length} Ready ({progressPct}%)
            </span>
          </div>

          <Link
            href="/today"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#fcf2e6] text-[#58423c] border-2 border-[#dfc0b7] text-xs font-bold shadow-xs transition-all"
          >
            ← View Today
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#fcf2e6] text-[#58423c] border-2 border-[#dfc0b7] text-xs font-bold shadow-xs transition-all"
          >
            🖨️ Print
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-2xl bg-[#ffdad6] hover:bg-[#ffb5a0] text-[#93000a] border border-[#ba1a1a]/20 text-xs font-bold shadow-xs transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ─── Calendar Navigation Bar ─── */}
      <MomCalendarBar
        dateStr={dateStr}
        dateKey={dateKey}
        isToday={isToday}
        isTomorrow={isTomorrow}
        isYesterday={isYesterday}
        onSelectDate={onSelectDate}
        onPrevDay={onPrevDay}
        onNextDay={onNextDay}
        onToday={onToday}
        onTomorrow={onTomorrow}
      />

      {/* ─── Clean 2-Column Desktop Grid ─── */}
      {meals.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#dfc0b7] shadow-xs space-y-2">
          <span className="text-5xl block mb-2">🍲</span>
          <h3 className="text-xl font-serif font-bold text-[#1f1b14]">
            No meals scheduled for {isToday ? "today" : isTomorrow ? "tomorrow" : dateStr}
          </h3>
          <p className="text-sm text-[#58423c] max-w-md mx-auto">
            Meals scheduled in your family routine will automatically populate here with exact ingredient specs and portion sizes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {meals.map((meal, index) => {
            const key = meal.id || String(index);
            const isPrepared = Boolean(preparedMap[key]) || Boolean(meal.isPrepared);
            const isPending = pendingPreparedKey === key;

            return (
              <div
                key={key}
                className={`p-6 rounded-3xl border-2 transition-all shadow-xs ${
                  isPrepared
                    ? "bg-[#f7faef] border-[#52652a]/50"
                    : "bg-white border-[#dfc0b7] hover:border-[#a43716]/50"
                }`}
              >
                {/* Header row: Time, Type, Toggle */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#dfc0b7]/60">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-mono font-extrabold text-[#a43716]">
                      {meal.time}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                      {meal.mealType}
                    </span>
                    {isPrepared && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#d4eca2] text-[#2c3814] border border-[#52652a]/20">
                        ✓ Prepared &amp; Eaten
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenConfirmMeal(meal, index)}
                    disabled={isPending}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 ${
                      isPrepared
                        ? "bg-[#52652a] text-white hover:bg-[#3f4f20]"
                        : "bg-[#fcf2e6] hover:bg-[#52652a] text-[#58423c] hover:text-white border-2 border-[#dfc0b7]"
                    }`}
                  >
                    {isPending ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : isPrepared ? (
                      "✓ Prepared"
                    ) : (
                      "Mark Prepared"
                    )}
                  </button>
                </div>

                {/* Title */}
                <h3
                  className={`text-xl font-serif font-black text-[#1f1b14] mt-4 ${
                    isPrepared ? "line-through text-[#8b716a]" : ""
                  }`}
                >
                  {meal.title}
                </h3>

                {/* Components Table */}
                {meal.components && meal.components.length > 0 && (
                  <div className="mt-4 bg-[#fcf2e6] rounded-2xl p-4 border border-[#dfc0b7]/80 space-y-2">
                    <span className="text-xs font-bold text-[#8b716a] uppercase tracking-wider block">
                      Ingredients &amp; Exact Portions:
                    </span>
                    <ul className="space-y-2 text-sm text-[#1f1b14]">
                      {meal.components.map((comp, cIdx) => (
                        <li key={cIdx} className="flex items-center justify-between py-0.5">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#a43716]" />
                            <span className="font-semibold">{comp.name}</span>
                          </span>
                          {(comp.quantity || comp.unit) && (
                            <span className="font-mono text-[#a43716] font-extrabold bg-white px-2.5 py-0.5 rounded-lg border border-[#dfc0b7] text-xs shadow-2xs">
                              {comp.quantity} {comp.unit}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
