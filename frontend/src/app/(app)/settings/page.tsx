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
      const parseRes = await fetch("/api/plans/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", text: sampleRoutine }),
      });
      const parseData = await parseRes.json();

      if (parseData.proposal) {
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
    <div className="w-full space-y-6 text-[#1f1b14] pb-20">
      {/* Header */}
      <header className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              System Configuration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1f1b14]">Preferences &amp; Account</h1>
          <p className="text-xs text-[#58423c] mt-0.5">Manage your Mediterranean Routine Protocol and credentials</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-[#ffdad6] hover:bg-[#ffb5a0] text-[#93000a] border border-[#ba1a1a]/20 text-xs font-bold transition-all active:scale-95 shadow-xs shrink-0"
        >
          Sign Out / Exit
        </button>
      </header>

      {/* Grid Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#8b716a] uppercase tracking-wider block">
            Role &amp; Security
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#58423c] font-medium">Session Role</span>
            <span className="px-3 py-1 rounded-full bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] font-bold font-mono text-[11px]">
              PRIMARY USER
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#dfc0b7]/50">
            <span className="text-[#58423c] font-medium">Active Timezone</span>
            <span className="text-[#1f1b14] font-mono font-semibold">Asia/Kolkata</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#dfc0b7]/50">
            <span className="text-[#58423c] font-medium">Database Persistence</span>
            <span className="text-[#52652a] font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#52652a]" />
              Supabase IPv4 Pooler
            </span>
          </div>
        </div>

        {/* Demo & Routine Loader */}
        <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#8b716a] uppercase tracking-wider block">
            Protocol Initialization
          </span>
          <p className="text-xs text-[#58423c]">
            One-click reloads the complete Mediterranean Routine (Proats, Lunch, Kala Chana, Dinner, Evening Walk, Bedtime Milk).
          </p>

          {seedMessage && (
            <p className="text-xs font-semibold text-[#52652a] animate-pulse bg-[#f7faef] p-2 rounded-xl border border-[#52652a]/20">
              {seedMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSeedSampleRoutine}
            disabled={seeding}
            className="w-full py-2.5 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs"
          >
            {seeding ? "Importing Routine..." : "Load Default 7-Day Routine"}
          </button>
        </div>
      </div>
    </div>
  );
}
