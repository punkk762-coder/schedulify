"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const handleSeedSampleRoutine = async () => {
    setSeeding(true);
    setSeedMessage(null);

    const sampleRoutine = `10:15 AM - Breakfast: Chocolate Proats (50g Oats, 1 scoop Whey, 200ml Almond milk) - 380 kcal, 32g protein, 45g carbs, 8g fat
12:30 PM - Lunch: 2 Phulkas, Cabbage-Capsicum Sabzi, Large Green Salad, 150g Dahi - 420 kcal, 14g protein, 55g carbs, 12g fat
5:30 PM - Evening Snack: Kala Chana (boiled 100g) - 180 kcal, 10g protein, 28g carbs, 3g fat
7:00 PM - Dinner: Paneer Bhurji (100g Paneer), 2 Phulkas, Fresh Salad - 450 kcal, 22g protein, 35g carbs, 20g fat
8:00 PM - 1-hour Evening Walk
11:30 PM - Bedtime: Warm Turmeric Milk / Chamomile - 120 kcal, 4g protein, 10g carbs, 5g fat`;

    try {
      // 1. Parse
      const parseRes = await fetch("/api/plans/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", text: sampleRoutine }),
      });
      const parseData = await parseRes.json();

      if (parseData.proposal) {
        // 2. Commit
        const commitRes = await fetch("/api/plans/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "commit", proposal: parseData.proposal }),
        });
        if (commitRes.ok) {
          setSeedMessage("Default routine loaded! Check your Today screen.");
        }
      }
    } catch (err) {
      console.error("Failed to seed sample routine:", err);
      setSeedMessage("Failed to load sample routine.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-6 text-[#1f1b14]">
      {/* Header */}
      <div>
        <span className="text-xs font-bold tracking-wider uppercase text-[#52652a]">
          Preferences &amp; System
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#1f1b14] mt-0.5">Settings</h1>
        <p className="text-xs text-[#58423c]">Configure your Mediterranean Routine Protocol</p>
      </div>

      <div className="space-y-4">
        {/* Account info */}
        <div className="p-5 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-[#8b716a] uppercase tracking-wider">Account &amp; Role</h2>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#58423c]">Active Role</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] font-semibold">
              PRIMARY USER
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#dfc0b7]/50">
            <span className="text-[#58423c]">Timezone</span>
            <span className="text-[#1f1b14] font-mono font-medium">Asia/Kolkata</span>
          </div>
        </div>

        {/* Quick Routine Load */}
        <div className="p-5 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-[#8b716a] uppercase tracking-wider">Demo &amp; Routine Setup</h2>
          <p className="text-xs text-[#58423c]">
            One-click load the Monday–Sunday Nutrition &amp; Workout Routine into your active schedule.
          </p>

          {seedMessage && (
            <p className="text-xs font-semibold text-[#52652a] animate-pulse">{seedMessage}</p>
          )}

          <button
            type="button"
            onClick={handleSeedSampleRoutine}
            disabled={seeding}
            className="w-full py-2.5 rounded-full bg-[#a43716] hover:bg-[#862201] text-white text-xs font-semibold transition-all active:scale-98 disabled:opacity-40 shadow-xs"
          >
            {seeding ? "Loading Routine..." : "Load Default Routine (Proats, Lunch, Chana, Dinner, Walk)"}
          </button>
        </div>

        {/* PWA & System */}
        <div className="p-5 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-[#8b716a] uppercase tracking-wider">PWA &amp; Device</h2>
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-[#1f1b14] block">Installable App</span>
              <span className="text-[11px] text-[#58423c]">Add Schedulfy to your phone home screen</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4eca2] text-[#141f00] border border-[#52652a]/30 font-semibold">
              Ready
            </span>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 rounded-full bg-[#ffdad6] hover:bg-[#ffb5a0] text-[#93000a] border border-[#ba1a1a]/20 text-xs font-semibold transition-all active:scale-98 shadow-xs"
          >
            Sign Out / Exit Session
          </button>
        </div>
      </div>
    </div>
  );
}
