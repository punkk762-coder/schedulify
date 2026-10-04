import React from "react";

interface QuickLogBarProps {
  quickText: string;
  setQuickText?: (text: string) => void;
  onTextChange?: (text: string) => void;
  submittingQuick: boolean;
  onQuickSubmit?: (textToSend: string) => void;
  onSubmit?: (textToSend: string) => void;
  quickChips?: string[];
}

const DEFAULT_CHIPS = [
  "Walked 60 mins",
  "Ate evening snack",
  "Had whey protein shake",
  "Drank 500ml water",
];

export const QuickLogBar: React.FC<QuickLogBarProps> = ({
  quickText,
  setQuickText,
  onTextChange,
  submittingQuick,
  onQuickSubmit,
  onSubmit,
  quickChips = DEFAULT_CHIPS,
}) => {
  const handleChange = onTextChange || setQuickText || (() => {});
  const handleSubmit = onSubmit || onQuickSubmit || (() => {});

  return (
    <div className="space-y-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(quickText);
        }}
        className="relative flex items-center"
      >
        <span className="absolute left-4 text-xs font-semibold text-[#a43716] pointer-events-none">
          ⚡
        </span>
        <input
          type="text"
          value={quickText}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Tell Schedulfy what happened... (e.g. 'walked 60 mins', 'had whey shake')"
          className="w-full pl-9 pr-12 py-3 rounded-2xl bg-white text-xs text-[#1f1b14] placeholder-[#8b716a] focus:outline-none focus:border-[#a43716] border border-[#dfc0b7] shadow-xs"
        />
        <button
          type="submit"
          disabled={!quickText.trim() || submittingQuick}
          className="absolute right-2 h-8 w-8 rounded-xl bg-[#a43716] hover:bg-[#862201] active:scale-95 disabled:opacity-40 disabled:hover:bg-[#a43716] text-white flex items-center justify-center transition-all shadow-2xs"
          title="Send"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b716a] shrink-0 font-mono">
          Quick Log:
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSubmit(chip)}
            disabled={submittingQuick}
            className="shrink-0 px-3 py-1 rounded-full bg-[#fcf2e6] hover:bg-white text-[#58423c] hover:text-[#1f1b14] border border-[#dfc0b7] text-[11px] font-medium transition-all shadow-2xs active:scale-95"
          >
            + {chip}
          </button>
        ))}
      </div>
    </div>
  );
};
