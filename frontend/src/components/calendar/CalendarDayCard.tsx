"use client";

import React from "react";

export interface CalendarDayItem {
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  totalItems: number;
  completedItems: number;
  skippedItems: number;
  replacedItems: number;
  percentage: number;
  hasChanges: boolean;
  hasDifferentFood?: boolean;
  differentMeals?: Array<{
    id: string;
    title: string;
    calories: number;
    notes?: string;
  }>;
  changes: string[];
  waterMl: number;
  waterPercentage: number;
  steps: number;
  items: Array<{
    id: string;
    title: string;
    category: string;
    scheduledTime: string;
    status: string;
    isReplaced: boolean;
    replacementTitle?: string;
    notes?: string;
  }>;
}

interface CalendarDayCardProps {
  day: CalendarDayItem;
  onClick: (day: CalendarDayItem) => void;
}

export const CalendarDayCard: React.FC<CalendarDayCardProps> = ({ day, onClick }) => {
  const {
    dayNumber,
    dayOfWeek,
    percentage,
    hasChanges,
    hasDifferentFood,
    differentMeals = [],
    changes,
    isToday,
    isFuture,
    waterMl,
    steps,
  } = day;

  const isDifferent = Boolean(hasDifferentFood || (differentMeals && differentMeals.length > 0));

  // Color gradient based on plan vs off-plan per user specification:
  // "if i had anything diff show the percentage of water ui with red and the thing according to my plan blue ,other with red water"
  let waterColor = "from-[#0284c7]/25 via-[#38bdf8]/35 to-[#0ea5e9]/40";
  let waveSvgColor = "text-sky-400/40";
  let percentageColor = "text-[#0369a1]";
  let statusText = percentage === 100 ? "On Plan" : percentage >= 70 ? "Consistent" : percentage > 0 ? "In Progress" : "Pending";

  if (isDifferent) {
    // Red water UI for anything different / off-plan!
    waterColor = "from-[#ba1a1a]/30 via-[#ef4444]/35 to-[#dc2626]/40";
    waveSvgColor = "text-red-500/40";
    percentageColor = "text-[#ba1a1a]";
    statusText = "Different / Off-Plan";
  } else {
    // Blue water UI for on-plan!
    waterColor = "from-[#0284c7]/25 via-[#38bdf8]/35 to-[#0ea5e9]/40";
    waveSvgColor = "text-sky-400/40";
    percentageColor = percentage >= 80 ? "text-[#0369a1]" : "text-[#1f1b14]";
  }

  // Water level height percentage (clamped between 0 and 100)
  const fluidHeightPct = isFuture && percentage === 0 ? 0 : Math.max(0, Math.min(100, percentage));

  return (
    <div
      onClick={() => onClick(day)}
      className={`relative overflow-hidden rounded-2xl border transition-all cursor-pointer group p-2.5 min-h-[110px] sm:min-h-[125px] flex flex-col justify-between select-none active:scale-[0.98] ${
        isToday
          ? "bg-white border-[#a43716] shadow-md ring-2 ring-[#a43716]/40"
          : "bg-white hover:bg-[#fffcf7] border-[#dfc0b7] hover:border-[#8b716a] shadow-2xs hover:shadow-sm"
      }`}
    >
      {/* ─── FLOATING WATER FLUID WAVE IN BACKGROUND ─── */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-700 ease-out z-0 overflow-hidden"
        style={{ height: `${fluidHeightPct}%` }}
      >
        {/* Floating wavy ripple */}
        <div
          className={`w-[200%] h-full bg-gradient-to-t ${waterColor} relative -left-1/2 opacity-90`}
          style={{
            maskImage: "linear-gradient(to top, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)",
          }}
        >
          {/* Animated SVG Surface Wave */}
          <svg
            className={`absolute top-0 left-0 w-full h-3 ${waveSvgColor} animate-[wave_6s_ease-in-out_infinite]`}
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* ─── CARD CONTENT (Z-10) ─── */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-baseline gap-1">
          <span className={`text-sm sm:text-base font-serif font-bold ${isToday ? "text-[#a43716]" : "text-[#1f1b14]"}`}>
            {dayNumber}
          </span>
          <span className="text-[10px] font-mono text-[#8b716a] uppercase">
            {dayOfWeek}
          </span>
        </div>

        {isToday && (
          <span className="text-[9px] font-mono font-bold uppercase bg-[#a43716] text-white px-1.5 py-0.5 rounded-full shadow-2xs">
            Today
          </span>
        )}
      </div>

      {/* Middle: Percentage Followed & Floating Water Indicator */}
      <div className="relative z-10 my-1 text-center">
        <div className="inline-flex items-baseline gap-0.5">
          <span className={`text-xl sm:text-2xl font-serif font-bold tracking-tight ${percentageColor}`}>
            {percentage}
          </span>
          <span className="text-xs font-mono font-bold text-[#8b716a]">%</span>
        </div>

        <span className={`text-[9px] font-mono block -mt-0.5 ${isDifferent ? "text-[#ba1a1a] font-bold" : "text-[#58423c]"}`}>
          {statusText}
        </span>
      </div>

      {/* Bottom: Change Alert Badge & Telemetry */}
      <div className="relative z-10 flex flex-col gap-1 pt-1 border-t border-[#dfc0b7]/40">
        {isDifferent ? (
          <div
            className="flex items-center justify-between px-1.5 py-0.5 rounded-md bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#ba1a1a] text-[9px] font-mono font-bold truncate shadow-2xs"
            title={changes.join("\n")}
          >
            <span className="truncate">⚡ {differentMeals.length > 0 ? `${differentMeals.length} Off-Plan` : "Swapped"}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-pulse shrink-0" />
          </div>
        ) : hasChanges ? (
          <div
            className="flex items-center justify-between px-1.5 py-0.5 rounded-md bg-[#fff0eb] border border-[#a43716]/40 text-[#a43716] text-[9px] font-mono font-bold truncate shadow-2xs"
            title={changes.join("\n")}
          >
            <span className="truncate">🔄 {changes.length} Shift</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#a43716] animate-pulse shrink-0" />
          </div>
        ) : (
          <div className="flex items-center justify-between text-[9px] font-mono text-[#8b716a]">
            <span>💧 {waterMl}ml</span>
            <span>🚶 {steps > 0 ? `${(steps / 1000).toFixed(1)}k` : "0k"}</span>
          </div>
        )}
      </div>
    </div>
  );
};
