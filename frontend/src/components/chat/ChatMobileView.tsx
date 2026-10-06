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
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#a43716] via-[#d4eca2] to-[#a43716] p-0.5 flex items-center justify-center shrink-0 animate-pulse">
            <div className="w-full h-full bg-[#14120e] rounded-full flex items-center justify-center text-sm">
              ⚡
            </div>
          </div>
          <div className="truncate">
            <h2 className="text-sm font-bold text-white truncate">AI Coach Studio</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4eca2] animate-pulse" />
              <span className="text-xs font-mono text-[#d4eca2]">Dynamic Island Active</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenImport}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold active:scale-95 transition-all border border-white/15 flex items-center gap-1 shrink-0"
        >
          <span>⚡</span>
          <span>Intake</span>
        </button>
      </div>

      {/* ─── Messages Stream (Clearer & Bigger Text) ─── */}
      <div className="flex-1 overflow-y-auto space-y-3.5 px-1">
        {messages.map((m) => {
          const isUser = m.role === "USER";

          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-2xl p-4 text-[14.5px] leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-[#a43716] text-white font-medium rounded-br-xs"
                    : "bg-white text-[#1f1b14] border border-[#dfc0b7] rounded-bl-xs space-y-2"
                }`}
              >
                {!isUser && (
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#a43716] block">
                    Schedulfy AI
                  </span>
                )}
                <p className="whitespace-pre-wrap">{m.content}</p>

                {/* Interactive Clarification Option Buttons */}
                {Array.isArray((m.actionPayload as any)?.data?.options) && (
                  <div className="pt-2.5 border-t border-[#dfc0b7]/50 space-y-1.5">
                    <span className="text-xs font-mono font-bold text-[#a43716] uppercase tracking-wider block">
                      {typeof (m.actionPayload as any)?.data?.question === "string"
                        ? (m.actionPayload as any).data.question
                        : "Quick Options:"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {((m.actionPayload as any).data.options as string[]).map((option: string, optIdx: number) => (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => onSendPreset(option)}
                          className="px-3 py-1.5 rounded-full bg-[#fcf2e6] hover:bg-[#a43716] hover:text-white border border-[#dfc0b7] text-xs font-bold text-[#1f1b14] transition-all active:scale-95"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {m.actionType && (
                  <div className="pt-2 border-t border-[#dfc0b7]/50 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#52652a]">{m.actionType}</span>
                    <span className="px-2 py-0.5 rounded bg-[#fcf2e6] border border-[#dfc0b7] font-semibold text-[#1f1b14]">
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
            <div className="bg-white border border-[#dfc0b7] rounded-2xl p-3.5 text-sm flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#a43716] animate-ping" />
              <span className="text-[#58423c] font-serif italic text-sm">AI thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Floating Prompt Chips ─── */}
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar shrink-0">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendPreset(p)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-full bg-white border border-[#dfc0b7] text-xs font-semibold text-[#58423c] whitespace-nowrap active:scale-95 shadow-2xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {p}
          </button>
        ))}
      </div>

      {/* ─── Mobile iPhone Floating Input Pill ─── */}
      <form
        onSubmit={onSendMessage}
        className="bg-[#14120e]/95 backdrop-blur-2xl text-white rounded-full p-2.5 border border-white/20 shadow-2xl flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message AI Coach (e.g. 'I walked 2k steps')..."
          className="flex-1 bg-transparent px-3 text-sm text-white placeholder-white/50 outline-none font-medium"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-4 py-2 bg-[#a43716] active:scale-95 text-white text-sm font-bold rounded-full disabled:opacity-40 transition-all shrink-0 shadow-xs flex items-center gap-1.5"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
