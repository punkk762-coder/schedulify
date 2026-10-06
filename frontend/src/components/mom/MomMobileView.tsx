"use client";

import React from "react";
import Link from "next/link";
import type { KitchenMeal } from "@/lib/domain/types";
import { MomCalendarBar } from "./MomCalendarBar";

interface MomMobileViewProps {
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

export function MomMobileView({
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
}: MomMobileViewProps) {
  const preparedCount = meals.filter(
    (m, idx) => Boolean(preparedMap[m.id || String(idx)]) || m.isPrepared
  ).length;
  const progressPct = meals.length > 0 ? Math.round((preparedCount / meals.length) * 100) : 0;

  return (
    <div className="w-full space-y-5 pb-24 animate-in fade-in duration-300">
      {/* ─── Magnificent Mobile Hearth Header ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#52652a] via-[#435322] to-[#2c3814] text-white rounded-3xl p-6 shadow-xl shadow-[#52652a]/20">
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4eca2] animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#fcf2e6] font-bold">
                Household Hearth
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white">
              Mom&apos;s Meal Board
            </h1>
            <p className="text-sm text-[#fcf2e6]/90 font-medium mt-0.5">
              {isToday ? "Today" : isTomorrow ? "Tomorrow" : dateStr ? dateStr.split(",")[0] : "Today"} • Real-Time Recipe Specs
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/today"
              className="px-3.5 py-2 rounded-2xl bg-white/20 backdrop-blur-xs text-white text-sm font-bold active:scale-95 transition-all border border-white/20"
            >
              Today
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-2xl bg-[#ffdad6]/25 backdrop-blur-xs text-[#ffdad6] text-sm font-bold active:scale-95 transition-all border border-[#ffdad6]/20"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Prepared Counter Meter */}
        <div className="mt-5 pt-3.5 border-t border-white/20">
          <div className="flex items-center justify-between text-sm sm:text-base mb-2">
            <span className="text-white/90 font-semibold">Prepared for Family:</span>
            <span className="font-mono font-extrabold text-[#d4eca2]">
              {preparedCount} / {meals.length} Ready ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-[#d4eca2] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

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

      {/* ─── Meals Cards Stack (BIGGER TEXT FOR MOM) ─── */}
      {meals.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border-2 border-dashed border-[#dfc0b7] shadow-xs space-y-3">
          <span className="text-4xl block">🍲</span>
          <h3 className="font-serif font-black text-xl text-[#1f1b14]">
            No meals scheduled for {isToday ? "today" : isTomorrow ? "tomorrow" : dateStr}
          </h3>
          <p className="text-sm text-[#58423c]">
            Meals scheduled in your family routine will appear here with exact ingredient portions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal, index) => {
            const key = meal.id || String(index);
            const isPrepared = Boolean(preparedMap[key]) || Boolean(meal.isPrepared);
            const isPending = pendingPreparedKey === key;

            return (
              <div
                key={key}
                className={`rounded-3xl p-6 border-2 transition-all duration-300 shadow-md ${
                  isPrepared
                    ? "bg-[#f7faef] border-[#52652a]/50"
                    : "bg-white border-[#dfc0b7]"
                }`}
              >
                {/* Header: Time & Meal Type (Larger & clearer) */}
                <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]/70">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl sm:text-2xl font-mono font-black text-[#a43716]">
                      {meal.time}
                    </span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                      {meal.mealType}
                    </span>
                  </div>

                  {isPrepared && (
                    <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-[#d4eca2] text-[#141f00] border border-[#52652a]/30">
                      ✓ Prepared &amp; Eaten
                    </span>
                  )}
                </div>

                {/* Recipe Title (Much bigger & bolder) */}
                <h3
                  className={`text-xl sm:text-2xl font-serif font-black text-[#1f1b14] mt-3.5 leading-snug ${
                    isPrepared ? "line-through text-[#8b716a]" : ""
                  }`}
                >
                  {meal.title}
                </h3>

                {/* Ingredients checklist (Extra large text for kitchen readability) */}
                {meal.components && meal.components.length > 0 && (
                  <div className="mt-4 bg-[#fcf2e6] rounded-2xl p-4 border border-[#dfc0b7] space-y-2.5">
                    <span className="text-xs sm:text-sm font-black text-[#8b716a] uppercase tracking-wider block font-mono">
                      Ingredients &amp; Exact Portions:
                    </span>
                    <div className="space-y-2">
                      {meal.components.map((comp, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center justify-between py-1 border-b border-[#dfc0b7]/30 last:border-0"
                        >
                          <span className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-[#1f1b14]">
                            <span className="w-2 h-2 rounded-full bg-[#a43716] shrink-0" />
                            <span>{comp.name}</span>
                          </span>
                          {(comp.quantity || comp.unit) && (
                            <span className="font-mono text-[#a43716] font-black bg-white px-3 py-1 rounded-xl border border-[#dfc0b7] text-sm sm:text-base shadow-xs">
                              {comp.quantity} {comp.unit}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Giant Tactile Toggle Button with Confirm Popup */}
                <button
                  type="button"
                  onClick={() => onOpenConfirmMeal(meal, index)}
                  disabled={isPending}
                  className={`w-full mt-5 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isPrepared
                      ? "bg-[#52652a] text-white hover:bg-[#3f4f20]"
                      : "bg-[#fcf2e6] text-[#58423c] border-2 border-[#dfc0b7] hover:bg-[#52652a] hover:text-white"
                  }`}
                >
                  {isPending ? (
                    <>
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : isPrepared ? (
                    <>
                      <span className="text-xl">✓</span>
                      <span>Prepared &amp; Eaten (Tap to Change)</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🍲</span>
                      <span>Mark as Prepared ✓</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
