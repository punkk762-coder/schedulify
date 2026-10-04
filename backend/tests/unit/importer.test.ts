import { describe, it, expect } from "vitest";
import { parsePlanText } from "@/lib/domain/importer";

describe("parsePlanText", () => {
  it("extracts items, times, categories, and nutrition from raw routine text", () => {
    const text = `10:15 AM - Breakfast: Chocolate Proats - 380 kcal, 32g protein
12:30 PM - Lunch: 2 Phulkas and Sabzi - 420 kcal, 14g protein
8:00 PM - 1-hour Walk`;

    const proposal = parsePlanText(text);

    expect(proposal.routineItems.length).toBe(3);
    expect(proposal.schedules.length).toBe(3);

    // Check item 1
    const item1 = proposal.routineItems[0];
    expect(item1.category).toBe("MEAL");
    expect(proposal.schedules[0].scheduledTime).toBe("10:15");

    // Check item 3
    const item3 = proposal.routineItems[2];
    expect(item3.category).toBe("WORKOUT");
    expect(proposal.schedules[2].scheduledTime).toBe("20:00");

    // Check nutrition
    expect(proposal.nutrition[0].calories).toBe(380);
    expect(proposal.nutrition[0].protein).toBe(32);
  });

  it("detects approximate quantities as ambiguities", () => {
    const text = `12:30 PM - small bowl rice`;
    const proposal = parsePlanText(text);

    expect(proposal.ambiguities.length).toBeGreaterThan(0);
    expect(proposal.ambiguities[0]).toContain("approximate portion");
  });
});
