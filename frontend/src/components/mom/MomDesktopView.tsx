"use client";

import React from "react";
import Link from "next/link";
import type { KitchenMeal } from "@/lib/domain/types";

interface MomDesktopViewProps {
  meals: KitchenMeal[];
  dateStr: string;
  preparedMap: Record<number, boolean>;
  pendingPreparedIndex?: number | null;
  onTogglePrepared: (index: number) => void;
  onLogout: () => void;
}

export function MomDesktopView({
  meals,
  dateStr,
  preparedMap,
  pendingPreparedIndex,
  onTogglePrepared,
  onLogout,
}: MomDesktopViewProps) {
  const preparedCount = Object.values(preparedMap).filter(Boolean).length;
  const progressPct = meals.length > 0 ? Math.round((preparedCount / meals.length) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      {/* ─── Clean Chef's Countertop Header ─── */}
      <header className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              Household Hearth Sync
            </span>
            <span className="text-xs font-mono text-[#8b716a]">• Kitchen Prep Ledger</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1f1b14]">Mom&apos;s Meal Preparation Deck</h1>
          <p className="text-xs text-[#58423c] mt-0.5">
            {dateStr || "Today"} • Real-time schedule specs &amp; exact recipe portions
          </p>
        </div>

        {/* Clean Controls & Progress */}
        <div className="flex items-center gap-3">
          <div className="bg-[#fcf2e6] px-4 py-2 rounded-xl border border-[#dfc0b7] text-right">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">Prep Status</span>
            <span className="text-xs font-bold text-[#52652a]">
              {preparedCount} of {meals.length} Ready ({progressPct}%)
            </span>
          </div>

          <Link
            href="/today"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7] text-xs font-semibold shadow-xs transition-all"
          >
            ← View Today
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7] text-xs font-semibold shadow-xs transition-all"
          >
            🖨️ Print
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-[#ffdad6] hover:bg-[#ffb5a0] text-[#93000a] border border-[#ba1a1a]/20 text-xs font-semibold shadow-xs transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ─── Clean 2-Column Desktop Grid ─── */}
      {meals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-[#dfc0b7] shadow-xs">
          <span className="text-4xl block mb-2">🍲</span>
          <h3 className="text-base font-serif font-semibold text-[#1f1b14]">No meals scheduled for today</h3>
          <p className="text-xs text-[#58423c] mt-1">
            Meals scheduled in the daily routine will automatically populate here with exact ingredient specs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {meals.map((meal, index) => {
            const isPrepared = Boolean(preparedMap[index]);

            return (
              <div
                key={index}
                className={`p-6 rounded-2xl border transition-all shadow-xs ${
                  isPrepared
                    ? "bg-[#f7faef] border-[#52652a]/40"
                    : "bg-white border-[#dfc0b7] hover:border-[#a43716]/40"
                }`}
              >
                {/* Header row: Time, Type, Toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-[#a43716]">
                      {meal.time}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                      {meal.mealType}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTogglePrepared(index)}
                    disabled={pendingPreparedIndex === index}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed ${
                      isPrepared
                        ? "bg-[#52652a] text-white"
                        : "bg-[#fcf2e6] hover:bg-[#52652a] text-[#58423c] hover:text-white border border-[#dfc0b7]"
                    }`}
                  >
                    {pendingPreparedIndex === index ? (
                      <>
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                  className={`text-lg font-serif font-bold text-[#1f1b14] mt-3.5 ${
                    isPrepared ? "line-through text-[#8b716a]" : ""
                  }`}
                >
                  {meal.title}
                </h3>

                {/* Components Table */}
                {meal.components && meal.components.length > 0 && (
                  <div className="mt-4 bg-[#fcf2e6] rounded-xl p-3.5 border border-[#dfc0b7]/70 space-y-2">
                    <span className="text-[10px] font-bold text-[#8b716a] uppercase tracking-wider block">
                      Ingredients &amp; Exact Portions:
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#1f1b14]">
                      {meal.components.map((comp, cIdx) => (
                        <li key={cIdx} className="flex items-center justify-between py-0.5">
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a43716]" />
                            <span className="font-medium">{comp.name}</span>
                          </span>
                          {(comp.quantity || comp.unit) && (
                            <span className="font-mono text-[#a43716] font-semibold bg-white px-2 py-0.5 rounded border border-[#dfc0b7] text-[11px] shadow-2xs">
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
