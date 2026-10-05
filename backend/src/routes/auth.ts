import { Router, type Request, type Response } from "express";
import { prisma } from "../db";
import { verifyPin, setSession, destroySession, getSession } from "../auth";
import { loginSchema } from "../validation/schemas";

const router = Router();

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "PIN must be between 4 and 10 digits" });
      return;
    }

    const { pin } = parse.data;
    const userPin = process.env.USER_PIN || "1234";
    const momPin = process.env.MOM_PIN || "5678";

    let role: "USER" | "MOM" | null = null;
    let userName = "Admin";
    let calorieLimit = 1800;
    let effectiveUserId = "";

    if (verifyPin(pin, userPin)) {
      role = "USER";
      const adminSetting = await prisma.systemSetting.findUnique({ where: { key: "admin_name" } });
      userName = adminSetting?.value || "Vrund";
      calorieLimit = 1800;
    } else if (verifyPin(pin, momPin)) {
      role = "MOM";
      const momSetting = await prisma.systemSetting.findUnique({ where: { key: "mom_name" } });
      userName = momSetting?.value || "Mom";
    } else {
      // Check created UserProfiles
      const profile = await prisma.userProfile.findUnique({ where: { pin } });
      if (profile) {
        role = profile.role;
        userName = profile.name;
        calorieLimit = profile.calorieTarget || 1600;
        effectiveUserId = profile.id;
      }
    }

    if (!role) {
      res.status(401).json({ error: "Invalid PIN" });
      return;
    }

    if (!effectiveUserId) {
      let user = await prisma.user.findUnique({ where: { role } });
      if (!user) {
        user = await prisma.user.create({ data: { role } });
      }
      effectiveUserId = user.id;
    }

    setSession(res, {
      userId: effectiveUserId,
      role,
      name: userName,
      calorieTarget: calorieLimit,
    });

    res.json({
      success: true,
      role,
      name: userName,
      calorieTarget: calorieLimit,
      redirectTo: role === "MOM" ? "/mom" : "/today",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (_req: Request, res: Response): void => {
  destroySession(res);
  res.json({ success: true });
});

router.get("/session", (req: Request, res: Response): void => {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    userId: session.userId,
    role: session.role,
    name: session.name || (session.role === "MOM" ? "Mom" : "Vrund"),
    calorieTarget: session.calorieTarget || (session.role === "USER" ? 1600 : undefined),
  });
});

export default router;
