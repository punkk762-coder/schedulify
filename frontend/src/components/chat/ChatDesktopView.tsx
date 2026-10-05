"use client";

import React, { RefObject } from "react";
import type { PlanImportProposal } from "@/lib/domain/types";

export interface MessageItem {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  actionType?: string;
  actionStatus?: string;
  actionPayload?: Record<string, unknown>;
}

interface ChatDesktopViewProps {
  messages: MessageItem[];
  inputText: string;
  setInputText: (text: string) => void;
  loading: boolean;
  onSendMessage: (e: React.FormEvent) => void;
  onOpenImport: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onSendPreset: (text: string) => void;
}

export function ChatDesktopView({
  messages,
  inputText,
  setInputText,
  loading,
  onSendMessage,
  onOpenImport,
  messagesEndRef,
  onSendPreset,
}: ChatDesktopViewProps) {
  const quickPrompts = [
    "What is my next pending meal today?",
    "I drank 500ml water",
    "Completed my 1-hour walk",
    "Show my current macro balance",
    "Suggest a high-protein dinner alternative",
  ];

  return (
    <div className="w-full space-y-6">
      {/* ─── Clean Header ─── */}
      <header className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              AI Routine Concierge
            </span>
            <span className="text-xs font-mono text-[#8b716a]">• Gemini Flash 3.5 Intelligence</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1f1b14]">AI Coach Studio</h1>
          <p className="text-xs text-[#58423c] mt-0.5">
            Real-time voice of your routine. Conversational logs, meal substitutions, and raw schedule imports.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenImport}
          className="px-4 py-2.5 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
        >
          <span>📋</span>
          <span>Import Routine Protocol</span>
        </button>
      </header>

      {/* ─── 12-Column Layout: Chat Stream (8 cols) + Context Sidebar (4 cols) ─── */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Chat Stream (8 cols) */}
        <section className="col-span-8 bg-white rounded-2xl border border-[#dfc0b7] shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === "USER";

              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed transition-all shadow-2xs ${
                      isUser
                        ? "bg-[#a43716] text-white font-medium ml-12"
                        : "bg-[#fcf2e6] text-[#1f1b14] border border-[#dfc0b7] mr-12 space-y-2"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono font-bold text-[#a43716] uppercase">
                        <span>🤖</span>
                        <span>Schedulfy AI</span>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {/* Action Execution Pill */}
                    {m.actionType && (
                      <div className="pt-2 border-t border-[#dfc0b7]/50 flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-[#52652a]">
                          Action: {m.actionType}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#dfc0b7] font-semibold text-[#1f1b14]">
                          {m.actionStatus || "PROPOSED"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#fcf2e6] text-[#1f1b14] border border-[#dfc0b7] rounded-2xl p-4 text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#a43716] animate-ping" />
                  <span className="font-serif italic text-[#58423c]">AI Coach reasoning over routine...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Clean Input Form */}
          <form
            onSubmit={onSendMessage}
            className="p-4 bg-[#fcf2e6] border-t border-[#dfc0b7] flex items-center gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type routine log, ask schedule questions, or request substitutions..."
              className="flex-1 bg-white border border-[#dfc0b7] focus:border-[#a43716] rounded-xl px-4 py-2.5 text-xs text-[#1f1b14] placeholder-[#8b716a] outline-none transition-all shadow-2xs font-medium"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-5 py-2.5 bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 shadow-xs"
            >
              Send
            </button>
          </form>
        </section>

        {/* Routine Context Sidebar (4 cols) */}
        <aside className="col-span-4 space-y-5">
          {/* Quick Prompts */}
          <div className="bg-white rounded-2xl p-5 border border-[#dfc0b7] shadow-xs space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a43716] block">
              Suggested Directives
            </span>
            <div className="space-y-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendPreset(prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#fcf2e6]/70 hover:bg-[#fcf2e6] border border-[#dfc0b7] text-xs text-[#1f1b14] transition-all hover:border-[#a43716]/40 font-medium"
                >
                  💬 {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Context Card */}
          <div className="bg-[#fcf2e6] rounded-2xl p-5 border border-[#dfc0b7] space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52652a] block">
              Direct Database Binding
            </span>
            <p className="text-xs text-[#58423c] leading-relaxed">
              When you tell AI &quot;had oats&quot; or &quot;finished walk&quot;, it maps your speech directly to the active PostgreSQL occurrence row and updates nutrition logs immediately.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
