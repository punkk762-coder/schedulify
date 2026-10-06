import { Router, type Request, type Response } from "express";
import { kitchenService, occurrenceService } from "../domain";
import { todayUtc, formatInTz, dateStrToUtc, addDays, subDays } from "../dates";
import { requireMomMiddleware } from "../auth";
import { prisma } from "../db";

const router = Router();

router.get("/mom/kitchen", requireMomMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawDateQuery = typeof req.query.date === "string" ? req.query.date.trim() : undefined;
    let targetDate = todayUtc();

    if (rawDateQuery && /^\d{4}-\d{2}-\d{2}$/.test(rawDateQuery)) {
      targetDate = dateStrToUtc(rawDateQuery);
    }

    // Generate occurrences if not present for the target date
    await occurrenceService.generateForRange(targetDate, targetDate);
    const meals = await kitchenService.getMealsForDate(targetDate);

    const today = todayUtc();
    const todayKey = formatInTz(today, "yyyy-MM-dd");
    const targetKey = formatInTz(targetDate, "yyyy-MM-dd");
    const tomorrowKey = formatInTz(addDays(today, 1), "yyyy-MM-dd");
    const yesterdayKey = formatInTz(subDays(today, 1), "yyyy-MM-dd");

    res.json({
      date: formatInTz(targetDate, "EEEE, MMMM d, yyyy"),
      dateKey: targetKey,
      isToday: targetKey === todayKey,
      isTomorrow: targetKey === tomorrowKey,
      isYesterday: targetKey === yesterdayKey,
      meals,
    });
  } catch (err) {
    console.error("GET /api/mom/kitchen error:", err);
    res.status(500).json({ error: "Failed to fetch kitchen meals" });
  }
});

// Toggle meal preparation status by occurrence ID
router.post("/mom/kitchen/toggle", requireMomMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const occurrenceId = req.body?.occurrenceId;
    if (!occurrenceId || typeof occurrenceId !== "string") {
      res.status(400).json({ error: "occurrenceId is required" });
      return;
    }

    const occurrence = await prisma.occurrence.findUnique({
      where: { id: occurrenceId },
    });

    if (!occurrence) {
      res.status(404).json({ error: "Meal occurrence not found" });
      return;
    }

    if (occurrence.status === "COMPLETED") {
      await occurrenceService.undo(occurrenceId);
      res.json({ success: true, occurrenceId, status: "PENDING", isPrepared: false });
    } else {
      await occurrenceService.complete(occurrenceId, "Prepared by Mom");
      res.json({ success: true, occurrenceId, status: "COMPLETED", isPrepared: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to toggle meal status";
    console.error("POST /api/mom/kitchen/toggle error:", err);
    res.status(400).json({ error: msg });
  }
});

// Also support parameterized toggle
router.post("/mom/kitchen/:id/toggle", requireMomMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const occurrenceId = req.params.id;
    const occurrence = await prisma.occurrence.findUnique({
      where: { id: occurrenceId },
    });

    if (!occurrence) {
      res.status(404).json({ error: "Meal occurrence not found" });
      return;
    }

    if (occurrence.status === "COMPLETED") {
      await occurrenceService.undo(occurrenceId);
      res.json({ success: true, occurrenceId, status: "PENDING", isPrepared: false });
    } else {
      await occurrenceService.complete(occurrenceId, "Prepared by Mom");
      res.json({ success: true, occurrenceId, status: "COMPLETED", isPrepared: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to toggle meal status";
    console.error("POST /api/mom/kitchen/:id/toggle error:", err);
    res.status(400).json({ error: msg });
  }
});

export default router;
