"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { KitchenMeal } from "@/lib/domain/types";
import { MomDesktopView } from "@/components/mom/MomDesktopView";
import { MomMobileView } from "@/components/mom/MomMobileView";

export default function MomKitchenPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<KitchenMeal[]>([]);
  const [dateStr, setDateStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [preparedMap, setPreparedMap] = useState<Record<number, boolean>>({});

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

  const togglePrepared = (index: number) => {
    setPreparedMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) {
    return (
      <main className="min-h-screen text-[#1f1b14] p-4 sm:p-8 max-w-6xl mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#dfc0b7] border-t-[#52652a] rounded-full animate-spin" />
          <p className="text-xs font-serif text-[#58423c]">Connecting to Household Hearth...</p>
        </div>
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
          onTogglePrepared={togglePrepared}
          onLogout={handleLogout}
        />
      </div>
    </main>
  );
}
