"use client";

import { useState, useEffect, useCallback } from "react";

export interface UptimeRobotMonitor {
  id: number;
  friendlyName: string;
  url: string;
  type: number;
  intervalSeconds: number;
  status: "UP" | "DOWN" | "SEEMS_DOWN" | "PAUSED" | "NOT_CHECKED" | "UNKNOWN";
  statusCode: number;
  uptime24h: string;
  uptime7d: string;
  uptime30d: string;
  averageResponseTimeMs: number;
  latestResponseTimeMs: number | null;
}

export interface UptimeRobotStatus {
  configured: boolean;
  source: "DATABASE" | "ENV" | "NONE";
  maskedKey: string;
  overallStatus: "OPERATIONAL" | "DEGRADED" | "DOWN" | "NOT_CONFIGURED" | "NO_MONITORS" | "ERROR";
  monitors: UptimeRobotMonitor[];
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  pausedMonitors: number;
  lastCheckedAt: string;
  error?: string | null;
}

export function UptimeRobotCockpit() {
  const [data, setData] = useState<UptimeRobotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchStatus = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch("/api/settings/uptimerobot");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error("Failed to fetch UptimeRobot status:", res.statusText);
      }
    } catch (err) {
      console.error("Error loading UptimeRobot telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || savingKey) return;
    setSavingKey(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/uptimerobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setMessage({ text: resJson.message || "UptimeRobot API Key activated!" });
        setApiKeyInput("");
        setShowKeyInput(false);
        if (resJson.status) setData(resJson.status);
        else fetchStatus();
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ text: resJson.error || "Failed to update UptimeRobot key.", error: true });
      }
    } catch {
      setMessage({ text: "Network error connecting to backend.", error: true });
    } finally {
      setSavingKey(false);
    }
  };

  const handleRevertKey = async () => {
    if (savingKey) return;
    setSavingKey(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/uptimerobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revert" }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setMessage({ text: resJson.message || "Reverted to .env key." });
        if (resJson.status) setData(resJson.status);
        else fetchStatus();
        setTimeout(() => setMessage(null), 4000);
      }
    } catch {
      setMessage({ text: "Failed to revert key.", error: true });
    } finally {
      setSavingKey(false);
    }
  };

  const handleCopyHealthUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const healthUrl = `${origin}/backend-health`;
    navigator.clipboard.writeText(healthUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const isConfigured = data?.configured;
  const overallStatus = data?.overallStatus || "NOT_CONFIGURED";

  return (
    <div className="p-6 rounded-2xl border border-[#dfc0b7] bg-white shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#dfc0b7] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                overallStatus === "OPERATIONAL"
                  ? "bg-[#52652a] animate-pulse"
                  : overallStatus === "DEGRADED"
                  ? "bg-[#b78103] animate-pulse"
                  : overallStatus === "DOWN"
                  ? "bg-[#ba1a1a] animate-pulse"
                  : "bg-[#8b716a]"
              }`}
            />
            <span className="text-[10px] font-mono font-bold text-[#a43716] uppercase tracking-wider">
              UptimeRobot • System Keep-Alive &amp; Heartbeat
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-[#1f1b14]">
            UptimeRobot Telemetry &amp; Server Heartbeat
          </h2>
          <p className="text-xs text-[#58423c]">
            Live ping latency, 24/7 background keep-alive monitoring, and automated uptime ratios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-[10px] font-mono text-[#8b716a] animate-pulse">Syncing monitors...</span>
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border uppercase ${
                overallStatus === "OPERATIONAL"
                  ? "bg-[#f7faef] text-[#52652a] border-[#52652a]/20"
                  : overallStatus === "DEGRADED"
                  ? "bg-[#fff8e1] text-[#b78103] border-[#b78103]/20"
                  : overallStatus === "DOWN"
                  ? "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30 animate-pulse"
                  : "bg-[#fcf2e6] text-[#a43716] border-[#dfc0b7]"
              }`}
            >
              ● {overallStatus.replace("_", " ")}
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchStatus(true)}
            disabled={refreshing || loading}
            title="Refresh monitors"
            className="p-1.5 rounded-lg border border-[#dfc0b7] hover:bg-[#fcf2e6] text-xs transition-all active:scale-95 disabled:opacity-40"
          >
            <span className={refreshing ? "inline-block animate-spin" : ""}>🔄</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold ${
            message.error
              ? "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30"
              : "bg-[#f7faef] text-[#52652a] border-[#52652a]/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Error alert from UptimeRobot API */}
      {data?.error && (
        <div className="p-3 rounded-xl bg-[#ffdad6]/60 border border-[#ba1a1a]/30 text-xs text-[#93000a] space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span>
            <span>UptimeRobot API Warning</span>
          </p>
          <p className="text-[11px] text-[#58423c]">{data.error}</p>
        </div>
      )}

      {/* Not Configured State */}
      {!isConfigured && !loading && (
        <div className="p-5 rounded-xl border border-dashed border-[#dfc0b7] bg-[#fcf2e6]/40 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-[#1f1b14]">UptimeRobot API Key Needed</h3>
              <p className="text-xs text-[#58423c] leading-relaxed">
                Connect your free UptimeRobot account to display real-time ping latency, uptime graphs, and monitor status right inside Schedulify.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white border border-[#dfc0b7]/70 space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#a43716]">Option 1: Add to .env</span>
              <p className="text-[#58423c] text-[11px]">
                Add to your <code className="px-1 py-0.5 rounded bg-[#fcf2e6] font-mono text-[#a43716]">backend/.env</code>:
              </p>
              <pre className="p-2 rounded bg-[#1f1b14] text-[#fcf2e6] font-mono text-[10px] overflow-x-auto select-all">
                UPTIMEROBOT_API_KEY=ur1234567-xxxxxxxxxxxxxxxx
              </pre>
            </div>

            <div className="p-3 rounded-lg bg-white border border-[#dfc0b7]/70 space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#a43716]">Option 2: Direct In-App Activation</span>
              <p className="text-[#58423c] text-[11px]">
                Paste your UptimeRobot Main or Read-Only API Key below to activate instantly without server restart.
              </p>
              <button
                type="button"
                onClick={() => setShowKeyInput(true)}
                className="w-full py-1.5 rounded-lg bg-[#a43716] hover:bg-[#862201] text-white font-bold text-xs transition-all active:scale-95"
              >
                Enter API Key Directly 🔑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3 Metric Tiles when configured */}
      {isConfigured && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tile 1: Overall Monitors */}
          <div className="p-4 rounded-xl border border-[#dfc0b7] bg-linear-to-br from-[#fcf2e6]/50 to-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a]">
                Active Monitors
              </span>
              <span className="text-[10px] font-mono font-bold text-[#52652a] bg-[#f7faef] px-2 py-0.5 rounded-full border border-[#52652a]/20">
                {data.upMonitors} / {data.totalMonitors} Online
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#1f1b14]">
                {data.totalMonitors}
              </span>
              <span className="text-xs text-[#8b716a] font-mono">
                {data.totalMonitors === 1 ? "monitor tracked" : "monitors tracked"}
              </span>
            </div>
            <div className="text-[11px] text-[#58423c] flex items-center justify-between">
              <span>Paused / Down:</span>
              <span className="font-mono font-bold text-[#1f1b14]">
                {data.pausedMonitors} paused • {data.downMonitors} down
              </span>
            </div>
          </div>

          {/* Tile 2: Uptime % Ratios */}
          <div className="p-4 rounded-xl border border-[#dfc0b7] bg-linear-to-br from-[#fcf2e6]/50 to-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a]">
                24H / 30D Uptime Ratio
              </span>
              <span className="text-[10px] font-mono font-bold text-[#a43716]">
                SLO Goal: 99.9%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#52652a]">
                {data.monitors[0]?.uptime24h ?? "100.00"}%
              </span>
              <span className="text-xs text-[#8b716a] font-mono">last 24 hours</span>
            </div>
            <div className="text-[11px] text-[#58423c] flex items-center justify-between">
              <span>30-Day Historical:</span>
              <strong className="font-mono text-[#1f1b14]">
                {data.monitors[0]?.uptime30d ?? "100.00"}%
              </strong>
            </div>
          </div>

          {/* Tile 3: Key & Target */}
          <div className="p-4 rounded-xl border border-[#dfc0b7] bg-linear-to-br from-[#fcf2e6]/50 to-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-[#8b716a]">
                Active Key Source
              </span>
              <span className="text-[10px] font-mono font-bold text-[#a43716]">
                {data.source === "DATABASE" ? "Custom DB Key" : "Default (.env)"}
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-[#1f1b14] truncate py-1">
              {data.maskedKey}
            </div>
            <p className="text-[11px] text-[#58423c] flex items-center justify-between">
              <span>Avg Latency:</span>
              <strong className="font-mono text-[#1f1b14]">
                {data.monitors[0]?.averageResponseTimeMs ?? 0} ms
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Monitors List */}
      {isConfigured && data.monitors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#58423c]">
              Monitored Target Endpoints
            </h3>
            <span className="text-[10px] text-[#8b716a] font-mono">
              Last synced: {new Date(data.lastCheckedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="space-y-2">
            {data.monitors.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-[#dfc0b7] bg-[#fcf2e6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        m.status === "UP"
                          ? "bg-[#52652a]"
                          : m.status === "PAUSED"
                          ? "bg-[#8b716a]"
                          : "bg-[#ba1a1a]"
                      }`}
                    />
                    <strong className="text-[#1f1b14] font-semibold">{m.friendlyName}</strong>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        m.status === "UP"
                          ? "bg-[#f7faef] text-[#52652a] border border-[#52652a]/20"
                          : m.status === "PAUSED"
                          ? "bg-[#fcf2e6] text-[#8b716a] border border-[#dfc0b7]"
                          : "bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#8b716a] truncate max-w-md">
                    {m.url || "No URL specified"}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-[#8b716a] uppercase">Ping Latency</div>
                    <div className="font-mono font-bold text-[#1f1b14]">
                      {m.latestResponseTimeMs !== null ? `${m.latestResponseTimeMs} ms` : `${m.averageResponseTimeMs} ms`}
                    </div>
                  </div>

                  <div className="text-right border-l border-[#dfc0b7] pl-3">
                    <div className="text-[10px] font-mono text-[#8b716a] uppercase">24h Uptime</div>
                    <div className="font-mono font-bold text-[#52652a]">{m.uptime24h}%</div>
                  </div>

                  <div className="text-right border-l border-[#dfc0b7] pl-3">
                    <div className="text-[10px] font-mono text-[#8b716a] uppercase">Interval</div>
                    <div className="font-mono text-[#58423c]">{Math.round(m.intervalSeconds / 60)} min</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copyable Health Check URL box for easy monitor creation in UptimeRobot */}
      <div className="p-4 rounded-xl border border-[#dfc0b7] bg-linear-to-r from-white to-[#fcf2e6]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono font-bold uppercase text-[#a43716]">
            Ping Target for UptimeRobot Monitor
          </span>
          <p className="text-[11px] text-[#58423c]">
            Use this health endpoint URL when setting up your HTTP(s) Monitor in UptimeRobot:
          </p>
          <div className="font-mono text-[11px] text-[#1f1b14] bg-white px-2.5 py-1 rounded-md border border-[#dfc0b7] inline-block mt-1">
            /backend-health <span className="text-[#8b716a]">(aliases /health &amp; /api/health)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyHealthUrl}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#fcf2e6] border border-[#dfc0b7] text-[#1f1b14] text-xs font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 self-start sm:self-center shrink-0"
        >
          <span>{copiedUrl ? "✅ Copied!" : "📋 Copy Full URL"}</span>
        </button>
      </div>

      {/* Bottom Actions: Key Form Toggle and UptimeRobot Links */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeyInput((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
          >
            <span>{showKeyInput ? "✕ Close Key Form" : isConfigured ? "🔑 Change UptimeRobot Key" : "🔑 Set API Key"}</span>
          </button>

          {data?.source === "DATABASE" && (
            <button
              type="button"
              onClick={handleRevertKey}
              disabled={savingKey}
              className="px-3.5 py-2 rounded-xl bg-[#fcf2e6] hover:bg-[#fae3cf] text-[#a43716] border border-[#dfc0b7] text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
            >
              Revert to .env Key
            </button>
          )}
        </div>

        <a
          href="https://uptimerobot.com/dashboard#mySettings"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-[#a43716] hover:underline flex items-center gap-1"
        >
          <span>Open UptimeRobot API Settings Dashboard</span>
          <span>↗</span>
        </a>
      </div>

      {/* Collapsible Key Entry Form */}
      {showKeyInput && (
        <form onSubmit={handleSaveKey} className="p-4 rounded-xl border border-[#dfc0b7] bg-[#fcf2e6]/30 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1f1b14] block">
              Enter UptimeRobot API Key (Main or Read-Only)
            </label>
            <p className="text-[11px] text-[#58423c]">
              We recommend using a <strong>Read-Only API Key</strong> (starts with <code className="font-mono text-[#a43716]">ur...</code>) from your UptimeRobot Integrations page for security.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. ur1234567-89abcdef0123456789abcdef"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-[#dfc0b7] bg-white text-xs font-mono text-[#1f1b14] placeholder-[#8b716a] focus:outline-hidden focus:border-[#a43716] focus:ring-1 focus:ring-[#a43716]"
            />
            <button
              type="submit"
              disabled={savingKey || !apiKeyInput.trim()}
              className="px-5 py-2 rounded-xl bg-[#a43716] hover:bg-[#862201] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-xs shrink-0"
            >
              {savingKey ? "Verifying with UptimeRobot..." : "Verify & Save Key"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
