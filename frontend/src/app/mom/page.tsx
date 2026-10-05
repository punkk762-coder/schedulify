"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { KitchenMeal } from "@/lib/domain/types";
import { MomDesktopView } from "@/components/mom/MomDesktopView";
import { MomMobileView } from "@/components/mom/MomMobileView";
import { MomDeckSkeleton } from "@/components/ui/BoneyardSkeleton";

export default function MomKitchenPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<KitchenMeal[]>([]);
  const [dateStr, setDateStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [preparedMap, setPreparedMap] = useState<Record<number, boolean>>({});
  const [pendingPreparedIndex, setPendingPreparedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchKitchen = async () => {
      try {
        const res = await fetch("/api/mom/kitchen");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.meals) {
          setMeals(data.meals);
          setDateStr(data.date);
        }
      } catch (err) {
        console.error("Failed to load mom kitchen:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKitchen();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const togglePrepared = async (index: number) => {
    if (pendingPreparedIndex === index) return;
    setPendingPreparedIndex(index);
    try {
      setPreparedMap((prev) => ({
        ...prev,
        [index]: !prev[index],
      }));
      await new Promise((r) => setTimeout(r, 350));
    } finally {
      setPendingPreparedIndex(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen text-[#1f1b14] p-3.5 sm:p-8 max-w-6xl mx-auto">
        <MomDeckSkeleton />
      </main>
    );
  }

  return (
    <main className="min-h-screen text-[#1f1b14] p-3.5 sm:p-8 max-w-6xl mx-auto">
      {/* Desktop Clean Executive View (lg+) */}
      <div className="hidden lg:block">
        <MomDesktopView
          meals={meals}
          dateStr={dateStr}
          preparedMap={preparedMap}
          pendingPreparedIndex={pendingPreparedIndex}
          onTogglePrepared={togglePrepared}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Magnificent Hearth View (< lg) */}
      <div className="block lg:hidden">
        <MomMobileView
          meals={meals}
          dateStr={dateStr}
          preparedMap={preparedMap}
          pendingPreparedIndex={pendingPreparedIndex}
          onTogglePrepared={togglePrepared}
          onLogout={handleLogout}
        />
      </div>
    </main>
  );
}
