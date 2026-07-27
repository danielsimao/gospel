import { describe, it, expect } from "vitest";
import {
  TAPS_TO_CEILING,
  CEILING_PCT,
  GOAL_PCT,
  DEAD_TAPS_TO_REVEAL,
  CROWD_PCT,
  barAfter,
  ceilingLineIndex,
} from "@/lib/good-enough";
import type { GoodEnoughMessages } from "@/lib/types";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

describe("the bar", () => {
  it("starts empty and already short of the line", () => {
    const s = barAfter(0);
    expect(s.fillPct).toBe(0);
    expect(s.shortPct).toBe(GOAL_PCT);
    expect(s.atCeiling).toBe(false);
    expect(s.revealed).toBe(false);
  });

  it("adds exactly the same amount on every tap", () => {
    // No decay, no diminishing returns. Equal steps are what make the rules
    // honest — the reader can verify the machine is not lying to them.
    const steps: number[] = [];
    for (let t = 1; t <= TAPS_TO_CEILING; t++) {
      steps.push(barAfter(t).fillPct - barAfter(t - 1).fillPct);
    }
    for (const step of steps) {
      expect(step).toBeCloseTo(steps[0]!, 10);
    }
    expect(steps[0]!).toBeGreaterThan(0);
  });

  it("stops dead at the ceiling and never moves again", () => {
    const at = barAfter(TAPS_TO_CEILING);
    expect(at.fillPct).toBeCloseTo(CEILING_PCT, 10);
    for (const extra of [1, 5, 50, 500]) {
      expect(barAfter(TAPS_TO_CEILING + extra).fillPct).toBeCloseTo(CEILING_PCT, 10);
    }
  });

  it("never produces a near miss", () => {
    // The load-bearing constraint, and the reason this is a test rather than a
    // comment. Near-miss outcomes raise the motivation to continue and breed an
    // illusion of control; a bar that crept up on the line would teach "try
    // harder", which is the belief the page exists to remove.
    const gap = GOAL_PCT - CEILING_PCT;
    expect(gap).toBeGreaterThanOrEqual(50);
    for (let t = 0; t <= TAPS_TO_CEILING + 100; t++) {
      expect(barAfter(t).shortPct).toBeGreaterThanOrEqual(gap);
      expect(barAfter(t).fillPct).toBeLessThan(GOAL_PCT);
    }
  });

  it("counts dead taps only after the ceiling", () => {
    expect(barAfter(TAPS_TO_CEILING - 1).deadTaps).toBe(0);
    expect(barAfter(TAPS_TO_CEILING).deadTaps).toBe(0);
    expect(barAfter(TAPS_TO_CEILING + 2).deadTaps).toBe(2);
  });

  it("turns only after the reader has proved it for themselves", () => {
    expect(barAfter(TAPS_TO_CEILING).revealed).toBe(false);
    expect(barAfter(TAPS_TO_CEILING + DEAD_TAPS_TO_REVEAL - 1).revealed).toBe(false);
    expect(barAfter(TAPS_TO_CEILING + DEAD_TAPS_TO_REVEAL).revealed).toBe(true);
    // And it stays turned — nothing is ever taken back.
    expect(barAfter(TAPS_TO_CEILING + 99).revealed).toBe(true);
  });

  it("survives nonsense tap counts instead of producing NaN", () => {
    for (const bad of [-1, -99, 2.7]) {
      const s = barAfter(bad);
      expect(Number.isFinite(s.fillPct)).toBe(true);
      expect(s.fillPct).toBeGreaterThanOrEqual(0);
    }
    expect(barAfter(2.7).fillPct).toBe(barAfter(2).fillPct);
    expect(barAfter(-5).fillPct).toBe(0);
  });

  it("clamps the ceiling line rather than running off the end of the copy", () => {
    expect(ceilingLineIndex(0, 4)).toBe(0);
    expect(ceilingLineIndex(3, 4)).toBe(3);
    expect(ceilingLineIndex(99, 4)).toBe(3);
    expect(ceilingLineIndex(-1, 4)).toBe(0);
    expect(ceilingLineIndex(0, 0)).toBe(0);
  });
});

describe("the crowd", () => {
  it("puts everyone far below the line, whatever their height", () => {
    // Romans 3:23's "all", in the bar's own language. Some clear the reader,
    // some do not, and the comparison is beside the point in every case.
    expect(CROWD_PCT.length).toBeGreaterThanOrEqual(10);
    for (const pct of CROWD_PCT) {
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThan(GOAL_PCT - 40);
    }
  });

  it("includes bars both above and below where the reader ends up", () => {
    expect(CROWD_PCT.some((p) => p > CEILING_PCT)).toBe(true);
    expect(CROWD_PCT.some((p) => p < CEILING_PCT)).toBe(true);
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
    "crowdLabel",
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
    // One for arriving at the ceiling, then one per dead tap until the turn.
    expect(lines.length).toBeGreaterThanOrEqual(DEAD_TAPS_TO_REVEAL + 1);
    for (const line of lines) expect(line.length).toBeGreaterThan(0);
  });

  it("cites Romans 3:23 in both locales — the whole page is that verse", () => {
    expect((en as { goodEnough: GoodEnoughMessages }).goodEnough.reveal.scriptureRef).toContain("3:23");
    expect((pt as { goodEnough: GoodEnoughMessages }).goodEnough.reveal.scriptureRef).toContain("3:23");
  });
});
