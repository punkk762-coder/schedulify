"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThreeAiCore } from "@/components/3d/ThreeAiCore";

interface MessageItem {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt?: string;
  actionType?: string;
  actionStatus?: string;
}

export function FloatingMobileAiIsland() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-island",
      role: "ASSISTANT",
      content: "Hey! Schedulfy AI Coach here. Drag your steps, tell me what you ate, or ask what's next on your routine.",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // If already on the dedicated /chat screen, don't show the duplicate floating island
  if (pathname === "/chat") return null;

  const handleSendMessage = async (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const textToSend = presetText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: "USER",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: MessageItem = {
          id: data.aiMessage?.id || `ai-${Date.now()}`,
          role: "ASSISTANT",
          content: data.aiMessage?.content || data.reply || "Done! Protocol synced.",
          actionType: data.actionResult?.actionType,
          actionStatus: data.actionResult?.status,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "ASSISTANT",
            content: "Network glitch. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "ASSISTANT",
          content: "Failed to connect to AI Coach.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    "I walked 2k steps right now",
    "What is my next routine?",
    "Logged 500ml water",
    "Show my macros",
  ];

  return (
    <>
      {/* ─── EXPANDED STATE: iPhone Dynamic Island / Siri Overlay ─── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop dismiss click area */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />

          <div className="w-full max-w-md mx-auto bg-[#14120e]/95 backdrop-blur-3xl text-white rounded-3xl border border-white/20 shadow-2xl p-4 space-y-3 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-250">
            {/* Top Notch & Island Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/15 shrink-0">
              <div className="flex items-center gap-2">
                <ThreeAiCore isThinking={loading} size={26} />
                <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-white">
                  AI Routine Coach
                </span>
                <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-[#d4eca2]">
                  Floating Assistant
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white/80 hover:text-white flex items-center justify-center text-sm font-bold active:scale-90 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 py-1 pr-1 text-sm">
              {messages.map((m) => {
                const isUser = m.role === "USER";
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed ${
                        isUser
                          ? "bg-[#a43716] text-white rounded-br-xs font-medium"
                          : "bg-white/10 border border-white/15 text-white rounded-bl-xs"
                      }`}
                    >
                      {!isUser && (
                        <span className="text-xs font-mono font-bold uppercase text-[#ffb5a0] block mb-1">
                          Schedulfy Coach
                        </span>
                      )}
                      <p className="whitespace-pre-wrap text-[13.5px] sm:text-[14px] leading-relaxed">{m.content}</p>

                      {m.actionType && (
                        <div className="mt-2 pt-1.5 border-t border-white/15 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#d4eca2] font-bold">{m.actionType}</span>
                          <span className="text-white/80">{m.actionStatus || "SUCCESS"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffb5a0] animate-ping" />
                    <span className="text-white/90 italic font-serif">Analyzing routine...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto py-1.5 no-scrollbar shrink-0">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(undefined, chip)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white/95 whitespace-nowrap active:scale-95 transition-all shrink-0 cursor-pointer font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Floating Input Pill */}
            <form
              onSubmit={(e) => handleSendMessage(e)}
              className="bg-white/10 rounded-full p-2 border border-white/20 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask AI Coach or log routine..."
                className="flex-1 bg-transparent px-3 text-sm text-white placeholder-white/50 outline-none font-medium"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="px-4 py-2 rounded-full bg-[#a43716] text-white text-xs sm:text-sm font-bold disabled:opacity-40 active:scale-95 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Send</span>
                <span>↑</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── COLLAPSED STATE: Floating iPhone Assistant Orb ─── */}
      {!isOpen && (
        <aside
          aria-label="Floating AI Coach"
          className="lg:hidden fixed bottom-6 right-4 sm:bottom-6 sm:right-6 z-40"
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative cursor-pointer flex items-center gap-2.5 p-2 pr-3.5 rounded-full bg-[#14120e]/95 backdrop-blur-2xl text-white border border-white/20 shadow-2xl shadow-[#a43716]/30 active:scale-95 transition-all hover:ring-2 hover:ring-[#a43716]/50"
            title="Open AI Coach"
          >
            {/* Siri Glow Halo behind orb */}
            <div className="absolute -inset-1 rounded-full bg-linear-to-r from-[#a43716] via-[#ffb5a0] to-[#52652a] opacity-50 blur-xs group-hover:opacity-85 transition-opacity animate-pulse" />

            {/* 3D Holographic AI Neural Core */}
            <div className="relative z-10 w-9 h-9 rounded-full bg-black/70 flex items-center justify-center border border-white/25 shadow-inner overflow-hidden shrink-0">
              <ThreeAiCore isThinking={loading} size={28} />
            </div>

            <div className="relative z-10 flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white tracking-tight">AI Coach</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#52652a] animate-ping" />
              </div>
              <span className="text-[9px] font-mono text-[#d4eca2]">Assistant</span>
            </div>
          </button>
        </aside>
      )}
    </>
  );
}
