import { describe, it, expect } from "vitest";
import { processUserMessage } from "@/lib/ai/gemini";
import { aiActionSchema } from "@/lib/validation/schemas";

describe("AI heuristic interpreter", () => {
  const mockContext = {
    todayDate: "Monday, October 5, 2026",
    timezone: "Asia/Kolkata",
    todayOccurrences: [
      { id: "occ-1", title: "1-hour Walk", category: "WORKOUT", time: "20:00", status: "PENDING" },
      { id: "occ-2", title: "Kala Chana", category: "MEAL", time: "17:30", status: "PENDING" },
      { id: "occ-3", title: "Chocolate Proats", category: "MEAL", time: "10:15", status: "PENDING" },
    ],
  };

  it("detects natural completion intent", async () => {
    const res = await processUserMessage("I finished my 1-hour walk", mockContext);
    expect(res.action?.intent).toBe("COMPLETE");
    expect(res.action?.target?.id).toBe("occ-1");
  });

  it("detects skip intent", async () => {
    const res = await processUserMessage("Skip chocolate proats today", mockContext);
    expect(res.action?.intent).toBe("SKIP");
    expect(res.action?.target?.id).toBe("occ-3");
  });

  it("detects replacement intent", async () => {
    const res = await processUserMessage("I had whey instead of the proats", mockContext);
    expect(res.action?.intent).toBe("REPLACE");
  });

  it("validates action payload with Zod schema", () => {
    const validAction = {
      intent: "COMPLETE",
      effectiveDate: "2026-10-05",
      target: { type: "occurrence", id: "occ-1" },
    };
    const parsed = aiActionSchema.safeParse(validAction);
    expect(parsed.success).toBe(true);
  });
});
