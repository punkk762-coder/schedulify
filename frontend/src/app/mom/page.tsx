"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { KitchenMeal } from "@/lib/domain/types";

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

  const preparedCount = Object.values(preparedMap).filter(Boolean).length;

  return (
    <main className="min-h-screen text-[#1f1b14] p-4 sm:p-8 max-w-lg lg:max-w-5xl mx-auto pb-16">
      
      {/* Top Header */}
      <header className="p-5 sm:p-6 rounded-2xl border border-[#dfc0b7] bg-white relative overflow-hidden mb-8 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a43716]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#52652a]/5 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#52652a]">
                Household Hearth Sync • Family Prep Deck
              </span>
              <span className="text-[11px] bg-[#d4eca2] text-[#141f00] font-semibold px-2.5 py-0.5 rounded-full border border-[#52652a]/30">
                {preparedCount} / {meals.length} Prepared
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1f1b14]">
              Mom&apos;s Meal Preparation Board
            </h1>
            <p className="text-xs text-[#58423c] mt-1">{dateStr || "Today"} • Real-time synchronization active</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <Link
              href="/today"
              className="px-3.5 py-2 rounded-full bg-[#fcf2e6] hover:bg-[#f6ede0] text-[#58423c] hover:text-[#1f1b14] border border-[#dfc0b7] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap"
            >
              <span>←</span> Today
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-full bg-[#fcf2e6] hover:bg-[#f6ede0] text-[#58423c] hover:text-[#1f1b14] border border-[#dfc0b7] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap"
            >
              <span>🖨️</span> Print
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-full bg-[#ffdad6] hover:bg-[#ffb5a0] text-[#93000a] border border-[#ba1a1a]/20 text-xs font-semibold transition-all shadow-xs whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl animate-pulse bg-white/70 border border-[#dfc0b7]" />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-dashed border-[#dfc0b7] shadow-sm">
            <span className="text-4xl block mb-3">🍲</span>
            <p className="text-base font-serif font-semibold text-[#1f1b14]">No meals scheduled for today yet</p>
            <p className="text-xs text-[#58423c] mt-1">
              Meals scheduled in the daily routine will automatically appear here with exact ingredient specs.
            </p>
          </div>
        ) : (
          meals.map((meal, index) => {
            const isPrepared = Boolean(preparedMap[index]);

            return (
              <div
                key={index}
                className={`p-5 sm:p-6 rounded-2xl transition-all duration-300 border relative shadow-xs ${
                  isPrepared
                    ? "border-[#52652a]/40 bg-[#f7faef]"
                    : "border-[#dfc0b7] bg-white hover:border-[#a43716]/40"
                }`}
              >
                {/* Header: Time, Meal Type & Status Toggle */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#dfc0b7]/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#a43716] font-mono tracking-tight">
                      {meal.time}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]">
                      {meal.mealType}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePrepared(index)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                      isPrepared
                        ? "bg-[#52652a] text-white shadow-[#52652a]/20"
                        : "bg-[#fcf2e6] hover:bg-[#52652a] text-[#58423c] hover:text-white border border-[#dfc0b7]"
                    }`}
                  >
                    {isPrepared ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Prepared</span>
                      </>
                    ) : (
                      <span>Mark Prepared</span>
                    )}
                  </button>
                </div>

                {/* Meal Title */}
                <h3
                  className={`text-lg font-serif font-bold text-[#1f1b14] mt-3.5 ${
                    isPrepared ? "line-through text-[#8b716a]" : ""
                  }`}
                >
                  {meal.title}
                </h3>

                {/* Ingredients & Quantities Box */}
                {meal.components && meal.components.length > 0 && (
                  <div className="mt-4 bg-[#fcf2e6] rounded-xl p-3.5 border border-[#dfc0b7]/70 space-y-2">
                    <span className="text-[10px] font-bold text-[#8b716a] uppercase tracking-wider block">
                      Ingredients &amp; Exact Portions:
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#1f1b14]">
                      {meal.components.map((comp, cIdx) => (
                        <li key={cIdx} className="flex items-center justify-between py-0.5">
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a43716]" />
                            <span className="font-medium">{comp.name}</span>
                          </span>
                          {(comp.quantity || comp.unit) && (
                            <span className="font-mono text-[#a43716] font-semibold bg-white px-2 py-0.5 rounded border border-[#dfc0b7] text-[11px] shadow-2xs">
                              {comp.quantity} {comp.unit}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
