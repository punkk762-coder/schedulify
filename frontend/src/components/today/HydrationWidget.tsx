"use client";

interface HydrationWidgetProps {
  waterIntakeMl: number;
  targetMl?: number;
  onAddWater: (deltaMl: number) => void;
}

export function HydrationWidget({
  waterIntakeMl,
  targetMl = 3000,
  onAddWater,
}: HydrationWidgetProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#dfc0b7] shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#0284c7]/10 border border-[#0284c7]/30 flex items-center justify-center text-[#0284c7] text-lg">
          💧
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7] block">
            Hydration Status
          </span>
          <span className="text-sm font-bold text-[#1f1b14] block font-mono">
            {waterIntakeMl.toLocaleString()} / {targetMl.toLocaleString()} ml
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAddWater(250)}
        className="px-3.5 py-1.5 rounded-full bg-[#0284c7] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
      >
        + 250ml
      </button>
    </div>
  );
}
