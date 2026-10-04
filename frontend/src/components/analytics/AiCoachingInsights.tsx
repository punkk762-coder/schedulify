"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface AiCoachingInsightsProps {
  insights?: string[];
  adherence: number;
}

export function AiCoachingInsights({
  insights = [],
  adherence,
}: AiCoachingInsightsProps) {
  const router = useRouter();

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[#dfc0b7] bg-[#fcf2e6] shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h4 className="text-sm font-serif font-bold text-[#1f1b14]">
              AI Solstice Coach Observations
            </h4>
            <p className="text-[11px] text-[#52652a] font-medium">
              Behavioral Pattern Recognition Active
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#a43716]/10 text-[#a43716] border border-[#a43716]/20">
          Precision Insights
        </span>
      </div>

      {/* Dynamic Insights list */}
      <div className="space-y-2.5">
        {insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-[#58423c] leading-relaxed bg-white/70 p-3 rounded-xl border border-[#dfc0b7]"
            >
              <span className="text-[#a43716] font-bold mt-0.5">✦</span>
              <span>{insight}</span>
            </div>
          ))
        ) : (
          <div className="flex items-start gap-2 text-xs text-[#58423c] bg-white/70 p-3 rounded-xl border border-[#dfc0b7]">
            <span className="text-[#52652a] font-bold">✓</span>
            <span>
              Consistent execution detected. Continue logging daily occurrences to refine longitudinal biometrics.
            </span>
          </div>
        )}
      </div>

      {/* Action to Chat */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-[#8b716a]">
          Want to adapt next week&apos;s meal split or workout intensity based on these numbers?
        </p>

        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="btn-spring shrink-0 px-4 py-2 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <span>Consult AI Coach</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
