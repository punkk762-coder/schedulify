"use client";

import React from "react";

interface DailyGoalItem {
  name: string;
  target: number;
  unit: string;
  current: number;
  status: string;
}

interface BodyStatusTelemetry {
  metabolicState: string;
  proteinAdherencePct: number;
  proteinTarget: number;
  averageProtein: number;
  hydrationTargetMl: number;
  estimatedWeeklyDeficitKcal: number;
  monthlyProjection: string;
}

interface DailyGoalsAndBodyStatusProps {
  dailyGoals?: DailyGoalItem[];
  bodyStatus?: BodyStatusTelemetry;
}

export const DailyGoalsAndBodyStatus: React.FC<DailyGoalsAndBodyStatusProps> = ({
  dailyGoals = [],
  bodyStatus,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Daily Goals Tracker (6 cols) */}
      <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-[#dfc0b7] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716] block">
                Daily Goal Matrix
              </span>
              <h3 className="text-base font-serif font-bold text-[#1f1b14]">
                Prescribed Target Standards
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#fcf2e6] text-[#52652a] border border-[#dfc0b7]">
              4 Active Goals
            </span>
          </div>

          <div className="mt-4 space-y-3.5">
            {dailyGoals.map((goal, idx) => {
              const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
              return (
                <div key={idx} className="p-3 rounded-xl bg-[#fcf2e6]/50 border border-[#dfc0b7]/70">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#1f1b14]">{goal.name}</span>
                    <span className="font-mono text-xs font-bold text-[#58423c]">
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-[#dfc0b7]/60">
                    <div
                      className="h-2 rounded-full transition-all duration-700 bg-[#a43716]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#58423c]">
                    <span>Fulfillment: {pct}%</span>
                    <span className="font-bold text-[#52652a]">{goal.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Current Status of Body & Monthly Telemetry (6 cols) */}
      <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-[#dfc0b7] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52652a] block">
                Biometric State
              </span>
              <h3 className="text-base font-serif font-bold text-[#1f1b14]">
                Current Body Status Telemetry
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#d4eca2] text-[#3b4d14] border border-[#52652a]/30">
              Live Evaluation
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {/* Metabolic Mode */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7]">
              <div className="w-9 h-9 rounded-xl bg-[#ffdbd1] text-[#a43716] flex items-center justify-center font-bold text-base shrink-0">
                ⚡
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#58423c] block font-mono">
                  Metabolic State
                </span>
                <span className="text-xs font-bold text-[#1f1b14] block">
                  {bodyStatus?.metabolicState || "Pending Routine Log"}
                </span>
              </div>
            </div>

            {/* Protein Muscle Retention */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#dfc0b7]">
              <div className="w-9 h-9 rounded-xl bg-[#d4eca2] text-[#52652a] flex items-center justify-center font-bold text-base shrink-0">
                🥩
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#58423c] font-mono">
                    Muscle Protein Synthesis
                  </span>
                  <span className="text-xs font-mono font-bold text-[#52652a]">
                    {bodyStatus?.averageProtein ?? 0}g / 150g
                  </span>
                </div>
                <p className="text-[11px] text-[#58423c] mt-0.5">
                  {(bodyStatus?.averageProtein ?? 0) >= 120
                    ? "Consistent anabolic threshold maintained throughout active timeline."
                    : (bodyStatus?.averageProtein ?? 0) > 0
                    ? "Progressing towards daily target threshold."
                    : "Awaiting meal completions for daily synthesis calculation."}
                </p>
              </div>
            </div>

            {/* End of Month Predictive Horizon */}
            <div className="p-3.5 rounded-xl bg-[#f7faef] border border-[#52652a]/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
                <span className="text-[10px] uppercase font-bold text-[#52652a] font-mono tracking-wider">
                  End of Month Trajectory
                </span>
              </div>
              <p className="text-xs text-[#1f1b14] leading-relaxed">
                {bodyStatus?.monthlyProjection ||
                  "Awaiting initial occurrence completions to project monthly trajectory."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
