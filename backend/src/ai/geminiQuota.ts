import { prisma } from "../db";

export interface GeminiUsageStats {
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

const DAILY_REQUEST_LIMIT = 1500; // Official Google Gemini Flash Free Tier RPD
const MINUTE_REQUEST_LIMIT = 15;   // 15 RPM
const MINUTE_TOKEN_LIMIT = 1000000; // 1,000,000 TPM

function getUtcTodayDate(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function maskKey(key: string): string {
  if (!key) return "None";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

/**
 * Retrieve active Gemini API key (Database setting takes precedence over .env)
 */
export async function getActiveGeminiKey(): Promise<{
  apiKey: string;
  source: "DATABASE" | "ENV" | "NONE";
  maskedKey: string;
}> {
  try {
    const dbSetting = await prisma.systemSetting.findUnique({
      where: { key: "gemini_api_key" },
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
    console.warn("Could not read gemini_api_key from DB:", err);
  }

  const envKey = process.env.GEMINI_API_KEY?.trim() || "";
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
 * Get comprehensive token and request usage statistics
 */
export async function getGeminiUsageStats(): Promise<GeminiUsageStats> {
  const { apiKey, source, maskedKey } = await getActiveGeminiKey();
  const today = getUtcTodayDate();

  let requestsToday = 0;
  let totalTokensToday = 0;
  let promptTokensToday = 0;
  let candidateTokensToday = 0;
  let lastError: string | null = null;
  let lastUsedAt: string | null = null;

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "gemini_usage_date",
            "gemini_requests_today",
            "gemini_total_tokens_today",
            "gemini_prompt_tokens_today",
            "gemini_candidate_tokens_today",
            "gemini_last_error",
            "gemini_last_used",
          ],
        },
      },
    });

    const map = settings.reduce<Record<string, string>>((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const usageDate = map["gemini_usage_date"];
    if (usageDate === today) {
      requestsToday = parseInt(map["gemini_requests_today"] || "0", 10);
      totalTokensToday = parseInt(map["gemini_total_tokens_today"] || "0", 10);
      promptTokensToday = parseInt(map["gemini_prompt_tokens_today"] || "0", 10);
      candidateTokensToday = parseInt(map["gemini_candidate_tokens_today"] || "0", 10);
    }
    lastError = map["gemini_last_error"] || null;
    lastUsedAt = map["gemini_last_used"] || null;
  } catch (err) {
    console.warn("Failed to read gemini usage stats:", err);
  }

  const remainingRequests = Math.max(0, DAILY_REQUEST_LIMIT - requestsToday);
  const quotaPercentageUsed = Math.min(100, Math.round((requestsToday / DAILY_REQUEST_LIMIT) * 100));

  let quotaStatus: "HEALTHY" | "MODERATE" | "NEARING_LIMIT" | "EXHAUSTED" = "HEALTHY";
  if (requestsToday >= DAILY_REQUEST_LIMIT || lastError?.includes("429")) {
    quotaStatus = "EXHAUSTED";
  } else if (quotaPercentageUsed >= 85 || remainingRequests <= 150) {
    quotaStatus = "NEARING_LIMIT";
  } else if (quotaPercentageUsed >= 60) {
    quotaStatus = "MODERATE";
  }

  const needsChange = quotaStatus === "EXHAUSTED" || quotaStatus === "NEARING_LIMIT" || !apiKey;
  const model = process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash";

  return {
    configured: Boolean(apiKey),
    source,
    maskedKey,
    model,
    dailyRequestLimit: DAILY_REQUEST_LIMIT,
    requestsToday,
    remainingRequests,
    totalTokensToday,
    promptTokensToday,
    candidateTokensToday,
    minuteRateLimit: MINUTE_REQUEST_LIMIT,
    minuteTokenLimit: MINUTE_TOKEN_LIMIT,
    quotaPercentageUsed,
    quotaStatus,
    needsChange,
    lastUsedAt,
    lastError,
    resetInfo: "Daily at 00:00 UTC (Midnight Pacific)",
  };
}

/**
 * Record token & request usage into database system settings
 */
export async function recordGeminiUsage(
  tokens?: { prompt?: number; candidate?: number; total?: number },
  errorMsg?: string | null
): Promise<void> {
  const today = getUtcTodayDate();
  const now = new Date().toISOString();

  try {
    const existingDate = await prisma.systemSetting.findUnique({
      where: { key: "gemini_usage_date" },
    });

    const isNewDay = !existingDate || existingDate.value !== today;

    const [currentRequests, currentTotalTokens, currentPrompt, currentCandidate] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "gemini_requests_today" } }),
      prisma.systemSetting.findUnique({ where: { key: "gemini_total_tokens_today" } }),
      prisma.systemSetting.findUnique({ where: { key: "gemini_prompt_tokens_today" } }),
      prisma.systemSetting.findUnique({ where: { key: "gemini_candidate_tokens_today" } }),
    ]);

    const reqCount = isNewDay ? 1 : (parseInt(currentRequests?.value || "0", 10) + 1);
    const promptTokens = (isNewDay ? 0 : parseInt(currentPrompt?.value || "0", 10)) + (tokens?.prompt || 0);
    const candTokens = (isNewDay ? 0 : parseInt(currentCandidate?.value || "0", 10)) + (tokens?.candidate || 0);
    const totTokens = (isNewDay ? 0 : parseInt(currentTotalTokens?.value || "0", 10)) + (tokens?.total || (tokens?.prompt || 0) + (tokens?.candidate || 0));

    const upserts = [
      prisma.systemSetting.upsert({
        where: { key: "gemini_usage_date" },
        create: { key: "gemini_usage_date", value: today },
        update: { value: today },
      }),
      prisma.systemSetting.upsert({
        where: { key: "gemini_requests_today" },
        create: { key: "gemini_requests_today", value: String(reqCount) },
        update: { value: String(reqCount) },
      }),
      prisma.systemSetting.upsert({
        where: { key: "gemini_total_tokens_today" },
        create: { key: "gemini_total_tokens_today", value: String(totTokens) },
        update: { value: String(totTokens) },
      }),
      prisma.systemSetting.upsert({
        where: { key: "gemini_prompt_tokens_today" },
        create: { key: "gemini_prompt_tokens_today", value: String(promptTokens) },
        update: { value: String(promptTokens) },
      }),
      prisma.systemSetting.upsert({
        where: { key: "gemini_candidate_tokens_today" },
        create: { key: "gemini_candidate_tokens_today", value: String(candTokens) },
        update: { value: String(candTokens) },
      }),
      prisma.systemSetting.upsert({
        where: { key: "gemini_last_used" },
        create: { key: "gemini_last_used", value: now },
        update: { value: now },
      }),
    ];

    if (errorMsg !== undefined) {
      upserts.push(
        prisma.systemSetting.upsert({
          where: { key: "gemini_last_error" },
          create: { key: "gemini_last_error", value: errorMsg || "" },
          update: { value: errorMsg || "" },
        })
      );
    }

    await Promise.all(upserts);
  } catch (err) {
    console.warn("Could not record gemini usage:", err);
  }
}

/**
 * Validate a candidate Gemini API key by making a minimal test call to Google AI
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: "API Key cannot be blank." };
  }

  const model = process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 2 },
      }),
    });

    if (res.ok) {
      return { valid: true };
    }

    const data = (await res.json().catch(() => ({}))) as any;
    const message = data?.error?.message || `Google API returned HTTP ${res.status}`;
    return { valid: false, error: message };
  } catch (err: any) {
    return { valid: false, error: err.message || "Network error connecting to Google Gemini" };
  }
}

/**
 * Save new custom API key or revert to .env
 */
export async function updateGeminiApiKey(newKey: string | null): Promise<void> {
  if (!newKey || newKey.trim() === "" || newKey === "DEFAULT") {
    // Revert to environment variable by deleting database setting
    await prisma.systemSetting.deleteMany({
      where: { key: "gemini_api_key" },
    });
    // Clear any previous error
    await prisma.systemSetting.deleteMany({
      where: { key: "gemini_last_error" },
    });
  } else {
    // Upsert into database
    await prisma.systemSetting.upsert({
      where: { key: "gemini_api_key" },
      create: { key: "gemini_api_key", value: newKey.trim() },
      update: { value: newKey.trim() },
    });
    // Clear last error on successful new key
    await prisma.systemSetting.deleteMany({
      where: { key: "gemini_last_error" },
    });
  }
}
