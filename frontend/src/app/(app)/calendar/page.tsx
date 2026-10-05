"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ThreeFluidOrb } from "@/components/3d/ThreeFluidOrb";
import { ThreeKineticTorus } from "@/components/3d/ThreeKineticTorus";
import { CalendarDayCard, type CalendarDayItem } from "@/components/calendar/CalendarDayCard";
import { DayDetailModal } from "@/components/calendar/DayDetailModal";

interface CalendarApiResponse {
  monthKey: string;
  monthName: string;
  year: number;
  month: number;
  daysInMonth: number;
  summary: {
    averagePercentage: number;
    totalCompleted: number;
    totalScheduled: number;
    daysWith100Pct: number;
    totalChangedCount: number;
    totalWaterLiters: number;
    totalSteps: number;
  };
  days: CalendarDayItem[];
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${y}`;
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return getMonthKey(d);
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<string>(getMonthKey(new Date()));
  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDayItem | null>(null);

  const fetchCalendar = useCallback(async (monthKey: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?month=${monthKey}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load calendar:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(currentMonth);
  }, [currentMonth, fetchCalendar]);

  const todayMonthKey = getMonthKey(new Date());

  const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="w-full space-y-6 text-[#1f1b14] pb-24 animate-in fade-in duration-300">
      {/* ─── 3D CREATIVE HERO: THREE.JS FLUID ORB & CALENDAR HEADER ─── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-white via-[#fcf2e6] to-white rounded-3xl p-6 border border-[#dfc0b7] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 z-10 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a43716] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#a43716]">
              3D Interactive Protocol Ledger
            </span>
            <span className="text-[10px] font-mono bg-white border border-[#dfc0b7] text-[#58423c] px-2 py-0.5 rounded-full font-semibold">
              Three.js Fluid Engine
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1f1b14]">
            {data?.monthName || getMonthLabel(currentMonth)} Routine Calendar
          </h1>
          <p className="text-xs text-[#58423c] max-w-xl leading-relaxed">
            Every day is filled with a dynamic water level representing your habit compliance percentage. Track exactly what percentage you followed and identify every day a routine swap or adaptation was made.
          </p>

          {/* Month Navigation — prev / current label / next */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
              className="p-2 rounded-xl bg-white border border-[#dfc0b7] text-[#58423c] hover:text-[#1f1b14] hover:border-[#8b716a] transition-all active:scale-95 text-sm font-bold"
              aria-label="Previous month"
            >
              ←
            </button>

            <span className="px-4 py-1.5 rounded-xl bg-[#a43716] text-white text-xs font-bold shadow-xs select-none">
              {getMonthLabel(currentMonth)}
            </span>

            <button
              type="button"
              onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
              className="p-2 rounded-xl bg-white border border-[#dfc0b7] text-[#58423c] hover:text-[#1f1b14] hover:border-[#8b716a] transition-all active:scale-95 text-sm font-bold"
              aria-label="Next month"
            >
              →
            </button>

            {currentMonth !== todayMonthKey && (
              <button
                type="button"
                onClick={() => setCurrentMonth(todayMonthKey)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#dfc0b7] text-[#a43716] text-xs font-bold hover:bg-[#fcf2e6] transition-all active:scale-95"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Right: Three.js 3D Interactive Fluid Sphere */}
        <div className="flex items-center gap-4 shrink-0 z-10">
          <div className="relative flex flex-col items-center">
            <ThreeFluidOrb
              level={data?.summary?.averagePercentage || 0}
              size={150}
              color="#0ea5e9"
            />
            <div className="absolute -bottom-2 bg-white/90 backdrop-blur-xs px-3 py-0.5 rounded-full border border-[#dfc0b7] shadow-xs text-center">
              <span className="text-[10px] font-mono font-bold text-[#0369a1]">
                💧 {data?.summary?.averagePercentage || 0}% Fluid
              </span>
            </div>
          </div>

          <div className="hidden sm:block">
            <ThreeKineticTorus size={110} color="#a43716" />
          </div>
        </div>
      </header>

      {/* ─── 4 SUMMARY TILES ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-[#dfc0b7] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Monthly Adherence
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-serif font-bold text-[#a43716]">
              {data?.summary?.averagePercentage ?? 0}
            </span>
            <span className="text-xs font-mono font-bold text-[#8b716a]">% Followed</span>
          </div>
          <span className="text-[11px] text-[#52652a] font-medium block mt-0.5">
            {data?.summary?.totalCompleted ?? 0} habits completed
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#dfc0b7] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Flawless Days (100%)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-serif font-bold text-[#52652a]">
              {data?.summary?.daysWith100Pct ?? 0}
            </span>
            <span className="text-xs font-mono font-bold text-[#8b716a]">Days Perfect</span>
          </div>
          <span className="text-[11px] text-[#58423c] font-medium block mt-0.5">
            Zero missed occurrences
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#dfc0b7] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Protocol Adaptations
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-serif font-bold text-[#1f1b14]">
              {data?.summary?.totalChangedCount ?? 0}
            </span>
            <span className="text-xs font-mono font-bold text-[#8b716a]">Shifts / Swaps</span>
          </div>
          <span className="text-[11px] text-[#a43716] font-medium block mt-0.5">
            Audited in daily ledger
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#dfc0b7] shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Cumulative Hydration
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-serif font-bold text-[#0369a1]">
              {data?.summary?.totalWaterLiters ?? 0}
            </span>
            <span className="text-xs font-mono font-bold text-[#8b716a]">Liters Logged</span>
          </div>
          <span className="text-[11px] text-[#0369a1] font-medium block mt-0.5">
            Active cellular hydration
          </span>
        </div>
      </div>

      {/* ─── CALENDAR GRID (7 COLUMNS WITH FLOATING WATER WAVES) ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#dfc0b7] shadow-xs space-y-3">
        {/* Weekday Labels Header */}
        <div className="grid grid-cols-7 gap-2 text-center pb-2 border-b border-[#dfc0b7]">
          {weekdayHeaders.map((w) => (
            <span key={w} className="text-xs font-mono font-bold uppercase text-[#8b716a]">
              {w}
            </span>
          ))}
        </div>

        {/* Day Cells Grid */}
        {loading && !data ? (
          <div className="grid grid-cols-7 gap-2 animate-pulse">
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
            {data?.days.map((day) => (
              <CalendarDayCard
                key={day.date}
                day={day}
                onClick={(d) => setSelectedDay(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── DAY DETAIL AUDIT MODAL ─── */}
      <DayDetailModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  );
}
