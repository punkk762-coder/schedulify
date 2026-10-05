"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  type AlarmSoundId,
  ALARM_SOUND_OPTIONS,
  playSoundOnce,
} from "@/lib/sound/alarmSynthesizer";
import type { AlarmSettings, RoutineAlarmItem } from "@/components/alarm/AlarmManager";

interface ManagedUser {
  id: string;
  name: string;
  pin: string;
  role: string;
  calorieTarget: number;
  proteinTarget: number;
  stepsTarget: number;
  waterTargetMl: number;
  createdAt: string;
}

export interface GeminiQuotaStats {
  configured: boolean;
  source: "DATABASE" | "ENV" | "NONE";
  maskedKey: string;
  model: string;
  dailyRequestLimit: number;
  requestsToday: number;
  remainingRequests: number;
  totalTokensToday: number;
  promptTokensToday: number;
  candidateTokensToday: number;
  minuteRateLimit: number;
  minuteTokenLimit: number;
  quotaPercentageUsed: number;
  quotaStatus: "HEALTHY" | "MODERATE" | "NEARING_LIMIT" | "EXHAUSTED";
  needsChange: boolean;
  lastUsedAt: string | null;
  lastError: string | null;
  resetInfo: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Profile names
  const [adminName, setAdminName] = useState("Vrund");
  const [momName, setMomName] = useState("Mom");
  const [savingNames, setSavingNames] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);

  // User management
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // New user form state
  const [adminPin, setAdminPin] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPin, setNewUserPin] = useState("");
  const [newUserCalories, setNewUserCalories] = useState<number>(1600);
  const [newUserProtein, setNewUserProtein] = useState<number>(130);
  const [newUserSteps, setNewUserSteps] = useState<number>(8000);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // Gemini token quota and dynamic key management
  const [geminiStats, setGeminiStats] = useState<GeminiQuotaStats | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(true);
  const [newApiKey, setNewApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [apiKeyMsg, setApiKeyMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchGeminiStats = useCallback(async () => {
    try {
      setLoadingGemini(true);
      const res = await fetch("/api/settings/gemini");
      if (res.ok) {
        const data = await res.json();
        setGeminiStats(data);
      }
    } catch (err) {
      console.error("Failed to load Gemini quota:", err);
    } finally {
      setLoadingGemini(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/settings/users");
      if (res.ok) {
        const data = await res.json();
        if (data.adminName) setAdminName(data.adminName);
        if (data.momName) setMomName(data.momName);
        if (data.users) setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Routine Alarms state
  const [alarmSettings, setAlarmSettings] = useState<AlarmSettings>({
    sound: "zen_bell",
    volume: 0.8,
    leadTimeMin: 0,
    browserPushEnabled: true,
    routines: [
      { id: "breakfast", name: "Breakfast Protocol", time: "10:15", category: "MEAL", enabled: true },
      { id: "lunch", name: "Lunch Protocol", time: "12:30", category: "MEAL", enabled: true },
      { id: "hydration", name: "Hydration Check-in", time: "14:30", category: "HYDRATION", enabled: true, intervalHours: 2 },
      { id: "evening_walk", name: "Evening Walk & Workout", time: "18:00", category: "ACTIVITY", enabled: true },
      { id: "dinner", name: "Dinner Protocol", time: "20:00", category: "MEAL", enabled: true },
      { id: "bedtime", name: "Bedtime Wind-Down", time: "23:00", category: "OTHER", enabled: true },
    ],
  });
  const [loadingAlarms, setLoadingAlarms] = useState(true);
  const [savingAlarms, setSavingAlarms] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  const fetchAlarmSettings = useCallback(async () => {
    try {
      setLoadingAlarms(true);
      const res = await fetch("/api/settings/alarms");
      if (res.ok) {
        const data = await res.json();
        setAlarmSettings(data);
      }
    } catch (err) {
      console.error("Failed to load alarm settings:", err);
    } finally {
      setLoadingAlarms(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchGeminiStats();
    fetchAlarmSettings();
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, [fetchSettings, fetchGeminiStats, fetchAlarmSettings]);

  const handleRequestNotifPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  const handleSaveAlarmSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingAlarms) return;
    setSavingAlarms(true);
    setAlarmMessage(null);

    try {
      const res = await fetch("/api/settings/alarms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alarmSettings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlarmMessage("Alarm sounds & routine notification schedule saved!");
        setTimeout(() => setAlarmMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save alarms:", err);
      setAlarmMessage("Network error saving alarm settings.");
    } finally {
      setSavingAlarms(false);
    }
  };

  const handleTestFullAlarm = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("schedulfy-test-alarm"));
    }
  };

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingApiKey || !newApiKey.trim()) return;
    setSavingApiKey(true);
    setApiKeyMsg(null);

    try {
      const res = await fetch("/api/settings/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newApiKey.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApiKeyMsg({ text: data.message || "Gemini API key verified and updated!" });
        setNewApiKey("");
        setShowKeyInput(false);
        if (data.stats) setGeminiStats(data.stats);
        else fetchGeminiStats();
        setTimeout(() => setApiKeyMsg(null), 5000);
      } else {
        setApiKeyMsg({ text: data.error || "Failed to update API key.", error: true });
      }
    } catch {
      setApiKeyMsg({ text: "Network error connecting to Gemini validation service.", error: true });
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleRevertGeminiKey = async () => {
    if (!window.confirm("Revert to default environment (.env) Gemini API key?")) return;
    setSavingApiKey(true);
    setApiKeyMsg(null);

    try {
      const res = await fetch("/api/settings/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revert" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApiKeyMsg({ text: data.message || "Reverted to .env key!" });
        if (data.stats) setGeminiStats(data.stats);
        else fetchGeminiStats();
        setTimeout(() => setApiKeyMsg(null), 4000);
      } else {
        setApiKeyMsg({ text: data.error || "Failed to revert key.", error: true });
      }
    } catch {
      setApiKeyMsg({ text: "Network error reverting key.", error: true });
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const handleSaveNames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingNames) return;
    setSavingNames(true);
    setNameMessage(null);

    try {
      const res = await fetch("/api/settings/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminName, momName }),
      });
      if (res.ok) {
        const data = await res.json();
        setNameMessage(data.message || "Display names updated successfully!");
        setTimeout(() => setNameMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save names:", err);
    } finally {
      setSavingNames(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingUser) return;
    setCreatingUser(true);
    setUserError(null);
    setUserSuccess(null);

    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPin,
          name: newUserName,
          pin: newUserPin,
          calorieTarget: newUserCalories,
          proteinTarget: newUserProtein,
          stepsTarget: newUserSteps,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUserSuccess(data.message || `User ${newUserName} created!`);
        setNewUserName("");
        setNewUserPin("");
        setNewUserCalories(1600);
        fetchSettings();
        setTimeout(() => setUserSuccess(null), 4000);
      } else {
        setUserError(data.error || "Failed to create user.");
      }
    } catch (err) {
      console.error("Failed to create user:", err);
      setUserError("Network error while creating user.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const enteredPin = prompt("Enter Admin PIN to confirm user deletion:");
    if (!enteredPin) return;

    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": enteredPin,
        },
      });

      if (res.ok) {
        fetchSettings();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  const handleSeedSampleRoutine = async () => {
    setSeeding(true);
    setSeedMessage(null);

    const sampleRoutine = `10:15 AM - Breakfast: Chocolate Proats (50g Oats, 1 scoop Whey, 200ml Almond milk) - 380 kcal, 32g protein, 45g carbs, 8g fat
12:30 PM - Lunch: 2 Phulkas, Cabbage-Capsicum Sabzi, Large Green Salad, 150g Dahi - 420 kcal, 14g protein, 55g carbs, 12g fat
5:30 PM - Evening Snack: Kala Chana (boiled 100g) - 180 kcal, 10g protein, 28g carbs, 3g fat
7:00 PM - Dinner: Paneer Bhurji (100g Paneer), 2 Phulkas, Fresh Salad - 450 kcal, 22g protein, 35g carbs, 20g fat
8:00 PM - 1-hour Evening Walk
11:30 PM - Bedtime: Warm Turmeric Milk / Chamomile - 120 kcal, 4g protein, 10g carbs, 5g fat`;

    try {
      const parseRes = await fetch("/api/plans/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", text: sampleRoutine }),
      });
      const parseData = await parseRes.json();

      if (parseData.proposal) {
        const commitRes = await fetch("/api/plans/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "commit", proposal: parseData.proposal }),
        });
        if (commitRes.ok) {
          setSeedMessage("Default routine loaded! Check your Today screen.");
        }
      }
    } catch (err) {
      console.error("Failed to seed sample routine:", err);
      setSeedMessage("Failed to load sample routine.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-[#1f1b14] pb-24">
      {/* Header */}
      <header className="bg-white rounded-2xl p-6 border border-[#dfc0b7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52652a] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#52652a]">
              Admin Control Panel &amp; Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1f1b14]">
            Settings &amp; User Directory
          </h1>
          <p className="text-xs text-[#58423c] mt-0.5">
            Manage profiles, authorize new user accounts with 1,600 kcal defaults, and configure names.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-[#ffdad6] hover:bg-[#ffb5a0] text-[#93000a] border border-[#ba1a1a]/20 text-xs font-bold transition-all active:scale-95 shadow-xs shrink-0"
        >
          Sign Out / Exit
        </button>
      </header>

      {/* ─── Gemini AI Token Quota & API Key Cockpit ─── */}
      <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#dfc0b7] gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-[#a43716] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-[#a43716] uppercase tracking-wider">
                Google AI Studio • Token &amp; Quota Engine
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-[#1f1b14]">
              Gemini AI Quota &amp; Key Cockpit
            </h2>
            <p className="text-xs text-[#58423c]">
              Real-time token telemetry, daily free-tier request limits, and instant in-app key swapping.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {loadingGemini ? (
              <span className="text-[10px] font-mono text-[#8b716a] animate-pulse">Syncing quota...</span>
            ) : geminiStats ? (
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border uppercase ${
                  geminiStats.quotaStatus === "HEALTHY"
                    ? "bg-[#f7faef] text-[#52652a] border-[#52652a]/20"
                    : geminiStats.quotaStatus === "MODERATE"
                    ? "bg-[#fff8e1] text-[#b78103] border-[#b78103]/20"
                    : geminiStats.quotaStatus === "NEARING_LIMIT"
                    ? "bg-[#ffedea] text-[#c0431a] border-[#c0431a]/20 animate-pulse"
                    : "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30 animate-pulse"
                }`}
              >
                ● {geminiStats.quotaStatus.replace("_", " ")} ({100 - geminiStats.quotaPercentageUsed}% Left)
              </span>
            ) : null}
          </div>
        </div>

        {/* Quota Exhaustion / Warning Alert */}
        {geminiStats?.needsChange && (
          <div className="p-4 rounded-xl bg-[#ffdad6]/60 border border-[#ba1a1a]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-[#93000a] flex items-center gap-1.5">
                <span>⚠️</span>
                <span>
                  {geminiStats.quotaStatus === "EXHAUSTED"
                    ? "Gemini Free Quota Exhausted! Time to Change API Key."
                    : "Nearing Daily Free Tier Quota Limit."}
                </span>
              </p>
              <p className="text-[#58423c] text-[11px]">
                {geminiStats.lastError
                  ? `Last Error: ${geminiStats.lastError}. `
                  : `You have consumed ${geminiStats.requestsToday} of 1,500 requests today. `}
                Paste another free API key from Google AI Studio below to keep AI running without interruption.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="px-4 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-all shrink-0 active:scale-95 shadow-xs"
            >
              Swap Key Now 🔑
            </button>
          </div>
        )}

        {/* 3 Metric Overview Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Daily Requests */}
          <div className="p-4 rounded-xl border border-[#dfc0b7] bg-linear-to-br from-[#fcf2e6]/50 to-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a]">
                Daily Requests (RPD)
              </span>
              <span className="text-[10px] font-mono font-bold text-[#a43716]">
                {geminiStats?.quotaPercentageUsed ?? 0}% Used
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#1f1b14]">
                {geminiStats?.requestsToday.toLocaleString() ?? 0}
              </span>
              <span className="text-xs text-[#8b716a] font-mono">
                / {geminiStats?.dailyRequestLimit.toLocaleString() ?? 1500} RPD
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#dfc0b7]/40 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  (geminiStats?.quotaPercentageUsed ?? 0) > 85
                    ? "bg-[#ba1a1a]"
                    : (geminiStats?.quotaPercentageUsed ?? 0) > 60
                    ? "bg-[#e59819]"
                    : "bg-[#52652a]"
                }`}
                style={{ width: `${Math.min(100, Math.max(4, geminiStats?.quotaPercentageUsed ?? 0))}%` }}
              />
            </div>
            <p className="text-[11px] text-[#58423c] flex items-center justify-between">
              <span>Remaining Today:</span>
              <strong className="text-[#1f1b14] font-mono font-bold">
                {geminiStats?.remainingRequests.toLocaleString() ?? 1500}
              </strong>
            </p>
          </div>

          {/* Card 2: Tokens Today */}
          <div className="p-4 rounded-xl border border-[#dfc0b7] bg-linear-to-br from-[#fcf2e6]/50 to-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a]">
                Tokens Used Today
              </span>
              <span className="text-[10px] font-mono text-[#52652a] font-bold bg-[#f7faef] px-2 py-0.5 rounded-full border border-[#52652a]/20">
                1M TPM Cap
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#1f1b14]">
                {geminiStats?.totalTokensToday.toLocaleString() ?? 0}
              </span>
              <span className="text-xs text-[#8b716a] font-mono">tokens</span>
            </div>
            <p className="text-[11px] text-[#58423c] space-x-1">
              <span>Prompt:</span>
              <strong className="font-mono text-[#1f1b14]">{geminiStats?.promptTokensToday.toLocaleString() ?? 0}</strong>
              <span>• Output:</span>
              <strong className="font-mono text-[#1f1b14]">{geminiStats?.candidateTokensToday.toLocaleString() ?? 0}</strong>
            </p>
            <p className="text-[10px] text-[#8b716a] font-mono">
              Model: {geminiStats?.model ?? "gemini-2.5-flash"}
            </p>
          </div>

          {/* Card 3: Key Status & Reset Timer */}
          <div className="p-4 rounded-xl border border-[#dfc0b7] bg-linear-to-br from-[#fcf2e6]/50 to-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a]">
                Active Key Source
              </span>
              <span className="text-[10px] font-mono font-bold text-[#a43716]">
                {geminiStats?.source === "DATABASE" ? "Custom DB Key" : "Default (.env)"}
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-[#1f1b14] truncate py-1">
              {geminiStats?.maskedKey ?? "None"}
            </div>
            <p className="text-[11px] text-[#58423c]">
              Limit: <strong>15 Requests/Min (RPM)</strong>
            </p>
            <p className="text-[10px] font-mono text-[#8b716a]">
              Resets: 00:00 UTC (Midnight Pacific)
            </p>
          </div>
        </div>

        {/* Messages */}
        {apiKeyMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold ${
              apiKeyMsg.error
                ? "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30"
                : "bg-[#f7faef] text-[#52652a] border-[#52652a]/20"
            }`}
          >
            {apiKeyMsg.text}
          </div>
        )}

        {/* Key Actions and Form Toggle */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeyInput((prev) => !prev)}
              className="px-4 py-2 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
            >
              <span>{showKeyInput ? "✕ Close Key Form" : "🔑 Change Gemini API Key"}</span>
            </button>

            {geminiStats?.source === "DATABASE" && (
              <button
                type="button"
                onClick={handleRevertGeminiKey}
                disabled={savingApiKey}
                className="px-3.5 py-2 rounded-xl bg-[#fcf2e6] hover:bg-[#fae3cf] text-[#a43716] border border-[#dfc0b7] text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
              >
                Revert to .env Key
              </button>
            )}
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-[#a43716] hover:underline flex items-center gap-1"
          >
            <span>Get a 100% Free Gemini Key from Google AI Studio</span>
            <span>↗</span>
          </a>
        </div>

        {/* Change Key Form (Collapsible) */}
        {showKeyInput && (
          <form onSubmit={handleSaveGeminiKey} className="p-4 rounded-xl border border-[#dfc0b7] bg-[#fcf2e6]/30 space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a]">
                New Gemini API Key (Verified live before activation) *
              </label>
              <p className="text-[11px] text-[#58423c]">
                Paste your API key (starts with <code className="font-mono bg-white px-1 rounded">AIzaSy...</code>). The app will test it with a ping request to Google AI to verify it works before saving.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="AIzaSy..."
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
              <button
                type="submit"
                disabled={savingApiKey || !newApiKey.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs flex items-center justify-center gap-1.5 shrink-0"
              >
                {savingApiKey ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying with Google...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Activate Key</span>
                    <span>✓</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-[#58423c] border-t border-[#dfc0b7]/50">
              <div className="space-y-0.5">
                <strong className="text-[#1f1b14] block">How much does Gemini give us?</strong>
                <p>1,500 requests per day (RPD) &amp; 1,000,000 tokens per minute (TPM) on Flash models completely free with 0 billing required.</p>
              </div>
              <div className="space-y-0.5">
                <strong className="text-[#1f1b14] block">When do you need to change?</strong>
                <p>Only if you reach 1,500 daily requests or receive HTTP 429 quota exhaustion. Swapping key here takes effect instantly without server restart.</p>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ─── Routine Alarms & Notification Sounds Engine ─── */}
      <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#dfc0b7] gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-[#a43716] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-[#a43716] uppercase tracking-wider">
                Web Audio Engine • Browser Routine Alarms
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-[#1f1b14]">
              Routine Alarms &amp; Notification Sounds
            </h2>
            <p className="text-xs text-[#58423c]">
              Browser-based audible alarms, procedural audio melodies, and customizable daily routine reminders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {notifPermission === "granted" ? (
              <span className="px-3 py-1 rounded-full bg-[#f7faef] text-[#52652a] text-[10px] font-mono font-bold border border-[#52652a]/20">
                🔔 Browser Push Active
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotifPermission}
                className="px-3.5 py-1.5 rounded-full bg-[#a43716] hover:bg-[#862201] text-white text-[10px] font-mono font-bold transition-all shadow-xs"
              >
                Enable Browser Notifications 🔔
              </button>
            )}
          </div>
        </div>

        {alarmMessage && (
          <p className="text-xs font-semibold text-[#52652a] bg-[#f7faef] p-3 rounded-xl border border-[#52652a]/20">
            {alarmMessage}
          </p>
        )}

        {/* 1. Alarm Sound Selection Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-[#8b716a]">
              Alarm Melody &amp; Tone (Synthesized Native Web Audio)
            </label>
            <span className="text-[10px] font-mono text-[#58423c]">
              Zero Latency • 100% Offline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALARM_SOUND_OPTIONS.map((opt) => {
              const isSelected = alarmSettings.sound === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => setAlarmSettings((prev) => ({ ...prev, sound: opt.id }))}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? "bg-[#ffdbd1]/50 border-[#a43716] ring-1 ring-[#a43716] shadow-xs"
                      : "bg-[#fcf2e6]/30 border-[#dfc0b7] hover:border-[#a43716]/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{opt.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-[#1f1b14]">{opt.name}</h4>
                        <p className="text-[10px] text-[#58423c] leading-tight">{opt.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#dfc0b7]/40 text-[10px]">
                    <span className="font-mono font-bold text-[#a43716]">
                      {isSelected ? "● SELECTED" : "SELECT"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSoundOnce(opt.id, alarmSettings.volume);
                      }}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-[#fcf2e6] border border-[#dfc0b7] font-bold text-[#1f1b14] active:scale-95"
                    >
                      ▶ Preview Tone
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Controls: Volume, Lead Time & Test Ringing HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-[#dfc0b7] bg-[#fcf2e6]/20">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
              Alarm Volume ({Math.round(alarmSettings.volume * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={alarmSettings.volume}
              onChange={(e) =>
                setAlarmSettings((prev) => ({
                  ...prev,
                  volume: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-[#a43716] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
              Notification Lead Time
            </label>
            <select
              value={alarmSettings.leadTimeMin}
              onChange={(e) =>
                setAlarmSettings((prev) => ({
                  ...prev,
                  leadTimeMin: parseInt(e.target.value, 10),
                }))
              }
              className="w-full px-3 py-1.5 rounded-xl border border-[#dfc0b7] text-xs font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
            >
              <option value="0">Exact Scheduled Time</option>
              <option value="5">5 Minutes Before</option>
              <option value="10">10 Minutes Before</option>
              <option value="15">15 Minutes Before</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleTestFullAlarm}
              className="w-full py-2 rounded-xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>🚨</span>
              <span>Test Alarm Ringing HUD</span>
            </button>
          </div>
        </div>

        {/* 3. Routine Alarms Schedule Checklist */}
        <form onSubmit={handleSaveAlarmSettings} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase text-[#8b716a]">
              Scheduled Routine Alarms (Meals, Walks, Hydration)
            </label>
            <span className="text-[10px] text-[#58423c]">
              Editable here or ask Schedulfy AI in chat!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {alarmSettings.routines.map((routine, idx) => (
              <div
                key={routine.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                  routine.enabled ? "bg-white border-[#dfc0b7]" : "bg-gray-50 border-gray-200 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`alarm-toggle-${routine.id}`}
                      checked={routine.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAlarmSettings((prev) => {
                          const updated = [...prev.routines];
                          updated[idx] = { ...updated[idx], enabled: checked };
                          return { ...prev, routines: updated };
                        });
                      }}
                      className="rounded accent-[#a43716] w-4 h-4 cursor-pointer"
                    />
                    <label
                      htmlFor={`alarm-toggle-${routine.id}`}
                      className="text-xs font-bold text-[#1f1b14] cursor-pointer"
                    >
                      {routine.name}
                    </label>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#fcf2e6] text-[#a43716]">
                    {routine.category}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-[#58423c]">Alarm Time:</span>
                  <input
                    type="time"
                    value={routine.time}
                    disabled={!routine.enabled}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      setAlarmSettings((prev) => {
                        const updated = [...prev.routines];
                        updated[idx] = { ...updated[idx], time: newTime };
                        return { ...prev, routines: updated };
                      });
                    }}
                    className="px-2 py-1 rounded-lg border border-[#dfc0b7] font-mono text-xs font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingAlarms}
              className="px-6 py-2.5 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-2"
            >
              {savingAlarms ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Alarms...</span>
                </>
              ) : (
                <>
                  <span>Save Alarm Settings</span>
                  <span>✓</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Profile Display Names Customization (Admin & Mom) ─── */}
      <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#a43716] uppercase tracking-wider block">
              Identity Management
            </span>
            <h2 className="text-base font-serif font-bold text-[#1f1b14]">
              Admin &amp; Mom Display Names
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#52652a] font-bold bg-[#f7faef] px-2.5 py-1 rounded-full border border-[#52652a]/20">
            Saved to Database
          </span>
        </div>

        {nameMessage && (
          <p className="text-xs font-semibold text-[#52652a] bg-[#f7faef] p-2.5 rounded-xl border border-[#52652a]/20">
            {nameMessage}
          </p>
        )}

        <form onSubmit={handleSaveNames} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
              Admin Name (You)
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. Vrund"
              className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-bold text-[#1f1b14] bg-[#fcf2e6]/40 focus:bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
              Mom's Name
            </label>
            <input
              type="text"
              value={momName}
              onChange={(e) => setMomName(e.target.value)}
              placeholder="e.g. Mom or Maa"
              className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-bold text-[#1f1b14] bg-[#fcf2e6]/40 focus:bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={savingNames}
              className="px-5 py-2 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-1.5"
            >
              {savingNames ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Names...</span>
                </>
              ) : (
                <>
                  <span>Save Profile Names</span>
                  <span>✓</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Create New User Panel (Admin Verified via ENV PIN) ─── */}
      <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-linear-to-br from-white via-[#fcf2e6]/30 to-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#a43716] uppercase tracking-wider block">
              User Creation Engine
            </span>
            <h2 className="text-base font-serif font-bold text-[#1f1b14]">
              Add New User (Admin Authorized)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#a43716] font-bold bg-[#ffdbd1] px-2.5 py-1 rounded-full border border-[#a43716]/20">
            1,600 kcal Default Target
          </span>
        </div>

        <p className="text-xs text-[#58423c]">
          Enter your Admin PIN (from environment) to register a new user. The user will be initialized with a standard <strong>1,600 calorie</strong> deficit target, personal PIN access, and dedicated routine tracking.
        </p>

        {userError && (
          <p className="text-xs font-semibold text-[#93000a] bg-[#ffdad6] p-2.5 rounded-xl border border-[#ba1a1a]/20">
            {userError}
          </p>
        )}

        {userSuccess && (
          <p className="text-xs font-semibold text-[#52652a] bg-[#f7faef] p-2.5 rounded-xl border border-[#52652a]/20">
            {userSuccess}
          </p>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                Admin ENV PIN *
              </label>
              <input
                type="password"
                maxLength={10}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Admin PIN (e.g. 1234)"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                New User Name *
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Rahul or Priya"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                New User Login PIN *
              </label>
              <input
                type="text"
                maxLength={6}
                value={newUserPin}
                onChange={(e) => setNewUserPin(e.target.value)}
                placeholder="4-digit Login PIN"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                Daily Calorie Limit (kcal)
              </label>
              <input
                type="number"
                value={newUserCalories}
                onChange={(e) => setNewUserCalories(parseInt(e.target.value, 10) || 1600)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
              <span className="text-[10px] text-[#52652a] font-medium block mt-0.5">
                Default: 1,600 kcal
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                Protein Target (g)
              </label>
              <input
                type="number"
                value={newUserProtein}
                onChange={(e) => setNewUserProtein(parseInt(e.target.value, 10) || 130)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-[#8b716a] mb-1">
                Daily Steps Target
              </label>
              <input
                type="number"
                step="500"
                value={newUserSteps}
                onChange={(e) => setNewUserSteps(parseInt(e.target.value, 10) || 8000)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#dfc0b7] text-xs font-mono font-bold text-[#1f1b14] bg-white outline-none focus:ring-1 focus:ring-[#a43716]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creatingUser}
              className="px-6 py-2.5 rounded-xl bg-[#52652a] hover:bg-[#3b4d14] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs flex items-center gap-2"
            >
              {creatingUser ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <span>Create User Account</span>
                  <span>➕</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Managed Users Directory Roster ─── */}
      <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#dfc0b7]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#8b716a] uppercase tracking-wider block">
              Active Accounts
            </span>
            <h2 className="text-base font-serif font-bold text-[#1f1b14]">
              Registered Users Directory ({users.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#58423c]">
            Multi-User Isolation
          </span>
        </div>

        {loadingUsers ? (
          <div className="p-4 text-center text-xs text-[#8b716a] animate-pulse">
            Loading managed accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#fcf2e6]/50 border border-[#dfc0b7] text-center space-y-1">
            <p className="text-xs font-bold text-[#1f1b14]">No managed users created yet</p>
            <p className="text-[11px] text-[#58423c]">
              Use the form above with your Admin PIN to create user accounts with 1,600 calorie defaults.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-[#dfc0b7] bg-[#fcf2e6]/30 flex items-center justify-between shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1f1b14]">{u.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#d4eca2] text-[#3b4d14] text-[9px] font-mono font-bold uppercase">
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#58423c] flex items-center gap-2">
                    <span>🔥 {u.calorieTarget} kcal</span>
                    <span>•</span>
                    <span>🥩 {u.proteinTarget}g Protein</span>
                    <span>•</span>
                    <span>🚶 {u.stepsTarget.toLocaleString()} steps</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8b716a]">
                    PIN: •••• (Registered: {new Date(u.createdAt).toLocaleDateString()})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(u.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6] transition-all"
                  title="Remove user"
                >
                  Delete ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Settings: Role & Routine Initialization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#8b716a] uppercase tracking-wider block">
            Session &amp; Security
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#58423c] font-medium">Session Role</span>
            <span className="px-3 py-1 rounded-full bg-[#fcf2e6] text-[#a43716] border border-[#dfc0b7] font-bold font-mono text-[11px]">
              PRIMARY ADMIN
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#dfc0b7]/50">
            <span className="text-[#58423c] font-medium">Active Timezone</span>
            <span className="text-[#1f1b14] font-mono font-semibold">Asia/Kolkata</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#dfc0b7]/50">
            <span className="text-[#58423c] font-medium">Database Persistence</span>
            <span className="text-[#52652a] font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#52652a]" />
              Supabase IPv4 Pooler
            </span>
          </div>
        </div>

        {/* Demo & Routine Loader */}
        <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-4">
          <span className="text-[10px] font-mono font-bold text-[#8b716a] uppercase tracking-wider block">
            Protocol Initialization
          </span>
          <p className="text-xs text-[#58423c]">
            One-click reloads the complete Mediterranean Routine (Proats, Lunch, Kala Chana, Dinner, Evening Walk, Bedtime Milk).
          </p>

          {seedMessage && (
            <p className="text-xs font-semibold text-[#52652a] animate-pulse bg-[#f7faef] p-2 rounded-xl border border-[#52652a]/20">
              {seedMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSeedSampleRoutine}
            disabled={seeding}
            className="w-full py-2.5 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40 shadow-xs"
          >
            {seeding ? "Importing Routine..." : "Load Default 7-Day Routine"}
          </button>
        </div>

        {/* Clean Data & AI Protocol Calibration */}
        <div className="p-6 rounded-2xl border border-[#ffdad6] bg-linear-to-br from-white to-[#fff8f6] shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#ba1a1a] uppercase tracking-wider block">
              Protocol Reset &amp; AI Calibration Flow
            </span>
            <span className="text-[10px] font-mono text-[#8b716a]">Clean &amp; Re-import</span>
          </div>

          <p className="text-xs text-[#58423c]">
            Cleans active routine data and directly initiates the <strong>AI Coach Studio</strong>. You can set your daily calorie limit (e.g. 1600 or 1800 kcal), paste raw plans from ChatGPT or Claude, review AI-selected foundations, and answer questions or write custom instructions.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Clean active protocol data and launch AI Chat Intake?")) {
                  try {
                    await fetch("/api/plans/reset", { method: "POST" });
                  } catch (e) {
                    console.error("Reset error:", e);
                  }
                  router.push("/chat?intake=1");
                }
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2"
            >
              <span>🧹</span>
              <span>Clean Data &amp; Start AI Intake</span>
            </button>
            <span className="text-[11px] text-[#8b716a]">
              Directs to AI Chat with Calorie Target selection first
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
