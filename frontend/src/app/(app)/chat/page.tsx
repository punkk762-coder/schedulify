"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PlanImportProposal } from "@/lib/domain/types";
import { ChatDesktopView } from "@/components/chat/ChatDesktopView";
import { ChatMobileView } from "@/components/chat/ChatMobileView";
import { AiIntakeWizard } from "@/components/chat/AiIntakeWizard";

interface MessageItem {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  actionType?: string;
  actionStatus?: string;
  actionPayload?: Record<string, unknown>;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // AI Intake Wizard & Import state
  const [showIntakeWizard, setShowIntakeWizard] = useState(false);
  const [intakeBanner, setIntakeBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check URL query for ?intake=1
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("intake") === "1") {
        setShowIntakeWizard(true);
        setIntakeBanner("Protocol cleared. Ready to set your Calorie Limit and calibrate your external plan.");
      }
    }
  }, []);

  // Load existing messages or init with welcoming prompt
  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          if (data.conversations && data.conversations.length > 0) {
            const latestConv = data.conversations[0];
            setConversationId(latestConv.id);
            const msgRes = await fetch(`/api/chat?conversationId=${latestConv.id}`);
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              if (msgData.messages && msgData.messages.length > 0) {
                setMessages(
                  msgData.messages.map((m: { id: string; role: "USER" | "ASSISTANT"; content: string; actionType?: string; actionStatus?: string; actionPayload?: Record<string, unknown> }) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    actionType: m.actionType,
                    actionStatus: m.actionStatus,
                    actionPayload: m.actionPayload,
                  }))
                );
                return;
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }

      // Default welcome message
      setMessages([
        {
          id: "welcome",
          role: "ASSISTANT",
          content:
            "Hello! I'm Schedulfy AI. You can tell me what you did today (e.g., 'finished my morning walk', 'had whey instead of oats'), ask about your schedule, or paste an entire weekly routine to import it.",
        },
      ]);
    };

    initChat();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    setInputText("");

    const tempUserMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: userText,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversationId) setConversationId(data.conversationId);

        const assistantMsg: MessageItem = {
          id: data.messageId || `msg-${Date.now()}`,
          role: "ASSISTANT",
          content: data.reply,
          actionType: data.action?.intent,
          actionStatus: data.actionStatus,
          actionPayload: data.action,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "ASSISTANT",
            content: "Sorry, I had trouble processing that. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "ASSISTANT",
          content: "Network error. Please check your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleIntakeSuccess = (summary: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `intake-${Date.now()}`,
        role: "ASSISTANT",
        content: `🎉 ${summary}\nYour live daily checklist is ready at /today!`,
      },
    ]);
    setIntakeBanner(null);
    setTimeout(() => {
      router.push("/today");
    }, 1200);
  };

  return (
    <div className="w-full text-[#1f1b14] space-y-4">
      {intakeBanner && (
        <div className="p-3.5 rounded-2xl bg-[#d4eca2] border border-[#52652a]/40 text-[#141f00] text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span>{intakeBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowIntakeWizard(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#52652a] text-white text-[11px] font-bold active:scale-95 transition-all shadow-xs"
          >
            Launch Wizard ➔
          </button>
        </div>
      )}

      {/* Desktop Clean Studio View (lg+) */}
      <div className="hidden lg:block">
        <ChatDesktopView
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          loading={loading}
          onSendMessage={handleSendMessage}
          onOpenImport={() => setShowIntakeWizard(true)}
          messagesEndRef={messagesEndRef}
          onSendPreset={(p) => setInputText(p)}
        />
      </div>

      {/* Mobile Magnificent Messaging View (< lg) */}
      <div className="block lg:hidden">
        <ChatMobileView
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          loading={loading}
          onSendMessage={handleSendMessage}
          onOpenImport={() => setShowIntakeWizard(true)}
          messagesEndRef={messagesEndRef}
          onSendPreset={(p) => setInputText(p)}
        />
      </div>

      {/* AI Intake Protocol Calibration Wizard */}
      <AiIntakeWizard
        isOpen={showIntakeWizard}
        onClose={() => setShowIntakeWizard(false)}
        onSuccess={handleIntakeSuccess}
      />
    </div>
  );
}
