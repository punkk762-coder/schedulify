import { Router, type Request, type Response } from "express";
import { occurrenceService } from "../domain";
import { todayUtc, subDays, formatInTz } from "../dates";
import { requireUserMiddleware } from "../auth";

const router = Router();

router.get("/history", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const range = (req.query.range as string) || "week";
    const today = todayUtc();

    let startDate: Date;
    let endDate: Date = today;

    if (range === "today") {
      startDate = today;
    } else if (range === "yesterday") {
      startDate = subDays(today, 1);
      endDate = startDate;
    } else if (range === "month") {
      startDate = subDays(today, 30);
    } else {
      startDate = subDays(today, 6);
    }

    const occurrences = await occurrenceService.getForRange(startDate, endDate);

    const grouped: Record<string, typeof occurrences> = {};
    for (const occ of occurrences) {
      const dateKey = formatInTz(occ.scheduledDate, "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(occ);
    }

    res.json({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      grouped,
      totalCount: occurrences.length,
    });
  } catch (err) {
    console.error("GET /api/history error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
