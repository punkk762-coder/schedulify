"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { TodayOccurrence } from "@/lib/domain/types";

interface DifferentMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  occurrences?: TodayOccurrence[];
}

export function DifferentMealModal({
  isOpen,
  onClose,
  onSaved,
  occurrences = [],
}: DifferentMealModalProps) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [mealSlot, setMealSlot] = useState("Snack");
  const [calories, setCalories] = useState<number | string>("");
  const [protein, setProtein] = useState<number | string>("");
  const [carbs, setCarbs] = useState<number | string>("");
  const [fat, setFat] = useState<number | string>("");
  const [notes, setNotes] = useState("");
  const [replacesOccurrenceId, setReplacesOccurrenceId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const quickPresets = [
    { title: "Outside Biryani / Rice Plate", cal: 650, p: 25, c: 80, f: 22, slot: "Dinner" },
    { title: "Pizza Slice & Drink", cal: 520, p: 18, c: 65, f: 20, slot: "Dinner" },
    { title: "Samosa / Fried Snack (2 pcs)", cal: 380, p: 6, c: 45, f: 18, slot: "Snack" },
    { title: "Protein Bar / Shake", cal: 240, p: 24, c: 22, f: 7, slot: "Snack" },
    { title: "Dessert / Pastry / Sweet", cal: 360, p: 4, c: 52, f: 16, slot: "Dinner" },
  ];

  const handleApplyPreset = (p: typeof quickPresets[0]) => {
    setTitle(p.title);
    setCalories(p.cal);
    setProtein(p.p);
    setCarbs(p.c);
    setFat(p.f);
    setMealSlot(p.slot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter food title / description");
      return;
    }
    if (!calories || Number(calories) <= 0) {
      toast.error("Please enter estimated calories");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/today/different-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          mealSlot,
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
          notes: notes.trim(),
          replacesOccurrenceId: replacesOccurrenceId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to log different food");
      }

      toast.success(
        `Logged off-plan food: "${title.trim()}" (+${calories} kcal) ⚡`,
        "Deviation Recorded"
      );
      onSaved();
      onClose();
      // Reset form
      setTitle("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setNotes("");
      setReplacesOccurrenceId("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save off-plan food", "Log Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#fffdfa] rounded-3xl border border-[#dfc0b7] shadow-2xl p-6 text-[#1f1b14] space-y-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#dfc0b7]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ba1a1a]">
                ⚡ Log Something Different / Off-Plan
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1f1b14] mt-0.5">
              Record Off-Plan Meal or Snack
            </h2>
            <p className="text-xs text-[#58423c] mt-0.5">
              Mention anything you ate outside your planned routine. Calories and macros will be audited in Analytics &amp; Calendar.
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

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a] block">
            Quick Suggestions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 rounded-lg bg-[#fcf2e6] hover:bg-[#faebd9] border border-[#dfc0b7] text-[11px] font-medium text-[#58423c] transition-colors"
              >
                + {p.title} ({p.cal} kcal)
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Food Title */}
          <div className="space-y-1">
            <label className="font-bold text-[#1f1b14] block">What did you eat / drink? *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2 Slices Veggie Pizza, Gulab Jamun, Chocolate Milkshake"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#ba1a1a]"
              required
            />
          </div>

          {/* Meal Slot */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#1f1b14] block">Meal Timing / Slot</label>
            <div className="flex flex-wrap gap-1.5">
              {["Breakfast", "Lunch", "Evening Snack", "Dinner", "Late Night", "Extra"].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setMealSlot(slot)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    mealSlot === slot
                      ? "bg-[#ba1a1a] text-white border-[#ba1a1a] shadow-2xs"
                      : "bg-white text-[#58423c] border-[#dfc0b7] hover:bg-[#fcf2e6]"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Nutritional Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7]">
            <div>
              <label className="block text-[10px] font-mono text-[#ba1a1a] font-bold mb-1">
                Calories (kcal) *
              </label>
              <input
                type="number"
                step="10"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g. 450"
                className="w-full px-2 py-1.5 rounded-lg border border-[#ba1a1a] bg-white font-mono font-bold text-sm text-[#ba1a1a]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#58423c] mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="e.g. 15"
                className="w-full px-2 py-1.5 rounded-lg border border-[#dfc0b7] bg-white font-mono text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#58423c] mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-2 py-1.5 rounded-lg border border-[#dfc0b7] bg-white font-mono text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#58423c] mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="e.g. 14"
                className="w-full px-2 py-1.5 rounded-lg border border-[#dfc0b7] bg-white font-mono text-sm font-semibold"
              />
            </div>
          </div>

          {/* Optional: Did this replace a scheduled routine item? */}
          {occurrences.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-[#1f1b14] block">
                Did this replace one of your planned routine items? (Optional)
              </label>
              <select
                value={replacesOccurrenceId}
                onChange={(e) => setReplacesOccurrenceId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dfc0b7] bg-white text-xs font-medium"
              >
                <option value="">No, this was an extra meal / unplanned food</option>
                {occurrences
                  .filter((o) => o.category === "MEAL")
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      Replaced: {o.scheduledTime} — {o.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Notes / Context */}
          <div className="space-y-1">
            <label className="font-bold text-[#1f1b14] block">Reason / Context</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dinner with colleagues, ate at restaurant, feeling satisfied"
              className="w-full px-3 py-2 rounded-xl border border-[#dfc0b7] bg-white text-xs"
            />
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
              className="px-5 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Log Off-Plan Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
