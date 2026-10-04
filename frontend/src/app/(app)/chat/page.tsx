"use client";

import { useState, useEffect, useRef } from "react";
import type { PlanImportProposal } from "@/lib/domain/types";

interface MessageItem {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  actionType?: string;
  actionStatus?: string;
  actionPayload?: Record<string, unknown>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Import Plan Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRawText, setImportRawText] = useState("");
  const [parsingPlan, setParsingPlan] = useState(false);
  const [committingPlan, setCommittingPlan] = useState(false);
  const [importProposal, setImportProposal] = useState<PlanImportProposal | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Plan Import Handlers
  const handleParsePlan = async () => {
    if (!importRawText.trim() || parsingPlan) return;
    setParsingPlan(true);
    setImportSuccessMessage(null);

    try {
      const res = await fetch("/api/plans/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", text: importRawText }),
      });
      const data = await res.json();
      if (data.proposal) {
        setImportProposal(data.proposal);
      }
    } catch (err) {
      console.error("Parse plan error:", err);
    } finally {
      setParsingPlan(false);
    }
  };

  const handleCommitPlan = async () => {
    if (!importProposal || committingPlan) return;
    setCommittingPlan(true);

    try {
      const res = await fetch("/api/plans/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "commit", proposal: importProposal }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportSuccessMessage("Plan imported successfully! Today's schedule has been created.");
        setImportProposal(null);
        setImportRawText("");
        // Notify chat
        setMessages((prev) => [
          ...prev,
          {
            id: `import-${Date.now()}`,
            role: "ASSISTANT",
            content: "✅ Your new routine plan is imported and active! Today's checklist is updated.",
          },
        ]);
        setTimeout(() => setShowImportModal(false), 1800);
      }
    } catch (err) {
      console.error("Commit plan error:", err);
    } finally {
      setCommittingPlan(false);
    }
  };

  const loadExamplePlan = () => {
    const sample = `Monday to Sunday Nutrition Routine:
10:15 AM - Breakfast: Chocolate Proats (50g Oats, 1 scoop Whey, 200ml Almond milk) - 380 kcal, 32g protein, 45g carbs, 8g fat
12:30 PM - Lunch: 2 Phulkas, Cabbage-Capsicum Sabzi, Large Green Salad, 150g Dahi - 420 kcal, 14g protein, 55g carbs, 12g fat
5:30 PM - Evening Snack: Kala Chana (boiled 100g) - 180 kcal, 10g protein, 28g carbs, 3g fat
7:00 PM - Dinner: Paneer Bhurji (100g Paneer), 2 Phulkas, Fresh Salad - 450 kcal, 22g protein, 35g carbs, 20g fat
8:00 PM - 1-hour Evening Walk
11:30 PM - Bedtime: Warm Turmeric Milk / Chamomile - 120 kcal, 4g protein, 10g carbs, 5g fat`;
    setImportRawText(sample);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] text-[#1f1b14]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
        <div>
          <h1 className="text-lg font-serif font-bold text-[#1f1b14] flex items-center gap-2">
            <span>Schedulfy AI Coach</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fcf2e6] text-[#a43716] font-semibold border border-[#dfc0b7]">
              Intelligence
            </span>
          </h1>
          <p className="text-xs text-[#58423c]">Conversational routine adjustments, swaps & plan manager</p>
        </div>

        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-[#a43716] hover:bg-[#862201] text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs whitespace-nowrap shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Import Plan</span>
        </button>
      </div>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b716a] shrink-0 mr-1">Prompts:</span>
        {[
          "Swap evening snack",
          "Log 20 min walk",
          "Suggest high-protein dinner",
          "Review today's macros",
        ].map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInputText(chip)}
            className="shrink-0 px-3 py-1 rounded-full bg-white border border-[#dfc0b7] text-[#52652a] hover:border-[#52652a] hover:bg-[#fcf2e6] transition-all text-xs font-medium active:scale-95 shadow-2xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {messages.map((m) => {
          const isUser = m.role === "USER";
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#a43716] text-white rounded-br-sm shadow-sm"
                    : "bg-white text-[#1f1b14] rounded-bl-sm border border-[#dfc0b7] shadow-xs"
                }`}
              >
                <p className="whitespace-pre-line">{m.content}</p>

                {/* Structured Action Badge if executed */}
                {m.actionType && (
                  <div className="mt-2.5 pt-2 border-t border-[#dfc0b7]/50 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#a43716]">
                      Action: {m.actionType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                        m.actionStatus === "EXECUTED"
                          ? "bg-[#d4eca2] text-[#141f00] border border-[#52652a]/30"
                          : "bg-[#fcf2e6] text-[#58423c] border border-[#dfc0b7]"
                      }`}
                    >
                      {m.actionStatus || "PROPOSED"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start">
            <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm border border-[#dfc0b7] flex items-center gap-2 text-xs text-[#a43716] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#a43716] animate-ping" />
              <span>Thinking & updating routine...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSendMessage} className="pt-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tell me what you did or ask to swap a meal..."
            className="w-full pl-4 pr-12 py-3.5 rounded-full bg-white text-sm text-[#1f1b14] placeholder-[#8b716a] focus:outline-none focus:border-[#a43716] border border-[#dfc0b7] shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="absolute right-2 h-9 w-9 rounded-full bg-[#a43716] hover:bg-[#862201] active:scale-95 disabled:opacity-40 disabled:hover:bg-[#a43716] text-white flex items-center justify-center transition-all shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>

      {/* Plan Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#dfc0b7]">
              <div>
                <h2 className="text-base font-serif font-bold text-[#1f1b14]">Import Routine or Diet Plan</h2>
                <p className="text-xs text-[#58423c]">Paste your weekly routine text below</p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-[#8b716a] hover:text-[#1f1b14] text-lg font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {importSuccessMessage && (
                <div className="p-3 rounded-xl bg-[#d4eca2] border border-[#52652a]/40 text-[#141f00] text-xs font-semibold animate-pulse">
                  {importSuccessMessage}
                </div>
              )}

              {/* Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#1f1b14]">Plan Content</label>
                  <button
                    type="button"
                    onClick={loadExamplePlan}
                    className="text-[11px] text-[#a43716] hover:underline font-medium"
                  >
                    Insert Example Routine
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder="Paste meal plan, workout schedule, or routine items with times..."
                  className="w-full p-3 rounded-xl bg-[#fcf2e6] border border-[#dfc0b7] text-xs text-[#1f1b14] placeholder-[#8b716a] focus:outline-none focus:border-[#a43716] font-mono"
                />
              </div>

              {/* Parse Button */}
              {!importProposal && (
                <button
                  type="button"
                  onClick={handleParsePlan}
                  disabled={!importRawText.trim() || parsingPlan}
                  className="w-full py-2.5 rounded-full bg-[#a43716] hover:bg-[#862201] text-white font-medium text-xs shadow-xs transition-all active:scale-98 disabled:opacity-40"
                >
                  {parsingPlan ? "Analyzing Plan with AI..." : "Analyze & Preview Plan"}
                </button>
              )}

              {/* Parsed Proposal Preview */}
              {importProposal && (
                <div className="space-y-3 pt-2 border-t border-[#dfc0b7]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#a43716] uppercase tracking-wider">
                      Detected Structure
                    </span>
                    <span className="text-[11px] text-[#58423c]">
                      {importProposal.routineItems.length} items detected
                    </span>
                  </div>

                  {/* Ambiguity Warnings */}
                  {importProposal.ambiguities.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#fcf2e6] border border-[#f59e0b]/40 text-[#862201] text-[11px] space-y-1">
                      <span className="font-semibold block">⚠️ Potential Ambiguities:</span>
                      {importProposal.ambiguities.map((a, i) => (
                        <p key={i}>• {a}</p>
                      ))}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {importProposal.routineItems.map((item, idx) => {
                      const sched = importProposal.schedules.find((s) => s.itemRef === item.tempId);
                      const nut = importProposal.nutrition.find((n) => n.itemRef === item.tempId);
                      return (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-[#fcf2e6] border border-[#dfc0b7] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#1f1b14]">{item.title}</span>
                            <span className="text-[#58423c] text-[10px] ml-2">({item.category})</span>
                          </div>
                          <div className="text-right text-[11px]">
                            <span className="text-[#a43716] font-medium">{sched?.scheduledTime}</span>
                            {nut?.protein && (
                              <span className="text-[#52652a] ml-2 font-semibold">
                                {nut.protein}g P
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setImportProposal(null)}
                      className="flex-1 py-2.5 rounded-full bg-[#fcf2e6] hover:bg-[#f6ede0] text-[#58423c] text-xs font-semibold border border-[#dfc0b7]"
                    >
                      Edit Text
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitPlan}
                      disabled={committingPlan}
                      className="flex-1 py-2.5 rounded-full bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold shadow-xs"
                    >
                      {committingPlan ? "Creating Schedule..." : "Confirm & Activate Plan"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
