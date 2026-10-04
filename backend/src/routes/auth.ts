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
    if (verifyPin(pin, userPin)) {
      role = "USER";
    } else if (verifyPin(pin, momPin)) {
      role = "MOM";
    }

    if (!role) {
      res.status(401).json({ error: "Invalid PIN" });
      return;
    }

    let user = await prisma.user.findUnique({ where: { role } });
    if (!user) {
      user = await prisma.user.create({ data: { role } });
    }

    setSession(res, { userId: user.id, role });

    res.json({
      success: true,
      role,
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
  res.json({ authenticated: true, userId: session.userId, role: session.role });
});

export default router;
