"use client";

import React, { useRef, useState, useMemo } from "react";

interface MomVerticalCalendarProps {
  dateStr: string;
  dateKey: string;
  isToday: boolean;
  isTomorrow: boolean;
  isYesterday: boolean;
  onSelectDate: (dateKey: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onTomorrow: () => void;
}

export function MomVerticalCalendar({
  dateStr,
  dateKey,
  isToday,
  isTomorrow,
  isYesterday,
  onSelectDate,
  onPrevDay,
  onNextDay,
  onToday,
  onTomorrow,
}: MomVerticalCalendarProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [showFullWeek, setShowFullWeek] = useState(false);

  // Helper to format Date to YYYY-MM-DD in local time
  const toKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Helper to parse YYYY-MM-DD
  const parseKey = (key: string): Date => {
    if (!key) return new Date();
    const parts = key.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  // Anchor references
  const now = new Date();
  const todayKeyStr = toKey(now);
  const tomorrowKeyStr = toKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const yesterdayKeyStr = toKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  // Build the list of days to display vertically
  const dayList = useMemo(() => {
    const baseDate = parseKey(dateKey);

    if (showFullWeek) {
      // Find Monday of current week
      const dayOfWeek = baseDate.getDay();
      const diffToMonday = (dayOfWeek + 6) % 7; // 0 for Mon, 6 for Sun
      const monday = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - diffToMonday);

      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const k = toKey(d);
        days.push({
          key: k,
          dayNum: String(d.getDate()).padStart(2, "0"),
          weekdayShort: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
          weekdayLong: d.toLocaleDateString("en-US", { weekday: "long" }),
          formattedDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          isToday: k === todayKeyStr,
          isTomorrow: k === tomorrowKeyStr,
          isYesterday: k === yesterdayKeyStr,
          isSelected: k === dateKey,
        });
      }
      return days;
    }

    // Default compact 5-day vertical sequence
    // Center around baseDate: -1 (Yesterday/Prev), 0 (Current), +1 (Next), +2, +3
    const offsets = [-1, 0, 1, 2, 3];
    return offsets.map((offset) => {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offset);
      const k = toKey(d);
      return {
        key: k,
        dayNum: String(d.getDate()).padStart(2, "0"),
        weekdayShort: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        weekdayLong: d.toLocaleDateString("en-US", { weekday: "long" }),
        formattedDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isToday: k === todayKeyStr,
        isTomorrow: k === tomorrowKeyStr,
        isYesterday: k === yesterdayKeyStr,
        isSelected: k === dateKey,
      };
    });
  }, [dateKey, showFullWeek, todayKeyStr, tomorrowKeyStr, yesterdayKeyStr]);

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onSelectDate(e.target.value);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-3 sm:p-4 border-2 border-[#dfc0b7] shadow-xs space-y-3">
      {/* ─── Vertical Calendar Header ─── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#dfc0b7]/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] flex items-center justify-center text-base shrink-0">
            📅
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-mono font-black uppercase tracking-wider text-[#1f1b14]">
                Vertical Schedule
              </h2>
              {isToday && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#d4eca2] text-[#2c3814] border border-[#52652a]/30">
                  Today
                </span>
              )}
              {isTomorrow && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ffdbd1] text-[#a43716] border border-[#a43716]/30">
                  Tomorrow
                </span>
              )}
              {isYesterday && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                  Yesterday
                </span>
              )}
            </div>
            <p className="text-xs text-[#8b716a] font-medium leading-tight">
              {dateStr || "Tap any day to switch"}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isToday && (
            <button
              type="button"
              onClick={onToday}
              className="px-2.5 py-1.5 rounded-xl bg-[#52652a] text-white text-xs font-black active:scale-95 transition-all shadow-xs"
            >
              ⭐ Today
            </button>
          )}

          <button
            type="button"
            onClick={openDatePicker}
            className="px-2.5 py-1.5 rounded-xl bg-[#fcf2e6] hover:bg-white text-[#58423c] border border-[#dfc0b7] text-xs font-bold active:scale-95 transition-all shadow-xs flex items-center gap-1"
          >
            <span>🗓️</span>
            <span>Pick</span>
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={dateKey}
            onChange={handleDateInput}
            className="sr-only"
            aria-label="Pick kitchen schedule date"
          />
        </div>
      </div>

      {/* ─── Vertical Day Stepper Row ─── */}
      <div className="flex items-center justify-between text-xs text-[#8b716a] px-1 font-mono">
        <button
          type="button"
          onClick={onPrevDay}
          className="flex items-center gap-1 font-bold hover:text-[#1f1b14] active:scale-95 py-0.5"
        >
          <span>▲</span>
          <span>Previous Day</span>
        </button>

        <button
          type="button"
          onClick={onNextDay}
          className="flex items-center gap-1 font-bold hover:text-[#1f1b14] active:scale-95 py-0.5"
        >
          <span>Next Day</span>
          <span>▼</span>
        </button>
      </div>

      {/* ─── Vertical Stack of Days (Mom's Touch Targets) ─── */}
      <div className="space-y-1.5">
        {dayList.map((day) => {
          const isSelected = day.isSelected;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDate(day.key)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
                isSelected
                  ? "bg-[#f7faef] border-[#52652a] shadow-xs ring-1 ring-[#52652a]/30"
                  : "bg-white border-[#dfc0b7]/80 hover:bg-[#fcf2e6]/40"
              }`}
            >
              {/* Left: Date Badge Pill */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 border transition-colors ${
                    isSelected
                      ? "bg-[#52652a] text-white border-[#52652a]"
                      : day.isToday
                      ? "bg-[#d4eca2] text-[#2c3814] border-[#52652a]/40"
                      : day.isTomorrow
                      ? "bg-[#ffdbd1] text-[#a43716] border-[#a43716]/30"
                      : "bg-[#fcf2e6] text-[#58423c] border-[#dfc0b7]"
                  }`}
                >
                  <span className="text-[9px] font-mono font-bold leading-none uppercase">
                    {day.weekdayShort}
                  </span>
                  <span className="text-base font-black leading-tight">
                    {day.dayNum}
                  </span>
                </div>

                {/* Day Name & Relative Badge */}
                <div className="truncate">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-sm font-black truncate ${
                        isSelected ? "text-[#1f1b14]" : "text-[#58423c]"
                      }`}
                    >
                      {day.weekdayLong}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#d4eca2] text-[#2c3814] border border-[#52652a]/30">
                        Today
                      </span>
                    )}
                    {day.isTomorrow && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ffdbd1] text-[#a43716] border border-[#a43716]/30">
                        Tomorrow
                      </span>
                    )}
                    {day.isYesterday && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                        Yesterday
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#8b716a] font-medium block">
                    {day.formattedDate}
                  </span>
                </div>
              </div>

              {/* Right: Active Indicator / Action Button */}
              <div className="shrink-0 pl-2">
                {isSelected ? (
                  <span className="px-2.5 py-1 rounded-lg bg-[#52652a] text-white text-xs font-black flex items-center gap-1 shadow-2xs">
                    <span>✓</span>
                    <span>Viewing</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#8b716a] flex items-center gap-0.5 group-hover:text-[#1f1b14]">
                    <span>View</span>
                    <span>➔</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Expand 7-Day Week Button ─── */}
      <button
        type="button"
        onClick={() => setShowFullWeek((prev) => !prev)}
        className="w-full py-2 rounded-xl bg-[#fcf2e6] hover:bg-white text-[#58423c] border border-[#dfc0b7] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
      >
        <span>↕</span>
        <span>
          {showFullWeek ? "Show 5-Day View" : "Show Full 7-Day Week Vertically"}
        </span>
      </button>
    </div>
  );
}
