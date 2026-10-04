"use client";

import type { TodayOccurrence } from "@/lib/domain/types";

interface SwapModalProps {
  item: TodayOccurrence | null;
  onClose: () => void;
  onConfirm: (occurrenceId: string, alternativeItemId: string) => void;
}

export function SwapModal({ item, onClose, onConfirm }: SwapModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-[#dfc0b7] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#eae1d5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a43716]">
              Meal Substitution
            </span>
            <h3 className="text-lg font-serif font-bold text-[#1f1b14] mt-0.5">Select Alternative</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8b716a] hover:text-[#1f1b14] text-lg p-1"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#58423c] mt-3">
          Replacing <strong className="text-[#1f1b14]">&quot;{item.title}&quot;</strong>. Macro targets will adjust automatically:
        </p>

        <div className="space-y-2.5 mt-4 max-h-72 overflow-y-auto pr-1">
          {item.alternatives && item.alternatives.length > 0 ? (
            item.alternatives.map((alt) => (
              <button
                key={alt.id}
                type="button"
                onClick={() => onConfirm(item.id, alt.itemId)}
                className="btn-spring w-full text-left p-3.5 rounded-xl bg-[#fcf2e6] hover:bg-[#f6ede0] border border-[#dfc0b7] hover:border-[#a43716]/40 text-[#1f1b14] transition-all group"
              >
                <div className="flex items-center justify-between font-semibold text-sm">
                  <span className="group-hover:text-[#a43716]">{alt.title}</span>
                  <span className="text-xs text-[#a43716] group-hover:translate-x-0.5 transition-transform font-bold">
                    Select →
                  </span>
                </div>
                <div className="text-[11px] text-[#58423c] font-mono mt-1">
                  Nutritionally equivalent healthy choice
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-[#fcf2e6] text-center text-xs text-[#8b716a]">
              No registered alternative items found.
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-spring px-4 py-2 rounded-xl text-xs font-semibold text-[#58423c] hover:text-[#1f1b14] bg-[#f0e7db] border border-[#dfc0b7]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
