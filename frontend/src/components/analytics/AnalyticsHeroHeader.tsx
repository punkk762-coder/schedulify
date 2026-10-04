"use client";

import React from "react";

interface AnalyticsHeroHeaderProps {
  daysCount: number;
  onSelectDays: (days: number) => void;
  adherence: number;
  completed: number;
  total: number;
  streak: number;
  grade?: string;
  bestDay?: string;
}

export function AnalyticsHeroHeader({
  daysCount,
  onSelectDays,
  adherence,
  completed,
  total,
  streak,
  grade = "A",
  bestDay = "Tue (92%)",
}: AnalyticsHeroHeaderProps) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (adherence / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Top Title & Horizon Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#dfc0b7]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-[#52652a]/10 text-[#52652a] border border-[#52652a]/20">
              Biometric &amp; Routine Telemetry
            </span>
            <span className="text-[10px] font-mono text-[#8b716a]">Live Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1f1b14] mt-1 tracking-tight">
            Performance Ledger
          </h1>
          <p className="text-xs text-[#58423c]">
            Comprehensive habit consistency, caloric balance, and momentum analytics.
          </p>
        </div>

        {/* Time Horizon Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#f0e7db] border border-[#dfc0b7] self-start sm:self-center shadow-xs">
          {[
            { label: "7 Days", val: 7 },
            { label: "14 Days", val: 14 },
            { label: "30 Days", val: 30 },
          ].map((tab) => (
            <button
              key={tab.val}
              type="button"
              onClick={() => onSelectDays(tab.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                daysCount === tab.val
                  ? "bg-[#a43716] text-white shadow-xs"
                  : "text-[#58423c] hover:text-[#1f1b14] hover:bg-[#fcf2e6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Adherence Ring Card */}
        <div className="glass-panel p-4 rounded-2xl border border-[#dfc0b7] bg-white flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a43716] block">
              Cycle Adherence
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-serif font-extrabold text-[#1f1b14]">
                {adherence}%
              </span>
            </div>
            <span className="text-[11px] text-[#52652a] font-semibold block">
              {completed} of {total} Done
            </span>
          </div>

          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="text-[#f0e7db]"
                strokeWidth="5"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="text-[#a43716] transition-all duration-700 ease-out"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-bold text-[#1f1b14] font-mono">
              {adherence}%
            </span>
          </div>
        </div>

        {/* Consistency Streak Card */}
        <div className="glass-panel p-4 rounded-2xl border border-[#dfc0b7] bg-white space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b] block">
              Active Streak
            </span>
            <span className="text-lg">🔥</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-serif font-extrabold text-[#1f1b14]">
              {streak}
            </span>
            <span className="text-xs text-[#8b716a] font-medium">Days (≥70%)</span>
          </div>
          <div className="w-full bg-[#f0e7db] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#f59e0b] to-[#a43716] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, streak * 14.3)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#58423c] block font-mono">
            Target: 7+ days continuous
          </span>
        </div>

        {/* Routine Grade Card */}
        <div className="glass-panel p-4 rounded-2xl border border-[#dfc0b7] bg-[#fcf2e6] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#52652a] block">
              Routine Grade
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#52652a]/10 text-[#52652a] border border-[#52652a]/20">
              Optimal
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-extrabold text-[#1f1b14]">
              {grade}
            </span>
            <span className="text-xs text-[#52652a] font-semibold">Solstice Level</span>
          </div>
          <p className="text-[10px] text-[#58423c]">
            Top tier adherence across nutrition &amp; movement.
          </p>
        </div>

        {/* Best Performance Day Card */}
        <div className="glass-panel p-4 rounded-2xl border border-[#dfc0b7] bg-white space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7] block">
              Peak Rhythm Day
            </span>
            <span className="text-base">⚡</span>
          </div>
          <div className="text-xl font-serif font-bold text-[#1f1b14] truncate">
            {bestDay}
          </div>
          <p className="text-[10px] text-[#58423c]">
            Highest completion velocity recorded in this window.
          </p>
        </div>
      </div>
    </div>
  );
}
