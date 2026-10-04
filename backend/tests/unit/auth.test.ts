import { describe, it, expect } from "vitest";
import { verifyPin } from "@/lib/auth";

describe("verifyPin", () => {
  it("returns true for matching PINs", () => {
    expect(verifyPin("1234", "1234")).toBe(true);
    expect(verifyPin("abcdef", "abcdef")).toBe(true);
  });

  it("returns false for non-matching PINs", () => {
    expect(verifyPin("1234", "5678")).toBe(false);
    expect(verifyPin("1234", "1235")).toBe(false);
  });

  it("returns false for different length PINs", () => {
    expect(verifyPin("123", "1234")).toBe(false);
    expect(verifyPin("12345", "1234")).toBe(false);
  });

  it("returns false for empty strings", () => {
    expect(verifyPin("", "1234")).toBe(false);
  });
});
