"use client";

import React, { useState } from "react";

export interface WinterArcPhaseSummary {
  phaseNumber: number;
  monthKey: string;
  monthName: string;
  title: string;
  theme: string;
  targetWeightKg: number;
  dailyStepsTarget: number;
  physiqueMilestone: string;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  retrospective?: {
    completedAt?: string;
    whatWeDone?: string[];
    whatWasExpected?: string[];
    aiRecommendations?: string[];
    gainsSummary?: string;
  } | null;
}

export interface WinterArcData {
  currentPhase: {
    phaseNumber: number;
    monthKey: string;
    monthName: string;
    title: string;
    subtitle: string;
    theme: string;
    physiqueMilestone: string;
    targetWeightKg: number;
    currentWeightKg: number;
    dailyStepsTarget: number;
    dailyWaterTargetMl: number;
    weeklyWorkoutsTarget: number;
    daysRemainingInPhase: number;
    status: string;
    isTransitionDue: boolean;
  };
  comparison: {
    whatWasExpected: {
      targetWeightKg: number;
      dailySteps: number;
      dailyWaterMl: number;
      dailyCalories: number;
      dailyProtein: number;
      targetAdherencePct: number;
    };
    whatWeHadDone: {
      currentWeightKg: number;
      averageDailySteps: number;
      averageDailyWaterMl: number;
      averageDailyCalories: number;
      averageDailyProtein: number;
      actualAdherencePct: number;
      streakDays: number;
    };
    variance: {
      weightKgDelta: number;
      stepsDelta: number;
      waterMlDelta: number;
      proteinGramsDelta: number;
      adherencePctDelta: number;
    };
  };
  aiRecommendations: string[];
  nextPhasePreview?: {
    phaseNumber: number;
    monthKey: string;
    monthName: string;
    title: string;
    subtitle: string;
    theme: string;
    targetWeightKg: number;
    dailyStepsTarget: number;
    dailyWaterTargetMl: number;
    weeklyWorkoutsTarget: number;
    physiqueMilestone: string;
    aiFocusPrompt: string;
  } | null;
  allPhases: WinterArcPhaseSummary[];
}

interface WinterArcCockpitProps {
  winterArc?: WinterArcData | null;
  onRefresh?: () => void;
}

export const WinterArcCockpit: React.FC<WinterArcCockpitProps> = ({
  winterArc,
  onRefresh,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for next phase adjustments
  const nextPreview = winterArc?.nextPhasePreview;
  const [targetWeight, setTargetWeight] = useState<number>(nextPreview?.targetWeightKg || 71.0);
  const [stepsTarget, setStepsTarget] = useState<number>(nextPreview?.dailyStepsTarget || 10000);
  const [waterTarget, setWaterTarget] = useState<number>(nextPreview?.dailyWaterTargetMl || 3200);
  const [notes, setNotes] = useState<string>("");

  if (!winterArc) return null;

  const { currentPhase, comparison, aiRecommendations, allPhases } = winterArc;
  const { whatWasExpected, whatWeHadDone, variance } = comparison;

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/analytics/phase-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedMonthKey: currentPhase.monthKey,
          nextMonthKey: nextPreview?.monthKey,
          actualWeightKg: whatWeHadDone.currentWeightKg,
          nextTargetWeightKg: targetWeight,
          nextDailyStepsTarget: stepsTarget,
          nextDailyWaterTargetMl: waterTarget,
          notes,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSuccessMessage(json.message || "Phase transition successful! New dashboard generated.");
        setTimeout(() => {
          setShowModal(false);
          setSuccessMessage(null);
          if (onRefresh) onRefresh();
        }, 1500);
      } else {
        alert("Failed to transition phase. Please retry.");
      }
    } catch (err) {
      console.error("Phase transition error:", err);
      alert("Error submitting phase transition.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-3xl p-6 border border-[#dfc0b7] shadow-xs space-y-6">
      {/* ─── Header: Winter Arc Physique Mission ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a43716] animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#a43716]">
              Winter Arc Blueprint • October to February
            </span>
            <span className="text-[10px] font-mono bg-[#fcf2e6] border border-[#dfc0b7] text-[#58423c] px-2 py-0.5 rounded-full font-semibold">
              Dream Physique Transformation
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1f1b14] mt-1">
            {currentPhase.title}
          </h2>
          <p className="text-xs text-[#58423c] mt-0.5 max-w-2xl">
            {currentPhase.subtitle} • Milestone: <strong className="text-[#1f1b14]">{currentPhase.physiqueMilestone}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono font-semibold uppercase text-[#8b716a] block">
              Phase Horizon
            </span>
            <span className="text-xs font-mono font-bold text-[#a43716]">
              {currentPhase.daysRemainingInPhase} Days Left
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#a43716] text-white hover:bg-[#8b2e12] transition-all font-bold text-xs shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span>Review &amp; Transition Phase</span>
            <span>⚡</span>
          </button>
        </div>
      </div>

      {/* ─── 5-Phase Longitudinal Progression Timeline ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#8b716a]">
          <span>5-Month Winter Arc Trajectory</span>
          <span className="text-[#a43716] font-bold">Phase {currentPhase.phaseNumber} of 5 Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {allPhases.map((phase) => {
            const isActive = phase.phaseNumber === currentPhase.phaseNumber;
            const isCompleted = phase.status === "COMPLETED" || phase.phaseNumber < currentPhase.phaseNumber;

            return (
              <div
                key={phase.phaseNumber}
                className={`p-3 rounded-2xl border transition-all ${
                  isActive
                    ? "bg-gradient-to-b from-[#fff5f2] to-white border-[#a43716] shadow-xs ring-1 ring-[#a43716]/30"
                    : isCompleted
                    ? "bg-[#f7faef] border-[#52652a]/30 text-[#1f1b14]"
                    : "bg-[#fcf2e6]/40 border-[#dfc0b7]/70 text-[#8b716a]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-[#ffdbd1] text-[#a43716]"
                        : isCompleted
                        ? "bg-[#d4eca2] text-[#3b4d14]"
                        : "bg-white text-[#8b716a] border border-[#dfc0b7]"
                    }`}
                  >
                    {isCompleted ? "Done ✓" : isActive ? "Active" : "Upcoming"}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#8b716a]">
                    P{phase.phaseNumber}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#1f1b14] mt-1.5 truncate">
                  {phase.monthName.split(" ")[0]}
                </h4>
                <p className="text-[10px] text-[#58423c] truncate">
                  Target: {phase.targetWeightKg}kg • {phase.dailyStepsTarget.toLocaleString()} steps
                </p>
                <p className="text-[9px] text-[#8b716a] truncate mt-1">
                  {phase.theme}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Core Comparison: What We Had Done vs What Was Expected ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Left: What Was Expected (Baseline Phase Target) */}
        <div className="p-4 rounded-2xl bg-[#fcf2e6]/50 border border-[#dfc0b7] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🎯</span>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#58423c]">
                What Was Expected (Baseline Target)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#8b716a]">
              {currentPhase.monthName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <span className="text-[10px] text-[#8b716a] block">Target Weight</span>
              <span className="text-base font-serif font-bold text-[#1f1b14]">
                {whatWasExpected.targetWeightKg} kg
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <span className="text-[10px] text-[#8b716a] block">Step Standard</span>
              <span className="text-base font-serif font-bold text-[#1f1b14]">
                {whatWasExpected.dailySteps.toLocaleString()} / day
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <span className="text-[10px] text-[#8b716a] block">Hydration Target</span>
              <span className="text-base font-serif font-bold text-[#1f1b14]">
                {whatWasExpected.dailyWaterMl.toLocaleString()} ml
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <span className="text-[10px] text-[#8b716a] block">Habit Adherence Standard</span>
              <span className="text-base font-serif font-bold text-[#1f1b14]">
                {whatWasExpected.targetAdherencePct}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: What We Had Done (Actual Execution & Variance) */}
        <div className="p-4 rounded-2xl bg-[#fff5f2] border border-[#a43716]/20 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#a43716]/20">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#a43716]">
                What We Had Done (Actual Execution)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#a43716]">
              Real-time Ledger
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8b716a]">Recorded Weight</span>
                <span className={`text-[9px] font-mono font-bold ${variance.weightKgDelta <= 0 ? "text-[#52652a]" : "text-[#a43716]"}`}>
                  {variance.weightKgDelta > 0 ? `+${variance.weightKgDelta}kg` : `${variance.weightKgDelta}kg`}
                </span>
              </div>
              <span className="text-base font-serif font-bold text-[#1f1b14]">
                {whatWeHadDone.currentWeightKg} kg
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8b716a]">Avg Daily Steps</span>
                <span className={`text-[9px] font-mono font-bold ${variance.stepsDelta >= 0 ? "text-[#52652a]" : "text-[#a43716]"}`}>
                  {variance.stepsDelta >= 0 ? `+${variance.stepsDelta}` : `${variance.stepsDelta}`}
                </span>
              </div>
              <span className="text-base font-serif font-bold text-[#1f1b14]">
                {whatWeHadDone.averageDailySteps.toLocaleString()} / day
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8b716a]">Avg Water Intake</span>
                <span className={`text-[9px] font-mono font-bold ${variance.waterMlDelta >= 0 ? "text-[#52652a]" : "text-[#a43716]"}`}>
                  {variance.waterMlDelta >= 0 ? `+${variance.waterMlDelta}ml` : `${variance.waterMlDelta}ml`}
                </span>
              </div>
              <span className="text-base font-serif font-bold text-[#1f1b14]">
                {whatWeHadDone.averageDailyWaterMl.toLocaleString()} ml
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#dfc0b7]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8b716a]">Habit Consistency</span>
                <span className={`text-[9px] font-mono font-bold ${variance.adherencePctDelta >= 0 ? "text-[#52652a]" : "text-[#a43716]"}`}>
                  {variance.adherencePctDelta >= 0 ? `+${variance.adherencePctDelta}%` : `${variance.adherencePctDelta}%`}
                </span>
              </div>
              <span className="text-base font-serif font-bold text-[#1f1b14]">
                {whatWeHadDone.actualAdherencePct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI Recommendations: What Can Be Done Next ─── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fcf2e6] via-[#fff5f2] to-[#fcf2e6] border border-[#dfc0b7] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🤖</span>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#a43716]">
              AI Retrospective &amp; What Can Be Done Next
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#58423c] font-semibold">
            Personalized Tactical Engine
          </span>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#1f1b14]">
          {aiRecommendations.map((rec, idx) => (
            <li
              key={idx}
              className="p-3 rounded-xl bg-white/90 border border-[#dfc0b7] flex items-start gap-2 shadow-2xs"
            >
              <span className="text-[#a43716] font-bold shrink-0 mt-0.5">❯</span>
              <span className="leading-snug text-[11px] text-[#58423c]">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ─── Archived Retrospectives History (Preserved Past Phases) ─── */}
      {allPhases.some((p) => p.retrospective) && (
        <div className="space-y-3 pt-2 border-t border-[#dfc0b7]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
            Archived Phase Ledgers &amp; Historical Gain Summaries
          </span>
          <div className="space-y-2">
            {allPhases
              .filter((p) => p.retrospective)
              .map((p) => (
                <div
                  key={p.phaseNumber}
                  className="p-3.5 rounded-xl bg-[#fcf2e6]/50 border border-[#dfc0b7] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1f1b14]">
                      Phase {p.phaseNumber} Finalized ({p.monthName})
                    </span>
                    <span className="text-[10px] font-mono text-[#52652a] font-bold bg-[#d4eca2] px-2 py-0.5 rounded-full">
                      Ledger Immutable ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-[#58423c]">
                    {p.retrospective?.gainsSummary}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── Phase Transition Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#dfc0b7] shadow-xl max-w-xl w-full space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716] block">
                  Winter Arc Transition Engine
                </span>
                <h3 className="text-xl font-serif font-bold text-[#1f1b14]">
                  Deploy New Phase Dashboard
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#fcf2e6] border border-[#dfc0b7] text-[#58423c] font-bold text-sm flex items-center justify-center hover:bg-[#ffdbd1]"
              >
                ✕
              </button>
            </div>

            {successMessage ? (
              <div className="p-4 rounded-2xl bg-[#f7faef] border border-[#52652a] text-[#52652a] text-center space-y-2">
                <span className="text-3xl block">🎉</span>
                <p className="font-bold text-sm">{successMessage}</p>
                <p className="text-xs text-[#58423c]">Refreshing dashboard with new targets...</p>
              </div>
            ) : (
              <form onSubmit={handleTransitionSubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#fff5f2] border border-[#a43716]/20 text-xs text-[#58423c] space-y-1">
                  <div className="font-bold text-[#a43716]">
                    Archiving Phase {currentPhase.phaseNumber} ({currentPhase.monthName})
                  </div>
                  <p className="text-[11px]">
                    All {whatWeHadDone.actualAdherencePct}% habit executions, daily step averages, and nutrition logs will be permanently locked into the ledger. Next, the AI will deploy the Phase {nextPreview?.phaseNumber || (currentPhase.phaseNumber + 1)} Dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#8b716a] font-bold mb-1">
                      Next Target Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 71.0)}
                      className="w-full px-3 py-2 rounded-xl border border-[#dfc0b7] font-mono text-sm bg-white font-bold text-[#1f1b14]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#8b716a] font-bold mb-1">
                      Next Daily Steps Target
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={stepsTarget}
                      onChange={(e) => setStepsTarget(parseInt(e.target.value, 10) || 10000)}
                      className="w-full px-3 py-2 rounded-xl border border-[#dfc0b7] font-mono text-sm bg-white font-bold text-[#1f1b14]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#8b716a] font-bold mb-1">
                      Next Daily Water Target (ml)
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={waterTarget}
                      onChange={(e) => setWaterTarget(parseInt(e.target.value, 10) || 3200)}
                      className="w-full px-3 py-2 rounded-xl border border-[#dfc0b7] font-mono text-sm bg-white font-bold text-[#1f1b14]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#8b716a] font-bold mb-1">
                      Phase Focus Theme
                    </label>
                    <div className="w-full px-3 py-2 rounded-xl border border-[#dfc0b7] font-sans text-xs bg-[#fcf2e6] text-[#58423c] font-medium truncate">
                      {nextPreview?.theme || "Hypertrophy & Density"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8b716a] font-bold mb-1">
                    Custom Reflection / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Felt strong on squats, want to push steps to 10k easily with morning walks."
                    className="w-full px-3 py-2 rounded-xl border border-[#dfc0b7] text-xs bg-white text-[#1f1b14]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#dfc0b7]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#58423c] hover:bg-[#fcf2e6]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#a43716] text-white hover:bg-[#8b2e12] font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Deploying AI Dashboard...</span>
                      </>
                    ) : (
                      <>
                        <span>Deploy Next Phase Dashboard</span>
                        <span>🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
