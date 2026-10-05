"use client";

import React, { useState, useEffect } from "react";
import type { TodayOccurrence } from "@/lib/domain/types";

interface CompleteConfirmationModalProps {
  item: TodayOccurrence | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void> | void;
}

export function CompleteConfirmationModal({
  item,
  isOpen,
  onClose,
  onConfirm,
}: CompleteConfirmationModalProps) {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  useEffect(() => {
    if (isOpen) {
      setState("idle");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape" && state === "idle") {
        onClose();
      } else if (e.key === "Enter" && state === "idle" && item) {
        handleActionConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, state, item]);

  if (!isOpen || !item) return null;

  const handleActionConfirm = async () => {
    if (state !== "idle") return;
    setState("loading");

    try {
      await onConfirm(item.id);
      setState("success");
      setTimeout(() => {
        onClose();
      }, 750);
    } catch {
      setState("idle");
    }
  };

  const isMeal = item.category === "MEAL";
  const hasNutrition = Boolean(
    item.nutrition?.protein || item.nutrition?.calories
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-[#dfc0b7] shadow-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle decorative top glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#a43716] via-[#52652a] to-[#d4eca2]" />

        {state === "success" ? (
          /* ─── SUCCESS TICK MARK STATE ─── */
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-90 duration-300">
            <div className="w-20 h-20 rounded-full bg-[#d4eca2] border-4 border-[#52652a] text-[#2c3814] flex items-center justify-center shadow-lg shadow-[#52652a]/20 animate-bounce">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-[#1f1b14]">
                Protocol Done! ✓
              </h3>
              <p className="text-xs text-[#52652a] font-medium mt-1 font-mono">
                Logged to today&apos;s database ledger
              </p>
            </div>
          </div>
        ) : (
          /* ─── CONFIRMATION & LOADING STATE ─── */
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#52652a] animate-pulse" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#52652a]">
                  Confirmation Required
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={state === "loading"}
                className="w-8 h-8 rounded-full hover:bg-[#fcf2e6] text-[#8b716a] hover:text-[#1f1b14] flex items-center justify-center text-base transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Prompt details */}
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1f1b14]">
                Mark Protocol as Done?
              </h2>
              <p className="text-xs text-[#58423c] mt-1">
                This commits completion status to your continuous routine history.
              </p>
            </div>

            {/* Item Card Details Preview */}
            <div className="p-4 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#a43716]">
                  {item.scheduledTime}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#58423c] border border-[#dfc0b7]">
                  {item.category}
                </span>
              </div>

              <h4 className="text-base font-serif font-bold text-[#1f1b14] leading-snug">
                {item.title}
              </h4>

              {hasNutrition && (
                <div className="flex items-center gap-2 pt-1 font-mono text-xs text-[#58423c]">
                  {item.nutrition?.calories ? (
                    <span className="bg-white px-2 py-0.5 rounded-md border border-[#dfc0b7]">
                      {item.nutrition.calories} kcal
                    </span>
                  ) : null}
                  {item.nutrition?.protein ? (
                    <span className="bg-[#d4eca2] text-[#2c3814] font-bold px-2 py-0.5 rounded-md border border-[#52652a]/20">
                      +{item.nutrition.protein}g Protein
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={state === "loading"}
                className="flex-1 py-3 rounded-2xl bg-white hover:bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7] text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleActionConfirm}
                disabled={state === "loading"}
                className="flex-1 py-3 rounded-2xl bg-[#52652a] hover:bg-[#3f4f20] text-white text-xs font-bold transition-all shadow-md shadow-[#52652a]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
              >
                {state === "loading" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Logging to DB...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Done ✓</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
