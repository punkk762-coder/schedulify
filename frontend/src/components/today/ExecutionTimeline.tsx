"use client";

import React, { useState } from "react";
import type { TodayOccurrence } from "@/lib/domain/types";
import { OccurrenceCard } from "./OccurrenceCard";

interface ExecutionTimelineProps {
  occurrences: TodayOccurrence[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenSwapModal: (item: TodayOccurrence) => void;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  occurrences,
  activeCategory,
  onSelectCategory,
  onComplete,
  onUndo,
  onSkip,
  onOpenSwapModal,
}) => {
  // Flexibility state: smart ordering (Next up on top, past at bottom) vs chronological
  const [orderMode, setOrderMode] = useState<"smart" | "chrono">("smart");
  const [showPastItems, setShowPastItems] = useState<boolean>(false);

  const filteredOccurrences = occurrences.filter((item) => {
    if (activeCategory === "ALL") return true;
    if (activeCategory === "MEAL") return item.category === "MEAL";
    if (activeCategory === "MOVEMENT")
      return item.category === "WORKOUT" || item.category === "ACTIVITY";
    return item.category !== "MEAL" && item.category !== "WORKOUT" && item.category !== "ACTIVITY";
  });

  // Separate active/pending from past/completed
  const pendingItems = filteredOccurrences.filter((o) => o.status === "PENDING");
  const pastItems = filteredOccurrences.filter((o) => o.status !== "PENDING");

  const nextUpItem = pendingItems[0] || null;
  const subsequentPending = pendingItems.slice(1);

  return (
    <section className="flex flex-col gap-5">
      {/* Day Schedule Ledger Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#dfc0b7]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1f1b14] font-mono">
            Day Schedule Ledger
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7] font-semibold">
            {occurrences.length} items
          </span>
        </div>

        {/* View Controls: Filter Pills & Smart/Chrono Mode Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto">
          {/* Smart Focus Mode vs Chronological Mode */}
          <div className="flex items-center gap-1 bg-[#fcf2e6] p-1 rounded-full border border-[#dfc0b7] text-xs shrink-0">
            <button
              type="button"
              onClick={() => setOrderMode("smart")}
              className={`px-3 py-1 rounded-full transition-all font-semibold flex items-center gap-1 whitespace-nowrap ${
                orderMode === "smart"
                  ? "bg-[#a43716] text-white shadow-2xs"
                  : "text-[#58423c] hover:text-[#1f1b14]"
              }`}
              title="Prioritizes Next Up item at top, moves past completed items to bottom"
            >
              <span>⚡ Next Up</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderMode("chrono")}
              className={`px-3 py-1 rounded-full transition-all font-semibold whitespace-nowrap ${
                orderMode === "chrono"
                  ? "bg-white text-[#1f1b14] shadow-2xs"
                  : "text-[#58423c] hover:text-[#1f1b14]"
              }`}
              title="Time-based chronological ordering"
            >
              <span>⏱️ Time</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-[#fcf2e6] p-1 rounded-full border border-[#dfc0b7] text-xs shrink-0">
            {[
              { id: "ALL", label: "All" },
              { id: "MEAL", label: "Meals" },
              { id: "MOVEMENT", label: "Movement" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategory(tab.id)}
                className={`px-3 py-1 rounded-full transition-all font-semibold whitespace-nowrap ${
                  activeCategory === tab.id
                    ? "bg-white text-[#1f1b14] shadow-2xs"
                    : "text-[#58423c] hover:text-[#1f1b14]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredOccurrences.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-[#dfc0b7]">
          <p className="text-sm font-serif font-semibold text-[#1f1b14]">
            No routine items found in this filter
          </p>
          <p className="text-xs text-[#58423c] mt-1">
            Select &quot;All&quot; to review the complete daily schedule.
          </p>
        </div>
      ) : orderMode === "smart" ? (
        /* ============================================================
           SMART MODE: NEXT UP ON TOP, THEN UPCOMING, PAST AT BOTTOM
           ============================================================ */
        <div className="flex flex-col gap-4">
          {/* 1. NEXT UP SPOTLIGHT (Immediate top item - no scrolling needed) */}
          {nextUpItem ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#a43716] uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#a43716] animate-pulse" />
                  Immediate Focus (Next Up)
                </span>
                <span className="text-[#58423c] font-normal">Active Protocol</span>
              </div>
              <OccurrenceCard
                item={nextUpItem}
                isNextUp={true}
                onComplete={onComplete}
                onUndo={onUndo}
                onSkip={onSkip}
                onOpenSwap={onOpenSwapModal}
              />
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#f7faef] border border-[#52652a]/30 text-center flex items-center justify-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h4 className="font-serif font-bold text-sm text-[#1f1b14]">
                  All scheduled protocols completed!
                </h4>
                <p className="text-xs text-[#52652a] font-medium">
                  Outstanding consistency achieved for today&apos;s routine horizon.
                </p>
              </div>
            </div>
          )}

          {/* 2. SUBSEQUENT UPCOMING ITEMS */}
          {subsequentPending.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-mono font-bold text-[#58423c] uppercase tracking-wider px-1">
                Later Today ({subsequentPending.length} remaining)
              </div>
              {subsequentPending.map((item) => (
                <OccurrenceCard
                  key={item.id}
                  item={item}
                  isNextUp={false}
                  onComplete={onComplete}
                  onUndo={onUndo}
                  onSkip={onSkip}
                  onOpenSwap={onOpenSwapModal}
                />
              ))}
            </div>
          )}

          {/* 3. PAST OF DAY AT BOTTOM (Collapsible to eliminate scrolling) */}
          {pastItems.length > 0 && (
            <div className="pt-3 border-t border-[#dfc0b7]/60 space-y-3">
              <button
                type="button"
                onClick={() => setShowPastItems((prev) => !prev)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#fcf2e6] hover:bg-[#f6ede0] border border-[#dfc0b7] transition-all text-xs font-semibold text-[#58423c] group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#d4eca2] text-[#3b4d14] flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span>
                    Past of Day ({pastItems.length} items logged earlier)
                  </span>
                </div>
                <span className="text-[#a43716] group-hover:translate-y-0.5 transition-transform font-mono text-xs">
                  {showPastItems ? "Hide Earlier Items ▴" : "View Earlier Items ▾"}
                </span>
              </button>

              {showPastItems && (
                <div className="flex flex-col gap-3 pt-1 animate-in fade-in duration-200">
                  {pastItems.map((item) => (
                    <OccurrenceCard
                      key={item.id}
                      item={item}
                      isNextUp={false}
                      onComplete={onComplete}
                      onUndo={onUndo}
                      onSkip={onSkip}
                      onOpenSwap={onOpenSwapModal}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================
           CHRONOLOGICAL MODE (Standard time order)
           ============================================================ */
        <div className="flex flex-col gap-4">
          {filteredOccurrences.map((item) => (
            <OccurrenceCard
              key={item.id}
              item={item}
              isNextUp={item.id === pendingItems[0]?.id}
              onComplete={onComplete}
              onUndo={onUndo}
              onSkip={onSkip}
              onOpenSwap={onOpenSwapModal}
            />
          ))}
        </div>
      )}
    </section>
  );
};
