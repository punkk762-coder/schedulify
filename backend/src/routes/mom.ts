import { Router, type Request, type Response } from "express";
import { kitchenService } from "../domain";
import { todayUtc, formatInTz } from "../dates";
import { requireMomMiddleware } from "../auth";

const router = Router();

router.get("/mom/kitchen", requireMomMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = todayUtc();
    const meals = await kitchenService.getTodayMeals();

    res.json({
      date: formatInTz(today, "EEEE, MMMM d, yyyy"),
      meals,
    });
  } catch (err) {
    console.error("GET /api/mom/kitchen error:", err);
    res.status(500).json({ error: "Failed to fetch kitchen meals" });
  }
});

export default router;
