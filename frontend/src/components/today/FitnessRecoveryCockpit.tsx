"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThreeFluidOrb } from "../3d/ThreeFluidOrb";
import { PhaseModal } from "./PhaseModal";

export interface FitnessRecoveryData {
  sleepHours: number;
  sleepQuality: "POOR" | "FAIR" | "GOOD" | "OPTIMAL";
  recoveryScore: number;
  sorenessLevel: "NONE" | "LOW" | "MILD" | "HIGH";
  electrolytesTaken: boolean;
  electrolytesTimeOfDay?: string;
  creatineTaken: boolean;
  creatineTimeOfDay?: string;
  magnesiumTaken: boolean;
  magnesiumTimeOfDay?: string;
  morningMobilityDone: boolean;
  postMealWalksCount: number;
}

export interface WinterArcData {
  phase: number;
  totalPhases?: number;
  phaseTitle: string;
  phaseSubtitle: string;
  theme?: string;
  physiqueMilestone?: string;
  daysRemainingInPhase: number;
  totalDurationDays?: number;
  progressPercent?: number;
  targetWeightKg?: number;
  currentWeightKg?: number;
  targetCalories?: number;
  dailyStepsTarget?: number;
  dailyWaterTargetMl?: number;
  startDate?: string;
  endDate?: string;
  isConfigured?: boolean;
  isPhaseTransitionDue?: boolean;
  phase2PreviewNotes?: string;
  nextPhasePreview?: any;
  allPhases?: Array<{
    phaseNumber: number;
    monthKey: string;
    title: string;
    theme: string;
    isCurrent: boolean;
    isCompleted: boolean;
  }>;
}

interface FitnessRecoveryCockpitProps {
  recovery?: FitnessRecoveryData | null;
  initialSteps?: number;
  initialWater?: number;
  winterArc?: WinterArcData | null;
  onRefresh?: () => void;
}

export function FitnessRecoveryCockpit({
  recovery,
  initialSteps = 0,
  initialWater = 0,
  winterArc,
  onRefresh,
}: FitnessRecoveryCockpitProps) {
  // Phase customization modal state
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);

  // Sliders state
  const [steps, setSteps] = useState<number>(initialSteps);
  const [stepsTimeOfDay, setStepsTimeOfDay] = useState<string>("EVENING");

  const [waterMl, setWaterMl] = useState<number>(initialWater);
  const [waterTimeOfDay, setWaterTimeOfDay] = useState<string>("AFTERNOON");

  // Recovery & Supplements state
  const [localRecovery, setLocalRecovery] = useState<FitnessRecoveryData>({
    sleepHours: recovery?.sleepHours ?? 7.5,
    sleepQuality: recovery?.sleepQuality ?? "OPTIMAL",
    recoveryScore: recovery?.recoveryScore ?? 85,
    sorenessLevel: recovery?.sorenessLevel ?? "LOW",
    electrolytesTaken: recovery?.electrolytesTaken ?? false,
    electrolytesTimeOfDay: recovery?.electrolytesTimeOfDay ?? "MORNING",
    creatineTaken: recovery?.creatineTaken ?? false,
    creatineTimeOfDay: recovery?.creatineTimeOfDay ?? "MORNING",
    magnesiumTaken: recovery?.magnesiumTaken ?? false,
    magnesiumTimeOfDay: recovery?.magnesiumTimeOfDay ?? "NIGHT",
    morningMobilityDone: recovery?.morningMobilityDone ?? false,
    postMealWalksCount: recovery?.postMealWalksCount ?? 0,
  });

  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "synced" | "manual_locked">("synced");
  const [lastLockedAt, setLastLockedAt] = useState<string | null>(null);

  // Sync with props
  useEffect(() => {
    if (initialSteps > 0 && steps === 0) setSteps(initialSteps);
  }, [initialSteps, steps]);

  useEffect(() => {
    if (initialWater > 0 && waterMl === 0) setWaterMl(initialWater);
  }, [initialWater, waterMl]);

  useEffect(() => {
    if (recovery) {
      setLocalRecovery((prev) => ({ ...prev, ...recovery }));
    }
  }, [recovery]);

  // Debounced auto-save timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPersist = (isManual: boolean = false) => {
    setSyncStatus("saving");
    fetch("/api/today/telemetry-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        steps,
        stepsTimeOfDay,
        waterIntakeMl: waterMl,
        waterTimeOfDay,
        recovery: localRecovery,
        isManualSubmit: isManual,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (isManual) {
            setSyncStatus("manual_locked");
            setLastLockedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          } else {
            setSyncStatus("synced");
          }
          if (data.recovery) {
            setLocalRecovery((prev) => ({ ...prev, ...data.recovery }));
          }
          if (onRefresh) onRefresh();
        }
      })
      .catch((err) => {
        console.error("Telemetry auto-commit error:", err);
        setSyncStatus("idle");
      });
  };

  // Auto-save whenever user drags sliders or toggles, so if they forget to submit, it commits automatically!
  const queueAutoSave = () => {
    setSyncStatus("saving");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      triggerPersist(false);
    }, 850);
  };

  // Steps drag handler
  const handleStepsChange = (val: number) => {
    setSteps(val);
    queueAutoSave();
  };

  // Water drag handler
  const handleWaterChange = (val: number) => {
    setWaterMl(val);
    queueAutoSave();
  };

  // Recovery patch handler
  const handleRecoveryPatch = (patch: Partial<FitnessRecoveryData>) => {
    setLocalRecovery((prev) => ({ ...prev, ...patch }));
    queueAutoSave();
  };

  const distanceKm = parseFloat((steps * 0.000762).toFixed(2));
  const caloriesBurned = Math.round(steps * 0.04);

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#dfc0b7] shadow-xs space-y-5">
      {/* ─── ACTIVE RUNNING PHASE HUD ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1f1b14] via-[#33241b] to-[#1f1b14] p-4 text-white shadow-sm border border-[#a43716]/30">
        {/* If new user / unconfigured phase: Show prompt banner */}
        {winterArc && winterArc.isConfigured === false && (
          <div className="mb-3 p-2.5 rounded-xl bg-[#a43716]/25 border border-[#a43716]/50 flex items-center justify-between gap-2.5 text-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎯</span>
              <div>
                <span className="font-bold text-[#ffdbd1] block">Welcome! Set Up Your Phase</span>
                <span className="text-[10px] text-white/80">Configure your target completion date, calories, and goals.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPhaseModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-[#a43716] hover:bg-[#83260c] text-white font-bold text-[10px] shrink-0 transition-all shadow-xs"
            >
              Set Up Now
            </button>
          </div>
        )}

        {/* Phase Header: Title + Change Phase Action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a43716] animate-pulse shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffdbd1] truncate">
              {winterArc?.phaseTitle || "Phase 1 — Winter Arc"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono font-bold bg-[#a43716] px-2 py-0.5 rounded-full text-white whitespace-nowrap">
              {winterArc?.daysRemainingInPhase ?? 30} Days Remaining
            </span>

            {/* Change Phase Button */}
            <button
              type="button"
              onClick={() => setIsPhaseModalOpen(true)}
              className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white font-bold text-[10px] flex items-center gap-1 transition-all active:scale-95"
              title="Change active running phase"
            >
              <span>⚙️</span>
              <span>Change Phase</span>
            </button>
          </div>
        </div>

        {/* Phase Body: Focus Subtitle & Daily Targets */}
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-serif font-bold text-white truncate">
              {winterArc?.phaseSubtitle || "Current Running Phase"}
            </h3>
            <p className="text-[11px] text-white/70 mt-0.5">
              Goal: {winterArc?.targetWeightKg || 72}kg Target • {winterArc?.dailyStepsTarget?.toLocaleString() || "8,000"} daily steps • {winterArc?.targetCalories || 1600} kcal
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] font-mono uppercase text-white/60 block whitespace-nowrap">Transformation</span>
            <span className="text-xs font-mono font-bold text-[#d4eca2] whitespace-nowrap">
              {winterArc?.theme || "Consistency & Discipline"}
            </span>
          </div>
        </div>

        {/* Phase progress bar */}
        {winterArc && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#a43716] to-[#d4eca2] transition-all duration-700"
                style={{
                  width: `${winterArc.progressPercent !== undefined ? Math.max(5, winterArc.progressPercent) : 50}%`,
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-white/70 shrink-0">
              {winterArc.progressPercent !== undefined ? `${winterArc.progressPercent}% Completed` : `Phase 1`}
            </span>
          </div>
        )}

        <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-white/75 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/analytics"
              className="text-[#ffdbd1] hover:underline flex items-center gap-1 font-bold"
            >
              <span>Open AI Retrospective &amp; Analytics</span>
              <span>❯</span>
            </Link>
            {winterArc?.endDate && (
              <span className="text-white/50 text-[9px] font-mono hidden sm:inline">
                • Target End: {winterArc.endDate}
              </span>
            )}
          </div>
          <span className="text-[#d4eca2] font-mono text-[9px] font-bold">Schedulfy Routine OS</span>
        </div>
      </div>

      {/* ─── DRAG SLIDER 1: STEPS & TIME OF DAY ─── */}
      <div className="p-4 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716] block">
              Movement Drag Slider
            </span>
            <h4 className="text-xs font-serif font-bold text-[#1f1b14]">
              Steps &amp; Time of Day
            </h4>
          </div>

          <div className="text-right font-mono">
            <span className="text-base font-bold text-[#1f1b14]">{steps.toLocaleString()}</span>
            <span className="text-[11px] text-[#58423c] ml-1">/ 8,000 target</span>
          </div>
        </div>

        {/* Tactile Range Drag Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="20000"
            step="250"
            value={steps}
            onChange={(e) => handleStepsChange(Number(e.target.value))}
            className="w-full h-2.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#a43716] border border-[#dfc0b7]"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8b716a]">
            <span>0</span>
            <span>5k</span>
            <span>8k (Goal)</span>
            <span>12k</span>
            <span>20k</span>
          </div>
        </div>

        {/* Step Telemetry & Time Slot Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#dfc0b7]/60">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#58423c]">📍 {distanceKm} km</span>
            <span className="text-[#a43716] font-semibold">🔥 {caloriesBurned} kcal</span>
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: "MORNING", label: "🌅 Morning" },
              { id: "AFTERNOON", label: "☀️ Aft" },
              { id: "EVENING", label: "🌆 Eve" },
              { id: "NIGHT", label: "🌙 Night" },
            ].map((slot) => {
              const active = stepsTimeOfDay === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setStepsTimeOfDay(slot.id);
                    queueAutoSave();
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                    active
                      ? "bg-[#a43716] text-white border-[#a43716] shadow-2xs"
                      : "bg-white text-[#58423c] border-[#dfc0b7] hover:bg-[#faebd9]"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── DRAG SLIDER 2: WATER INTAKE & TIME OF DAY ─── */}
      <div className="p-4 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ThreeFluidOrb
              level={Math.min(100, Math.round((waterMl / 3000) * 100))}
              size={56}
              color="#0284c7"
            />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0284c7] block">
                3D Hydration Fluid Tank
              </span>
              <h4 className="text-xs font-serif font-bold text-[#1f1b14]">
                Water Intake &amp; Time Slot
              </h4>
            </div>
          </div>

          <div className="text-right font-mono shrink-0">
            <span className="text-base font-bold text-[#0284c7]">{waterMl.toLocaleString()}</span>
            <span className="text-[11px] text-[#58423c] ml-1">/ 3,000 ml</span>
          </div>
        </div>

        {/* Water Range Drag Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={waterMl}
            onChange={(e) => handleWaterChange(Number(e.target.value))}
            className="w-full h-2.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#0284c7] border border-[#dfc0b7]"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8b716a]">
            <span>0</span>
            <span>1.5L</span>
            <span>3L (Target)</span>
            <span>4L</span>
            <span>5L</span>
          </div>
        </div>

        {/* Quick Water Time Slot Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#dfc0b7]/60">
          <div className="text-xs font-mono text-[#58423c]">
            💧 {((waterMl / 3000) * 100).toFixed(0)}% Hydrated
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: "MORNING", label: "🌅 Wakeup" },
              { id: "AFTERNOON", label: "☀️ Mid-day" },
              { id: "EVENING", label: "🌆 Evening" },
              { id: "NIGHT", label: "🌙 Night" },
            ].map((slot) => {
              const active = waterTimeOfDay === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setWaterTimeOfDay(slot.id);
                    queueAutoSave();
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                    active
                      ? "bg-[#0284c7] text-white border-[#0284c7] shadow-2xs"
                      : "bg-white text-[#58423c] border-[#dfc0b7] hover:bg-[#faebd9]"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MICRONUTRIENTS & SUPPLEMENTS WITH TIMING ─── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a]">
            Daily Micronutrients &amp; Non-Gym Saturation
          </span>
          <span className="text-[10px] font-mono text-[#52652a] font-semibold">
            {localRecovery.recoveryScore}% Readiness
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Creatine */}
          <div className="p-3 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRecoveryPatch({ creatineTaken: !localRecovery.creatineTaken })}
                className="flex items-center gap-1.5 font-bold text-left"
              >
                <span>⚡</span>
                <span className={localRecovery.creatineTaken ? "text-[#52652a]" : "text-[#1f1b14]"}>
                  Creatine (5g)
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleRecoveryPatch({ creatineTaken: !localRecovery.creatineTaken })}
                className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                  localRecovery.creatineTaken ? "bg-[#52652a] text-white border-[#52652a]" : "bg-white border-[#dfc0b7]"
                }`}
              >
                {localRecovery.creatineTaken ? "✓" : ""}
              </button>
            </div>
            <div className="flex items-center gap-1">
              {["MORNING", "POST_WORKOUT", "NIGHT"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleRecoveryPatch({ creatineTimeOfDay: t, creatineTaken: true })}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    localRecovery.creatineTimeOfDay === t && localRecovery.creatineTaken
                      ? "bg-[#52652a] text-white"
                      : "bg-white/80 text-[#58423c] border border-[#dfc0b7]"
                  }`}
                >
                  {t === "POST_WORKOUT" ? "Post" : t === "MORNING" ? "Morn" : "Night"}
                </button>
              ))}
            </div>
          </div>

          {/* Electrolytes */}
          <div className="p-3 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRecoveryPatch({ electrolytesTaken: !localRecovery.electrolytesTaken })}
                className="flex items-center gap-1.5 font-bold text-left"
              >
                <span>🧂</span>
                <span className={localRecovery.electrolytesTaken ? "text-[#52652a]" : "text-[#1f1b14]"}>
                  Pink Salt/Lime
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleRecoveryPatch({ electrolytesTaken: !localRecovery.electrolytesTaken })}
                className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                  localRecovery.electrolytesTaken ? "bg-[#52652a] text-white border-[#52652a]" : "bg-white border-[#dfc0b7]"
                }`}
              >
                {localRecovery.electrolytesTaken ? "✓" : ""}
              </button>
            </div>
            <div className="flex items-center gap-1">
              {["MORNING", "AFTERNOON"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleRecoveryPatch({ electrolytesTimeOfDay: t, electrolytesTaken: true })}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    localRecovery.electrolytesTimeOfDay === t && localRecovery.electrolytesTaken
                      ? "bg-[#52652a] text-white"
                      : "bg-white/80 text-[#58423c] border border-[#dfc0b7]"
                  }`}
                >
                  {t === "MORNING" ? "Wakeup" : "Mid-day"}
                </button>
              ))}
            </div>
          </div>

          {/* Magnesium */}
          <div className="p-3 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRecoveryPatch({ magnesiumTaken: !localRecovery.magnesiumTaken })}
                className="flex items-center gap-1.5 font-bold text-left"
              >
                <span>💊</span>
                <span className={localRecovery.magnesiumTaken ? "text-[#52652a]" : "text-[#1f1b14]"}>
                  Magnesium (400mg)
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleRecoveryPatch({ magnesiumTaken: !localRecovery.magnesiumTaken })}
                className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                  localRecovery.magnesiumTaken ? "bg-[#52652a] text-white border-[#52652a]" : "bg-white border-[#dfc0b7]"
                }`}
              >
                {localRecovery.magnesiumTaken ? "✓" : ""}
              </button>
            </div>
            <div className="flex items-center gap-1">
              {["PRE_BED", "NIGHT"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleRecoveryPatch({ magnesiumTimeOfDay: t, magnesiumTaken: true })}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    localRecovery.magnesiumTimeOfDay === t && localRecovery.magnesiumTaken
                      ? "bg-[#52652a] text-white"
                      : "bg-white/80 text-[#58423c] border border-[#dfc0b7]"
                  }`}
                >
                  {t === "PRE_BED" ? "30m Bed" : "Bedtime"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SLEEP REST & SORENESS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Sleep Slider */}
        <div className="p-3 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#58423c]">Sleep Duration</span>
            <span className="font-mono font-bold text-sm text-[#1f1b14]">{localRecovery.sleepHours} hrs</span>
          </div>
          <input
            type="range"
            min="4"
            max="12"
            step="0.5"
            value={localRecovery.sleepHours}
            onChange={(e) => handleRecoveryPatch({ sleepHours: Number(e.target.value) })}
            className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-[#52652a] border border-[#dfc0b7]"
          />
        </div>

        {/* DOMS & Muscle Soreness */}
        <div className="p-3 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase text-[#58423c] block">Muscle Soreness</span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: "NONE", label: "Fresh", color: "bg-[#d4eca2]/70 text-[#141f00]" },
              { id: "LOW", label: "Mild", color: "bg-[#fef3c7] text-[#b45309]" },
              { id: "HIGH", label: "High", color: "bg-[#ffdad6] text-[#93000a]" },
            ].map((lvl) => {
              const active = localRecovery.sorenessLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => handleRecoveryPatch({ sorenessLevel: lvl.id as any })}
                  className={`py-1 rounded-md text-[10px] font-bold border transition-all ${
                    active ? `${lvl.color} border-current shadow-2xs font-extrabold` : "bg-white text-[#58423c] border-[#dfc0b7]"
                  }`}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── SUBMIT AT DAY END & AUTO-COMMIT BADGE ─── */}
      <div className="pt-2 border-t border-[#dfc0b7]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {syncStatus === "saving" && (
            <span className="text-xs font-mono font-semibold text-[#a43716] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a43716] animate-ping" />
              Auto-syncing to DB...
            </span>
          )}
          {syncStatus === "synced" && (
            <span className="text-xs font-mono font-semibold text-[#52652a] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#52652a]" />
              Auto-synced to DB (Safe if forgotten)
            </span>
          )}
          {syncStatus === "manual_locked" && (
            <span className="text-xs font-mono font-bold text-[#52652a] flex items-center gap-1.5 bg-[#d4eca2]/50 px-2.5 py-1 rounded-lg">
              ✓ Day End Locked in DB at {lastLockedAt}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={syncStatus === "saving"}
          onClick={() => triggerPersist(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {syncStatus === "saving" ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Locking in DB...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Submit Day End Telemetry &amp; Lock in DB</span>
            </>
          )}
        </button>
      </div>

      {/* User-Defined Phase Customization Modal */}
      <PhaseModal
        isOpen={isPhaseModalOpen}
        onClose={() => setIsPhaseModalOpen(false)}
        currentPhase={winterArc}
        onSaved={() => {
          if (onRefresh) onRefresh();
        }}
        isNewUser={winterArc?.isConfigured === false}
      />
    </div>
  );
}
