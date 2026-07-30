import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JOURNEY_STAGES, type JourneyStage } from "@/lib/journey-storage";

/**
 * Structural checks on the journey-stage markup and CSS, not a cascade test.
 *
 * The real behaviour — which block a browser reveals for a given attribute —
 * cannot be tested here. Vitest runs in `environment: "node"`, and even under
 * jsdom `globals.css` opens with `@import "tailwindcss"`: jsdom does not run
 * PostCSS, does not resolve the import, and does not implement `@layer`
 * precedence, which is the entire reason these rules beat Tailwind's `.contents`
 * utility. A jsdom assertion here would be testing a fiction.
 *
 * What this file can do is pin the three lists that have to agree — the
 * JourneyStage union, the `data-stage` attributes in the markup, and the reveal
 * rules in the stylesheet — so a sixth stage cannot be added to two of them and
 * forgotten in the third. That is the failure mode: a stage whose block exists
 * but which no rule reveals renders an empty page section, silently, forever.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const css = readFileSync(join(ROOT, "src", "app", "globals.css"), "utf8");
/** Comments in this file quote selectors that were removed, so any assertion
    about what the stylesheet no longer contains has to read the rules only. */
const cssRules = css.replace(/\/\*[\s\S]*?\*\//g, "");
const homeShell = readFileSync(join(ROOT, "src", "components", "home-shell.tsx"), "utf8");

/** Whitespace-tolerant, so reformatting either file does not break these. */
function hasRule(selector: string): boolean {
  const pattern = selector
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  return new RegExp(pattern).test(css);
}

describe("journey stage markup and CSS", () => {
  it("renders exactly one block per journey stage", () => {
    const found = [...homeShell.matchAll(/data-stage="([^"]+)"/g)].map((m) => m[1]);
    // Sorted rather than set-compared: a duplicated stage is its own bug, and a
    // typo like data-stage="commited" produces a block hidden for every reader.
    expect([...found].sort()).toEqual([...JOURNEY_STAGES].sort());
  });

  it("scopes every stage block with data-slot, so the global selector cannot overreach", () => {
    // `[data-stage]` alone is one character from Radix's `data-state`. The CSS
    // matches `[data-slot="journey-stage"][data-stage=...]`, so a wrapper that
    // forgot the slot would never be revealed.
    const wrappers = [...homeShell.matchAll(/data-slot="journey-stage" data-stage="([^"]+)"/g)];
    expect(wrappers).toHaveLength(JOURNEY_STAGES.length);
  });

  it("has a reveal rule for every journey stage", () => {
    for (const stage of JOURNEY_STAGES) {
      expect(
        hasRule(`html[data-journey-stage="${stage}"] [data-slot="journey-stage"][data-stage="${stage}"]`),
        `globals.css has no reveal rule for the "${stage}" stage`,
      ).toBe(true);
    }
  });

  it("falls back to the visitor block when no stage is named", () => {
    // The script sets no attribute if storage cannot be read. Without this
    // unconditional default, that reader would see no stage block at all.
    expect(hasRule('[data-slot="journey-stage"][data-stage="visitor"]')).toBe(true);
  });

  it("takes the visitor default back for each non-visitor stage by name", () => {
    /*
     * Enumerated, never negated. Written as
     * `:not([data-journey-stage="visitor"])` this rule removed the visitor
     * fallback for ANY other attribute value — so an unrecognised stage hid all
     * five blocks and the homepage painted with no call to action. Naming the
     * four means an unrecognised value degrades to the visitor door instead.
     */
    for (const stage of JOURNEY_STAGES.filter((s) => s !== "visitor")) {
      expect(
        hasRule(`html[data-journey-stage="${stage}"] [data-slot="journey-stage"][data-stage="visitor"]`),
        `globals.css does not hide the visitor block for the "${stage}" stage`,
      ).toBe(true);
    }
    expect(cssRules).not.toMatch(/:not\(\[data-journey-stage="visitor"\]\)/);
  });

  it("names no stage the JourneyStage union does not", () => {
    const inCss = new Set(
      [...css.matchAll(/data-journey-stage="([^"]+)"/g)].map((m) => m[1] as JourneyStage),
    );
    for (const stage of inCss) {
      expect(JOURNEY_STAGES).toContain(stage);
    }
  });

  it("keeps the stage rules unlayered", () => {
    /*
     * These rules outrank Tailwind's `.contents` utility only because unlayered
     * declarations beat layered ones regardless of specificity. Inside an
     * `@layer` they would tie with `.contents` at equal specificity and source
     * order would decide, which can reveal all five stages at once.
     */
    const anchor = css.indexOf('[data-slot="journey-stage"] {');
    expect(anchor).toBeGreaterThan(-1);
    const before = css.slice(0, anchor);
    const opened = (before.match(/@layer[^;{]*\{/g) ?? []).length;
    const closed = (before.match(/\}/g) ?? []).length;
    // Every @layer block opened before the stage rules must also have closed.
    expect(opened).toBeLessThanOrEqual(closed);
  });
});
