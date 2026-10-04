"use client";

import { useState, useEffect } from "react";

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

export default function HistoryPage() {
  const [range, setRange] = useState<"today" | "yesterday" | "week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState<Record<string, OccurrenceRecord[]>>({});

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/history?range=${range}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore) {
            setGrouped(json.grouped || {});
          }
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [range]);

  const dates = Object.keys(grouped).sort().reverse();

  return (
    <div className="space-y-6 pb-6 text-[#1f1b14]">
      {/* Header */}
      <div>
        <span className="text-xs font-bold tracking-wider uppercase text-[#52652a]">
          Historical Audit
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#1f1b14] mt-0.5">Routine History</h1>
        <p className="text-xs text-[#58423c]">Immutable past occurrence records & execution trace</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#fcf2e6] rounded-full border border-[#dfc0b7] text-xs">
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
            onClick={() => setRange(tab.id)}
            className={`flex-1 py-1.5 rounded-full font-medium transition-all ${
              range === tab.id
                ? "bg-[#a43716] text-white shadow-xs font-semibold"
                : "text-[#58423c] hover:text-[#1f1b14]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History List Grouped by Day */}
      <div className="space-y-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse bg-white border border-[#dfc0b7]" />
            ))}
          </div>
        ) : dates.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-[#dfc0b7] shadow-xs">
            <p className="text-sm font-serif font-semibold text-[#1f1b14]">No historical records found for this period</p>
            <p className="text-xs text-[#58423c] mt-1">
              Recorded occurrences and completions will be preserved here permanently.
            </p>
          </div>
        ) : (
          dates.map((dateKey) => {
            const items = grouped[dateKey];
            return (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#a43716] uppercase tracking-wider">{dateKey}</span>
                  <span className="h-px flex-1 bg-[#dfc0b7]" />
                </div>

                <div className="space-y-2">
                  {items.map((item) => {
                    const isDone = item.status === "COMPLETED";
                    const isSkip = item.status === "SKIPPED";
                    const isRep = item.status === "REPLACED";
                    const isMiss = item.status === "MISSED";

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-2xs ${
                          isDone
                            ? "border-[#52652a]/40 bg-[#f7faef]"
                            : isSkip
                            ? "border-[#dfc0b7] bg-[#f6ede0] opacity-80"
                            : isRep
                            ? "border-[#f59e0b]/40 bg-[#fffbeb]"
                            : isMiss
                            ? "border-[#ba1a1a]/30 bg-[#fff5f5]"
                            : "border-[#dfc0b7] bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[#a43716]">
                            {item.scheduledTime}
                          </span>
                          <div>
                            <span
                              className={`font-semibold text-[#1f1b14] ${
                                isSkip ? "line-through text-[#8b716a]" : ""
                              }`}
                            >
                              {item.routineItem.title}
                            </span>
                            <span className="text-[10px] text-[#58423c] ml-2">
                              {item.routineItem.category}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isDone
                              ? "bg-[#d4eca2] text-[#141f00] border border-[#52652a]/30"
                              : isSkip
                              ? "bg-[#eae1d5] text-[#58423c]"
                              : isRep
                              ? "bg-[#fef3c7] text-[#92400e] border border-[#f59e0b]/30"
                              : isMiss
                              ? "bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20"
                              : "bg-[#fcf2e6] text-[#58423c]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
