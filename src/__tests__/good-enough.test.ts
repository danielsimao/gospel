import { describe, it, expect } from "vitest";
import {
  CANYON_FEET,
  MAX_ATTEMPTS,
  attemptAt,
  allAttempts,
  displayDistance,
  numberLocale,
} from "@/lib/good-enough";

describe("good-enough mechanic", () => {
  it("spans eighteen miles", () => {
    expect(CANYON_FEET).toBe(18 * 5280);
  });

  it("bounds the reader at four attempts", () => {
    expect(MAX_ATTEMPTS).toBe(4);
    expect(allAttempts()).toHaveLength(4);
  });

  it("jumps strictly further every attempt", () => {
    const feet = allAttempts().map((a) => a.feet);
    for (let i = 1; i < feet.length; i++) {
      expect(feet[i]!).toBeGreaterThan(feet[i - 1]!);
    }
  });

  it("never reaches the far side, not even on the best attempt", () => {
    for (const a of allAttempts()) {
      expect(a.remainingFeet).toBeGreaterThan(0);
      expect(a.remainingFeet).toBe(CANYON_FEET - a.feet);
    }
    // The best attempt clears well under 1% — the reader must never be able to
    // read the display as "nearly there".
    const best = allAttempts()[MAX_ATTEMPTS - 1]!;
    expect(best.feet / CANYON_FEET).toBeLessThan(0.01);
  });

  it("marks only the last attempt terminal", () => {
    const attempts = allAttempts();
    expect(attempts.filter((a) => a.terminal)).toHaveLength(1);
    expect(attempts[MAX_ATTEMPTS - 1]!.terminal).toBe(true);
  });

  it("includes a world record among the attempts, because comparison is the trap", () => {
    expect(allAttempts().map((a) => a.feet)).toContain(50);
  });

  it("does not accumulate — each press is a fresh jump, not a running total", () => {
    // Accumulation would make this a progress bar, which the app's own copy
    // forbids, and would teach that works bank.
    const attempts = allAttempts();
    const runningTotal = attempts.reduce((sum, a) => sum + a.feet, 0);
    expect(attempts[MAX_ATTEMPTS - 1]!.feet).not.toBe(runningTotal);
    expect(attempts[MAX_ATTEMPTS - 1]!.feet).toBe(200);
  });

  it("clamps out-of-range attempt numbers instead of returning undefined", () => {
    expect(attemptAt(0)).toEqual(attemptAt(1));
    expect(attemptAt(-5)).toEqual(attemptAt(1));
    expect(attemptAt(99)).toEqual(attemptAt(MAX_ATTEMPTS));
    expect(attemptAt(2.7)).toEqual(attemptAt(2));
  });
});

describe("readout units", () => {
  it("leaves feet alone for en", () => {
    expect(displayDistance(CANYON_FEET, "en")).toBe(CANYON_FEET);
    expect(displayDistance(200, "en")).toBe(200);
  });

  it("converts to whole metres for pt, whose copy speaks kilometres", () => {
    // 18 miles ≈ 28.97 km. The PT copy says "vinte e nove quilómetros".
    expect(displayDistance(CANYON_FEET, "pt")).toBe(28968);
    expect(displayDistance(200, "pt")).toBe(61);
    expect(displayDistance(4, "pt")).toBe(1);
  });

  it("stays short of the far side in both units", () => {
    for (const locale of ["en", "pt"] as const) {
      for (const a of allAttempts()) {
        expect(displayDistance(a.remainingFeet, locale)).toBeGreaterThan(0);
        expect(displayDistance(a.remainingFeet, locale)).toBeLessThan(
          displayDistance(CANYON_FEET, locale) + 1,
        );
      }
    }
  });

  it("names a number locale per page locale, not per runtime", () => {
    expect(numberLocale("en")).toBe("en-US");
    expect(numberLocale("pt")).toBe("pt-PT");
  });
});
