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

  // If already on the dedicated /chat screen, don't show the duplicate floating island
  if (pathname === "/chat") return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
    <div className="lg:hidden fixed bottom-22 left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-40 pointer-events-none">
      {/* ─── EXPANDED STATE: iPhone Dynamic Island Overlay Drawer ─── */}
      {isOpen ? (
        <div className="pointer-events-auto bg-[#14120e]/95 backdrop-blur-3xl text-white rounded-3xl border border-white/20 shadow-2xl p-4 space-y-3 max-h-[75vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Top Notch & Island Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <ThreeAiCore isThinking={loading} size={24} />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
                AI Routine Assistant
              </span>
              <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-[#d4eca2]">
                Dynamic Island
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 border border-white/15 text-white/80 hover:text-white flex items-center justify-center text-xs font-bold active:scale-90 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-1 pr-1 text-xs">
            {messages.map((m) => {
              const isUser = m.role === "USER";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      isUser
                        ? "bg-[#a43716] text-white rounded-br-xs font-medium"
                        : "bg-white/10 border border-white/10 text-white rounded-bl-xs"
                    }`}
                  >
                    {!isUser && (
                      <span className="text-[9px] font-mono font-bold uppercase text-[#ffb5a0] block mb-0.5">
                        Schedulfy Coach
                      </span>
                    )}
                    <p className="whitespace-pre-wrap text-[11px]">{m.content}</p>

                    {m.actionType && (
                      <div className="mt-1.5 pt-1 border-t border-white/15 flex items-center justify-between text-[9px] font-mono">
                        <span className="text-[#d4eca2] font-bold">{m.actionType}</span>
                        <span className="text-white/70">{m.actionStatus || "SUCCESS"}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2 text-[11px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ffb5a0] animate-ping" />
                  <span className="text-white/80 italic font-serif">Analyzing routine...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar shrink-0">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(undefined, chip)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] text-white/90 whitespace-nowrap active:scale-95 transition-all shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Floating Input Pill */}
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="bg-white/10 rounded-full p-1.5 border border-white/20 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask AI Coach or log routine..."
              className="flex-1 bg-transparent px-3 text-xs text-white placeholder-white/50 outline-none font-medium"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-3.5 py-1.5 rounded-full bg-[#a43716] text-white text-xs font-bold disabled:opacity-40 active:scale-95 transition-all shadow-xs flex items-center gap-1"
            >
              <span>Send</span>
              <span>↑</span>
            </button>
          </form>
        </div>
      ) : (
        /* ─── COLLAPSED STATE: iPhone Floating Island Pill ─── */
        <div
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto cursor-pointer bg-[#14120e]/92 backdrop-blur-2xl text-white rounded-full px-4 py-2.5 border border-white/20 shadow-2xl flex items-center justify-between gap-3 active:scale-98 transition-all hover:bg-[#14120e] ring-1 ring-white/10"
        >
          {/* Left: 3D Holographic AI Neural Core */}
          <div className="flex items-center gap-2.5 min-w-0">
            <ThreeAiCore isThinking={loading} size={28} />
            <div className="truncate">
              <span className="text-[11px] font-bold text-white block truncate">
                AI Routine Assistant
              </span>
              <span className="text-[9px] text-white/60 block truncate">
                Tap to ask or log steps &amp; macros
              </span>
            </div>
          </div>

          {/* Right: Expand Badge */}
          <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-[#d4eca2] shrink-0 border border-white/10">
            <span>Ask</span>
            <span>⚡</span>
          </div>
        </div>
      )}
    </div>
  );
}
