"use client";

import React from "react";

interface RoutineItemEvolution {
  title: string;
  category: string;
  status: string;
  adherencePct: number;
  notes: string;
}

interface MonthlyEvolutionCardProps {
  unchanged?: RoutineItemEvolution[];
  changed?: RoutineItemEvolution[];
}

export const MonthlyEvolutionCard: React.FC<MonthlyEvolutionCardProps> = ({
  unchanged = [],
  changed = [],
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#dfc0b7] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#dfc0b7] gap-2">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716] block">
            Longitudinal Routine Stability
          </span>
          <h3 className="text-base font-serif font-bold text-[#1f1b14]">
            Monthly Schedule Evolution &amp; Historical Immutability
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fcf2e6] border border-[#dfc0b7] text-[10px] font-mono font-semibold text-[#58423c] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#52652a]" />
          <span>Historical Occurrences Preserved (0% Data Loss)</span>
        </div>
      </div>

      <p className="text-xs text-[#58423c] mt-2.5">
        When schedules evolve or meal swaps occur, historical completions and recorded nutrition remain immutable. Below is the monthly ledger of constant foundations versus dynamic routine adaptations:
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Left Column: What Remained Constant (Unchanged Foundations) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#52652a]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#52652a] font-mono">
              Constant Pillars (Unchanged • {unchanged.length})
            </h4>
          </div>

          {unchanged.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[#fcf2e6]/50 border border-[#dfc0b7] text-xs text-[#58423c]">
              All items are undergoing active horizon adaptation.
            </div>
          ) : (
            <div className="space-y-2">
              {unchanged.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#f7faef] border border-[#52652a]/20 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1f1b14]">{item.title}</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-white text-[#58423c] border border-[#dfc0b7]">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#52652a] block mt-0.5">{item.notes}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#52652a] shrink-0">
                    {item.adherencePct}% Done
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: What Changed / Adapted */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a43716]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#a43716] font-mono">
              Dynamic Adaptations (Substitutions &amp; Adjustments • {changed.length})
            </h4>
          </div>

          {changed.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[#fcf2e6]/50 border border-[#dfc0b7] text-xs text-[#58423c]">
              No protocol substitutions recorded in this cycle window.
            </div>
          ) : (
            <div className="space-y-2">
              {changed.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#fff5f2] border border-[#a43716]/20 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1f1b14]">{item.title}</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-[#ffdbd1] text-[#a43716]">
                        {item.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#58423c] block mt-0.5">{item.notes}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#a43716] shrink-0">
                    {item.adherencePct}% Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
