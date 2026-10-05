"use client";

import React, { RefObject } from "react";
import type { MessageItem } from "./ChatDesktopView";

interface ChatMobileViewProps {
  messages: MessageItem[];
  inputText: string;
  setInputText: (text: string) => void;
  loading: boolean;
  onSendMessage: (e: React.FormEvent) => void;
  onOpenImport: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onSendPreset: (text: string) => void;
}

export function ChatMobileView({
  messages,
  inputText,
  setInputText,
  loading,
  onSendMessage,
  onOpenImport,
  messagesEndRef,
  onSendPreset,
}: ChatMobileViewProps) {
  const quickPrompts = [
    "I walked 2k steps right now",
    "Set 72kgs for this october month",
    "Add 30 min morning run at 6:30 AM",
    "What is next?",
    "Show my macros",
  ];

  return (
    <div className="w-full flex flex-col h-[calc(100vh-170px)] pb-2 animate-in fade-in duration-300">
      {/* ─── Mobile iPhone Dynamic Island Header ─── */}
      <div className="bg-[#14120e] text-white rounded-full px-4 py-2.5 border border-white/20 shadow-xl flex items-center justify-between shrink-0 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-linear-to-tr from-[#a43716] via-[#d4eca2] to-[#a43716] p-0.5 flex items-center justify-center shrink-0 animate-pulse">
            <div className="w-full h-full bg-[#14120e] rounded-full flex items-center justify-center text-xs">
              ⚡
            </div>
          </div>
          <div className="truncate">
            <h2 className="text-xs font-bold text-white truncate">AI Coach Studio</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4eca2] animate-pulse" />
              <span className="text-[10px] font-mono text-[#d4eca2]">Dynamic Island Active</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenImport}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono font-bold active:scale-95 transition-all border border-white/15 flex items-center gap-1 shrink-0"
        >
          <span>⚡</span>
          <span>Intake</span>
        </button>
      </div>

      {/* ─── Messages Stream ─── */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1">
        {messages.map((m) => {
          const isUser = m.role === "USER";

          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-[#a43716] text-white font-medium rounded-br-xs"
                    : "bg-white text-[#1f1b14] border border-[#dfc0b7] rounded-bl-xs space-y-1.5"
                }`}
              >
                {!isUser && (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#a43716] block">
                    Schedulfy AI
                  </span>
                )}
                <p className="whitespace-pre-wrap">{m.content}</p>

                {m.actionType && (
                  <div className="pt-2 border-t border-[#dfc0b7]/50 flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[#52652a]">{m.actionType}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#fcf2e6] border border-[#dfc0b7] font-semibold text-[#1f1b14]">
                      {m.actionStatus || "EXECUTED"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#dfc0b7] rounded-2xl p-3 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#a43716] animate-ping" />
              <span className="text-[#58423c] font-serif italic text-xs">AI thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Floating Prompt Chips ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar shrink-0">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendPreset(p)}
            disabled={loading}
            className="px-3 py-1 rounded-full bg-white border border-[#dfc0b7] text-[11px] font-medium text-[#58423c] whitespace-nowrap active:scale-95 shadow-2xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {p}
          </button>
        ))}
      </div>

      {/* ─── Mobile iPhone Floating Input Pill ─── */}
      <form
        onSubmit={onSendMessage}
        className="bg-[#14120e]/95 backdrop-blur-2xl text-white rounded-full p-2 border border-white/20 shadow-2xl flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message AI Coach (e.g. 'I walked 2k steps')..."
          className="flex-1 bg-transparent px-3 text-xs text-white placeholder-white/50 outline-none font-medium"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-4 py-2 bg-[#a43716] active:scale-95 text-white text-xs font-bold rounded-full disabled:opacity-40 transition-all shrink-0 shadow-xs flex items-center gap-1.5"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>...</span>
            </>
          ) : (
            <>
              <span>Send</span>
              <span>↑</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
