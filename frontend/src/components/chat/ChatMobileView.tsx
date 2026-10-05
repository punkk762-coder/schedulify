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
      {/* ─── Mobile Header ─── */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#dfc0b7] shadow-xs flex items-center justify-between shrink-0 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ffdbd1] text-[#a43716] flex items-center justify-center text-lg shrink-0">
            🤖
          </div>
          <div>
            <h2 className="text-xs font-serif font-bold text-[#1f1b14]">AI Coach Studio</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#52652a] animate-pulse" />
              <span className="text-[10px] font-mono text-[#52652a] font-bold">Online • Flash 3.5</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenImport}
          className="px-3 py-1.5 rounded-xl bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] text-[11px] font-bold active:scale-95 transition-all"
        >
          📋 Import
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
            className="px-3 py-1 rounded-full bg-white border border-[#dfc0b7] text-[11px] font-medium text-[#58423c] whitespace-nowrap active:scale-95 shadow-2xs shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* ─── Mobile Input Form ─── */}
      <form
        onSubmit={onSendMessage}
        className="bg-white rounded-2xl p-2 border border-[#dfc0b7] shadow-xs flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message AI Coach..."
          className="flex-1 bg-transparent px-2 text-xs text-[#1f1b14] placeholder-[#8b716a] outline-none font-medium"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-3.5 py-1.5 bg-[#a43716] active:scale-95 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all shrink-0 shadow-2xs"
        >
          Send
        </button>
      </form>
    </div>
  );
}
