"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import type { WinterArcData } from "./FitnessRecoveryCockpit";

interface PhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhase?: WinterArcData | null;
  onSaved: () => void;
  isNewUser?: boolean;
}

export function PhaseModal({
  isOpen,
  onClose,
  currentPhase,
  onSaved,
  isNewUser = false,
}: PhaseModalProps) {
  const toast = useToast();

  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getDefaultEndStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [theme, setTheme] = useState("Consistency & Discipline");
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getDefaultEndStr());
  const [targetWeightKg, setTargetWeightKg] = useState<number | string>(72);
  const [currentWeightKg, setCurrentWeightKg] = useState<number | string>(74);
  const [targetCalories, setTargetCalories] = useState<number | string>(1600);
  const [dailyStepsTarget, setDailyStepsTarget] = useState<number | string>(8000);
  const [dailyWaterTargetMl, setDailyWaterTargetMl] = useState<number | string>(3000);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentPhase) {
        setName(currentPhase.phaseTitle || "Phase 1 — Winter Arc");
        setSubtitle(currentPhase.phaseSubtitle || "Foundation & Consistency");
        setTheme(currentPhase.theme || "Consistency & Discipline");
        setStartDate(currentPhase.startDate || getTodayStr());
        setEndDate(currentPhase.endDate || getDefaultEndStr());
        setTargetWeightKg(currentPhase.targetWeightKg ?? 72);
        setCurrentWeightKg(currentPhase.currentWeightKg ?? 74);
        setTargetCalories(currentPhase.targetCalories ?? 1600);
        setDailyStepsTarget(currentPhase.dailyStepsTarget ?? 8000);
        setDailyWaterTargetMl(currentPhase.dailyWaterTargetMl ?? 3000);
      } else {
        setName("Phase 1 — Winter Arc");
        setSubtitle("Foundation & Consistency");
        setTheme("Consistency & Discipline");
        setStartDate(getTodayStr());
        setEndDate(getDefaultEndStr());
        setTargetWeightKg(72);
        setCurrentWeightKg(74);
        setTargetCalories(1600);
        setDailyStepsTarget(8000);
        setDailyWaterTargetMl(3000);
      }
    }
  }, [isOpen, currentPhase]);

  if (!isOpen) return null;

  // Compute preview days
  const startD = new Date(`${startDate}T00:00:00`);
  const endD = new Date(`${endDate}T23:59:59`);
  const diffDays = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
  const todayD = new Date();
  const daysLeft = Math.max(0, Math.ceil((endD.getTime() - todayD.getTime()) / (1000 * 60 * 60 * 24)));

  const handleSetQuickDuration = (days: number) => {
    const d = new Date(startDate || getTodayStr());
    d.setDate(d.getDate() + days);
    setEndDate(d.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a phase title", "Validation");
      return;
    }
    if (!endDate) {
      toast.error("Please select a completion date", "Validation");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subtitle: subtitle.trim(),
          theme: theme.trim(),
          startDate,
          endDate,
          targetWeightKg: Number(targetWeightKg) || 72,
          currentWeightKg: Number(currentWeightKg) || 74,
          targetCalories: Number(targetCalories) || 1600,
          dailyStepsTarget: Number(dailyStepsTarget) || 8000,
          dailyWaterTargetMl: Number(dailyWaterTargetMl) || 3000,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save phase");
      }

      toast.success(
        `Active Phase configured: "${name.trim()}" (${daysLeft} days remaining) 🎯`,
        "Phase Activated"
      );
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update phase", "Save Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#fffdfa] rounded-3xl border border-[#dfc0b7] shadow-2xl p-6 text-[#1f1b14] space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#dfc0b7]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a43716] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
                {isNewUser ? "✨ First Time Setup" : "⚡ Customize Phase"}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1f1b14] mt-0.5">
              {isNewUser ? "Set Up Your Initial Routine Phase" : "Set Active Running Phase"}
            </h2>
            <p className="text-xs text-[#58423c] mt-0.5">
              Configure your phase name, target completion date, and biometric milestones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#fcf2e6] hover:bg-[#dfc0b7] text-[#58423c] flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Phase Title & Quick Presets */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#1f1b14] block">Phase Title / Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Phase 1 — Hypertrophy & Fat Loss"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#52652a]"
              required
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "Phase 1 — Winter Arc",
                "Phase 1 — Fat Loss Sprint",
                "Phase 1 — Lean Muscle Baseline",
                "Phase 1 — Habit Discipline",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setName(chip)}
                  className="px-2 py-0.5 rounded-md bg-[#fcf2e6] hover:bg-[#faebd9] border border-[#dfc0b7] text-[10px] font-semibold text-[#58423c] transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Subtitle / Focus Statement */}
          <div className="space-y-1">
            <label className="font-bold text-[#1f1b14] block">Focus & Objective</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. 1,600 kcal strict discipline + 8k daily steps"
              className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#52652a]"
            />
          </div>

          {/* Theme / Pillar */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#1f1b14] block">Transformation Theme</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Consistency & Discipline",
                "Metabolic Baseline",
                "Aggressive Cut",
                "Lean Hypertrophy",
                "Strength & Mobility",
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    theme === t
                      ? "bg-[#52652a] text-white border-[#52652a] shadow-2xs"
                      : "bg-white text-[#58423c] border-[#dfc0b7] hover:bg-[#fcf2e6]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="p-3 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1f1b14] uppercase tracking-wider text-[10px] font-mono">
                📅 Phase Timeline &amp; Completion Target
              </span>
              <span className="text-[10px] font-mono font-bold text-[#a43716]">
                {daysLeft} Days Remaining ({diffDays} Days Total)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-[#58423c] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#dfc0b7] bg-white font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#58423c] mb-1 font-bold text-[#a43716]">
                  Target Completion Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#a43716] bg-white font-mono text-xs font-bold text-[#1f1b14]"
                  required
                />
              </div>
            </div>

            {/* Quick Timeline buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-[#58423c] font-mono">Quick span:</span>
              {[
                { label: "15 Days", days: 15 },
                { label: "30 Days", days: 30 },
                { label: "45 Days", days: 45 },
                { label: "60 Days", days: 60 },
                { label: "90 Days", days: 90 },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => handleSetQuickDuration(opt.days)}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#dfc0b7] text-[10px] font-bold text-[#58423c] hover:bg-[#faebd9]"
                >
                  +{opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Milestones / Goals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <label className="block text-[10px] font-mono text-[#58423c] mb-1">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(e.target.value)}
                className="w-full px-2 py-1 rounded-md border border-[#dfc0b7] font-mono font-bold text-sm"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <label className="block text-[10px] font-mono text-[#58423c] mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={currentWeightKg}
                onChange={(e) => setCurrentWeightKg(e.target.value)}
                className="w-full px-2 py-1 rounded-md border border-[#dfc0b7] font-mono font-bold text-sm"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <label className="block text-[10px] font-mono text-[#58423c] mb-1">Target Calories</label>
              <input
                type="number"
                step="50"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="w-full px-2 py-1 rounded-md border border-[#dfc0b7] font-mono font-bold text-sm"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <label className="block text-[10px] font-mono text-[#58423c] mb-1">Daily Steps Target</label>
              <input
                type="number"
                step="500"
                value={dailyStepsTarget}
                onChange={(e) => setDailyStepsTarget(e.target.value)}
                className="w-full px-2 py-1 rounded-md border border-[#dfc0b7] font-mono font-bold text-sm"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7] col-span-2 sm:col-span-2">
              <label className="block text-[10px] font-mono text-[#58423c] mb-1">Daily Water Target (ml)</label>
              <input
                type="number"
                step="250"
                value={dailyWaterTargetMl}
                onChange={(e) => setDailyWaterTargetMl(e.target.value)}
                className="w-full px-2 py-1 rounded-md border border-[#dfc0b7] font-mono font-bold text-sm"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-[#dfc0b7] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#dfc0b7] text-xs font-semibold text-[#58423c] hover:bg-[#fcf2e6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Phase...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{isNewUser ? "Complete Setup & Activate Phase" : "Save & Activate Phase"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
