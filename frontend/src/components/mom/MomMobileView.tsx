"use client";

import React from "react";
import Link from "next/link";
import type { KitchenMeal } from "@/lib/domain/types";

interface MomMobileViewProps {
  meals: KitchenMeal[];
  dateStr: string;
  preparedMap: Record<number, boolean>;
  onTogglePrepared: (index: number) => void;
  onLogout: () => void;
}

export function MomMobileView({
  meals,
  dateStr,
  preparedMap,
  onTogglePrepared,
  onLogout,
}: MomMobileViewProps) {
  const preparedCount = Object.values(preparedMap).filter(Boolean).length;
  const progressPct = meals.length > 0 ? Math.round((preparedCount / meals.length) * 100) : 0;

  return (
    <div className="w-full space-y-4 pb-20 animate-in fade-in duration-300">
      {/* ─── Magnificent Mobile Hearth Header ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#52652a] via-[#435322] to-[#2c3814] text-white rounded-3xl p-5 shadow-lg shadow-[#52652a]/20">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#d4eca2] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#fcf2e6]/90 font-bold">
                Household Hearth
              </span>
            </div>
            <h1 className="text-xl font-serif font-bold text-white">Mom&apos;s Meal Board</h1>
            <p className="text-[11px] text-[#fcf2e6]/80 font-medium">
              {dateStr ? dateStr.split(",")[0] : "Today"} • Real-Time Recipe Specs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/today"
              className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-xs text-white text-xs font-bold active:scale-95 transition-all"
            >
              Today
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-[#ffdad6]/20 backdrop-blur-xs text-[#ffdad6] text-xs font-bold active:scale-95 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Prepared Counter Meter */}
        <div className="mt-4 pt-3 border-t border-white/15">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-white/80 font-medium">Prepared for Family:</span>
            <span className="font-mono font-bold text-[#d4eca2]">
              {preparedCount} / {meals.length} Ready ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-[#d4eca2] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Meals Cards Stack ─── */}
      {meals.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#dfc0b7] shadow-xs space-y-2">
          <span className="text-3xl block">🍲</span>
          <h3 className="font-serif font-bold text-base text-[#1f1b14]">No meals scheduled yet</h3>
          <p className="text-xs text-[#58423c]">Daily meals will appear here as soon as scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {meals.map((meal, index) => {
            const isPrepared = Boolean(preparedMap[index]);

            return (
              <div
                key={index}
                className={`rounded-3xl p-5 border transition-all duration-300 shadow-xs ${
                  isPrepared
                    ? "bg-[#f7faef] border-[#52652a]/40"
                    : "bg-white border-[#dfc0b7]"
                }`}
              >
                {/* Header: Time & Meal Type */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#dfc0b7]/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-extrabold text-[#a43716]">
                      {meal.time}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                      {meal.mealType}
                    </span>
                  </div>

                  {isPrepared && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4eca2] text-[#141f00]">
                      ✓ Prepared
                    </span>
                  )}
                </div>

                {/* Recipe Title */}
                <h3
                  className={`text-base font-serif font-bold text-[#1f1b14] mt-3 ${
                    isPrepared ? "line-through text-[#8b716a]" : ""
                  }`}
                >
                  {meal.title}
                </h3>

                {/* Ingredients checklist */}
                {meal.components && meal.components.length > 0 && (
                  <div className="mt-3 bg-[#fcf2e6] rounded-2xl p-3 border border-[#dfc0b7]/70 space-y-2">
                    <span className="text-[10px] font-bold text-[#8b716a] uppercase tracking-wider block font-mono">
                      Ingredients &amp; Portions:
                    </span>
                    <div className="space-y-1.5">
                      {meal.components.map((comp, cIdx) => (
                        <div key={cIdx} className="flex items-center justify-between text-xs py-0.5">
                          <span className="flex items-center gap-2 font-medium text-[#1f1b14]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a43716]" />
                            <span>{comp.name}</span>
                          </span>
                          {(comp.quantity || comp.unit) && (
                            <span className="font-mono text-[#a43716] font-bold bg-white px-2 py-0.5 rounded-lg border border-[#dfc0b7] text-[11px]">
                              {comp.quantity} {comp.unit}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Giant Tactile Toggle Button */}
                <button
                  type="button"
                  onClick={() => onTogglePrepared(index)}
                  className={`w-full mt-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 ${
                    isPrepared
                      ? "bg-[#52652a] text-white"
                      : "bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7] hover:bg-[#52652a] hover:text-white"
                  }`}
                >
                  {isPrepared ? (
                    <>
                      <span>✓</span>
                      <span>Prepared (Tap to Undo)</span>
                    </>
                  ) : (
                    <span>Mark as Prepared</span>
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
