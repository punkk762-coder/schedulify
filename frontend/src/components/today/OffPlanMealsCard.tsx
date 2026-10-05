"use client";

import React from "react";
import { useToast } from "@/components/ui/Toast";

export interface DifferentMealItem {
  id: string;
  title: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealSlot?: string;
  notes?: string;
  time?: string;
}

interface OffPlanMealsCardProps {
  differentMeals: DifferentMealItem[];
  onOpenModal: () => void;
  onRefresh: () => void;
}

export function OffPlanMealsCard({
  differentMeals = [],
  onOpenModal,
  onRefresh,
}: OffPlanMealsCardProps) {
  const toast = useToast();

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Remove "${title}" from off-plan logs?`)) return;
    try {
      const res = await fetch(`/api/today/different-meal/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.info(`Removed "${title}"`);
        onRefresh();
      }
    } catch {
      toast.error("Failed to delete log");
    }
  };

  const totalCalories = differentMeals.reduce((acc, m) => acc + (m.calories || 0), 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#dfc0b7] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ba1a1a] block">
              Off-Plan / Different Food Logs
            </span>
            <h4 className="text-xs font-serif font-bold text-[#1f1b14]">
              {differentMeals.length > 0
                ? `${differentMeals.length} Unplanned Item${differentMeals.length > 1 ? "s" : ""} Logged (+${totalCalories} kcal)`
                : "Ate Something Different Today?"}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="px-3 py-1.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1"
        >
          <span>+</span>
          <span>Log Different Food</span>
        </button>
      </div>

      {differentMeals.length > 0 ? (
        <div className="divide-y divide-[#dfc0b7]/40 text-xs">
          {differentMeals.map((meal) => (
            <div key={meal.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-1 last:pb-0">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#1f1b14] truncate">{meal.title}</span>
                  {meal.mealSlot && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#ffdad6] text-[#93000a]">
                      {meal.mealSlot}
                    </span>
                  )}
                  {meal.time && (
                    <span className="text-[10px] font-mono text-[#8b716a]">
                      {meal.time}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-[#58423c]">
                  <span className="font-bold text-[#ba1a1a]">+{meal.calories} kcal</span>
                  {(meal.protein || meal.carbs || meal.fat) ? (
                    <span className="text-[#8b716a]">
                      • P: {meal.protein || 0}g • C: {meal.carbs || 0}g • F: {meal.fat || 0}g
                    </span>
                  ) : null}
                  {meal.notes && (
                    <span className="italic text-[#8b716a] truncate max-w-xs">
                      • &ldquo;{meal.notes}&rdquo;
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(meal.id, meal.title)}
                className="w-7 h-7 rounded-lg text-[#8b716a] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 flex items-center justify-center shrink-0 transition-colors"
                title="Remove off-plan log"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[#8b716a]">
          Everything on plan so far! If you have outside food, cheat snacks, or an unlisted meal, tap &ldquo;Log Different Food&rdquo; so your daily telemetry stays accurate.
        </p>
      )}
    </div>
  );
}
