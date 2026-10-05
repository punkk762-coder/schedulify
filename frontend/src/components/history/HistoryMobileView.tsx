"use client";

import React, { useState } from "react";

interface OccurrenceRecord {
  id: string;
  scheduledTime: string;
  status: string;
  routineItem: {
    title: string;
    category: string;
  };
  completion?: {
    notes?: string;
  };
}

interface HistoryMobileViewProps {
  range: "today" | "yesterday" | "week" | "month";
  onSelectRange: (r: "today" | "yesterday" | "week" | "month") => void;
  grouped: Record<string, OccurrenceRecord[]>;
}

export function HistoryMobileView({
  range,
  onSelectRange,
  grouped,
}: HistoryMobileViewProps) {
  const dates = Object.keys(grouped).sort().reverse();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(() => {
    // Expand the first date by default
    if (dates.length > 0) return { [dates[0]]: true };
    return {};
  });

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  return (
    <div className="w-full space-y-4 pb-20 animate-in fade-in duration-300">
      {/* ─── Mobile Audit Header ─── */}
      <div className="bg-white rounded-3xl p-5 border border-[#dfc0b7] shadow-xs">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#52652a] font-bold">
            Historical Audit
          </span>
        </div>
        <h1 className="text-xl font-serif font-bold text-[#1f1b14]">Routine Logbook</h1>
        <p className="text-xs text-[#58423c] mt-0.5">
          Immutable past execution trace with 0% data loss.
        </p>

        {/* Range Segmented Pill */}
        <div className="flex items-center gap-1 bg-[#fcf2e6] p-1 rounded-2xl border border-[#dfc0b7] text-xs font-semibold mt-4">
          {(
            [
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yest" },
              { id: "week", label: "7 Days" },
              { id: "month", label: "30 Days" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectRange(tab.id)}
              className={`flex-1 py-1.5 rounded-xl transition-all text-center ${
                range === tab.id
                  ? "bg-[#a43716] text-white shadow-xs font-bold"
                  : "text-[#58423c] hover:text-[#1f1b14]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Expandable Day Cards Stack ─── */}
      {dates.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#dfc0b7] shadow-xs space-y-2">
          <span className="text-3xl block">📜</span>
          <h3 className="font-serif font-bold text-base text-[#1f1b14]">No records for this range</h3>
          <p className="text-xs text-[#58423c]">Select a wider timeframe above to view past entries.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dates.map((date) => {
            const items = grouped[date] || [];
            const completedCount = items.filter((i) => i.status === "COMPLETED").length;
            const adherence = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
            const isExpanded = expandedDates[date] ?? false;

            return (
              <div
                key={date}
                className="bg-white rounded-3xl border border-[#dfc0b7] shadow-xs overflow-hidden transition-all"
              >
                {/* Day Card Header Button */}
                <button
                  type="button"
                  onClick={() => toggleDate(date)}
                  className="w-full p-4 flex items-center justify-between text-left active:bg-[#fcf2e6]/50 transition-all"
                >
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#1f1b14]">{date}</h3>
                    <span className="text-[11px] font-mono text-[#58423c]">
                      {completedCount} of {items.length} items completed
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        adherence >= 80
                          ? "bg-[#d4eca2] text-[#141f00] border-[#52652a]/30"
                          : adherence >= 50
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-red-100 text-red-900 border-red-300"
                      }`}
                    >
                      {adherence}%
                    </span>
                    <span className="text-xs text-[#8b716a]">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Expanded Items */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-[#dfc0b7]/50 bg-[#fffbf7]">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-2xl bg-white border border-[#dfc0b7] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-bold text-[#a43716]">
                            {item.scheduledTime}
                          </span>
                          <span className="font-medium text-[#1f1b14] truncate">
                            {item.routineItem.title}
                          </span>
                        </div>

                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            item.status === "COMPLETED"
                              ? "bg-[#52652a]/10 text-[#52652a] border-[#52652a]/20"
                              : item.status === "SKIPPED"
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : item.status === "REPLACED"
                              ? "bg-[#a43716]/10 text-[#a43716] border-[#a43716]/20"
                              : "bg-[#fcf2e6] text-[#58423c] border-[#dfc0b7]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
