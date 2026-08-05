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
const shell = strip(read("src", "components", "game-shell.tsx"));
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

  it("answers a tap as well as a scroll", () => {
    /*
     * A chevron under a headline looks like a control, and readers tapped it and
     * got nothing — two ways to read one shape, only one of which worked. It now
     * honours both, which serves the reader who reaches for the wrong gesture
     * better than a label would: a word only helps whoever reads it, and "tap"
     * would be a lie on a page whose primary gesture is scrolling.
     */
    expect(cue).toMatch(/onClick=\{handleActivate\}/);
  });

  it("advances by a section, not by a fixed distance", () => {
    /*
     * Grace's movements are 832, 509, 692, 529, 506, 104, 440 and 248px tall —
     * no fixed hop lands well against that. A 0.9-viewport version was measured
     * leaving the announcement still occupying the top of the screen with two
     * movements' text in view at once, which is the opposite of the
     * one-beat-at-a-time reading the argument is built for.
     *
     * Centred, not top-aligned: every movement is shorter than the viewport and
     * carries 135–241px of its own padding, so aligning tops parks a screenful
     * of padding with the words below it.
     */
    expect(cue).toMatch(/querySelectorAll\("section"\)/);
    expect(cue).toMatch(/scrollIntoView\(\{\s*block:\s*"center"/);
  });

  it("does not mistake the section the reader is already on for the next one", () => {
    // The shell pads the flow by 12px, so the current section reports a top of
    // 12. A `top > 0` test matched it and re-centred the announcement instead of
    // advancing — the half-viewport threshold is what makes "next" mean next.
    expect(cue).toMatch(/top > window\.innerHeight \/ 2/);
  });

  it("still reaches the way out of a document with no sections", () => {
    // The verdict's re-read document is built from divs and overflows by only
    // 244px; one viewport of scroll clamps at the end, which is exactly enough
    // to bring its forward control into view.
    expect(cue).toMatch(/window\.scrollBy/);
  });

  it("scrolls instantly for a reader who asked for less motion", () => {
    // The bob is stopped in CSS; the scroll it performs has to be stopped here.
    expect(cue).toMatch(/prefers-reduced-motion: reduce/);
    expect(cue).toMatch(/reduced\s*\?\s*\("auto" as const\)\s*:\s*\("smooth" as const\)/);
    // …and that choice has to reach BOTH paths, the section hop and the fallback.
    expect(cue).toMatch(/scrollIntoView\(\{[^}]*behavior\s*\}\)/);
    expect(cue).toMatch(/scrollBy\(\{[^}]*behavior\s*\}\)/);
  });

  it("is decorative, and never takes focus", () => {
    /*
     * The argument itself follows in reading order, so a screen reader needs no
     * instruction to scroll — and naming this would add a string in two locales
     * for a gesture neither keyboard nor screen-reader users make.
     *
     * But `tabIndex={-1}` alone is not enough: clicking a <button> focuses it,
     * and a FOCUSED aria-hidden element makes the browser refuse the hiding
     * ("Blocked aria-hidden on an element because its descendant retained
     * focus"), putting an unnamed button into the accessibility tree — exactly
     * what aria-hidden was chosen to prevent. Both halves are load-bearing:
     * preventDefault stops the focus on pointer devices, blur covers touch.
     */
    expect(cue).toMatch(/aria-hidden="true"/);
    expect(cue).toMatch(/tabIndex=\{-1\}/);
    expect(cue).toMatch(/onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
    expect(cue).toMatch(/\.blur\(\)/);
  });
});

describe("the flow's shell does not eat a touch gesture", () => {
  it("clips horizontally without becoming a scroll container", () => {
    /*
     * `overflow: hidden` on ONE axis makes the other compute to `auto`, which
     * turned <main> into a scroll container holding 12px of internal overflow
     * (its own `pt-3`). On touch the compositor spent the reader's first swipe
     * scrolling MAIN by those 12px instead of chaining to the document: measured
     * on grace at 390×844 with touch emulation, main.scrollTop 12 /
     * window.scrollY 0, on a 3,871px page. The page could not be scrolled.
     *
     * `clip` clips the same overflow and never scrolls, so the gesture reaches
     * the page. It cannot simply be dropped — grace's full-bleed turn
     * (`mx-[calc(50%-50vw)]`) relies on the clipping.
     *
     * A wheel chains straight to the document and never reproduced this, which
     * is why it survived every desktop measurement.
     */
    expect(shell).toMatch(/<main className="[^"]*overflow-x-clip/);
    expect(shell).not.toMatch(/<main className="[^"]*overflow-x-hidden/);
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
