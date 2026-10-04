"use client";

import React from "react";

interface AverageNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroDistribution {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

interface NutritionMatrixCardProps {
  averageNutrition: AverageNutrition;
  macroDistribution?: MacroDistribution;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

export function NutritionMatrixCard({
  averageNutrition,
  macroDistribution = { proteinPct: 35, carbsPct: 40, fatPct: 25 },
  targetCalories = 1800,
  targetProtein = 150,
  targetCarbs = 160,
  targetFat = 45,
}: NutritionMatrixCardProps) {
  const calDelta = averageNutrition.calories - targetCalories;
  const proteinDelta = averageNutrition.protein - targetProtein;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#eae1d5]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a43716] block">
            Nutritional Balance
          </span>
          <h3 className="text-base font-serif font-bold text-[#1f1b14]">
            Daily Average Metabolic Intake
          </h3>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#52652a]/10 text-[#52652a] border border-[#52652a]/20">
          Target: {targetCalories} kcal
        </span>
      </div>

      {/* 4 Nutrient Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        {/* Calories */}
        <div className="bg-[#fcf2e6] p-3 rounded-xl border border-[#dfc0b7] space-y-0.5">
          <span className="text-[10px] text-[#58423c] block font-semibold flex items-center justify-center gap-1">
            🔥 Calories
          </span>
          <span className="text-lg font-serif font-bold text-[#1f1b14] block">
            {averageNutrition.calories}
          </span>
          <span className="text-[10px] font-mono text-[#8b716a] block">
            {calDelta > 0 ? `+${calDelta}` : `${calDelta}`} vs goal
          </span>
        </div>

        {/* Protein */}
        <div className="bg-[#fcf2e6] p-3 rounded-xl border border-[#dfc0b7] space-y-0.5">
          <span className="text-[10px] text-[#52652a] block font-bold flex items-center justify-center gap-1">
            🍗 Protein
          </span>
          <span className="text-lg font-serif font-bold text-[#1f1b14] block">
            {averageNutrition.protein}g
          </span>
          <span className="text-[10px] font-mono text-[#52652a] font-medium block">
            {proteinDelta >= 0 ? `+${proteinDelta}g target met` : `${Math.abs(proteinDelta)}g to target`}
          </span>
        </div>

        {/* Carbs */}
        <div className="bg-[#fcf2e6] p-3 rounded-xl border border-[#dfc0b7] space-y-0.5">
          <span className="text-[10px] text-[#f59e0b] block font-bold flex items-center justify-center gap-1">
            🌾 Carbs
          </span>
          <span className="text-lg font-serif font-bold text-[#1f1b14] block">
            {averageNutrition.carbs}g
          </span>
          <span className="text-[10px] font-mono text-[#8b716a] block">
            Target: {targetCarbs}g
          </span>
        </div>

        {/* Fats */}
        <div className="bg-[#fcf2e6] p-3 rounded-xl border border-[#dfc0b7] space-y-0.5">
          <span className="text-[10px] text-[#0284c7] block font-bold flex items-center justify-center gap-1">
            🥑 Fats
          </span>
          <span className="text-lg font-serif font-bold text-[#1f1b14] block">
            {averageNutrition.fat}g
          </span>
          <span className="text-[10px] font-mono text-[#8b716a] block">
            Target: {targetFat}g
          </span>
        </div>
      </div>

      {/* Caloric Distribution Stacked Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#1f1b14]">Caloric Energy Split</span>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-[#52652a] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#52652a]" />
              P: {macroDistribution.proteinPct}%
            </span>
            <span className="text-[#f59e0b] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              C: {macroDistribution.carbsPct}%
            </span>
            <span className="text-[#0284c7] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
              F: {macroDistribution.fatPct}%
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3 w-full bg-[#f0e7db] rounded-full overflow-hidden flex border border-[#dfc0b7]">
          <div
            className="h-full bg-[#52652a] transition-all duration-500"
            style={{ width: `${macroDistribution.proteinPct}%` }}
            title={`Protein: ${macroDistribution.proteinPct}%`}
          />
          <div
            className="h-full bg-[#f59e0b] transition-all duration-500"
            style={{ width: `${macroDistribution.carbsPct}%` }}
            title={`Carbs: ${macroDistribution.carbsPct}%`}
          />
          <div
            className="h-full bg-[#0284c7] transition-all duration-500"
            style={{ width: `${macroDistribution.fatPct}%` }}
            title={`Fats: ${macroDistribution.fatPct}%`}
          />
        </div>

        <p className="text-[11px] text-[#58423c] leading-relaxed">
          Balanced Mediterranean macronutrient profile supporting sustained metabolic focus and muscular recovery.
        </p>
      </div>
    </div>
  );
}
