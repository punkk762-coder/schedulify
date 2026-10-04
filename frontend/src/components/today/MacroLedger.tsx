"use client";

import React from "react";

interface MacroLedgerProps {
  currentCalories: number;
  targetCalories?: number;
  currentProtein: number;
  targetProtein?: number;
  currentCarbs: number;
  targetCarbs?: number;
  currentFat: number;
  targetFat?: number;
}

export const MacroLedger: React.FC<MacroLedgerProps> = ({
  currentCalories,
  targetCalories = 1800,
  currentProtein,
  targetProtein = 150,
  currentCarbs,
  targetCarbs = 160,
  currentFat,
  targetFat = 45,
}) => {
  const calPercent = Math.min(100, Math.round((currentCalories / targetCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((currentProtein / targetProtein) * 100));
  const carbsPercent = Math.min(100, Math.round((currentCarbs / targetCarbs) * 100));
  const fatPercent = Math.min(100, Math.round((currentFat / targetFat) * 100));

  const proteinRemaining = Math.max(0, targetProtein - currentProtein);

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#a43716] font-mono">
            Metabolic Target
          </span>
          <h2 className="text-lg font-serif font-bold text-[#1f1b14]">Daily Nutrition Ledger</h2>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#fcf2e6] text-[#1f1b14] border border-[#dfc0b7]">
          {currentCalories.toLocaleString()} / {targetCalories.toLocaleString()} kcal
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mt-4">
        {/* Calories */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#1f1b14] font-semibold">Calories</span>
            <span className="font-mono font-medium text-[#58423c]">
              {currentCalories} / {targetCalories} kcal ({calPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#fcf2e6] rounded-full h-2.5 overflow-hidden border border-[#dfc0b7]">
            <div
              className="bg-[#a43716] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${calPercent}%` }}
            />
          </div>
        </div>

        {/* Protein (Priority) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#52652a] font-bold">Protein (Priority)</span>
            <span className="font-mono font-bold text-[#52652a]">
              {currentProtein} / {targetProtein}g
            </span>
          </div>
          <div className="w-full bg-[#fcf2e6] rounded-full h-2.5 overflow-hidden border border-[#dfc0b7]">
            <div
              className="bg-[#52652a] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-[#58423c] mt-1 block font-medium">
            {proteinRemaining > 0
              ? `${proteinRemaining}g remaining for evening meals`
              : "Daily protein target completed! 🎯"}
          </span>
        </div>

        {/* Carbohydrates */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#1f1b14] font-semibold">Carbohydrates</span>
            <span className="font-mono font-medium text-[#58423c]">
              {currentCarbs} / {targetCarbs}g
            </span>
          </div>
          <div className="w-full bg-[#fcf2e6] rounded-full h-2 overflow-hidden border border-[#dfc0b7]">
            <div
              className="bg-[#f59e0b] h-2 rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* Healthy Fats */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#1f1b14] font-semibold">Healthy Fats</span>
            <span className="font-mono font-medium text-[#58423c]">
              {currentFat} / {targetFat}g
            </span>
          </div>
          <div className="w-full bg-[#fcf2e6] rounded-full h-2 overflow-hidden border border-[#dfc0b7]">
            <div
              className="bg-[#0284c7] h-2 rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
