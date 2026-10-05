"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { TodayOccurrence, DailyStats } from "@/lib/domain/types";
import { TodayDesktopView } from "@/components/today/TodayDesktopView";
import { TodayMobileView } from "@/components/today/TodayMobileView";
import { SwapModal } from "@/components/today/SwapModal";
import { CompleteConfirmationModal } from "@/components/today/CompleteConfirmationModal";
import { TodaySkeleton } from "@/components/ui/BoneyardSkeleton";
import { useToast } from "@/components/ui/Toast";

export default function TodayPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [dateStr, setDateStr] = useState("");
  const [occurrences, setOccurrences] = useState<TodayOccurrence[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [quickText, setQuickText] = useState("");
  const [submittingQuick, setSubmittingQuick] = useState(false);
  const [swapModalItem, setSwapModalItem] = useState<TodayOccurrence | null>(null);
  const [confirmingOccurrence, setConfirmingOccurrence] = useState<TodayOccurrence | null>(null);
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null);
  const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(new Set());
  const [addingWater, setAddingWater] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [waterIntakeMl, setWaterIntakeMl] = useState(0);
  const [activity, setActivity] = useState<{
    totalSteps: number;
    totalDistanceKm: number;
    totalCaloriesBurned: number;
    logs: Array<{ id: string; title: string; steps?: number; distanceKm?: number; caloriesBurned?: number; notes?: string; time?: string }>;
  } | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState<{
    month: string;
    targetWeightKg?: number;
    currentWeightKg?: number;
    dailyStepsTarget?: number;
    status: string;
    velocityNotes?: string;
  } | null>(null);
  const [recovery, setRecovery] = useState<any | null>(null);
  const [winterArc, setWinterArc] = useState<any | null>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/today", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.occurrences) {
        setOccurrences(data.occurrences);
        setStats(data.stats);
        setDateStr(data.date);
        if (data.waterIntakeMl !== undefined) {
          setWaterIntakeMl(data.waterIntakeMl);
        }
        if (data.activity) setActivity(data.activity);
        if (data.monthlyGoal) setMonthlyGoal(data.monthlyGoal);
        if (data.recovery) setRecovery(data.recovery);
        if (data.winterArc) setWinterArc(data.winterArc);
      }
    } catch (err) {
      console.error("Error refreshing today routine:", err);
    }
  }, [router]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch("/api/today");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!ignore && data.occurrences) {
          setOccurrences(data.occurrences);
          setStats(data.stats);
          setDateStr(data.date);
          if (data.waterIntakeMl !== undefined) {
            setWaterIntakeMl(data.waterIntakeMl);
          }
          if (data.activity) setActivity(data.activity);
          if (data.monthlyGoal) setMonthlyGoal(data.monthlyGoal);
          if (data.recovery) setRecovery(data.recovery);
          if (data.winterArc) setWinterArc(data.winterArc);
        }
      } catch (err) {
        console.error("Error loading today routine:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [router]);

  // Keyboard shortcut listener ('/' to focus quick log, 'Escape' to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && swapModalItem) {
        setSwapModalItem(null);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Tell Schedulfy"]') as HTMLInputElement;
        if (input) {
          input.focus();
          toast.info("Quick log focused. Press Enter to submit.");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [swapModalItem, toast]);

  // Open confirmation pop-up first before executing
  const handleRequestComplete = (id: string) => {
    const targetItem = occurrences.find((o) => o.id === id);
    if (targetItem) {
      setConfirmingOccurrence(targetItem);
    }
  };

  // Called when user clicks "Confirm Done ✓" in the modal
  const handleConfirmComplete = async (id: string) => {
    if (pendingActionIds.has(id)) return;
    setPendingActionIds((prev) => new Set(prev).add(id));

    const targetItem = occurrences.find((o) => o.id === id);
    const prevItems = occurrences;

    setOccurrences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "COMPLETED" } : item))
    );
    setRecentlyCompletedId(id);

    const proteinBonus = targetItem?.nutrition?.protein ? ` (+${targetItem.nutrition.protein}g Protein)` : "";
    toast.success(`Completed "${targetItem?.title || "Routine item"}"${proteinBonus} ✓`, "Routine Executed");

    try {
      const res = await fetch(`/api/occurrences/${id}/complete`, { method: "POST" });
      if (!res.ok) {
        setOccurrences(prevItems);
        setRecentlyCompletedId(null);
        toast.error("Failed to sync completion with server. Rolled back.", "Network Error");
      } else {
        await refreshData();
      }
    } catch {
      setOccurrences(prevItems);
      setRecentlyCompletedId(null);
      toast.error("Network issue. Rolled back completion.", "Connection Error");
    } finally {
      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUndo = async (id: string) => {
    if (pendingActionIds.has(id)) return;
    setPendingActionIds((prev) => new Set(prev).add(id));

    const targetItem = occurrences.find((o) => o.id === id);
    const prevItems = occurrences;

    setOccurrences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "PENDING" } : item))
    );

    toast.info(`Restored "${targetItem?.title || "Item"}" to pending state ↩`);

    try {
      const res = await fetch(`/api/occurrences/${id}/undo`, { method: "POST" });
      if (!res.ok) {
        setOccurrences(prevItems);
      } else {
        await refreshData();
      }
    } catch {
      setOccurrences(prevItems);
    } finally {
      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSkip = async (id: string) => {
    if (pendingActionIds.has(id)) return;
    setPendingActionIds((prev) => new Set(prev).add(id));

    const targetItem = occurrences.find((o) => o.id === id);
    const prevItems = occurrences;

    setOccurrences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "SKIPPED" } : item))
    );

    toast.warning(`Skipped "${targetItem?.title || "Item"}" for today`);

    try {
      const res = await fetch(`/api/occurrences/${id}/skip`, { method: "POST" });
      if (!res.ok) {
        setOccurrences(prevItems);
      } else {
        await refreshData();
      }
    } catch {
      setOccurrences(prevItems);
    } finally {
      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSwapConfirm = async (occurrenceId: string, alternativeItemId: string) => {
    setSwapModalItem(null);
    setOccurrences((prev) =>
      prev.map((item) => (item.id === occurrenceId ? { ...item, status: "REPLACED" } : item))
    );

    toast.success("Meal substituted with healthy alternative ⇄", "Macros Recalibrated");

    try {
      const res = await fetch(`/api/occurrences/${occurrenceId}/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alternativeItemId }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch {
      await refreshData();
    }
  };

  const handleQuickChatSubmit = async (textToSend: string) => {
    if (!textToSend.trim() || submittingQuick) return;

    setSubmittingQuick(true);
    toast.info(`Logging "${textToSend}"... ⚡`);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });
      if (res.ok) {
        setQuickText("");
        toast.success(`Logged: "${textToSend}"`, "AI Synchronized");
        await refreshData();
      }
    } catch (err) {
      console.error("Chat quick submit error:", err);
      toast.error("Failed to submit quick log");
    } finally {
      setSubmittingQuick(false);
    }
  };

  const handleAddWater = async (delta: number) => {
    if (addingWater) return;
    setAddingWater(true);

    const nextOptimistic = Math.min(6000, waterIntakeMl + delta);
    setWaterIntakeMl(nextOptimistic);
    toast.info(`Hydration logged: +${delta}ml (${nextOptimistic.toLocaleString()} / 3,000 ml) 💧`);

    try {
      const res = await fetch("/api/today/hydration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deltaMl: delta }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch {
      // rollback or keep optimistic
    } finally {
      setAddingWater(false);
    }
  };

  // Metrics computation
  const completedCount = occurrences.filter((o) => o.status === "COMPLETED").length;
  const totalCount = occurrences.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const ringCircumference = 2 * Math.PI * 26;
  const ringOffset = ringCircumference - (completionPercentage / 100) * ringCircumference;

  if (loading) {
    return <TodaySkeleton />;
  }

  return (
    <div>
      {/* Desktop Clean Executive View (lg+) */}
      <div className="hidden lg:block">
        <TodayDesktopView
          occurrences={occurrences}
          stats={stats}
          dateStr={dateStr}
          waterIntakeMl={waterIntakeMl}
          recovery={recovery}
          onUpdateRecovery={(patch) => setRecovery((prev: any) => ({ ...prev, ...patch }))}
          winterArc={winterArc}
          onRefresh={refreshData}
          activity={activity}
          monthlyGoal={monthlyGoal}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          recentlyCompletedId={recentlyCompletedId}
          onComplete={handleRequestComplete}
          onUndo={handleUndo}
          onSkip={handleSkip}
          onOpenSwapModal={setSwapModalItem}
          onAddWater={handleAddWater}
          onQuickLog={handleQuickChatSubmit}
          quickText={quickText}
          setQuickText={setQuickText}
          submittingQuick={submittingQuick}
          pendingActionIds={pendingActionIds}
          addingWater={addingWater}
        />
      </div>

      {/* Mobile Magnificent Tactile View (< lg) */}
      <div className="block lg:hidden">
        <TodayMobileView
          occurrences={occurrences}
          stats={stats}
          dateStr={dateStr}
          waterIntakeMl={waterIntakeMl}
          recovery={recovery}
          onUpdateRecovery={(patch) => setRecovery((prev: any) => ({ ...prev, ...patch }))}
          winterArc={winterArc}
          onRefresh={refreshData}
          activity={activity}
          monthlyGoal={monthlyGoal}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          recentlyCompletedId={recentlyCompletedId}
          onComplete={handleRequestComplete}
          onUndo={handleUndo}
          onSkip={handleSkip}
          onOpenSwapModal={setSwapModalItem}
          onAddWater={handleAddWater}
          onQuickLog={handleQuickChatSubmit}
          quickText={quickText}
          setQuickText={setQuickText}
          submittingQuick={submittingQuick}
          pendingActionIds={pendingActionIds}
          addingWater={addingWater}
        />
      </div>

      {/* Meal Substitution Modal */}
      <SwapModal
        item={swapModalItem}
        onClose={() => setSwapModalItem(null)}
        onConfirm={handleSwapConfirm}
      />

      {/* Protocol Execution Confirmation Modal */}
      <CompleteConfirmationModal
        item={confirmingOccurrence}
        isOpen={Boolean(confirmingOccurrence)}
        onClose={() => setConfirmingOccurrence(null)}
        onConfirm={handleConfirmComplete}
      />
    </div>
  );
}
