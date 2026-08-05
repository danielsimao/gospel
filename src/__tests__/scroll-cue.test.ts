import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Where the flow says "there is more below", and where it must not.
 *
 * Source assertions in the idiom of flow-column.test.ts: these are Tailwind
 * classes, a CSS rule and JSX conditionals, and vitest runs in
 * `environment: "node"`, so there is no layout here to observe as behaviour.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

/** Every file here explains its decision in prose that quotes the very tokens
    asserted, so a deleted implementation would pass on its own comments. */
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const cue = strip(read("src", "components", "shared", "scroll-cue.tsx"));
const grace = strip(read("src", "components", "grace-screen.tsx"));
const verdict = strip(read("src", "components", "verdict-screen.tsx"));
const css = read("src", "app", "globals.css");

describe("the scroll cue", () => {
  it("moves, because a static cue is the one that gets missed", () => {
    // Grace's announcement fills the viewport to the pixel — the next section
    // begins at exactly 844 of 844 — so nothing intrudes to suggest more. The
    // cue is carrying that job alone, and motion is what makes a cue work.
    expect(cue).toMatch(/animate-\[scroll-cue_[\d.]+s_[a-z-]+_infinite\]/);
    expect(css).toMatch(/@keyframes scroll-cue/);
  });

  it("stops moving for a reader who asked for less motion, and stays visible", () => {
    /*
     * `prefers-reduced-motion` is handled per-selector in this codebase, not
     * blanket — a new keyframe that skips the block keeps animating for exactly
     * the readers who opted out.
     *
     * Visible, not hidden: the fact crawl's precedent. Removing the cue under
     * reduced motion would leave grace looking like it ends at the announcement,
     * which is the defect this exists to fix.
     */
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    const rule = reduced.match(/\[data-slot="scroll-cue"\]\s*\{[^}]*\}/)?.[0];
    expect(rule, "no reduced-motion rule for the scroll cue").toBeTruthy();
    expect(rule).toMatch(/animation:\s*none/);
    expect(rule).not.toMatch(/display:\s*none|visibility:\s*hidden|opacity:\s*0/);
  });

  it("is decorative, so it names nothing to a screen reader", () => {
    // The argument itself is what follows in reading order; a screen reader does
    // not need to be told to scroll. Also why no WCAG target-size rule applies.
    expect(cue).toMatch(/aria-hidden="true"/);
  });
});

describe("each screen cues the gesture it actually wants", () => {
  it("grace shows the cue, because grace scrolls", () => {
    expect(grace).toMatch(/<ScrollCue\s*\/>/);
    // One definition, not two: the verdict document needs the same promise, and
    // a second copy is how the two drift apart.
    expect(grace).not.toMatch(/rotate-45/);
  });

  it("the verdict's re-read document shows the cue, because its way out is below the fold", () => {
    /*
     * Measured at 390×844: the document is 1088px and its only forward control
     * sits at y=878. The full-screen click target does not exist in this mode —
     * deliberately — so without a cue a reader clicked and nothing happened.
     */
    expect(verdict).toMatch(/showAll && !hasScrolled/);
    expect(verdict).toMatch(/<ScrollCue\s*\/>/);
  });

  it("retires the cue once the reader has scrolled", () => {
    // A cue still pointing down after the control is on screen is noise.
    expect(verdict).toMatch(/once:\s*true/);
  });

  it("the beat sequence shows no scroll cue and no down arrow", () => {
    /*
     * The sequence advances by TAP and its document is exactly one viewport.
     * A down arrow there is the page's own vocabulary for "scroll", pointed at
     * a gesture that does nothing — readers reported trying to scroll and
     * getting nothing. The persistent "click anywhere, or press space"
     * affordance is what belongs on those beats, and it stays.
     *
     * The arrow survives inside the showAll button, where it is true.
     */
    const sequenceBlock = verdict.slice(
      verdict.indexOf("{!showAll && ("),
      verdict.indexOf("{showAll && ("),
    );
    expect(sequenceBlock.length, "could not isolate the sequence block").toBeGreaterThan(0);
    expect(sequenceBlock).not.toMatch(/&darr;/);
    expect(sequenceBlock).not.toMatch(/ScrollCue/);
    // …and the arrow is still there for the document, which really does scroll.
    expect(verdict.slice(verdict.indexOf("{showAll && ("))).toMatch(/&darr;/);
  });
});
