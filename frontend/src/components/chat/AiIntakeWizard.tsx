"use client";

import React, { useState } from "react";
import type { PlanImportProposal } from "@/lib/domain/types";

export interface KeptItem {
  id: string;
  title: string;
  category: string;
  scheduledTime: string;
  calories: number;
  protein: number;
}

export interface IntakeQuestion {
  id: string;
  title: string;
  description: string;
  options: string[];
  canCustomWrite: boolean;
  defaultSelected?: string;
}

export interface IntakeAnalysisResult {
  proposal: PlanImportProposal;
  metrics: {
    totalCalories: number;
    calorieLimit: number;
    totalProtein: number;
    proteinTarget: number;
    itemsCount: number;
  };
  keptItems: KeptItem[];
  questions: IntakeQuestion[];
}

interface AiIntakeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (summary: string) => void;
}

export function AiIntakeWizard({ isOpen, onClose, onSuccess }: AiIntakeWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [calorieLimit, setCalorieLimit] = useState<number>(1800);
  const [proteinTarget, setProteinTarget] = useState<number>(150);
  const [rawText, setRawText] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IntakeAnalysisResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [customWriteIns, setCustomWriteIns] = useState<Record<string, string>>({});
  const [isWritingCustom, setIsWritingCustom] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetCaloriePreset = (val: number) => {
    setCalorieLimit(val);
  };

  const handleLoadSampleRoutine = () => {
    const sample = `Monday to Sunday Mediterranean Schedule:
10:15 AM - Breakfast: Chocolate Proats (50g Oats, 1 scoop Whey, 200ml Almond milk) - 380 kcal, 32g protein
12:30 PM - Lunch: 2 Phulkas, Cabbage Sabzi, Cucumber Salad, 150g Dahi - 420 kcal, 14g protein
05:30 PM - Snack: Boiled Kala Chana (100g) with lime & pink salt - 180 kcal, 10g protein
07:00 PM - Dinner: Paneer Bhurji (100g Paneer), 2 Phulkas, Mixed Salad - 450 kcal, 22g protein
08:00 PM - 1-hour Evening Walk (3.5 km)
11:30 PM - Bedtime: Warm Turmeric Milk / Chamomile - 120 kcal, 4g protein`;
    setRawText(sample);
  };

  const handleAnalyze = async () => {
    if (!rawText.trim() || analyzing) return;
    setAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/plans/intake-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          calorieLimit,
          proteinTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze plan");
      }

      setAnalysisResult(data);
      // Initialize default selections for questions
      const initialAnswers: Record<string, string> = {};
      data.questions.forEach((q: IntakeQuestion) => {
        if (q.defaultSelected) {
          initialAnswers[q.id] = q.defaultSelected;
        } else if (q.options.length > 0) {
          initialAnswers[q.id] = q.options[0];
        }
      });
      setSelectedAnswers(initialAnswers);
      setStep(3);
    } catch (err: unknown) {
      console.error("Intake analyze failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Error analyzing plan. Check network connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setIsWritingCustom((prev) => ({ ...prev, [questionId]: false }));
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleTriggerCustomWrite = (questionId: string) => {
    setIsWritingCustom((prev) => ({ ...prev, [questionId]: true }));
    const currentCustom = customWriteIns[questionId] || "";
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: currentCustom ? `Custom: ${currentCustom}` : "Custom: (Pending)",
    }));
  };

  const handleCustomTextChange = (questionId: string, val: string) => {
    setCustomWriteIns((prev) => ({ ...prev, [questionId]: val }));
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: val.trim() ? `Custom: ${val.trim()}` : "",
    }));
  };

  const handleCommit = async () => {
    if (!analysisResult || committing) return;
    setCommitting(true);
    setErrorMessage(null);

    try {
      const finalAnswers: Record<string, string> = {};
      for (const [qId, ans] of Object.entries(selectedAnswers)) {
        if (isWritingCustom[qId]) {
          const custom = customWriteIns[qId]?.trim();
          if (custom) {
            finalAnswers[qId] = `Custom: ${custom}`;
          }
        } else {
          finalAnswers[qId] = ans;
        }
      }

      const res = await fetch("/api/plans/intake-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal: analysisResult.proposal,
          answers: finalAnswers,
          calorieLimit,
          proteinTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to commit routine protocol");
      }

      onSuccess(
        `AI Protocol committed successfully! Initialized with ${analysisResult.keptItems.length} routine items at ${calorieLimit} kcal limit.`
      );
      onClose();
    } catch (err: unknown) {
      console.error("Intake commit failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Error committing protocol");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#dfc0b7] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#dfc0b7] bg-linear-to-r from-[#fcf2e6] to-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52652a]">
                AI Routine Onboarding &amp; Calibration
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1f1b14]">
              {step === 1 && "Step 1: Set Calorie Limit & Goals"}
              {step === 2 && "Step 2: Paste External AI Protocol"}
              {step === 3 && "Step 3: AI Calorie & Habit Calibration"}
            </h2>
            <p className="text-xs text-[#58423c]">
              {step === 1 && "Specify your daily dietary threshold before importing"}
              {step === 2 && "Paste raw routine text from ChatGPT, Claude, or DeepSeek"}
              {step === 3 && "Our AI highlights approved foundations and poses targeted adjustments"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#dfc0b7] text-[#8b716a] hover:text-[#1f1b14] flex items-center justify-center text-sm font-bold shadow-xs"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 py-2.5 bg-[#fbf5ed] border-b border-[#dfc0b7]/60 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
                step >= 1 ? "bg-[#a43716] text-white" : "bg-[#dfc0b7] text-[#58423c]"
              }`}
            >
              1
            </span>
            <span className={`font-semibold ${step === 1 ? "text-[#a43716]" : "text-[#58423c]"}`}>Limit</span>
            <span className="text-[#dfc0b7]">→</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
                step >= 2 ? "bg-[#a43716] text-white" : "bg-[#dfc0b7] text-[#58423c]"
              }`}
            >
              2
            </span>
            <span className={`font-semibold ${step === 2 ? "text-[#a43716]" : "text-[#58423c]"}`}>Paste Plan</span>
            <span className="text-[#dfc0b7]">→</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
                step >= 3 ? "bg-[#a43716] text-white" : "bg-[#dfc0b7] text-[#58423c]"
              }`}
            >
              3
            </span>
            <span className={`font-semibold ${step === 3 ? "text-[#a43716]" : "text-[#58423c]"}`}>AI Review</span>
          </div>

          <span className="text-[11px] font-mono text-[#8b716a]">
            Limit: <strong className="text-[#1f1b14]">{calorieLimit} kcal</strong>
          </span>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* ─── STEP 1: Set Calorie Limit ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#1f1b14] uppercase tracking-wider mb-2">
                  Daily Calorie Limit Target
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[1500, 1800, 2000, 2200].map((preset) => {
                    const isSelected = calorieLimit === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSetCaloriePreset(preset)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-[#a43716] text-white border-[#a43716] shadow-sm font-bold scale-[1.02]"
                            : "bg-[#fcf2e6] text-[#1f1b14] border-[#dfc0b7] hover:bg-[#faebd9]"
                        }`}
                      >
                        <div className="text-base font-mono font-bold">{preset} kcal</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            isSelected ? "text-white/80" : "text-[#8b716a]"
                          }`}
                        >
                          {preset === 1500 && "Deficit / Cut"}
                          {preset === 1800 && "Standard / Recomp"}
                          {preset === 2000 && "Maintenance"}
                          {preset === 2200 && "Performance"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[11px] text-[#58423c] block mb-1">Custom Calorie Target</span>
                    <input
                      type="number"
                      value={calorieLimit}
                      onChange={(e) => setCalorieLimit(Number(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] font-mono text-sm font-bold text-[#1f1b14] focus:outline-none focus:border-[#a43716]"
                      min={1000}
                      max={4000}
                      step={50}
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] text-[#58423c] block mb-1">Protein Target (grams)</span>
                    <input
                      type="number"
                      value={proteinTarget}
                      onChange={(e) => setProteinTarget(Number(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] font-mono text-sm font-bold text-[#1f1b14] focus:outline-none focus:border-[#a43716]"
                      min={50}
                      max={300}
                      step={5}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#f7faef] border border-[#52652a]/20 space-y-1 text-xs text-[#2e4010]">
                <span className="font-bold flex items-center gap-1 text-[#52652a]">
                  <span>💡</span> Why calibrate this first?
                </span>
                <p>
                  When you paste raw text from another AI (like ChatGPT), our engine calculates the total energy in each
                  meal. Any excess or deficiency against <strong>{calorieLimit} kcal</strong> triggers instant,
                  customizable options.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-2xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold shadow-md transition-all active:scale-98"
                >
                  Continue to Paste Protocol ➔
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Paste Raw Routine ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1f1b14] uppercase tracking-wider">
                  Raw Protocol Text
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleRoutine}
                  className="text-xs text-[#a43716] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>✨</span> Load Sample AI Routine
                </button>
              </div>

              <textarea
                rows={9}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the output from ChatGPT or Claude here:
e.g.
10:15 AM - Breakfast: Chocolate Proats (Whey, Oats, Almond Milk) - 380 kcal
12:30 PM - Lunch: 2 Phulkas, Sabzi, Salad, Dahi - 420 kcal
05:30 PM - Kala Chana (boiled) - 180 kcal
07:00 PM - Dinner: Paneer Bhurji with 2 Phulkas - 450 kcal
08:00 PM - Evening Walk 45 mins"
                className="w-full p-3.5 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] font-mono text-xs text-[#1f1b14] placeholder-[#8b716a] focus:outline-none focus:border-[#a43716] leading-relaxed"
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl bg-[#fcf2e6] hover:bg-[#faebd9] text-[#58423c] text-xs font-bold border border-[#dfc0b7]"
                >
                  ← Back to Limits
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!rawText.trim() || analyzing}
                  className="flex-1 py-3 rounded-2xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold shadow-md transition-all active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing with AI Concierge...</span>
                    </>
                  ) : (
                    <span>Analyze Protocol &amp; Formulate Questions ⚡</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: AI Calibration Breakdown (What to Keep vs What to Change) ─── */}
          {step === 3 && analysisResult && (
            <div className="space-y-6">
              {/* Macro & Calorie Header Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#dfc0b7] shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b716a] font-bold block">
                    Calculated Intake vs Target
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-mono font-bold text-[#1f1b14]">
                      {analysisResult.metrics.totalCalories}
                    </span>
                    <span className="text-xs text-[#58423c] font-medium">/ {calorieLimit} kcal limit</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#8b716a] block">PROTEIN</span>
                    <span className="text-sm font-mono font-bold text-[#52652a]">
                      {analysisResult.metrics.totalProtein}g / {proteinTarget}g
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                      analysisResult.metrics.totalCalories > calorieLimit
                        ? "bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30"
                        : "bg-[#d4eca2] text-[#141f00] border border-[#52652a]/30"
                    }`}
                  >
                    {analysisResult.metrics.totalCalories > calorieLimit
                      ? `+${analysisResult.metrics.totalCalories - calorieLimit} kcal Surplus`
                      : "Within Limit"}
                  </div>
                </div>
              </div>

              {/* SECTION 1: WHAT TO KEEP (Foundations) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#52652a] uppercase tracking-wider flex items-center gap-1.5">
                    <span>✅</span> What AI Keeps (Preserved Foundations)
                  </h3>
                  <span className="text-[11px] font-mono text-[#8b716a]">
                    {analysisResult.keptItems.length} items verified
                  </span>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {analysisResult.keptItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#52652a] font-bold">✓</span>
                        <span className="font-semibold text-[#1f1b14]">{item.title}</span>
                        <span className="text-[10px] font-mono text-[#8b716a] bg-white/70 px-1.5 py-0.5 rounded-md border border-[#dfc0b7]/50">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right text-[11px] font-mono">
                        <span className="text-[#a43716] font-medium mr-2">{item.scheduledTime}</span>
                        {item.calories > 0 && <span className="text-[#58423c]">{item.calories} kcal</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: WHAT TO CHANGE / QUESTIONS FROM AI */}
              <div className="space-y-4 pt-2 border-t border-[#dfc0b7]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#a43716] uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡</span> AI Questions &amp; Tailored Adjustments
                  </h3>
                  <span className="text-[10px] font-mono text-[#8b716a]">Choose suggested or write custom</span>
                </div>

                {analysisResult.questions.map((q) => {
                  const currentSelection = selectedAnswers[q.id];
                  const isCustomActive = isWritingCustom[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-white border border-[#dfc0b7] shadow-xs space-y-3"
                    >
                      <div>
                        <h4 className="text-xs font-serif font-bold text-[#1f1b14]">{q.title}</h4>
                        <p className="text-[11px] text-[#58423c] mt-0.5">{q.description}</p>
                      </div>

                      {/* Options Chips */}
                      <div className="space-y-1.5">
                        {q.options.map((opt) => {
                          const isOptionSelected = !isCustomActive && currentSelection === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectOption(q.id, opt)}
                              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                                isOptionSelected
                                  ? "bg-[#fcf2e6] border-[#a43716] text-[#a43716] font-bold shadow-xs"
                                  : "bg-[#fbf5ed] border-[#dfc0b7] text-[#1f1b14] hover:bg-[#f6ede0]"
                              }`}
                            >
                              <span>{opt}</span>
                              {isOptionSelected && (
                                <span className="w-2 h-2 rounded-full bg-[#a43716] shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}

                        {/* Explicit Option: "Write something for this" */}
                        {q.canCustomWrite && (
                          <div className="space-y-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleTriggerCustomWrite(q.id)}
                              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                                isCustomActive
                                  ? "bg-[#ffede9] border-[#a43716] text-[#a43716] font-bold shadow-xs"
                                  : "bg-[#fbf5ed] border-dashed border-[#dfc0b7] text-[#58423c] hover:bg-[#f6ede0]"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span>✍️</span>
                                <span>Write something for this (Custom instruction)</span>
                              </span>
                              {isCustomActive && (
                                <span className="w-2 h-2 rounded-full bg-[#a43716] shrink-0 ml-2" />
                              )}
                            </button>

                            {/* Active Custom Write-in input */}
                            {isCustomActive && (
                              <div className="p-2.5 rounded-xl bg-[#fcf2e6] border border-[#a43716] animate-in fade-in duration-150">
                                <label className="text-[10px] font-bold text-[#a43716] uppercase tracking-wider block mb-1">
                                  Your Custom Instruction for this question:
                                </label>
                                <input
                                  type="text"
                                  value={customWriteIns[q.id] || ""}
                                  onChange={(e) => handleCustomTextChange(q.id, e.target.value)}
                                  placeholder="e.g. Replace oats with moong dal chilla, or shift dinner to 8:30 PM..."
                                  className="w-full p-2 rounded-lg bg-white border border-[#dfc0b7] text-xs text-[#1f1b14] placeholder-[#8b716a] focus:outline-none focus:border-[#a43716]"
                                  autoFocus
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions footer */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#dfc0b7]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded-xl bg-[#fcf2e6] hover:bg-[#faebd9] text-[#58423c] text-xs font-bold border border-[#dfc0b7]"
                >
                  ← Edit Plan
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={committing}
                  className="flex-1 py-3 rounded-2xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold shadow-md transition-all active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {committing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Writing Protocol to DB...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Launch Protocol 🚀</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
