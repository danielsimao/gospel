import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
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
  /*
   * Every way this codebase can say gold, because matching only the hex is a
   * guard with four doors left open. All four forms are in live use here:
   *
   *   #D4A843               globals.css:10 and most components
   *   rgba(212,168,67,…)    verdict-screen, invitation-screen, questions-band
   *   --color-gold          globals.css:10 defines it
   *   to-gold / text-gold   invitation-screen:95 uses the utility
   *
   * Spacing is tolerated in the rgb form because both `rgba(212,168,67` and
   * `rgba(212, 168, 67` appear in the tree.
   */
  const GOLD =
    /#D4A843|rgba?\(\s*212\s*,\s*168\s*,\s*67|--color-gold|\b(?:text|bg|border|from|via|to|ring|shadow|fill|stroke|decoration|outline|accent|caret|divide)-gold\b/i;

  /** Comments discuss gold constantly — "spent gold on the front door", "the
      gold band two hundred lines below". Only the code may be asserted on. */
  const stripComments = (s: string) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\/.*$/gm, "");

  /**
   * Components home-shell imports from the repo, by tag name.
   *
   * The guard reads one file, so gold moved into a child rendered inside the
   * visitor block would pass it untouched — the most plausible way this
   * regression comes back, since the block renders SelfRating. Resolving the
   * import lets the child be read too.
   */
  const importedPaths = new Map<string, string>();
  for (const [, names, spec] of homeShell.matchAll(
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+"(@\/[^"]+)"/g,
  )) {
    for (const raw of names.split(",")) {
      const name = raw.replace(/^\s*type\s+/, "").split(/\s+as\s+/).pop()?.trim();
      if (name && /^[A-Z]/.test(name)) importedPaths.set(name, spec.replace("@/", "src/"));
    }
  }

  /** Source of every repo component rendered inside `block`, comments stripped. */
  function renderedChildSources(block: string): Array<{ name: string; source: string }> {
    const out: Array<{ name: string; source: string }> = [];
    for (const tag of new Set([...block.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]))) {
      const rel = importedPaths.get(tag);
      if (!rel) continue;
      for (const ext of [".tsx", ".ts"]) {
        const file = join(ROOT, rel + ext);
        if (!existsSync(file)) continue;
        out.push({ name: tag, source: stripComments(readFileSync(file, "utf8")) });
        break;
      }
    }
    return out;
  }

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
      stripComments(stageBlock("visitor")),
      "gold appeared in the visitor block — METHOD.md: do not spend it early",
    ).not.toMatch(GOLD);
  });

  it("spends none in the components that block renders either", () => {
    // Where the regression would actually hide: the markup stays neutral and
    // the gold moves one file down, into a child nobody re-reads.
    const children = renderedChildSources(stageBlock("visitor"));
    expect(
      children.map((c) => c.name),
      "no repo component resolved inside the visitor block — the import scan broke",
    ).not.toHaveLength(0);
    for (const { name, source } of children) {
      expect(
        source,
        `${name} renders inside the visitor block and spends gold before the Law`,
      ).not.toMatch(GOLD);
    }
  });

  it("still lets gold through after the verdict, so this guard is not vacuous", () => {
    // If the committed block ever loses its gold, the assertions above stop
    // proving anything and this fails to say so.
    expect(stripComments(stageBlock("committed"))).toMatch(GOLD);
  });

  it("recognises every form this codebase writes gold in", () => {
    /*
     * The guard's own coverage, pinned. A matcher that only knew the hex
     * passed while `to-gold`, `rgba(212,168,67…)` and `var(--color-gold)` all
     * walked straight through it — so the alternation is asserted directly
     * rather than trusted.
     */
    for (const form of [
      "#D4A843",
      "#d4a843",
      "rgba(212,168,67,0.3)",
      "rgba(212, 168, 67, 0.3)",
      "rgb(212,168,67)",
      "var(--color-gold)",
      "text-gold",
      "to-gold",
      "border-gold/30",
    ]) {
      expect(form, `the gold matcher does not recognise ${form}`).toMatch(GOLD);
    }
    // And it must not fire on prose or on unrelated colours.
    for (const safe of ["text-white/70", "the gold band below", "#D4A844", "goldilocks"]) {
      expect(safe, `the gold matcher false-positives on ${safe}`).not.toMatch(GOLD);
    }
  });
});
