"use client";

import React, { useState, useEffect } from "react";
import type { KitchenMeal } from "@/lib/domain/types";

interface MomConfirmModalProps {
  meal: KitchenMeal | null;
  isOpen: boolean;
  isPrepared: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function MomConfirmModal({
  meal,
  isOpen,
  isPrepared,
  onClose,
  onConfirm,
}: MomConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || submitting) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !meal) return null;

  const handleExecute = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Failed to confirm meal status:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border-2 border-[#dfc0b7] shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Accent Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 ${
            isPrepared
              ? "bg-gradient-to-r from-[#a43716] to-[#8b716a]"
              : "bg-gradient-to-r from-[#52652a] via-[#748c3d] to-[#d4eca2]"
          }`}
        />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  isPrepared ? "bg-[#a43716]" : "bg-[#52652a] animate-pulse"
                }`}
              />
              <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#52652a]">
                {isPrepared ? "Meal Status Update" : "Confirm Kitchen Prep"}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-9 h-9 rounded-full bg-[#fcf2e6] hover:bg-[#dfc0b7] text-[#1f1b14] flex items-center justify-center text-lg font-bold transition-all disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Heading & Explanation */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1f1b14] leading-snug">
              {isPrepared ? "Mark Meal as Not Prepared?" : "Confirm Meal Prepared?"}
            </h2>
            <p className="text-sm sm:text-base text-[#58423c] font-medium mt-2 leading-relaxed">
              {isPrepared
                ? "This will uncheck the meal and mark it back to pending in your son's schedule."
                : "Confirming this will mark the meal as prepared in the kitchen and record it as eaten in your son's daily schedule."}
            </p>
          </div>

          {/* Meal Details Box (Super Legible for Mom) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#fcf2e6] border-2 border-[#dfc0b7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-base sm:text-lg font-extrabold text-[#a43716]">
                {meal.time}
              </span>
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white text-[#58423c] border border-[#dfc0b7]">
                {meal.mealType}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-serif font-black text-[#1f1b14]">
              {meal.title}
            </h3>

            {meal.components && meal.components.length > 0 && (
              <div className="pt-2 border-t border-[#dfc0b7]/70 space-y-1.5">
                <span className="text-xs font-bold text-[#8b716a] uppercase tracking-wider block">
                  Ingredients:
                </span>
                <div className="flex flex-wrap gap-2">
                  {meal.components.map((comp, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#dfc0b7] text-xs sm:text-sm font-semibold text-[#1f1b14]"
                    >
                      <span>•</span>
                      <span>{comp.name}</span>
                      {(comp.quantity || comp.unit) && (
                        <span className="text-[#a43716] font-mono font-bold">
                          ({comp.quantity} {comp.unit})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Big Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-4 px-4 rounded-2xl bg-white hover:bg-[#fcf2e6] text-[#58423c] border-2 border-[#dfc0b7] text-sm sm:text-base font-bold transition-all disabled:opacity-50 active:scale-95"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecute}
              disabled={submitting}
              className={`py-4 px-4 rounded-2xl text-white text-sm sm:text-base font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 ${
                isPrepared
                  ? "bg-[#a43716] hover:bg-[#832c12] shadow-[#a43716]/25"
                  : "bg-[#52652a] hover:bg-[#3f4f20] shadow-[#52652a]/25"
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isPrepared ? (
                <span>Mark Pending ↩</span>
              ) : (
                <span>Confirm Prepared ✓</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
