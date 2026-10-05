import { Router, type Request, type Response } from "express";
import { prisma } from "../db";
import { verifyPin, requireUserMiddleware } from "../auth";

const router = Router();

// GET /api/settings/users — Returns admin/mom display names and all managed users
router.get("/settings/users", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
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
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        pin: u.pin,
        role: u.role,
        calorieTarget: u.calorieTarget || 1600,
        proteinTarget: u.proteinTarget || 130,
        stepsTarget: u.stepsTarget || 8000,
        waterTargetMl: u.waterTargetMl || 3000,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET /api/settings/users error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// POST /api/settings/users — Create new user from admin panel (verifying admin PIN from env)
router.post("/settings/users", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      adminPin,
      name,
      pin,
      calorieTarget = 1600,
      proteinTarget = 130,
      stepsTarget = 8000,
      waterTargetMl = 3000,
    } = req.body || {};

    const envAdminPin = process.env.ADMIN_PIN || process.env.USER_PIN || "1234";

    if (!adminPin || !verifyPin(String(adminPin), envAdminPin)) {
      res.status(403).json({ error: "Invalid Admin PIN. Verification failed against env credentials." });
      return;
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "User name is required." });
      return;
    }

    if (!pin || typeof pin !== "string" || pin.trim().length < 4) {
      res.status(400).json({ error: "User PIN must be at least 4 digits." });
      return;
    }

    const cleanPin = pin.trim();

    // Check PIN uniqueness
    if (cleanPin === envAdminPin || cleanPin === (process.env.MOM_PIN || "5678")) {
      res.status(400).json({ error: "PIN is reserved for Admin/Mom system access." });
      return;
    }

    const existing = await prisma.userProfile.findUnique({
      where: { pin: cleanPin },
    });

    if (existing) {
      res.status(400).json({ error: `PIN is already assigned to ${existing.name}. Choose another PIN.` });
      return;
    }

    const newUser = await prisma.userProfile.create({
      data: {
        name: name.trim(),
        pin: cleanPin,
        role: "USER",
        calorieTarget: Number(calorieTarget) || 1600,
        proteinTarget: Number(proteinTarget) || 130,
        stepsTarget: Number(stepsTarget) || 8000,
        waterTargetMl: Number(waterTargetMl) || 3000,
        isAdmin: false,
      },
    });

    res.json({
      success: true,
      message: `User ${newUser.name} created successfully with ${newUser.calorieTarget} kcal daily default!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        pin: newUser.pin,
        role: newUser.role,
        calorieTarget: newUser.calorieTarget,
        proteinTarget: newUser.proteinTarget,
        stepsTarget: newUser.stepsTarget,
        waterTargetMl: newUser.waterTargetMl,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("POST /api/settings/users error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// DELETE /api/settings/users/:id — Remove managed user
router.delete("/settings/users/:id", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminPin = (req.headers["x-admin-pin"] as string) || req.body?.adminPin;
    const envAdminPin = process.env.ADMIN_PIN || process.env.USER_PIN || "1234";

    if (!adminPin || !verifyPin(String(adminPin), envAdminPin)) {
      res.status(403).json({ error: "Admin PIN verification required to remove users." });
      return;
    }

    await prisma.userProfile.delete({
      where: { id },
    });

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

export default router;
