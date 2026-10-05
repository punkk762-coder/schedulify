import { Router, type Request, type Response } from "express";
import { prisma } from "../db";
import { verifyPin, requireUserMiddleware } from "../auth";
import {
  getGeminiUsageStats,
  testGeminiApiKey,
  updateGeminiApiKey,
} from "../ai/geminiQuota";
import {
  getUptimeRobotStatus,
  testUptimeRobotApiKey,
  updateUptimeRobotApiKey,
} from "../uptime/uptimerobot";

const router = Router();

// Helper: Generate unique 4-digit PIN for new managed user
async function generateUniquePin(): Promise<string> {
  const envAdminPin = process.env.ADMIN_PIN || process.env.USER_PIN || "1234";
  const envMomPin = process.env.MOM_PIN || "5678";
  const reserved = new Set([
    envAdminPin,
    envMomPin,
    "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321", "2468", "1357"
  ]);

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = Math.floor(1000 + Math.random() * 9000).toString();
    if (reserved.has(candidate)) continue;
    const existing = await prisma.userProfile.findUnique({ where: { pin: candidate } });
    if (!existing) return candidate;
  }
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET /api/settings/users/generate-pin — Generate new unique 4-digit PIN for Admin
router.get("/settings/users/generate-pin", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const pin = await generateUniquePin();
    res.json({ pin });
  } catch (err) {
    console.error("GET /api/settings/users/generate-pin error:", err);
    res.status(500).json({ error: "Failed to generate PIN" });
  }
});

// GET /api/settings/users — Returns admin/mom display names, admin check, and managed users with setup status
router.get("/settings/users", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as any).user;
    let isCallerAdmin = Boolean(session?.isAdmin);
    if (!isCallerAdmin && session?.role === "USER" && session?.userId) {
      const managedProfile = await prisma.userProfile.findUnique({ where: { id: session.userId } });
      if (!managedProfile || managedProfile.isAdmin) {
        isCallerAdmin = true;
      }
    }

    const [settings, users] = await Promise.all([
      prisma.systemSetting.findMany(),
      prisma.userProfile.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const settingsMap = settings.reduce<Record<string, string>>((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const adminName = settingsMap["admin_name"] || "Vrund";
    const momName = settingsMap["mom_name"] || "Mom";

    res.json({
      adminName,
      momName,
      isAdmin: isCallerAdmin,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        // Only Admin sees full PINs so they can issue/share them
        pin: isCallerAdmin ? u.pin : "••••",
        role: u.role,
        calorieTarget: u.calorieTarget || 1600,
        proteinTarget: u.proteinTarget || 130,
        stepsTarget: u.stepsTarget || 8000,
        waterTargetMl: u.waterTargetMl || 3000,
        isSetupComplete: settingsMap[`onboarding_${u.id}`] === "true",
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET /api/settings/users error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// POST /api/settings/users — Strictly Admin only: Create new user with generated PIN
router.post("/settings/users", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as any).user;
    let isCallerAdmin = Boolean(session?.isAdmin);
    if (!isCallerAdmin && session?.role === "USER" && session?.userId) {
      const managedProfile = await prisma.userProfile.findUnique({ where: { id: session.userId } });
      if (!managedProfile || managedProfile.isAdmin) {
        isCallerAdmin = true;
      }
    }

    const {
      adminPin,
      name,
      pin,
    } = req.body || {};

    const envAdminPin = process.env.ADMIN_PIN || process.env.USER_PIN || "1234";

    // Strictly enforce: Only admin can create users
    if (!isCallerAdmin) {
      if (!adminPin || !verifyPin(String(adminPin), envAdminPin)) {
        res.status(403).json({ error: "Access denied: Only Admin can create user accounts." });
        return;
      }
    } else if (adminPin && !verifyPin(String(adminPin), envAdminPin)) {
      res.status(403).json({ error: "Invalid Admin PIN." });
      return;
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "User name is required." });
      return;
    }

    // Auto-generate clean 4-digit PIN if none provided
    let cleanPin = pin ? String(pin).trim() : "";
    if (!cleanPin || cleanPin.length < 4) {
      cleanPin = await generateUniquePin();
    }

    // Check PIN uniqueness
    if (cleanPin === envAdminPin || cleanPin === (process.env.MOM_PIN || "5678")) {
      res.status(400).json({ error: "PIN is reserved for Admin/Mom system access." });
      return;
    }

    const existing = await prisma.userProfile.findUnique({
      where: { pin: cleanPin },
    });

    if (existing) {
      res.status(400).json({ error: `PIN ${cleanPin} is already assigned to ${existing.name}. Click 'Generate PIN' for a new code.` });
      return;
    }

    const newUser = await prisma.userProfile.create({
      data: {
        name: name.trim(),
        pin: cleanPin,
        role: "USER",
        calorieTarget: 1600,
        proteinTarget: 130,
        stepsTarget: 8000,
        waterTargetMl: 3000,
        isAdmin: false,
      },
    });

    // Mark onboarding state as pending for new user
    await prisma.systemSetting.upsert({
      where: { key: `onboarding_${newUser.id}` },
      create: { key: `onboarding_${newUser.id}`, value: "pending" },
      update: { value: "pending" },
    });

    res.json({
      success: true,
      message: `User "${newUser.name}" created! Generated PIN: ${cleanPin}. Share this PIN with them to begin their setup.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        pin: cleanPin,
        role: newUser.role,
        calorieTarget: newUser.calorieTarget,
        proteinTarget: newUser.proteinTarget,
        stepsTarget: newUser.stepsTarget,
        waterTargetMl: newUser.waterTargetMl,
        isSetupComplete: false,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("POST /api/settings/users error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// POST /api/settings/users/:id/regenerate-pin — Admin only: Re-issue a fresh 4-digit PIN for a user
router.post("/settings/users/:id/regenerate-pin", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = (req as any).user;
    let isCallerAdmin = Boolean(session?.isAdmin);
    if (!isCallerAdmin && session?.role === "USER" && session?.userId) {
      const managedProfile = await prisma.userProfile.findUnique({ where: { id: session.userId } });
      if (!managedProfile || managedProfile.isAdmin) {
        isCallerAdmin = true;
      }
    }

    if (!isCallerAdmin) {
      res.status(403).json({ error: "Access denied: Only Admin can regenerate user PINs." });
      return;
    }

    const newPin = await generateUniquePin();
    const updated = await prisma.userProfile.update({
      where: { id },
      data: { pin: newPin },
    });

    res.json({
      success: true,
      message: `New PIN generated for ${updated.name}: ${newPin}`,
      pin: newPin,
    });
  } catch (err) {
    console.error("POST /api/settings/users/:id/regenerate-pin error:", err);
    res.status(500).json({ error: "Failed to regenerate PIN" });
  }
});

// DELETE /api/settings/users/:id — Strictly Admin only: Remove managed user
router.delete("/settings/users/:id", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = (req as any).user;
    let isCallerAdmin = Boolean(session?.isAdmin);
    if (!isCallerAdmin && session?.role === "USER" && session?.userId) {
      const managedProfile = await prisma.userProfile.findUnique({ where: { id: session.userId } });
      if (!managedProfile || managedProfile.isAdmin) {
        isCallerAdmin = true;
      }
    }

    const adminPin = (req.headers["x-admin-pin"] as string) || req.body?.adminPin;
    const envAdminPin = process.env.ADMIN_PIN || process.env.USER_PIN || "1234";

    if (!isCallerAdmin) {
      if (!adminPin || !verifyPin(String(adminPin), envAdminPin)) {
        res.status(403).json({ error: "Access denied: Only Admin can remove user accounts." });
        return;
      }
    }

    await Promise.all([
      prisma.userProfile.delete({ where: { id } }),
      prisma.systemSetting.deleteMany({
        where: { key: { in: [`onboarding_${id}`, `phase_${id}`] } },
      }),
    ]);

    res.json({ success: true, message: "User deleted from roster." });
  } catch (err) {
    console.error("DELETE /api/settings/users error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// POST /api/settings/profiles — Update Admin & Mom display names
router.post("/settings/profiles", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminName, momName } = req.body || {};

    const updates: Promise<any>[] = [];

    if (adminName && typeof adminName === "string" && adminName.trim()) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: "admin_name" },
          create: { key: "admin_name", value: adminName.trim() },
          update: { value: adminName.trim() },
        })
      );
    }

    if (momName && typeof momName === "string" && momName.trim()) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: "mom_name" },
          create: { key: "mom_name", value: momName.trim() },
          update: { value: momName.trim() },
        })
      );
    }

    await Promise.all(updates);

    const [adminSetting, momSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "admin_name" } }),
      prisma.systemSetting.findUnique({ where: { key: "mom_name" } }),
    ]);

    res.json({
      success: true,
      adminName: adminSetting?.value || "Vrund",
      momName: momSetting?.value || "Mom",
      message: "Display names updated successfully!",
    });
  } catch (err) {
    console.error("POST /api/settings/profiles error:", err);
    res.status(500).json({ error: "Failed to update profile names" });
  }
});

// GET /api/settings/gemini — Fetch real-time Gemini token & request quota metrics
router.get("/settings/gemini", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getGeminiUsageStats();
    res.json(stats);
  } catch (err) {
    console.error("GET /api/settings/gemini error:", err);
    res.status(500).json({ error: "Failed to load Gemini quota stats" });
  }
});

// POST /api/settings/gemini — Test and swap Gemini API key or revert to .env
router.post("/settings/gemini", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, action } = req.body || {};

    if (action === "revert" || !apiKey || apiKey.trim() === "") {
      await updateGeminiApiKey(null);
      const updated = await getGeminiUsageStats();
      res.json({
        success: true,
        message: "Reverted to default .env Gemini API key.",
        stats: updated,
      });
      return;
    }

    const cleanKey = apiKey.trim();

    // Verify key validity with Google AI endpoint before committing
    const testResult = await testGeminiApiKey(cleanKey);
    if (!testResult.valid) {
      res.status(400).json({
        error: `Google Gemini verification failed: ${testResult.error || "Invalid API key"}. Key was not saved.`,
      });
      return;
    }

    // Persist validated key in DB
    await updateGeminiApiKey(cleanKey);
    const updated = await getGeminiUsageStats();

    res.json({
      success: true,
      message: "Gemini API Key verified with Google AI and activated successfully!",
      stats: updated,
    });
  } catch (err) {
    console.error("POST /api/settings/gemini error:", err);
    res.status(500).json({ error: "Failed to update Gemini API key" });
  }
});

// ─── Routine Alarms & Notification Sounds Engine ───

export interface RoutineAlarmItem {
  id: string;
  name: string;
  time: string;
  category: "MEAL" | "ACTIVITY" | "HYDRATION" | "OTHER";
  enabled: boolean;
  intervalHours?: number;
}

export interface AlarmSettings {
  sound: "zen_bell" | "energetic_pulse" | "digital_alarm" | "synth_ambient" | "vitality_gong";
  volume: number;
  leadTimeMin: number;
  browserPushEnabled: boolean;
  routines: RoutineAlarmItem[];
}

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
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
};

export async function getAlarmSettings(): Promise<AlarmSettings> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "alarm_settings" },
    });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return {
        ...DEFAULT_ALARM_SETTINGS,
        ...parsed,
        routines: Array.isArray(parsed.routines) && parsed.routines.length > 0 ? parsed.routines : DEFAULT_ALARM_SETTINGS.routines,
      };
    }
  } catch (err) {
    console.warn("Could not read alarm_settings from DB:", err);
  }
  return DEFAULT_ALARM_SETTINGS;
}

// GET /api/settings/alarms — Read user's alarm sounds & routine schedules
router.get("/settings/alarms", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getAlarmSettings();
    res.json(settings);
  } catch (err) {
    console.error("GET /api/settings/alarms error:", err);
    res.status(500).json({ error: "Failed to fetch alarm settings" });
  }
});

// POST /api/settings/alarms — Update alarm sounds, volume, and routine alarm triggers
router.post("/settings/alarms", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const current = await getAlarmSettings();
    const updateData = req.body || {};

    const merged: AlarmSettings = {
      sound: updateData.sound || current.sound,
      volume: typeof updateData.volume === "number" ? Math.max(0, Math.min(1, updateData.volume)) : current.volume,
      leadTimeMin: typeof updateData.leadTimeMin === "number" ? updateData.leadTimeMin : current.leadTimeMin,
      browserPushEnabled: typeof updateData.browserPushEnabled === "boolean" ? updateData.browserPushEnabled : current.browserPushEnabled,
      routines: Array.isArray(updateData.routines) ? updateData.routines : current.routines,
    };

    await prisma.systemSetting.upsert({
      where: { key: "alarm_settings" },
      create: { key: "alarm_settings", value: JSON.stringify(merged) },
      update: { value: JSON.stringify(merged) },
    });

    res.json({
      success: true,
      message: "Alarm sound & routine notification schedule saved!",
      settings: merged,
    });
  } catch (err) {
    console.error("POST /api/settings/alarms error:", err);
    res.status(500).json({ error: "Failed to update alarm settings" });
  }
});

// GET /api/settings/uptimerobot — Fetch live UptimeRobot monitors & telemetry
router.get("/settings/uptimerobot", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await getUptimeRobotStatus();
    res.json(status);
  } catch (err) {
    console.error("GET /api/settings/uptimerobot error:", err);
    res.status(500).json({ error: "Failed to fetch UptimeRobot metrics" });
  }
});

// POST /api/settings/uptimerobot — Test and update/revert UptimeRobot API key
router.post("/settings/uptimerobot", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, action } = req.body || {};

    if (action === "revert" || !apiKey || apiKey.trim() === "") {
      await updateUptimeRobotApiKey(null);
      const updated = await getUptimeRobotStatus();
      res.json({
        success: true,
        message: "Reverted to default .env UptimeRobot API key.",
        status: updated,
      });
      return;
    }

    const cleanKey = apiKey.trim();
    const testResult = await testUptimeRobotApiKey(cleanKey);
    if (!testResult.valid) {
      res.status(400).json({
        error: `UptimeRobot verification failed: ${testResult.error || "Invalid API key"}. Key was not saved.`,
      });
      return;
    }

    await updateUptimeRobotApiKey(cleanKey);
    const updated = await getUptimeRobotStatus();

    res.json({
      success: true,
      message: `UptimeRobot API Key verified! Found ${testResult.monitorCount ?? 0} monitor(s).`,
      status: updated,
    });
  } catch (err) {
    console.error("POST /api/settings/uptimerobot error:", err);
    res.status(500).json({ error: "Failed to update UptimeRobot key" });
  }
});

export default router;

