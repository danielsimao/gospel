import { describe, it, expect } from "vitest";
import {
  TAPS_TO_CEILING,
  CEILING_MIN_PCT,
  CEILING_MAX_PCT,
  MIN_GAP_PCT,
  GOAL_PCT,
  DEAD_TAPS_TO_REVEAL,
  barAfter,
  rollCeiling,
  ceilingLineIndex,
} from "@/lib/good-enough";
import type { GoodEnoughMessages } from "@/lib/types";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

/** Every ceiling the roll can produce, so invariants are checked over the band. */
const BAND = Array.from(
  { length: CEILING_MAX_PCT - CEILING_MIN_PCT + 1 },
  (_, i) => CEILING_MIN_PCT + i,
);

describe("the bar", () => {
  it("starts empty and already short of the line", () => {
    for (const ceiling of BAND) {
      const s = barAfter(0, ceiling);
      expect(s.fillPct).toBe(0);
      expect(s.shortPct).toBe(GOAL_PCT);
      expect(s.atCeiling).toBe(false);
      expect(s.revealed).toBe(false);
    }
  });

  it("adds exactly the same amount on every tap", () => {
    // No decay, no diminishing returns. Equal steps are what make the rules
    // honest — the reader can verify the machine is not lying to them.
    for (const ceiling of BAND) {
      const steps: number[] = [];
      for (let t = 1; t <= TAPS_TO_CEILING; t++) {
        steps.push(barAfter(t, ceiling).fillPct - barAfter(t - 1, ceiling).fillPct);
      }
      for (const step of steps) expect(step).toBeCloseTo(steps[0]!, 10);
      expect(steps[0]!).toBeGreaterThan(0);
    }
  });

  it("stops dead at the ceiling and never moves again", () => {
    for (const ceiling of BAND) {
      expect(barAfter(TAPS_TO_CEILING, ceiling).fillPct).toBeCloseTo(ceiling, 10);
      for (const extra of [1, 5, 50, 500]) {
        expect(barAfter(TAPS_TO_CEILING + extra, ceiling).fillPct).toBeCloseTo(ceiling, 10);
      }
    }
  });

  it("never produces a near miss, at any ceiling the roll can give", () => {
    // The load-bearing constraint, and the reason this is a test rather than a
    // comment. Near-miss outcomes raise the motivation to continue and breed an
    // illusion of control; a bar that crept up on the line would teach "try
    // harder", which is the belief the page exists to remove. With a variable
    // ceiling and a replay button that risk is structural, so the guarantee has
    // to hold for the luckiest possible roll, not for one chosen value.
    expect(GOAL_PCT - CEILING_MAX_PCT).toBeGreaterThanOrEqual(MIN_GAP_PCT);
    for (const ceiling of BAND) {
      for (let t = 0; t <= TAPS_TO_CEILING + 50; t++) {
        const s = barAfter(t, ceiling);
        expect(s.shortPct).toBeGreaterThanOrEqual(MIN_GAP_PCT);
        expect(s.fillPct).toBeLessThan(GOAL_PCT);
      }
    }
  });

  it("clamps a ceiling outside the band rather than trusting the caller", () => {
    expect(barAfter(TAPS_TO_CEILING, 999).ceilingPct).toBe(CEILING_MAX_PCT);
    expect(barAfter(TAPS_TO_CEILING, -5).ceilingPct).toBe(CEILING_MIN_PCT);
    expect(barAfter(TAPS_TO_CEILING, 999).fillPct).toBeCloseTo(CEILING_MAX_PCT, 10);
  });

  it("counts dead taps only after the ceiling", () => {
    expect(barAfter(TAPS_TO_CEILING - 1, 30).deadTaps).toBe(0);
    expect(barAfter(TAPS_TO_CEILING, 30).deadTaps).toBe(0);
    expect(barAfter(TAPS_TO_CEILING + 2, 30).deadTaps).toBe(2);
  });

  it("flips atCeiling exactly at the boundary", () => {
    expect(barAfter(TAPS_TO_CEILING - 1, 30).atCeiling).toBe(false);
    expect(barAfter(TAPS_TO_CEILING, 30).atCeiling).toBe(true);
  });

  it("turns only after the reader has proved it for themselves", () => {
    expect(barAfter(TAPS_TO_CEILING, 30).revealed).toBe(false);
    expect(barAfter(TAPS_TO_CEILING + DEAD_TAPS_TO_REVEAL - 1, 30).revealed).toBe(false);
    expect(barAfter(TAPS_TO_CEILING + DEAD_TAPS_TO_REVEAL, 30).revealed).toBe(true);
    // And it stays turned — nothing is ever taken back.
    expect(barAfter(TAPS_TO_CEILING + 99, 30).revealed).toBe(true);
  });

  it("survives nonsense tap counts instead of producing NaN", () => {
    for (const bad of [-1, -99, 2.7]) {
      const s = barAfter(bad, 30);
      expect(Number.isFinite(s.fillPct)).toBe(true);
      expect(s.fillPct).toBeGreaterThanOrEqual(0);
    }
    expect(barAfter(2.7, 30).fillPct).toBe(barAfter(2, 30).fillPct);
    expect(barAfter(-5, 30).fillPct).toBe(0);
  });

  it("clamps the ceiling line rather than running off the end of the copy", () => {
    expect(ceilingLineIndex(0, 4)).toBe(0);
    expect(ceilingLineIndex(3, 4)).toBe(3);
    expect(ceilingLineIndex(99, 4)).toBe(3);
    expect(ceilingLineIndex(-1, 4)).toBe(0);
    expect(ceilingLineIndex(0, 0)).toBe(0);
  });
});

describe("rollCeiling", () => {
  it("stays inside the band for every possible random value", () => {
    for (const r of [0, 0.0001, 0.25, 0.5, 0.75, 0.9999, 1]) {
      const c = rollCeiling(() => r);
      expect(c).toBeGreaterThanOrEqual(CEILING_MIN_PCT);
      expect(c).toBeLessThanOrEqual(CEILING_MAX_PCT);
      expect(Number.isInteger(c)).toBe(true);
    }
  });

  it("reaches both ends, so replaying is genuinely a different life", () => {
    expect(rollCeiling(() => 0)).toBe(CEILING_MIN_PCT);
    expect(rollCeiling(() => 1)).toBe(CEILING_MAX_PCT);
  });

  it("cannot roll close to the line — the retry button depends on this", () => {
    // A variable outcome plus a replay is the shape of a slot machine. It is
    // only safe because no roll gets near the goal, so no roll can suggest that
    // another go might.
    for (const r of [0, 0.5, 1]) {
      expect(GOAL_PCT - rollCeiling(() => r)).toBeGreaterThanOrEqual(MIN_GAP_PCT);
    }
  });
});

describe("good-enough copy", () => {
  const SCALARS = [
    "title",
    "metaDescription",
    "eyebrow",
    "prompt",
    "buttonLabel",
    "goalLabel",
    "shortLabel",
    "tryAgainLabel",
  ] as const;
  const REVEAL = ["lead", "scripture", "scriptureRef", "turn", "cta"] as const;

  it.each([
    ["en", en],
    ["pt", pt],
  ] as const)("%s has a complete goodEnough block", (_locale, messages) => {
    const g = (messages as { goodEnough?: GoodEnoughMessages }).goodEnough;
    expect(g).toBeDefined();
    for (const key of SCALARS) {
      expect(typeof g![key]).toBe("string");
      expect(g![key]).not.toBe("");
    }
    for (const key of REVEAL) {
      expect(typeof g!.reveal[key]).toBe("string");
      expect(g!.reveal[key]).not.toBe("");
    }
  });

  it.each([
    ["en", en],
    ["pt", pt],
  ] as const)("%s has a line for every dead tap up to the turn", (_locale, messages) => {
    const lines = (messages as { goodEnough: GoodEnoughMessages }).goodEnough.ceilingLines;
    expect(lines.length).toBeGreaterThanOrEqual(DEAD_TAPS_TO_REVEAL + 1);
    for (const line of lines) expect(line.length).toBeGreaterThan(0);
  });

  it.each([
    ["en", en],
    ["pt", pt],
  ] as const)("%s never names a fixed stopping point", (_locale, messages) => {
    // The ceiling is rolled per play, so copy that says "a third" would be
    // wrong most of the time. This caught real strings when the bar gained its
    // band; it exists to stop them coming back.
    const g = (messages as { goodEnough: GoodEnoughMessages }).goodEnough;
    const suspect = /a third|um terço|34%/i;
    for (const line of g.ceilingLines) expect(line).not.toMatch(suspect);
    expect(g.reveal.lead).not.toMatch(suspect);
    expect(g.prompt).not.toMatch(suspect);
  });

  it("cites Romans 3:23 in both locales — the whole page is that verse", () => {
    expect((en as { goodEnough: GoodEnoughMessages }).goodEnough.reveal.scriptureRef).toContain("3:23");
    expect((pt as { goodEnough: GoodEnoughMessages }).goodEnough.reveal.scriptureRef).toContain("3:23");
  });
});
