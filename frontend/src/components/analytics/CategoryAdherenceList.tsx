"use client";

import React from "react";

interface CategoryStat {
  category: string;
  total: number;
  completed: number;
  rate: number;
}

interface CategoryAdherenceListProps {
  categoryBreakdown: CategoryStat[];
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  MEAL: { label: "Fresh Nutrition", icon: "🥗", color: "from-[#52652a] to-[#84cc16]" },
  WORKOUT: { label: "Movement & Strength", icon: "🏋️", color: "from-[#a43716] to-[#f59e0b]" },
  ACTIVITY: { label: "Daily Conditioning", icon: "🚶", color: "from-[#a43716] to-[#f59e0b]" },
  SUPPLEMENT: { label: "Vital Micronutrients", icon: "💊", color: "from-[#0284c7] to-[#38bdf8]" },
  HYDRATION: { label: "Cellular Hydration", icon: "💧", color: "from-[#0284c7] to-[#06b6d4]" },
  OTHER: { label: "General Habits", icon: "✨", color: "from-[#78350f] to-[#d97706]" },
};

export function CategoryAdherenceList({ categoryBreakdown }: CategoryAdherenceListProps) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#eae1d5]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a43716] block">
            Routine Pillars
          </span>
          <h3 className="text-base font-serif font-bold text-[#1f1b14]">
            Category Adherence Breakdown
          </h3>
        </div>
        <span className="text-xs text-[#8b716a] font-mono">
          {categoryBreakdown.length} Domains Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categoryBreakdown.map((cat) => {
          const meta = CATEGORY_META[cat.category] || {
            label: cat.category,
            icon: "✨",
            color: "from-[#52652a] to-[#84cc16]",
          };
          const isHigh = cat.rate >= 80;
          const isMid = cat.rate >= 60 && cat.rate < 80;

          return (
            <div
              key={cat.category}
              className="p-3.5 rounded-xl border border-[#dfc0b7] bg-[#fcf2e6]/50 hover:bg-[#fcf2e6] transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <div>
                    <span className="text-xs font-serif font-bold text-[#1f1b14] block">
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-[#8b716a] font-mono">
                      {cat.completed} of {cat.total} items completed
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isHigh
                      ? "bg-[#52652a]/10 text-[#52652a] border-[#52652a]/20"
                      : isMid
                      ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
                      : "bg-[#ba1a1a]/10 text-[#ba1a1a] border-[#ba1a1a]/20"
                  }`}
                >
                  {cat.rate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#f0e7db] rounded-full h-2 overflow-hidden border border-[#dfc0b7]">
                <div
                  className={`h-full bg-gradient-to-r ${meta.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(4, cat.rate)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
