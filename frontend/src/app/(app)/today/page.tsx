"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { TodayOccurrence, DailyStats } from "@/lib/domain/types";
import { TodayHeroHeader } from "@/components/today/TodayHeroHeader";
import { QuickLogBar } from "@/components/today/QuickLogBar";
import { ExecutionTimeline } from "@/components/today/ExecutionTimeline";
import { MacroLedger } from "@/components/today/MacroLedger";
import { MomKitchenHub } from "@/components/today/MomKitchenHub";
import { HydrationWidget } from "@/components/today/HydrationWidget";
import { SwapModal } from "@/components/today/SwapModal";
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
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [waterIntakeMl, setWaterIntakeMl] = useState(0);
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

  // Fast optimistic action handlers with micro-feedback
  const handleComplete = async (id: string) => {
    const targetItem = occurrences.find((o) => o.id === id);
    const prevItems = occurrences;

    setOccurrences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "COMPLETED" } : item))
    );

    const proteinBonus = targetItem?.nutrition?.protein ? ` (+${targetItem.nutrition.protein}g Protein)` : "";
    toast.success(`Completed "${targetItem?.title || "Routine item"}"${proteinBonus} ✓`, "Routine Executed");

    try {
      const res = await fetch(`/api/occurrences/${id}/complete`, { method: "POST" });
      if (!res.ok) {
        setOccurrences(prevItems);
        toast.error("Failed to sync completion with server. Rolled back.", "Network Error");
      } else {
        refreshData();
      }
    } catch {
      setOccurrences(prevItems);
      toast.error("Network issue. Rolled back completion.", "Connection Error");
    }
  };

  const handleUndo = async (id: string) => {
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
        refreshData();
      }
    } catch {
      setOccurrences(prevItems);
    }
  };

  const handleSkip = async (id: string) => {
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
        refreshData();
      }
    } catch {
      setOccurrences(prevItems);
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
        refreshData();
      }
    } catch {
      refreshData();
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
        const json = await res.json();
        if (json.waterIntakeMl !== undefined) {
          setWaterIntakeMl(json.waterIntakeMl);
        }
      }
    } catch (err) {
      console.error("Hydration sync error:", err);
    }
  };

  // Metrics computation
  const completedCount = occurrences.filter((o) => o.status === "COMPLETED").length;
  const totalCount = occurrences.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const ringCircumference = 2 * Math.PI * 26;
  const ringOffset = ringCircumference - (completionPercentage / 100) * ringCircumference;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#dfc0b7] border-t-[#a43716] rounded-full animate-spin" />
        <p className="text-sm font-serif italic text-[#58423c]">Harvesting routine telemetry...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* Hero Summary Strip */}
      <TodayHeroHeader
        dateStr={dateStr}
        completionPercentage={completionPercentage}
        completedCount={completedCount}
        totalCount={totalCount}
        ringCircumference={ringCircumference}
        ringOffset={ringOffset}
        onQuickLog={handleQuickChatSubmit}
      />

      {/* Natural Entry Quick-Log Bar */}
      <div className="max-w-2xl">
        <QuickLogBar
          quickText={quickText}
          submittingQuick={submittingQuick}
          onTextChange={setQuickText}
          onSubmit={handleQuickChatSubmit}
        />
      </div>

      {/* Panoramic Triple/Double-Column Layout matching desktop-suite.html */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Column A (7 Cols): Chronological Timeline Ledger */}
        <div className="lg:col-span-7">
          <ExecutionTimeline
            occurrences={occurrences}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onComplete={handleComplete}
            onUndo={handleUndo}
            onSkip={handleSkip}
            onOpenSwapModal={setSwapModalItem}
          />
        </div>

        {/* Column B (5 Cols): Intelligence, Metabolic & Hearth */}
        <aside className="lg:col-span-5 flex flex-col gap-6">
          <MacroLedger
            currentCalories={stats?.nutrition?.calories || 0}
            targetCalories={1800}
            currentProtein={stats?.nutrition?.protein || 0}
            targetProtein={150}
            currentCarbs={stats?.nutrition?.carbs || 0}
            targetCarbs={160}
            currentFat={stats?.nutrition?.fat || 0}
            targetFat={45}
          />

          <MomKitchenHub
            queuedCount={occurrences.filter((o) => o.category === "MEAL" && o.status === "PENDING").length}
          />

          <HydrationWidget
            waterIntakeMl={waterIntakeMl}
            targetMl={3000}
            onAddWater={handleAddWater}
          />
        </aside>
      </div>

      {/* Meal Substitution Modal */}
      <SwapModal
        item={swapModalItem}
        onClose={() => setSwapModalItem(null)}
        onConfirm={handleSwapConfirm}
      />
    </div>
  );
}
