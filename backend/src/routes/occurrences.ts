import { Router, type Request, type Response } from "express";
import { occurrenceService } from "../domain";
import { requireUserMiddleware, requireMomMiddleware } from "../auth";

const router = Router();

router.post("/occurrences/:id/complete", requireMomMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const completion = await occurrenceService.complete(id, notes);
    res.json({ success: true, completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to complete occurrence";
    res.status(400).json({ error: msg });
  }
});

router.post("/occurrences/:id/undo", requireMomMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await occurrenceService.undo(id);
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to undo occurrence";
    res.status(400).json({ error: msg });
  }
});

router.post("/occurrences/:id/skip", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const completion = await occurrenceService.skip(id, notes);
    res.json({ success: true, completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to skip occurrence";
    res.status(400).json({ error: msg });
  }
});

router.post("/occurrences/:id/replace", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { alternativeItemId, notes } = req.body || {};

    if (!alternativeItemId) {
      res.status(400).json({ error: "alternativeItemId is required" });
      return;
    }

    const completion = await occurrenceService.replace(id, alternativeItemId, notes);
    res.json({ success: true, completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to replace occurrence";
    res.status(400).json({ error: msg });
  }
});

export default router;
