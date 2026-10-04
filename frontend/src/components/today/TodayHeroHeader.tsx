"use client";

import React from "react";

interface TodayHeroHeaderProps {
  dateStr: string;
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  ringCircumference: number;
  ringOffset: number;
  onQuickLog?: (action: string) => void;
}

export const TodayHeroHeader: React.FC<TodayHeroHeaderProps> = ({
  dateStr,
  completedCount,
  totalCount,
  completionPercentage,
  ringCircumference,
  ringOffset,
  onQuickLog,
}) => {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#dfc0b7] shadow-xs mb-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#a43716]/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#52652a] font-mono">
              Sunday Cadence
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] font-semibold">
              ☀️ 6-Day Streak
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1f1b14] tracking-tight">
            {dateStr || "Sunday, October 4, 2026"}
          </h1>
          <p className="text-xs text-[#58423c] mt-1 font-medium">
            {completedCount} of {totalCount} prescribed occurrences completed • 150g Target
          </p>
        </div>

        {/* Quick Execution Ring & Top Action Cluster */}
        <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-start flex-wrap">
          <div className="flex items-center gap-3.5 bg-[#fcf2e6] p-3 rounded-2xl border border-[#dfc0b7] shadow-2xs">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="19"
                  stroke="#dfc0b7"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="19"
                  stroke="#a43716"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={(2 * Math.PI * 19) * (1 - completionPercentage / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xs font-bold text-[#1f1b14] font-mono">
                  {completionPercentage}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#58423c] block">
                Adherence
              </span>
              <span className="text-xs font-bold text-[#1f1b14] block">
                {completedCount} Done
              </span>
              <span className="text-[11px] text-[#52652a] block font-medium">
                {completionPercentage >= 70 ? "Ahead of pace" : "In Progress"}
              </span>
            </div>
          </div>

          {onQuickLog && (
            <div className="flex sm:flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onQuickLog("Walked 60 mins")}
                className="px-3 py-1.5 rounded-full bg-[#fcf2e6] hover:bg-white text-[#1f1b14] border border-[#dfc0b7] text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs active:scale-95 whitespace-nowrap"
              >
                <span>🚶</span>
                <span>Walk</span>
              </button>
              <button
                type="button"
                onClick={() => onQuickLog("Had whey protein shake")}
                className="px-3 py-1.5 rounded-full bg-[#fcf2e6] hover:bg-white text-[#1f1b14] border border-[#dfc0b7] text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs active:scale-95 whitespace-nowrap"
              >
                <span>⚡</span>
                <span>Whey</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
