"use client";

import React, { useState } from "react";

interface DailyTrendItem {
  date: string;
  day: string;
  completed: number;
  total: number;
  rate: number;
  calories?: number;
  protein?: number;
}

interface InteractiveTrendChartProps {
  dailyTrend: DailyTrendItem[];
  daysCount: number;
}

export function InteractiveTrendChart({ dailyTrend, daysCount }: InteractiveTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeItem =
    hoveredIndex !== null && dailyTrend[hoveredIndex]
      ? dailyTrend[hoveredIndex]
      : dailyTrend[dailyTrend.length - 1] || null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
      {/* Header and Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#eae1d5]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a43716] block">
            Adherence Velocity
          </span>
          <h3 className="text-base font-serif font-bold text-[#1f1b14]">
            {daysCount}-Day Routine Execution Trend
          </h3>
        </div>

        {activeItem && (
          <div className="flex items-center gap-2 bg-[#fcf2e6] px-3 py-1.5 rounded-xl border border-[#dfc0b7] text-xs">
            <span className="font-serif font-bold text-[#1f1b14]">
              {activeItem.day}, {activeItem.date}:
            </span>
            <span className="font-mono text-[#a43716] font-bold">
              {activeItem.rate}% Done ({activeItem.completed}/{activeItem.total})
            </span>
            {activeItem.calories ? (
              <span className="text-[11px] text-[#58423c] font-mono border-l border-[#dfc0b7] pl-2">
                🔥 {activeItem.calories} kcal · 🍗 {activeItem.protein || 0}g
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Target Reference Line Legend */}
      <div className="flex items-center justify-between text-[11px] text-[#8b716a]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#a43716]" />
            Completed %
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t border-dashed border-[#52652a]" />
            70% Consistency Benchmark
          </span>
        </div>
        <span className="font-mono text-[10px]">Hover bars for telemetry</span>
      </div>

      {/* Interactive Bar Chart Container */}
      <div className="relative h-44 w-full pt-4 pb-2">
        {/* 70% Benchmark Line */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-[#52652a]/50 flex items-center justify-end pr-1 pointer-events-none z-10"
          style={{ bottom: "70%" }}
        >
          <span className="text-[9px] font-mono text-[#52652a] font-bold bg-white/90 px-1 rounded-xs">
            70% Goal
          </span>
        </div>

        {/* 100% Top Line */}
        <div
          className="absolute inset-x-0 border-t border-[#dfc0b7]/40 pointer-events-none"
          style={{ bottom: "100%" }}
        />

        {/* Bars Flex Row */}
        <div className="flex items-end justify-between h-full gap-1.5 sm:gap-2">
          {dailyTrend.map((day, idx) => {
            const isHovered = hoveredIndex === idx;
            const meetsGoal = day.rate >= 70;
            const barHeight = Math.max(4, day.rate);

            return (
              <div
                key={day.date + idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 cursor-pointer group"
              >
                {/* Rate Tooltip Tag on hover/active */}
                <span
                  className={`text-[9px] font-mono font-bold transition-all duration-150 ${
                    isHovered
                      ? "text-[#a43716] scale-110"
                      : meetsGoal
                      ? "text-[#52652a]"
                      : "text-[#8b716a]"
                  }`}
                >
                  {day.total > 0 ? `${day.rate}%` : "—"}
                </span>

                {/* Bar Track */}
                <div className="w-full bg-[#f0e7db] rounded-t-lg h-full flex items-end overflow-hidden border border-[#dfc0b7] transition-all group-hover:border-[#a43716]">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      meetsGoal
                        ? "bg-gradient-to-t from-[#a43716] to-[#f59e0b] group-hover:from-[#862201] group-hover:to-[#d97706]"
                        : "bg-[#8b716a]/60 group-hover:bg-[#8b716a]"
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered ? "text-[#a43716] font-bold" : "text-[#58423c]"
                  }`}
                >
                  {daysCount > 14 ? day.day.slice(0, 1) : day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
