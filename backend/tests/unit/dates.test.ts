import { describe, it, expect } from "vitest";
import { matchesRecurrence, parseTime, formatTime } from "@/lib/dates";

describe("parseTime", () => {
  it("parses HH:mm correctly", () => {
    expect(parseTime("10:15")).toEqual({ hours: 10, minutes: 15 });
    expect(parseTime("00:00")).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime("23:59")).toEqual({ hours: 23, minutes: 59 });
  });
});

describe("formatTime", () => {
  it("formats to HH:mm", () => {
    expect(formatTime(9, 5)).toBe("09:05");
    expect(formatTime(23, 0)).toBe("23:00");
  });
});

describe("matchesRecurrence", () => {
  // Monday 2026-10-05 (MON)
  const monday = new Date("2026-10-05T00:00:00Z");
  // Saturday 2026-10-10 (SAT)
  const saturday = new Date("2026-10-10T00:00:00Z");
  // Sunday 2026-10-11 (SUN)
  const sunday = new Date("2026-10-11T00:00:00Z");

  it("DAILY matches everything", () => {
    expect(matchesRecurrence(monday, "DAILY", "UTC")).toBe(true);
    expect(matchesRecurrence(saturday, "DAILY", "UTC")).toBe(true);
  });

  it("WEEKDAYS matches Mon-Fri only", () => {
    expect(matchesRecurrence(monday, "WEEKDAYS", "UTC")).toBe(true);
    expect(matchesRecurrence(saturday, "WEEKDAYS", "UTC")).toBe(false);
    expect(matchesRecurrence(sunday, "WEEKDAYS", "UTC")).toBe(false);
  });

  it("WEEKENDS matches Sat-Sun only", () => {
    expect(matchesRecurrence(monday, "WEEKENDS", "UTC")).toBe(false);
    expect(matchesRecurrence(saturday, "WEEKENDS", "UTC")).toBe(true);
    expect(matchesRecurrence(sunday, "WEEKENDS", "UTC")).toBe(true);
  });

  it("comma-separated days", () => {
    expect(matchesRecurrence(monday, "MON,WED,FRI", "UTC")).toBe(true);
    expect(matchesRecurrence(saturday, "MON,WED,FRI", "UTC")).toBe(false);
  });

  it("ONCE always matches (caller handles one-time)", () => {
    expect(matchesRecurrence(monday, "ONCE", "UTC")).toBe(true);
  });
});
