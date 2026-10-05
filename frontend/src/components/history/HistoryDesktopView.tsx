"use client";

import React from "react";

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

interface HistoryDesktopViewProps {
  range: "today" | "yesterday" | "week" | "month";
  onSelectRange: (r: "today" | "yesterday" | "week" | "month") => void;
  grouped: Record<string, OccurrenceRecord[]>;
}

export function HistoryDesktopView({
  range,
  onSelectRange,
  grouped,
}: HistoryDesktopViewProps) {
  const dates = Object.keys(grouped).sort().reverse();
  const totalEvents = Object.values(grouped).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="w-full space-y-6">
      {/* ─── Clean Executive Audit Header ─── */}
      <header className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              Historical Audit Engine
            </span>
            <span className="text-xs font-mono text-[#8b716a]">• Immutable PostgreSQL Logs</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1f1b14]">Routine Execution Trace</h1>
          <p className="text-xs text-[#58423c] mt-0.5">
            Cryptographic-style auditability of historical occurrences. Schedule updates never delete past facts.
          </p>
        </div>

        {/* Range Buttons & Event Count */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-[#fcf2e6] p-1.5 rounded-xl border border-[#dfc0b7] text-xs font-semibold">
            {(
              [
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "week", label: "Last 7 Days" },
                { id: "month", label: "30 Days" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectRange(tab.id)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  range === tab.id
                    ? "bg-[#a43716] text-white shadow-xs font-bold"
                    : "text-[#58423c] hover:text-[#1f1b14]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-[#fcf2e6] px-4 py-2 rounded-xl border border-[#dfc0b7] text-right">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">Records</span>
            <span className="text-xs font-bold text-[#1f1b14]">{totalEvents} Logged</span>
          </div>
        </div>
      </header>

      {/* ─── Day-by-Day Clean Audit Tables ─── */}
      {dates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-[#dfc0b7] shadow-xs">
          <p className="text-sm font-serif font-semibold text-[#1f1b14]">No audit records found for this period</p>
          <p className="text-xs text-[#58423c] mt-1">All executions and completions will be preserved here permanently.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => {
            const items = grouped[date] || [];
            const completedCount = items.filter((i) => i.status === "COMPLETED").length;
            const adherence = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

            return (
              <div key={date} className="bg-white rounded-2xl border border-[#dfc0b7] shadow-xs overflow-hidden">
                {/* Day Header Strip */}
                <div className="bg-[#fcf2e6] px-6 py-3.5 border-b border-[#dfc0b7] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-sm text-[#1f1b14]">{date}</span>
                    <span className="text-[11px] font-mono text-[#58423c]">• {items.length} occurrences recorded</span>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      adherence >= 80
                        ? "bg-[#d4eca2] text-[#141f00] border-[#52652a]/30"
                        : adherence >= 50
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-red-100 text-red-900 border-red-300"
                    }`}
                  >
                    {completedCount}/{items.length} Completed ({adherence}%)
                  </span>
                </div>

                {/* Day Rows */}
                <div className="divide-y divide-[#dfc0b7]/40">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-3 flex items-center justify-between hover:bg-[#fffbf7] transition-all text-xs"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs font-bold text-[#a43716] w-14">
                          {item.scheduledTime}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                          {item.routineItem.category}
                        </span>
                        <span className="font-medium text-[#1f1b14]">{item.routineItem.title}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.completion?.notes && (
                          <span className="text-[11px] font-mono text-[#8b716a] bg-[#fcf2e6] px-2 py-0.5 rounded-md border border-[#dfc0b7]">
                            {item.completion.notes}
                          </span>
                        )}

                        <span
                          className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
