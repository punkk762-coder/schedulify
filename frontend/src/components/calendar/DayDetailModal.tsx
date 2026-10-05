"use client";

import React from "react";
import type { CalendarDayItem } from "./CalendarDayCard";

interface DayDetailModalProps {
  day: CalendarDayItem | null;
  onClose: () => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ day, onClose }) => {
  if (!day) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 border border-[#dfc0b7] shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                Day Protocol Audit
              </span>
              {day.isToday && (
                <span className="px-2 py-0.5 rounded-full bg-[#a43716] text-white text-[9px] font-mono font-bold">
                  Active Today
                </span>
              )}
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1f1b14] mt-0.5">
              {day.dayOfWeek}, {day.date}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#fcf2e6] border border-[#dfc0b7] text-[#58423c] font-bold text-sm flex items-center justify-center hover:bg-[#ffdbd1]"
          >
            ✕
          </button>
        </div>

        {/* ─── Adherence & Telemetry Banner ─── */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="p-3 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] text-center">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">
              Followed
            </span>
            <span className="text-xl font-serif font-bold text-[#a43716]">
              {day.percentage}%
            </span>
            <span className="text-[10px] text-[#58423c] block">
              {day.completedItems}/{day.totalItems} Done
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#e0f2fe]/60 border border-[#0284c7]/30 text-center">
            <span className="text-[10px] font-mono font-bold uppercase text-[#0369a1] block">
              Hydration
            </span>
            <span className="text-xl font-serif font-bold text-[#0369a1]">
              {day.waterMl}
            </span>
            <span className="text-[10px] text-[#0369a1] block">
              ml logged
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#f7faef] border border-[#52652a]/30 text-center">
            <span className="text-[10px] font-mono font-bold uppercase text-[#52652a] block">
              Steps Cadence
            </span>
            <span className="text-xl font-serif font-bold text-[#52652a]">
              {day.steps.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#52652a] block">
              daily steps
            </span>
          </div>
        </div>

        {/* ─── Off-Plan / Different Meals Audit ─── */}
        {day.differentMeals && day.differentMeals.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#ffdad6]/40 border border-[#ba1a1a]/30 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-[#ba1a1a] font-mono">
              <span className="flex items-center gap-1.5">
                <span>⚡</span>
                <span>Different / Off-Plan Meals ({day.differentMeals.length})</span>
              </span>
              <span>+{day.differentMeals.reduce((acc, m) => acc + (m.calories || 0), 0)} kcal</span>
            </div>
            <div className="divide-y divide-[#ba1a1a]/20 text-xs">
              {day.differentMeals.map((dm) => (
                <div key={dm.id} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#1f1b14] truncate">{dm.title}</span>
                  <span className="font-mono font-bold text-[#ba1a1a] shrink-0">+{dm.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Change Audit Notification ─── */}
        {day.hasChanges && (!day.differentMeals || day.differentMeals.length === 0) && (
          <div className="p-3.5 rounded-2xl bg-[#fff5f2] border border-[#a43716]/30 space-y-1.5 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#a43716] font-mono">
              <span>🔄</span>
              <span>Modifications &amp; Protocol Shifts Recorded ({day.changes.length})</span>
            </div>
            <ul className="text-xs text-[#58423c] space-y-1 pl-4 list-disc">
              {day.changes.map((ch, idx) => (
                <li key={idx} className="leading-snug">{ch}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ─── Scheduled Items Stream ─── */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">
            Occurrences &amp; Habits ({day.items.length})
          </span>

          {day.items.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#fcf2e6]/50 border border-[#dfc0b7] text-xs text-[#58423c] text-center">
              No occurrences scheduled for this calendar date.
            </div>
          ) : (
            day.items.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  item.status === "COMPLETED"
                    ? "bg-[#f7faef] border-[#52652a]/20"
                    : item.status === "REPLACED"
                    ? "bg-[#fff5f2] border-[#a43716]/30"
                    : "bg-[#fcf2e6]/40 border-[#dfc0b7]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#8b716a]">
                      {item.scheduledTime}
                    </span>
                    <span className="font-bold text-[#1f1b14]">{item.title}</span>
                  </div>

                  {item.isReplaced && item.replacementTitle && (
                    <span className="text-[10px] text-[#a43716] block mt-0.5 font-medium">
                      ↳ Swapped with: {item.replacementTitle}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-[10px] text-[#58423c] block mt-0.5 italic">
                      Note: {item.notes}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                    item.status === "COMPLETED"
                      ? "bg-[#d4eca2] text-[#3b4d14]"
                      : item.status === "REPLACED"
                      ? "bg-[#ffdbd1] text-[#a43716]"
                      : "bg-white text-[#8b716a] border border-[#dfc0b7]"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#dfc0b7] flex items-center justify-between text-[11px] text-[#8b716a] shrink-0 font-mono">
          <span>Ledger Hash: Immutable DB Record</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] text-[#1f1b14] font-bold hover:bg-[#ffdbd1]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
