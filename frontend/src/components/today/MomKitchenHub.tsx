"use client";

import { useRouter } from "next/navigation";
import type { TodayOccurrence } from "@/lib/domain/types";

interface MomKitchenHubProps {
  queuedCount?: number;
  meals?: TodayOccurrence[];
}

export function MomKitchenHub({ queuedCount, meals = [] }: MomKitchenHubProps) {
  const router = useRouter();
  const mealItems = meals.slice(0, 3);
  const pendingCount = queuedCount !== undefined
    ? queuedCount
    : meals.filter((m) => m.status === "PENDING").length;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍲</span>
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1f1b14]">Mom&apos;s Kitchen Sync</h3>
            <span className="text-[11px] text-[#52652a] font-medium">Household Hearth Active</span>
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] font-bold">
          {pendingCount} Queued
        </span>
      </div>

      <div className="mt-3.5 space-y-2.5 text-xs">
        {mealItems.length > 0 ? (
          mealItems.map((meal) => {
            const isCompleted = meal.status === "COMPLETED";
            const componentsSummary =
              meal.meal?.components && meal.meal.components.length > 0
                ? meal.meal.components.map((c) => c.name).join(", ")
                : undefined;

            return (
              <div
                key={meal.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                  isCompleted
                    ? "bg-[#f7faef] border-[#52652a]/30"
                    : "bg-[#fcf2e6] border-[#dfc0b7]"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-[#a43716]">
                      {meal.scheduledTime}
                    </span>
                    <span className="font-bold text-[#1f1b14] truncate block">
                      {meal.title}
                    </span>
                  </div>
                  {componentsSummary && (
                    <span className="text-[11px] text-[#58423c] truncate block mt-0.5">
                      {componentsSummary}
                    </span>
                  )}
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full font-semibold text-[10px] shrink-0 border ${
                    isCompleted
                      ? "bg-[#d4eca2] text-[#3b4d14] border-[#52652a]/30"
                      : "bg-white text-[#a43716] border-[#dfc0b7]"
                  }`}
                >
                  {isCompleted ? "Eaten ✓" : "Prepping 🟢"}
                </span>
              </div>
            );
          })
        ) : (
          <div className="p-3 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] text-center text-[#58423c]">
            No meals scheduled for today
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push("/mom")}
        className="w-full mt-4 py-2.5 rounded-full bg-[#fcf2e6] hover:bg-[#a43716] hover:text-white text-[#a43716] border border-[#dfc0b7] text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
      >
        <span>Open Mom&apos;s Hearth Station Board</span>
        <span>→</span>
      </button>
    </div>
  );
}
