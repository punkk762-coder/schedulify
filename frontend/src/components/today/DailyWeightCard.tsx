"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";

interface DailyWeightCardProps {
  todayWeight: number | null;
  defaultWeight: number;
  isLoggedToday: boolean;
  onRefresh: () => void;
}

export function DailyWeightCard({
  todayWeight,
  defaultWeight = 74,
  isLoggedToday = false,
  onRefresh,
}: DailyWeightCardProps) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [customWeight, setCustomWeight] = useState<string>(
    todayWeight ? String(todayWeight) : String(defaultWeight)
  );
  const [submitting, setSubmitting] = useState(false);

  const handleLogWeight = async (weightToLog: number) => {
    if (isNaN(weightToLog) || weightToLog <= 20 || weightToLog >= 300) {
      toast.error("Please enter a realistic weight in kg (20–300 kg)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/today/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: weightToLog }),
      });

      if (!res.ok) {
        throw new Error("Failed to record weight");
      }

      toast.success(`Weight recorded: ${weightToLog} kg ✓`, "Biometrics Synced");
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to log weight", "Sync Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#dfc0b7] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⚖️</span>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8b716a] block">
              Daily Weigh-In Check
            </span>
            <h4 className="text-xs font-serif font-bold text-[#1f1b14]">
              {isLoggedToday && !isEditing
                ? `Today's Log: ${todayWeight} kg`
                : "Record Today's Morning Weight"}
            </h4>
          </div>
        </div>

        {isLoggedToday && !isEditing && (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[#f7faef] text-[#52652a] border border-[#52652a]/20 text-[10px] font-mono font-bold">
              ✓ Recorded
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[10px] text-[#58423c] hover:text-[#1f1b14] underline font-semibold px-1"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {(!isLoggedToday || isEditing) && (
        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Default Quick Confirm Button */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleLogWeight(defaultWeight)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#fcf2e6] hover:bg-[#faebd9] border border-[#dfc0b7] text-[#1f1b14] text-xs font-bold transition-all active:scale-95 shadow-2xs flex items-center justify-center gap-1.5"
            title="Confirm unchanged weight in 1 click"
          >
            <span>✓</span>
            <span>Same as Default ({defaultWeight} kg)</span>
          </button>

          {/* Custom Weight Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogWeight(parseFloat(customWeight));
            }}
            className="flex items-center gap-1.5"
          >
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                placeholder="74.0"
                className="w-24 px-2.5 py-1.5 rounded-xl border border-[#dfc0b7] bg-white font-mono font-bold text-xs text-[#1f1b14] focus:outline-none focus:ring-2 focus:ring-[#52652a]"
              />
              <span className="absolute right-2 top-1.5 text-[10px] font-mono text-[#8b716a]">
                kg
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 rounded-xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? "..." : "Save"}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2 py-1.5 rounded-xl text-xs text-[#8b716a] hover:bg-[#fcf2e6]"
              >
                ✕
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
