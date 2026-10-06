"use client";

import React, { useRef } from "react";

interface MomCalendarBarProps {
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

export function MomCalendarBar({
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
}: MomCalendarBarProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onSelectDate(e.target.value);
    }
  };

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  return (
    <div className="w-full bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#dfc0b7] shadow-sm space-y-3.5">
      {/* Top Banner: Date & Relative Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dfc0b7]/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#fcf2e6] border-2 border-[#dfc0b7] flex items-center justify-center text-xl shrink-0">
            📅
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8b716a]">
                Kitchen Schedule Date
              </span>
              {isToday && (
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#d4eca2] text-[#2c3814] border border-[#52652a]/30">
                  Today
                </span>
              )}
              {isTomorrow && (
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ffdbd1] text-[#a43716] border border-[#a43716]/30">
                  Tomorrow (Next Day)
                </span>
              )}
              {isYesterday && (
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                  Yesterday
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#1f1b14] mt-0.5">
              {dateStr || "Today"}
            </h2>
          </div>
        </div>

        {/* Date Picker Trigger (Native HTML5 Date Input) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            ref={dateInputRef}
            type="date"
            value={dateKey}
            onChange={handleDateChange}
            className="sr-only"
            aria-label="Pick kitchen schedule date"
          />
          <button
            type="button"
            onClick={openDatePicker}
            className="px-3.5 py-2.5 rounded-2xl bg-[#fcf2e6] hover:bg-white text-[#58423c] border-2 border-[#dfc0b7] text-xs sm:text-sm font-bold flex items-center gap-2 active:scale-95 transition-all shadow-xs"
          >
            <span>🗓️</span>
            <span>Pick Any Date</span>
          </button>
        </div>
      </div>

      {/* Navigation Buttons Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
        <button
          type="button"
          onClick={onPrevDay}
          className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7] text-xs sm:text-sm font-bold active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>←</span>
          <span>Prev Day</span>
        </button>

        <button
          type="button"
          onClick={onToday}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all shrink-0 border ${
            isToday
              ? "bg-[#52652a] text-white border-[#52652a] shadow-sm"
              : "bg-white text-[#58423c] border-[#dfc0b7] hover:bg-[#fcf2e6]"
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={onTomorrow}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all shrink-0 border flex items-center gap-1.5 ${
            isTomorrow
              ? "bg-[#a43716] text-white border-[#a43716] shadow-sm"
              : "bg-[#fcf2e6] text-[#a43716] border-[#dfc0b7] hover:bg-[#ffdbd1]"
          }`}
        >
          <span>Tomorrow (Next Day)</span>
          <span>➔</span>
        </button>

        <button
          type="button"
          onClick={onNextDay}
          className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7] text-xs sm:text-sm font-bold active:scale-95 transition-all flex items-center gap-1.5 shrink-0 ml-auto"
        >
          <span>Next Day</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
