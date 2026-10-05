import { prisma } from "../db";

export interface UptimeRobotMonitor {
  id: number;
  friendlyName: string;
  url: string;
  type: number; // 1: HTTP, 2: Keyword, 3: Ping, 4: Port
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

function maskKey(key: string): string {
  if (!key) return "None";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

/**
 * Retrieve active UptimeRobot API key (Database setting takes precedence over .env)
 */
export async function getActiveUptimeRobotKey(): Promise<{
  apiKey: string;
  source: "DATABASE" | "ENV" | "NONE";
  maskedKey: string;
}> {
  try {
    const dbSetting = await prisma.systemSetting.findUnique({
      where: { key: "uptimerobot_api_key" },
    });

    if (dbSetting?.value && dbSetting.value.trim().length > 0) {
      const key = dbSetting.value.trim();
      return {
        apiKey: key,
        source: "DATABASE",
        maskedKey: maskKey(key),
      };
    }
  } catch (err) {
    console.warn("Could not read uptimerobot_api_key from DB:", err);
  }

  const envKey = process.env.UPTIMEROBOT_API_KEY?.trim() || "";
  if (envKey) {
    return {
      apiKey: envKey,
      source: "ENV",
      maskedKey: maskKey(envKey),
    };
  }

  return {
    apiKey: "",
    source: "NONE",
    maskedKey: "None",
  };
}

/**
 * Persist or clear active UptimeRobot API key in database
 */
export async function updateUptimeRobotApiKey(apiKey: string | null): Promise<void> {
  if (!apiKey || apiKey.trim() === "") {
    await prisma.systemSetting.deleteMany({
      where: { key: "uptimerobot_api_key" },
    });
  } else {
    await prisma.systemSetting.upsert({
      where: { key: "uptimerobot_api_key" },
      create: { key: "uptimerobot_api_key", value: apiKey.trim() },
      update: { value: apiKey.trim() },
    });
  }
}

/**
 * Test validity of an UptimeRobot API key
 */
export async function testUptimeRobotApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string; monitorCount?: number }> {
  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        api_key: apiKey.trim(),
        format: "json",
        limit: "5",
      }).toString(),
    });

    const data = (await res.json()) as any;
    if (data.stat === "ok") {
      return {
        valid: true,
        monitorCount: data.pagination?.total ?? (data.monitors?.length || 0),
      };
    }

    return {
      valid: false,
      error: data.message || "Invalid UptimeRobot API response",
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err.message || "Network error contacting UptimeRobot API",
    };
  }
}

/**
 * Fetch live monitors and uptime telemetry from UptimeRobot
 */
export async function getUptimeRobotStatus(): Promise<UptimeRobotStatus> {
  const { apiKey, source, maskedKey } = await getActiveUptimeRobotKey();

  if (!apiKey) {
    return {
      configured: false,
      source: "NONE",
      maskedKey: "None",
      overallStatus: "NOT_CONFIGURED",
      monitors: [],
      totalMonitors: 0,
      upMonitors: 0,
      downMonitors: 0,
      pausedMonitors: 0,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        api_key: apiKey,
        format: "json",
        response_times: "1",
        response_times_limit: "1",
        custom_uptime_ratios: "1-7-30",
      }).toString(),
    });

    const data = (await res.json()) as any;

    if (data.stat !== "ok") {
      return {
        configured: true,
        source,
        maskedKey,
        overallStatus: "ERROR",
        monitors: [],
        totalMonitors: 0,
        upMonitors: 0,
        downMonitors: 0,
        pausedMonitors: 0,
        lastCheckedAt: new Date().toISOString(),
        error: data.message || "UptimeRobot API rejected request",
      };
    }

    const rawMonitors: any[] = data.monitors || [];

    const statusMap: Record<number, "UP" | "DOWN" | "SEEMS_DOWN" | "PAUSED" | "NOT_CHECKED"> = {
      0: "PAUSED",
      1: "NOT_CHECKED",
      2: "UP",
      8: "SEEMS_DOWN",
      9: "DOWN",
    };

    let upCount = 0;
    let downCount = 0;
    let pausedCount = 0;

    const monitors: UptimeRobotMonitor[] = rawMonitors.map((m) => {
      const code = Number(m.status);
      const status = statusMap[code] || "UNKNOWN";

      if (status === "UP") upCount++;
      else if (status === "DOWN" || status === "SEEMS_DOWN") downCount++;
      else if (status === "PAUSED") pausedCount++;

      const ratios = (m.custom_uptime_ratio || "").split("-");
      const uptime24h = ratios[0] ? parseFloat(ratios[0]).toFixed(2) : "100.00";
      const uptime7d = ratios[1] ? parseFloat(ratios[1]).toFixed(2) : "100.00";
      const uptime30d = ratios[2] ? parseFloat(ratios[2]).toFixed(2) : "100.00";

      const latestRt =
        Array.isArray(m.response_times) && m.response_times.length > 0
          ? m.response_times[0].value
          : null;

      return {
        id: m.id,
        friendlyName: m.friendly_name || "Monitor",
        url: m.url || "",
        type: m.type,
        intervalSeconds: m.interval || 300,
        status,
        statusCode: code,
        uptime24h,
        uptime7d,
        uptime30d,
        averageResponseTimeMs: m.average_response_time ? parseFloat(m.average_response_time) : 0,
        latestResponseTimeMs: typeof latestRt === "number" ? latestRt : null,
      };
    });

    let overallStatus: "OPERATIONAL" | "DEGRADED" | "DOWN" | "NO_MONITORS" = "OPERATIONAL";
    if (monitors.length === 0) {
      overallStatus = "NO_MONITORS";
    } else if (downCount > 0 && upCount === 0) {
      overallStatus = "DOWN";
    } else if (downCount > 0) {
      overallStatus = "DEGRADED";
    }

    return {
      configured: true,
      source,
      maskedKey,
      overallStatus,
      monitors,
      totalMonitors: monitors.length,
      upMonitors: upCount,
      downMonitors: downCount,
      pausedMonitors: pausedCount,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      configured: true,
      source,
      maskedKey,
      overallStatus: "ERROR",
      monitors: [],
      totalMonitors: 0,
      upMonitors: 0,
      downMonitors: 0,
      pausedMonitors: 0,
      lastCheckedAt: new Date().toISOString(),
      error: err.message || "Failed to reach UptimeRobot API",
    };
  }
}
