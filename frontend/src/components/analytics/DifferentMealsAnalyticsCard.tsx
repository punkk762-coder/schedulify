"use client";

import React, { useState } from "react";

export interface DifferentMealItem {
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
}

export interface DeviationsData {
  totalCount: number;
  totalCalories: number;
  items: DifferentMealItem[];
}

export interface CaloriesSummaryData {
  totalPlanned: number;
  totalOffPlan: number;
  totalAll: number;
  averageDaily: number;
}

interface DifferentMealsAnalyticsCardProps {
  deviations?: DeviationsData;
  caloriesSummary?: CaloriesSummaryData;
  daysCount?: number;
}

export function DifferentMealsAnalyticsCard({
  deviations,
  caloriesSummary,
  daysCount = 7,
}: DifferentMealsAnalyticsCardProps) {
  const [filterSlot, setFilterSlot] = useState<string>("ALL");

  const items = deviations?.items || [];
  const totalOffPlan = caloriesSummary?.totalOffPlan ?? deviations?.totalCalories ?? 0;
  const totalPlanned = caloriesSummary?.totalPlanned ?? 0;
  const totalAll = caloriesSummary?.totalAll ?? (totalPlanned + totalOffPlan);
  const plannedPct = totalAll > 0 ? Math.round((totalPlanned / totalAll) * 100) : 100;
  const offPlanPct = totalAll > 0 ? Math.round((totalOffPlan / totalAll) * 100) : 0;

  const filteredItems = filterSlot === "ALL"
    ? items
    : items.filter((item) => (item.mealSlot || "Extra").toUpperCase() === filterSlot);

  const mealSlots = Array.from(new Set(items.map((i) => i.mealSlot || "Extra")));

  return (
    <div className="bg-white rounded-2xl border border-[#dfc0b7] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#dfc0b7]/60 bg-gradient-to-r from-white via-[#fcf2e6]/30 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🍽️</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
              Nutrition Telemetry &amp; Off-Plan Ledger
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              items.length > 0 ? "bg-[#ffdbd1] text-[#a43716]" : "bg-[#d4eca2] text-[#3b4d14]"
            }`}>
              {items.length} {items.length === 1 ? "Deviation" : "Deviations"} ({daysCount}d)
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#1f1b14] mt-1">
            What You Had Differently
          </h2>
          <p className="text-xs text-[#58423c]">
            Audit trail of non-standard meals, substitutions, and their total caloric impact.
          </p>
        </div>

        {items.length > 0 && mealSlots.length > 1 && (
          <div className="flex items-center gap-1 bg-[#fcf2e6] p-1 rounded-xl border border-[#dfc0b7] text-[11px] font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterSlot("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterSlot === "ALL" ? "bg-[#a43716] text-white font-bold" : "text-[#58423c]"
              }`}
            >
              All
            </button>
            {mealSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setFilterSlot(slot.toUpperCase())}
                className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                  filterSlot === slot.toUpperCase() ? "bg-[#a43716] text-white font-bold" : "text-[#58423c]"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Caloric Intake Composition Split */}
      <div className="p-5 bg-[#faf6f0]/50 border-b border-[#dfc0b7]/60">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3.5 rounded-xl border border-[#dfc0b7]/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono text-[#8b716a] uppercase text-[10px] font-bold">Planned Routine</span>
              <span className="font-bold text-sky-700">{plannedPct}%</span>
            </div>
            <div className="text-2xl font-serif font-bold text-[#1f1b14]">
              {totalPlanned.toLocaleString()} <span className="text-xs font-sans text-[#8b716a] font-normal">kcal</span>
            </div>
            <span className="text-[10px] text-[#58423c]">Diet protocol target fulfillment</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#dfc0b7]/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono text-[#a43716] uppercase text-[10px] font-bold">Off-Plan / Differing</span>
              <span className="font-bold text-[#a43716]">{offPlanPct}%</span>
            </div>
            <div className="text-2xl font-serif font-bold text-[#a43716]">
              +{totalOffPlan.toLocaleString()} <span className="text-xs font-sans text-[#8b716a] font-normal">kcal</span>
            </div>
            <span className="text-[10px] text-[#8b716a]">
              {items.length} unscripted or substituted items
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#dfc0b7]/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono text-[#52652a] uppercase text-[10px] font-bold">Total Caloric Intake</span>
              <span className="font-bold text-[#52652a]">100%</span>
            </div>
            <div className="text-2xl font-serif font-bold text-[#1f1b14]">
              {totalAll.toLocaleString()} <span className="text-xs font-sans text-[#8b716a] font-normal">kcal</span>
            </div>
            <span className="text-[10px] text-[#8b716a]">
              Avg {caloriesSummary?.averageDaily || Math.round(totalAll / Math.max(1, daysCount))} kcal / day
            </span>
          </div>
        </div>

        {/* Visual Progress Bar Ratio */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-[#e8decb] rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-sky-600 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, plannedPct)}%` }}
              title={`Planned: ${totalPlanned} kcal (${plannedPct}%)`}
            />
            <div
              className="bg-[#a43716] h-full transition-all duration-500"
              style={{ width: `${Math.min(100, offPlanPct)}%` }}
              title={`Off-Plan: ${totalOffPlan} kcal (${offPlanPct}%)`}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#8b716a]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
              Planned Diet ({plannedPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a43716] inline-block" />
              Off-Plan / Differing Food ({offPlanPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Differing Meals Ledger */}
      <div className="p-5">
        {filteredItems.length === 0 ? (
          <div className="py-8 px-4 text-center bg-[#fcf2e6]/40 rounded-xl border border-dashed border-[#dfc0b7]">
            <span className="text-2xl">✨</span>
            <h4 className="text-sm font-bold text-[#1f1b14] mt-1">100% On-Plan Adherence</h4>
            <p className="text-xs text-[#58423c] mt-0.5">
              No off-plan meals logged in the selected {daysCount}-day window. Your dietary execution is completely aligned with protocol.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="hidden sm:grid sm:grid-cols-12 text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] pb-2 border-b border-[#dfc0b7]/40 px-2">
              <span className="col-span-2">Date / Slot</span>
              <span className="col-span-4">Food Item</span>
              <span className="col-span-2 text-right">Calories</span>
              <span className="col-span-2 text-center">Macros (P / C / F)</span>
              <span className="col-span-2 text-right">Notes</span>
            </div>

            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white hover:bg-[#fcf2e6]/30 transition-colors rounded-xl border border-[#dfc0b7]/70 flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-2 text-xs"
              >
                <div className="col-span-2 flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0.5">
                  <span className="font-mono text-[11px] font-bold text-[#1f1b14]">{item.date}</span>
                  <span className="text-[10px] font-mono text-[#a43716] bg-[#ffdbd1] px-1.5 py-0.5 rounded capitalize">
                    {item.mealSlot || "Extra"}
                  </span>
                </div>

                <div className="col-span-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a43716] shrink-0" />
                  <div>
                    <span className="font-semibold text-[#1f1b14] block">{item.title}</span>
                    <span className="text-[10px] font-mono text-[#8b716a]">Logged at {item.time}</span>
                  </div>
                </div>

                <div className="col-span-2 text-left sm:text-right font-mono font-bold text-[#a43716]">
                  +{item.calories} <span className="text-[10px] text-[#8b716a] font-normal">kcal</span>
                </div>

                <div className="col-span-2 flex items-center justify-start sm:justify-center gap-1 font-mono text-[11px]">
                  <span className="text-[#52652a] font-bold" title="Protein">{item.protein || 0}P</span>
                  <span className="text-[#8b716a]">/</span>
                  <span className="text-[#b07d17] font-bold" title="Carbs">{item.carbs || 0}C</span>
                  <span className="text-[#8b716a]">/</span>
                  <span className="text-[#a43716] font-bold" title="Fat">{item.fat || 0}F</span>
                </div>

                <div className="col-span-2 text-left sm:text-right text-[11px] text-[#58423c] truncate max-w-full">
                  {item.notes ? (
                    <span title={item.notes} className="italic text-[#8b716a]">“{item.notes}”</span>
                  ) : (
                    <span className="text-[#8b716a]/60">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
