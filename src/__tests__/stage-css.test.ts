import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JOURNEY_STAGES, type JourneyStage } from "@/lib/journey-storage";

/**
 * Structural checks on the journey-stage markup and CSS, not a cascade test.
 *
 * The real behaviour — which block a browser reveals for a given attribute —
 * cannot be tested here. Vitest runs in `environment: "node"`, and even under
 * jsdom `globals.css` opens with `@import "tailwindcss"`, which jsdom neither
 * resolves nor runs PostCSS over; the cascade these rules depend on would not
 * exist. A jsdom assertion here would be testing a fiction.
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

/** Whitespace-tolerant, so reformatting either file does not break these. Reads
    the comment-stripped text: comments in globals.css quote selectors that were
    removed, so matching against the raw file would let a deleted rule pass on
    the strength of its own explanatory comment. */
function hasRule(selector: string): boolean {
  const pattern = selector
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  return new RegExp(pattern).test(cssRules);
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
      [...cssRules.matchAll(/data-journey-stage="([^"]+)"/g)].map((m) => m[1] as JourneyStage),
    );
    for (const stage of inCss) {
      expect(JOURNEY_STAGES).toContain(stage);
    }
  });

  it("keeps the stage rules after the Tailwind import", () => {
    /*
     * The real constraint, and the second attempt at testing it.
     *
     * The first version asserted these rules were not inside an `@layer`, by
     * counting `@layer …{` against every `}` in the preceding stylesheet. Those
     * counts are never unbalanced in a real file, so the assertion could not
     * fail — wrapping the whole block in `@layer utilities` still passed. It was
     * a guard that did not guard, which is the exact fault it was written to
     * prevent elsewhere.
     *
     * Measured in a browser, layering turns out not to be the hazard at all:
     * inside `@layer utilities` the behaviour is identical, because the base
     * rule ties with a `.contents` utility at (0,1,0) and wins on source order.
     * Putting these rules BEFORE Tailwind's utilities is what breaks it — four
     * stages become visible at once. So source order is the invariant.
     */
    const importAt = cssRules.indexOf('@import "tailwindcss"');
    const rulesAt = cssRules.indexOf('[data-slot="journey-stage"] {');
    expect(importAt).toBeGreaterThan(-1);
    expect(rulesAt).toBeGreaterThan(importAt);
  });

  it("lets nothing else set display on a stage wrapper", () => {
    // A `class="contents"` on these wrappers was inert but was the only
    // declaration that could ever compete with the rules above. Keeping the
    // wrappers class-free is what makes the source-order argument sufficient.
    const wrappers = homeShell.match(/<div data-slot="journey-stage"[^>]*>/g) ?? [];
    expect(wrappers).toHaveLength(JOURNEY_STAGES.length);
    for (const w of wrappers) expect(w).not.toMatch(/className=/);
  });
});

describe("the post-test band", () => {
  /*
   * The reading plan is follow-up — the method's step for AFTER the verdict —
   * so the shell gates it behind the same pre-paint attribute the stage blocks
   * ride. Same three-list agreement problem as above: the wrapper in the
   * markup, the hide-by-default rule, and one reveal rule per post-test stage.
   * A missing reveal hides the plan from that stage silently, forever.
   */
  const POST_TEST = JOURNEY_STAGES.filter((s) => s !== "visitor");

  it("wraps the reading band in a class-free, stage-free slot", () => {
    const wrappers = homeShell.match(/<div data-slot="post-test-band"[^>]*>/g) ?? [];
    expect(wrappers).toHaveLength(1);
    // No className, for the display argument above; no data-stage, because
    // the exactly-one-block-per-stage assertion counts those.
    expect(wrappers[0]).not.toMatch(/className=|data-stage=/);
    const slotAt = homeShell.indexOf('data-slot="post-test-band"');
    const bandAt = homeShell.indexOf("<ReadingBand");
    expect(slotAt).toBeGreaterThan(-1);
    expect(bandAt).toBeGreaterThan(slotAt);
  });

  it("hides the band by default, so a visitor or an unknown stage never sees it", () => {
    expect(hasRule('[data-slot="post-test-band"] { display: none')).toBe(true);
  });

  it("reveals the band for each post-test stage by name, never by negation", () => {
    for (const stage of POST_TEST) {
      expect(
        hasRule(`html[data-journey-stage="${stage}"] [data-slot="post-test-band"]`),
        `globals.css does not reveal the post-test band for the "${stage}" stage`,
      ).toBe(true);
    }
    // Written as :not(...visitor...) the reveal would fire for garbage stages.
    expect(cssRules).not.toMatch(/:not\([^)]*\)\s*\[data-slot="post-test-band"\]/);
  });
});

describe("the colour spine, before the Law", () => {
  /*
   * METHOD.md: "Gold does not appear during the Law. It arrives once, and its
   * arrival is the event. Do not spend it early."
   *
   * The visitor block is the earliest surface on the whole journey — a reader
   * who has not been asked anything yet. It is where gold costs the most to
   * spend, and it is exactly where it crept in: the test section's "Tap your
   * answer to begin" shipped in gold on the strength of being a caption rather
   * than a control. A caption register is not an exemption from the spine.
   *
   * Scoped to the stage blocks, and that scope is the whole argument — state
   * it precisely, because the obvious "improvement" is to widen it and that
   * would be wrong:
   *
   * - The stages past the verdict may carry gold. Grace has arrived for them,
   *   which is the point, and the committed block's blockquote does.
   * - The score and questions bands below the stage group carry gold too, and
   *   they render for all five stages including visitors. That is deliberate
   *   (see the bands comment in home-shell) — they are pre-evangelism, and the
   *   owner settled the gold door on the score band. So the rule this guard
   *   enforces is not "no gold on a visitor's screen"; it is the narrower and
   *   actually-violated one: the stage copy itself, which is where the test is
   *   introduced, does not spend gold before the Law.
   *
   * Bounding matters for the same reason. The visitor block is the LAST stage
   * wrapper, so "slice to the next wrapper" runs to end-of-file and silently
   * swallows the bands region — a guard that looks scoped and is not. It stops
   * at the first band instead.
   */
  const GOLD = /#D4A843/;

  function stageBlock(stage: JourneyStage): string {
    const open = homeShell.indexOf(`<div data-slot="journey-stage" data-stage="${stage}">`);
    expect(open, `no block found for the ${stage} stage`).toBeGreaterThan(-1);
    const nextStage = homeShell.indexOf('<div data-slot="journey-stage"', open + 1);
    // The first band marks the end of the stage group. If it is ever renamed
    // this throws rather than quietly widening every assertion below.
    const firstBand = homeShell.indexOf("<PassedBand", open + 1);
    expect(firstBand, "the stage group's end marker (<PassedBand) moved").toBeGreaterThan(-1);
    const end = nextStage === -1 ? firstBand : Math.min(nextStage, firstBand);
    return homeShell.slice(open, end);
  }

  it("spends no gold on a reader the Law has not met", () => {
    expect(
      stageBlock("visitor"),
      "gold appeared in the visitor block — METHOD.md: do not spend it early",
    ).not.toMatch(GOLD);
  });

  it("still lets gold through after the verdict, so this guard is not vacuous", () => {
    // If the committed block ever loses its gold, the assertion above stops
    // proving anything and this fails to say so.
    expect(stageBlock("committed")).toMatch(GOLD);
  });
});
