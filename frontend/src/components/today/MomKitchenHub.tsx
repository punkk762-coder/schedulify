"use client";

import { useRouter } from "next/navigation";

interface MomKitchenHubProps {
  queuedCount?: number;
}

export function MomKitchenHub({ queuedCount = 3 }: MomKitchenHubProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍲</span>
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1f1b14]">Mom&apos;s Kitchen Sync</h3>
            <span className="text-[11px] text-[#52652a] font-medium">Household Dispatch Active</span>
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] font-bold">
          {queuedCount} Queued
        </span>
      </div>

      <div className="mt-3.5 space-y-2.5 text-xs">
        <div className="p-3 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] flex items-center justify-between">
          <div>
            <span className="font-bold text-[#1f1b14] block">12:30 PM Lunch</span>
            <span className="text-[#58423c]">2 Phulkas, Cabbage Sabzi, Curd</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#d4eca2] text-[#3b4d14] font-semibold text-[10px] border border-[#52652a]/30">
            Prepping 🟢
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#dfc0b7] flex items-center justify-between">
          <div>
            <span className="font-bold text-[#1f1b14] block">05:30 PM Kala Chana</span>
            <span className="text-[#58423c]">100g Boiled, Lemon &amp; Chaat</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#fcf2e6] text-[#58423c] text-[10px]">
            Pending
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/mom")}
        className="w-full mt-4 py-2.5 rounded-full bg-[#fcf2e6] hover:bg-[#a43716] hover:text-white text-[#a43716] border border-[#dfc0b7] text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
      >
        <span>Open Full Hearth Station Board</span>
        <span>→</span>
      </button>
    </div>
  );
}
