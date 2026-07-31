import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Which rungs of the grace argument are open, and when.
 *
 * The chain used to open every rung the moment the last one was revealed.
 * Measured on a 390px viewport, that tap grew the page from 844px to 1221px
 * while a smooth scroll to the new rung was already running, so the rung the
 * reader had just opened moved under them. After the fix the same tap leaves
 * the page at 844px.
 *
 * The distinction the predicate draws is the whole fix: `returning` is a reader
 * who has already been to the decision and come back, and they get the whole
 * argument in their first painted frame — no shift, because nothing moves.
 * `allBeatsRevealed` is a moment mid-walk, and expanding on it is what jolted.
 *
 * Source assertions in the idiom of stage-css.test.ts: this is JSX and vitest
 * runs in `environment: "node"`, so there is no layout here to measure.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const grace = readFileSync(join(ROOT, "src", "components", "grace-screen.tsx"), "utf8");

/** The comment above the predicate narrates the regression and quotes the old
    expression, so assertions read the file with comments stripped. */
const code = grace.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("the grace chain's open rung", () => {
  it("opens the active rung, and the whole argument only for a returning reader", () => {
    expect(code).toMatch(/const isOpen = returning \|\| i === activeIndex;/);
  });

  it("never keys the open state off allBeatsRevealed", () => {
    // The regression, exactly: `allBeatsRevealed || i === activeIndex`. That
    // flag is still the right gate for the pill and for Continue — it is only
    // wrong as a reason to expand — so this pins the one use, not the flag.
    const openLine = code.match(/const isOpen = .*/)?.[0] ?? "";
    expect(openLine).not.toMatch(/allBeatsRevealed/);
  });

  it("keeps the pill's gate short enough to read as a control", () => {
    // 2200 left the chain's only forward control absent for over two seconds.
    const delay = Number(code.match(/const PILL_DELAY_MS = (\d+)/)?.[1]);
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(1200);
  });
});
