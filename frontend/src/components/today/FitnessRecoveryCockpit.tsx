"use client";

import React, { useState } from "react";

export interface FitnessRecoveryData {
  sleepHours: number;
  sleepQuality: "POOR" | "FAIR" | "GOOD" | "OPTIMAL";
  recoveryScore: number;
  sorenessLevel: "NONE" | "LOW" | "MILD" | "HIGH";
  electrolytesTaken: boolean;
  creatineTaken: boolean;
  magnesiumTaken: boolean;
  morningMobilityDone: boolean;
  postMealWalksCount: number;
}

interface FitnessRecoveryCockpitProps {
  recovery?: FitnessRecoveryData | null;
  onUpdateRecovery?: (data: Partial<FitnessRecoveryData>) => void;
}

export function FitnessRecoveryCockpit({
  recovery,
  onUpdateRecovery,
}: FitnessRecoveryCockpitProps) {
  const [localData, setLocalData] = useState<FitnessRecoveryData>({
    sleepHours: recovery?.sleepHours ?? 7.5,
    sleepQuality: recovery?.sleepQuality ?? "OPTIMAL",
    recoveryScore: recovery?.recoveryScore ?? 85,
    sorenessLevel: recovery?.sorenessLevel ?? "LOW",
    electrolytesTaken: recovery?.electrolytesTaken ?? false,
    creatineTaken: recovery?.creatineTaken ?? false,
    magnesiumTaken: recovery?.magnesiumTaken ?? false,
    morningMobilityDone: recovery?.morningMobilityDone ?? false,
    postMealWalksCount: recovery?.postMealWalksCount ?? 0,
  });

  const [saving, setSaving] = useState(false);

  // Sync with prop when updated externally
  React.useEffect(() => {
    if (recovery) {
      setLocalData((prev) => ({ ...prev, ...recovery }));
    }
  }, [recovery]);

  const handlePatch = async (patch: Partial<FitnessRecoveryData>) => {
    const updated = { ...localData, ...patch };
    setLocalData(updated);
    if (onUpdateRecovery) {
      onUpdateRecovery(patch);
    }

    try {
      setSaving(true);
      await fetch("/api/today/fitness-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch (err) {
      console.error("Failed to sync fitness recovery telemetry:", err);
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#52652a] bg-[#d4eca2]/60 border-[#52652a]/30";
    if (score >= 60) return "text-[#b45309] bg-[#fef3c7] border-[#f59e0b]/30";
    return "text-[#93000a] bg-[#ffdad6] border-[#ba1a1a]/30";
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#dfc0b7] shadow-xs space-y-4">
      {/* ─── Header: Non-Gym Fitness & Recovery Cockpit ─── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]/70">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52652a]">
              Fitness Beyond The Gym
            </span>
          </div>
          <h4 className="text-sm font-serif font-bold text-[#1f1b14]">
            Recovery, NEAT &amp; Bio-Hygiene
          </h4>
        </div>

        <div
          className={`px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${getScoreColor(
            localData.recoveryScore
          )}`}
        >
          <span>⚡</span>
          <span>{localData.recoveryScore}% Readiness</span>
        </div>
      </div>

      {/* ─── PILLAR 1: Sleep Duration & Muscle Soreness ─── */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Sleep Hours */}
        <div className="p-3 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#58423c]">
              Sleep Rest
            </span>
            <span className="text-xs">🌙</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                handlePatch({ sleepHours: Math.max(4, parseFloat((localData.sleepHours - 0.5).toFixed(1))) })
              }
              className="w-6 h-6 rounded-lg bg-white border border-[#dfc0b7] text-[#1f1b14] font-bold text-xs hover:bg-[#faebd9] flex items-center justify-center active:scale-90"
            >
              -
            </button>
            <div className="text-center font-mono">
              <span className="text-base font-bold text-[#1f1b14]">{localData.sleepHours}</span>
              <span className="text-[10px] text-[#58423c] ml-1">hrs</span>
            </div>
            <button
              type="button"
              onClick={() =>
                handlePatch({ sleepHours: Math.min(12, parseFloat((localData.sleepHours + 0.5).toFixed(1))) })
              }
              className="w-6 h-6 rounded-lg bg-white border border-[#dfc0b7] text-[#1f1b14] font-bold text-xs hover:bg-[#faebd9] flex items-center justify-center active:scale-90"
            >
              +
            </button>
          </div>
        </div>

        {/* DOMS & Muscle Soreness */}
        <div className="p-3 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#58423c]">
              Muscle Soreness
            </span>
            <span className="text-xs">🩹</span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-0.5">
            {[
              { id: "NONE", label: "Fresh", color: "text-[#52652a] bg-[#d4eca2]/60" },
              { id: "LOW", label: "Mild", color: "text-[#b45309] bg-[#fef3c7]" },
              { id: "HIGH", label: "High", color: "text-[#93000a] bg-[#ffdad6]" },
            ].map((lvl) => {
              const active = localData.sorenessLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => handlePatch({ sorenessLevel: lvl.id as "NONE" | "LOW" | "HIGH" })}
                  className={`py-1 rounded-md text-[10px] font-bold border transition-all ${
                    active
                      ? `${lvl.color} border-current font-extrabold shadow-2xs scale-102`
                      : "bg-white text-[#58423c] border-[#dfc0b7]/70 hover:bg-[#faebd9]"
                  }`}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── PILLAR 2: Daily Essential Supplement Stack (Non-Gym) ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a]">
            Daily Micronutrient &amp; Saturation Stack
          </span>
          <span className="text-[10px] font-mono text-[#52652a]">Essential Health</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Creatine */}
          <button
            type="button"
            onClick={() => handlePatch({ creatineTaken: !localData.creatineTaken })}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              localData.creatineTaken
                ? "bg-[#d4eca2]/50 border-[#52652a] text-[#141f00] font-bold shadow-2xs"
                : "bg-[#fcf2e6] border-[#dfc0b7] text-[#1f1b14] hover:bg-[#faebd9]"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold flex items-center gap-1">
                <span>⚡</span> Creatine (5g)
              </div>
              <div className="text-[9px] text-[#58423c] mt-0.5">Cellular ATP</div>
            </div>
            <span
              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                localData.creatineTaken
                  ? "bg-[#52652a] text-white border-[#52652a]"
                  : "bg-white border-[#dfc0b7]"
              }`}
            >
              {localData.creatineTaken ? "✓" : ""}
            </span>
          </button>

          {/* Morning Electrolytes */}
          <button
            type="button"
            onClick={() => handlePatch({ electrolytesTaken: !localData.electrolytesTaken })}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              localData.electrolytesTaken
                ? "bg-[#d4eca2]/50 border-[#52652a] text-[#141f00] font-bold shadow-2xs"
                : "bg-[#fcf2e6] border-[#dfc0b7] text-[#1f1b14] hover:bg-[#faebd9]"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold flex items-center gap-1">
                <span>🧂</span> Electrolytes
              </div>
              <div className="text-[9px] text-[#58423c] mt-0.5">Pink Salt/Lime</div>
            </div>
            <span
              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                localData.electrolytesTaken
                  ? "bg-[#52652a] text-white border-[#52652a]"
                  : "bg-white border-[#dfc0b7]"
              }`}
            >
              {localData.electrolytesTaken ? "✓" : ""}
            </span>
          </button>

          {/* Night Magnesium */}
          <button
            type="button"
            onClick={() => handlePatch({ magnesiumTaken: !localData.magnesiumTaken })}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              localData.magnesiumTaken
                ? "bg-[#d4eca2]/50 border-[#52652a] text-[#141f00] font-bold shadow-2xs"
                : "bg-[#fcf2e6] border-[#dfc0b7] text-[#1f1b14] hover:bg-[#faebd9]"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold flex items-center gap-1">
                <span>💊</span> Magnesium
              </div>
              <div className="text-[9px] text-[#58423c] mt-0.5">Delta Sleep</div>
            </div>
            <span
              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                localData.magnesiumTaken
                  ? "bg-[#52652a] text-white border-[#52652a]"
                  : "bg-white border-[#dfc0b7]"
              }`}
            >
              {localData.magnesiumTaken ? "✓" : ""}
            </span>
          </button>
        </div>
      </div>

      {/* ─── PILLAR 3: Post-Meal Digestion Walks & Joint Mobility ─── */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#dfc0b7]/60">
        {/* Post-Meal Strolls (Glucose Blunting) */}
        <div className="p-3 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#58423c] block">
              Post-Meal Walks
            </span>
            <div className="text-xs font-semibold text-[#1f1b14] mt-0.5">
              {localData.postMealWalksCount} recorded
            </div>
            <div className="text-[9px] text-[#52652a] font-medium">-30% Glucose Spike</div>
          </div>
          <button
            type="button"
            onClick={() => handlePatch({ postMealWalksCount: localData.postMealWalksCount + 1 })}
            className="px-2.5 py-1.5 rounded-lg bg-[#a43716] hover:bg-[#862201] text-white font-bold text-[10px] active:scale-95 shadow-xs"
          >
            +1 Walk
          </button>
        </div>

        {/* 5-Min Morning Mobility & Posture Decompression */}
        <button
          type="button"
          onClick={() => handlePatch({ morningMobilityDone: !localData.morningMobilityDone })}
          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
            localData.morningMobilityDone
              ? "bg-[#d4eca2]/50 border-[#52652a] text-[#141f00] font-bold shadow-2xs"
              : "bg-[#fcf2e6] border-[#dfc0b7] text-[#1f1b14] hover:bg-[#faebd9]"
          }`}
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#58423c] block">
              Joint Mobility
            </span>
            <div className="text-xs font-semibold mt-0.5">5-Min Decompression</div>
            <div className="text-[9px] text-[#58423c]">Cat-cow &amp; Hip flexors</div>
          </div>
          <span
            className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold shrink-0 ml-1 ${
              localData.morningMobilityDone
                ? "bg-[#52652a] text-white border-[#52652a]"
                : "bg-white border-[#dfc0b7]"
            }`}
          >
            {localData.morningMobilityDone ? "✓" : ""}
          </span>
        </button>
      </div>
    </div>
  );
}
