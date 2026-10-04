import { Router, type Request, type Response } from "express";
import { parsePlanText, commitPlanProposal, planService } from "../domain";
import { requireUserMiddleware } from "../auth";
import { cache } from "../cache";

const router = Router();

router.post("/plans/import", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, text, proposal } = req.body || {};

    if (action === "commit") {
      if (!proposal) {
        res.status(400).json({ error: "Proposal object required for commit" });
        return;
      }
      const plan = await commitPlanProposal(proposal);
      // Invalidate all occurrence and today payload caches
      await cache.invalidatePattern("today_payload:");
      await cache.invalidatePattern("occurrences:");
      await cache.invalidatePattern("gen_range:");
      await cache.invalidatePattern("analytics:");
      res.json({ success: true, plan });
      return;
    }

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text required to parse plan" });
      return;
    }

    const parsedProposal = parsePlanText(text);
    res.json({ success: true, proposal: parsedProposal });
  } catch (err) {
    console.error("POST /api/plans/import error:", err);
    res.status(500).json({ error: "Plan import failed" });
  }
});

router.get("/plans", requireUserMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await planService.list();
    res.json({ plans });
  } catch (err) {
    console.error("GET /api/plans error:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

export default router;
