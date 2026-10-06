"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { KitchenMeal } from "@/lib/domain/types";
import { MomDesktopView } from "@/components/mom/MomDesktopView";
import { MomMobileView } from "@/components/mom/MomMobileView";
import { MomConfirmModal } from "@/components/mom/MomConfirmModal";
import { MomDeckSkeleton } from "@/components/ui/BoneyardSkeleton";

export default function MomKitchenPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<KitchenMeal[]>([]);
  const [dateStr, setDateStr] = useState("");
  const [dateKey, setDateKey] = useState("");
  const [isToday, setIsToday] = useState(true);
  const [isTomorrow, setIsTomorrow] = useState(false);
  const [isYesterday, setIsYesterday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preparedMap, setPreparedMap] = useState<Record<string, boolean>>({});
  const [pendingPreparedKey, setPendingPreparedKey] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmingMeal, setConfirmingMeal] = useState<{
    meal: KitchenMeal;
    index: number;
    isPrepared: boolean;
  } | null>(null);

  const fetchKitchen = useCallback(async (targetDateKey?: string) => {
    setLoading(true);
    try {
      const url = targetDateKey
        ? `/api/mom/kitchen?date=${encodeURIComponent(targetDateKey)}`
        : "/api/mom/kitchen";
      const res = await fetch(url);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.meals) {
        setMeals(data.meals);
        setDateStr(data.date);
        setDateKey(data.dateKey || targetDateKey || "");
        setIsToday(Boolean(data.isToday));
        setIsTomorrow(Boolean(data.isTomorrow));
        setIsYesterday(Boolean(data.isYesterday));

        // Sync initial prepared state from database occurrences
        const initialPrepared: Record<string, boolean> = {};
        data.meals.forEach((m: KitchenMeal, idx: number) => {
          const key = m.id || String(idx);
          if (m.isPrepared || m.status === "COMPLETED") {
            initialPrepared[key] = true;
          }
        });
        setPreparedMap(initialPrepared);
      }
    } catch (err) {
      console.error("Failed to load mom kitchen:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchKitchen();
  }, [fetchKitchen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  // Date navigation helpers
  const handleSelectDate = (newDateKey: string) => {
    fetchKitchen(newDateKey);
  };

  const shiftDays = (days: number) => {
    if (!dateKey) {
      fetchKitchen();
      return;
    }
    const [y, m, d] = dateKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, "0");
    const nextD = String(dateObj.getDate()).padStart(2, "0");
    const nextKey = `${nextY}-${nextM}-${nextD}`;
    fetchKitchen(nextKey);
  };

  const handlePrevDay = () => shiftDays(-1);
  const handleNextDay = () => shiftDays(1);
  const handleToday = () => fetchKitchen();
  const handleTomorrow = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    fetchKitchen(`${y}-${m}-${d}`);
  };

  // Trigger confirm popup when clicking checkbox or mark button
  const handleOpenConfirmMeal = (meal: KitchenMeal, index: number) => {
    const key = meal.id || String(index);
    const currentPrepared = Boolean(preparedMap[key]);
    setConfirmingMeal({
      meal,
      index,
      isPrepared: currentPrepared,
    });
  };

  // Executed when confirmed in popup
  const handleExecuteToggle = async () => {
    if (!confirmingMeal) return;
    const { meal, index, isPrepared } = confirmingMeal;
    const key = meal.id || String(index);

    if (pendingPreparedKey === key) return;
    setPendingPreparedKey(key);

    const prevMap = preparedMap;
    const targetStatus = !isPrepared;

    // Optimistic UI update
    setPreparedMap((prev) => ({
      ...prev,
      [key]: targetStatus,
    }));
    setMeals((prev) =>
      prev.map((m, i) =>
        i === index
          ? {
              ...m,
              isPrepared: targetStatus,
              status: targetStatus ? "COMPLETED" : "PENDING",
            }
          : m
      )
    );

    try {
      if (meal.id) {
        const res = await fetch("/api/mom/kitchen/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ occurrenceId: meal.id }),
        });

        if (res.ok) {
          const data = await res.json();
          setPreparedMap((prev) => ({
            ...prev,
            [key]: data.isPrepared,
          }));
          setMeals((prev) =>
            prev.map((m, i) =>
              i === index
                ? {
                    ...m,
                    isPrepared: data.isPrepared,
                    status: data.status,
                  }
                : m
            )
          );
        } else {
          // Rollback on server error
          setPreparedMap(prevMap);
        }
      }
    } catch (err) {
      console.error("Failed to toggle prepared state:", err);
      setPreparedMap(prevMap);
    } finally {
      setPendingPreparedKey(null);
    }
  };

  if (loading && meals.length === 0) {
    return (
      <main className="min-h-screen text-[#1f1b14] px-2.5 py-3 sm:px-6 sm:py-8 max-w-5xl mx-auto">
        <MomDeckSkeleton />
      </main>
    );
  }

  return (
    <main className="min-h-screen text-[#1f1b14] px-2.5 py-3 sm:px-6 sm:py-8 max-w-5xl mx-auto">
      {/* Desktop Clean Executive View (lg+) */}
      <div className="hidden lg:block">
        <MomDesktopView
          meals={meals}
          dateStr={dateStr}
          dateKey={dateKey}
          isToday={isToday}
          isTomorrow={isTomorrow}
          isYesterday={isYesterday}
          preparedMap={preparedMap}
          pendingPreparedKey={pendingPreparedKey}
          onOpenConfirmMeal={handleOpenConfirmMeal}
          onSelectDate={handleSelectDate}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onToday={handleToday}
          onTomorrow={handleTomorrow}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Magnificent Hearth View (< lg) */}
      <div className="block lg:hidden">
        <MomMobileView
          meals={meals}
          dateStr={dateStr}
          dateKey={dateKey}
          isToday={isToday}
          isTomorrow={isTomorrow}
          isYesterday={isYesterday}
          preparedMap={preparedMap}
          pendingPreparedKey={pendingPreparedKey}
          onOpenConfirmMeal={handleOpenConfirmMeal}
          onSelectDate={handleSelectDate}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onToday={handleToday}
          onTomorrow={handleTomorrow}
          onLogout={handleLogout}
        />
      </div>

      {/* Confirmation Pop-up for Ticking / Changing Meal Prep */}
      <MomConfirmModal
        meal={confirmingMeal?.meal || null}
        isOpen={Boolean(confirmingMeal)}
        isPrepared={Boolean(confirmingMeal?.isPrepared)}
        onClose={() => setConfirmingMeal(null)}
        onConfirm={handleExecuteToggle}
      />
    </main>
  );
}
