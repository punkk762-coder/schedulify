"use client";

import React from "react";
import type { TodayOccurrence } from "@/lib/domain/types";

interface OccurrenceCardProps {
  item: TodayOccurrence;
  isNextUp?: boolean;
  isRecentlyCompleted?: boolean;
  isActionPending?: boolean;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenSwap?: (item: TodayOccurrence) => void;
}

const categoryIcons: Record<string, string> = {
  MEAL: "🍲",
  WORKOUT: "🏋️",
  SUPPLEMENT: "💊",
  HYDRATION: "💧",
  ACTIVITY: "🚶",
  OTHER: "✨",
};

export const OccurrenceCard: React.FC<OccurrenceCardProps> = ({
  item,
  isNextUp = false,
  isRecentlyCompleted = false,
  isActionPending = false,
  onComplete,
  onUndo,
  onSkip,
  onOpenSwap,
}) => {
  const isCompleted = item.status === "COMPLETED";
  const isSkipped = item.status === "SKIPPED";
  const isReplaced = item.status === "REPLACED";
  const isPending = item.status === "PENDING";

  const icon = categoryIcons[item.category] || "✨";

  // Formatted macro string or elements
  const calories = item.nutrition?.calories;
  const protein = item.nutrition?.protein;
  const carbs = item.nutrition?.carbs;
  const fat = item.nutrition?.fat;

  // Meal components summary text
  const componentsSummary =
    item.meal?.components && item.meal.components.length > 0
      ? item.meal.components.map((c) => `${c.quantity ? `${c.quantity} ` : ""}${c.name}`).join(", ")
      : undefined;

  // Case 1: COMPLETED
  if (isCompleted) {
    return (
      <div
        className={`rounded-2xl p-3.5 sm:p-5 shadow-xs flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 ${
          isRecentlyCompleted
            ? "bg-[#f7faef] border-2 border-[#52652a] shadow-md shadow-[#52652a]/15"
            : "bg-white border border-[#dfc0b7]"
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#d4eca2] border border-[#52652a]/30 flex items-center justify-center text-[#52652a] font-serif text-base sm:text-lg font-bold shrink-0">
            ✓
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#a43716]">
                {item.scheduledTime}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                {item.category}
              </span>
              {isRecentlyCompleted && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#52652a] text-white animate-pulse shadow-xs">
                  ✓ Just Completed
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-[#1f1b14] mt-0.5 truncate">
              {item.title}
            </h3>
            {componentsSummary && (
              <p className="text-xs text-[#58423c] mt-0.5 truncate">{componentsSummary}</p>
            )}
            <div className="flex items-center gap-x-2.5 gap-y-1 mt-2 text-xs text-[#58423c] font-mono flex-wrap">
              {calories ? <span className="text-[#1f1b14] font-semibold">{calories} kcal</span> : null}
              {protein ? (
                <>
                  <span>•</span>
                  <span className="text-[#52652a] font-bold">{protein}g Protein</span>
                </>
              ) : null}
              {carbs ? (
                <>
                  <span>•</span>
                  <span>{carbs}g Carbs</span>
                </>
              ) : null}
              {fat ? (
                <>
                  <span>•</span>
                  <span>{fat}g Fat</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isActionPending}
          onClick={() => onUndo(item.id)}
          title="Click to Undo"
          className="px-3 py-1.5 rounded-full bg-[#d4eca2] text-[#3b4d14] hover:bg-[#c5e688] border border-[#52652a]/30 text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isActionPending ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[#3b4d14]/40 border-t-[#3b4d14] rounded-full animate-spin" />
              <span>Restoring...</span>
            </>
          ) : (
            <>
              <span>Done ✓</span>
              <span className="text-[10px] opacity-60">↩</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Case 2: ACTIVE NEXT UP (Prominent terracotta border + action buttons)
  if (isNextUp && isPending) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#a43716]/40 shadow-xs relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 bg-[#a43716] text-white px-3 py-0.5 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider font-mono">
          NEXT UP • {item.scheduledTime}
        </div>
        <div className="flex items-start gap-3 sm:gap-4 mt-2 sm:mt-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#ffdbd1] border border-[#a43716]/30 flex items-center justify-center text-[#a43716] font-serif text-base sm:text-lg font-bold shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0 pr-28 sm:pr-32">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#a43716]">
                {item.scheduledTime}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                {item.category}
              </span>
              {item.category === "MEAL" && (
                <span className="text-[10px] font-semibold text-[#52652a] bg-[#d4eca2] px-2 py-0.5 rounded-full border border-[#52652a]/20">
                  Mom Prepping 🟢
                </span>
              )}
            </div>
            <h3 className="text-base font-serif font-bold text-[#1f1b14] mt-1">
              {item.title}
            </h3>
            {componentsSummary && (
              <p className="text-xs text-[#58423c] mt-0.5">{componentsSummary}</p>
            )}
            <div className="flex items-center gap-x-2.5 gap-y-1 mt-2.5 text-xs text-[#58423c] font-mono flex-wrap">
              {calories ? <span className="text-[#1f1b14] font-semibold">{calories} kcal</span> : null}
              {protein ? (
                <>
                  <span>•</span>
                  <span className="text-[#52652a] font-bold">{protein}g Protein</span>
                </>
              ) : null}
              {carbs ? (
                <>
                  <span>•</span>
                  <span>{carbs}g Carbs</span>
                </>
              ) : null}
              {fat ? (
                <>
                  <span>•</span>
                  <span>{fat}g Fat</span>
                </>
              ) : null}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#dfc0b7]/60 flex-wrap">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => onComplete(item.id)}
                className="px-4 py-2 rounded-full bg-[#52652a] text-white hover:bg-[#3b4d14] text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isActionPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Mark Done ✓</span>
                )}
              </button>
              {item.hasAlternatives && (
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => onOpenSwap?.(item)}
                  className="px-3.5 py-2 rounded-full bg-[#fcf2e6] text-[#1f1b14] hover:bg-white border border-[#dfc0b7] text-xs font-semibold transition-all active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Swap Meal ⇄
                </button>
              )}
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => onSkip(item.id)}
                className="px-3.5 py-2 rounded-full text-[#58423c] hover:text-[#ba1a1a] text-xs font-medium transition-all whitespace-nowrap ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActionPending ? "Skipping..." : "Skip"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: SCHEDULED / OTHER PENDING / SKIPPED / REPLACED
  return (
    <div
      className={`bg-white rounded-2xl p-3.5 sm:p-5 border border-[#dfc0b7] shadow-xs flex items-center justify-between gap-3 sm:gap-4 transition-all ${
        isSkipped ? "opacity-75 bg-[#fcf2e6]/40" : ""
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#fcf2e6] border border-[#dfc0b7] flex items-center justify-center text-[#58423c] font-serif text-base sm:text-lg font-bold shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-[#1f1b14]">
              {item.scheduledTime}
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
              {item.category}
            </span>
            {isReplaced && (
              <span className="text-[10px] font-semibold text-[#a43716] bg-[#ffdbd1] px-2 py-0.5 rounded-full">
                Substituted ⇄
              </span>
            )}
          </div>
          <h3
            className={`text-sm sm:text-base font-serif font-bold text-[#1f1b14] mt-0.5 ${
              isSkipped ? "line-through text-[#8b716a]" : ""
            }`}
          >
            {item.title}
          </h3>
          {componentsSummary && (
            <p className="text-xs text-[#58423c] mt-0.5 truncate">{componentsSummary}</p>
          )}
          <div className="flex items-center gap-x-2.5 gap-y-1 mt-2 text-xs text-[#58423c] font-mono flex-wrap">
            {calories ? <span className="text-[#1f1b14] font-semibold">{calories} kcal</span> : null}
            {protein ? (
              <>
                <span>•</span>
                <span className="text-[#52652a] font-bold">{protein}g Protein</span>
              </>
            ) : null}
            {carbs ? (
              <>
                <span>•</span>
                <span>{carbs}g Carbs</span>
              </>
            ) : null}
            {fat ? (
              <>
                <span>•</span>
                <span>{fat}g Fat</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {isSkipped ? (
          <button
            type="button"
            disabled={isActionPending}
            onClick={() => onUndo(item.id)}
            className="px-3 py-1.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7] text-xs font-semibold hover:bg-white whitespace-nowrap active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isActionPending ? (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-[#58423c]/40 border-t-[#58423c] rounded-full animate-spin" />
                <span>Restoring...</span>
              </span>
            ) : (
              "Skipped ↩"
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isActionPending}
              onClick={() => onComplete(item.id)}
              className="px-3 sm:px-3.5 py-1.5 rounded-full bg-[#fcf2e6] hover:bg-[#52652a] text-[#58423c] hover:text-white border border-[#dfc0b7] text-xs font-semibold transition-all active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isActionPending ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </span>
              ) : (
                "Done ✓"
              )}
            </button>
            {item.hasAlternatives && (
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => onOpenSwap?.(item)}
                className="px-2 py-1.5 rounded-full text-[#0284c7] hover:bg-[#e0f2fe] text-xs font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title="Swap"
              >
                ⇄
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
