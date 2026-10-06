"use client";

import React from "react";
import Link from "next/link";
import type { KitchenMeal } from "@/lib/domain/types";
import { MomVerticalCalendar } from "./MomVerticalCalendar";

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
    <div className="w-full space-y-4 pb-20 animate-in fade-in duration-300">
      {/* ─── Mobile Hearth Header Card ─── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#435322] via-[#52652a] to-[#2c3814] text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-[#52652a]/15">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

        <div className="relative z-10 space-y-3">
          {/* Top Row: Brand & Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4eca2] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#fcf2e6] font-bold">
                Household Hearth
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href="/today"
                className="px-2.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-xs text-white text-xs font-bold active:scale-95 transition-all border border-white/20 flex items-center gap-1"
              >
                <span>Son&apos;s Plan</span>
                <span>➔</span>
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-xl bg-[#ffdad6]/20 backdrop-blur-xs text-[#ffdad6] text-xs font-bold active:scale-95 transition-all border border-[#ffdad6]/20"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Title & Date Headline */}
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight">
              Mom&apos;s Meal Board
            </h1>
            <p className="text-xs text-[#fcf2e6]/90 font-medium mt-0.5">
              {isToday ? "Today" : isTomorrow ? "Tomorrow" : dateStr ? dateStr.split(",")[0] : "Today"} • Real-Time Recipe Specs
            </p>
          </div>

          {/* Prepared Progress Meter */}
          <div className="pt-2 border-t border-white/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white/90 font-medium">Prepared for Family:</span>
              <span className="font-mono font-black text-[#d4eca2]">
                {preparedCount} / {meals.length} Ready ({progressPct}%)
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-[#d4eca2] transition-all duration-500 shadow-xs"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ─── Vertical Calendar (Up There For Mom) ─── */}
      <section aria-label="Kitchen Calendar">
        <MomVerticalCalendar
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
      </section>

      {/* ─── Meals Cards Stack (Mobile Kitchen Ergonomics) ─── */}
      <section aria-label="Daily Meal Cards" className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-mono font-black uppercase tracking-wider text-[#58423c] flex items-center gap-1.5">
            <span>🍲</span>
            <span>Daily Menu ({meals.length} Meals)</span>
          </h2>
          {meals.length > 0 && (
            <span className="text-xs font-mono font-bold text-[#52652a]">
              {preparedCount}/{meals.length} Done
            </span>
          )}
        </div>

        {meals.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border-2 border-dashed border-[#dfc0b7] shadow-xs space-y-3">
            <span className="text-4xl block">🍲</span>
            <h3 className="font-serif font-black text-lg text-[#1f1b14]">
              No meals scheduled for {isToday ? "today" : isTomorrow ? "tomorrow" : dateStr || "this date"}
            </h3>
            <p className="text-xs text-[#58423c] max-w-xs mx-auto">
              Meals scheduled in your family routine will appear here with exact ingredient portions.
            </p>
            {!isToday && (
              <button
                type="button"
                onClick={onToday}
                className="mt-2 px-4 py-2 rounded-xl bg-[#52652a] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                Return to Today
              </button>
            )}
          </div>
        ) : (
          meals.map((meal, index) => {
            const key = meal.id || String(index);
            const isPrepared = Boolean(preparedMap[key]) || Boolean(meal.isPrepared);
            const isPending = pendingPreparedKey === key;

            return (
              <article
                key={key}
                className={`rounded-2xl p-4 border-2 transition-all duration-200 shadow-xs ${
                  isPrepared
                    ? "bg-[#f7faef] border-[#52652a]/50"
                    : "bg-white border-[#dfc0b7]"
                }`}
              >
                {/* Header: Time & Meal Type */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#dfc0b7]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-black text-[#a43716]">
                      {meal.time}
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                      {meal.mealType}
                    </span>
                  </div>

                  {isPrepared ? (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#d4eca2] text-[#141f00] border border-[#52652a]/30">
                      ✓ Ready
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#8b716a]">
                      Pending
                    </span>
                  )}
                </div>

                {/* Recipe Title */}
                <h3
                  className={`text-lg font-serif font-black text-[#1f1b14] mt-2.5 leading-snug ${
                    isPrepared ? "line-through text-[#8b716a]" : ""
                  }`}
                >
                  {meal.title}
                </h3>

                {/* Ingredients checklist (Extra large readable text for kitchen) */}
                {meal.components && meal.components.length > 0 && (
                  <div className="mt-3 bg-[#fcf2e6] rounded-xl p-3 border border-[#dfc0b7] space-y-2">
                    <span className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block font-mono">
                      Ingredients &amp; Exact Portions:
                    </span>
                    <div className="space-y-1.5">
                      {meal.components.map((comp, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center justify-between py-1 border-b border-[#dfc0b7]/30 last:border-0"
                        >
                          <span className="flex items-center gap-2 text-sm font-bold text-[#1f1b14]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a43716] shrink-0" />
                            <span>{comp.name}</span>
                          </span>
                          {(comp.quantity || comp.unit) && (
                            <span className="font-mono text-[#a43716] font-black bg-white px-2 py-0.5 rounded-lg border border-[#dfc0b7] text-xs shadow-2xs">
                              {comp.quantity} {comp.unit}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full-Width Tactile Toggle Button with Confirm Modal */}
                <button
                  type="button"
                  onClick={() => onOpenConfirmMeal(meal, index)}
                  disabled={isPending}
                  className={`w-full mt-3.5 py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                    isPrepared
                      ? "bg-[#52652a] text-white hover:bg-[#435322]"
                      : "bg-[#fcf2e6] text-[#58423c] border-2 border-[#dfc0b7] hover:bg-[#52652a] hover:text-white"
                  }`}
                >
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : isPrepared ? (
                    <>
                      <span className="text-base">✓</span>
                      <span>Prepared &amp; Ready (Tap to Change)</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">🍲</span>
                      <span>Mark as Prepared ✓</span>
                    </>
                  )}
                </button>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
