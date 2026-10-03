import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Where the flow says "there is more below", and where it must not.
 *
 * The cue and the section hop it performs now serve the homepage hero alone.
 * Grace used both while it was a scroll, and the measurements quoted below
 * were taken there — they are why the hop works as it does. Grace is a beat
 * sequence now, pinned in grace-chain.test.ts and beat-sequence.test.ts, and
 * the last block here is the record that it shows no cue.
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
const advance = strip(read("src", "lib", "advance-section.ts"));
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

  it("delegates the hop, so the shape and the tap surface cannot disagree", () => {
    // Grace's full-screen tap surface performs the identical move. Two copies of
    // "what counts as the next section" is how they start sending a tap and a
    // chevron to different places.
    expect(cue).toMatch(/advanceSection\(\)/);
    expect(cue).not.toMatch(/scrollIntoView|scrollBy/);
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
    expect(advance).toMatch(/querySelectorAll\("section"\)/);
    /*
     * Aligned to the TOP, not centred. Centring suited sections shorter than the
     * screen. Now each claims a viewport, and centring one that outgrows it — a
     * long movement, a large system font, a narrow phone — pushes its heading
     * off the top. Top alignment degrades the other way: the tail falls below
     * the fold and the reader scrolls, which they can always do.
     */
    expect(advance).toMatch(/scrollIntoView\(\{\s*block:\s*"start"/);
  });

  it("advances to the next boundary, not the next half-screen", () => {
    /*
     * `top > innerHeight / 2` was doing damage nobody had measured. A reader who
     * had scrolled by hand so a section began just above the middle — heading at
     * 388, most of a screen of unread text below it — tapped, and the tap jumped
     * straight past it: measured top 388 before, -838 after. At 300 the same,
     * two thirds of a screen of argument skipped. Only a section starting BELOW
     * the middle counted as somewhere to go.
     *
     * A tap advances to the next boundary, and when the current section has not
     * been brought to the top yet, that boundary is its own top — so a tap never
     * crosses text the reader has not been shown.
     */
    expect(advance).toMatch(/top > ALIGNED_SLOP/);
    expect(advance, "the half-screen guess is back").not.toMatch(/innerHeight \/ 2/);
    /*
     * The slop is not zero, and that is the original bug: the shell pads the
     * flow by 12px, so a section already at the top reports 12 and a `top > 0`
     * test re-aligned what the reader was looking at instead of advancing.
     */
    const slop = Number(advance.match(/const ALIGNED_SLOP = (\d+)/)?.[1]);
    expect(slop, "no slop constant").toBeGreaterThan(12);
    expect(slop, "so much slop that a real section start is treated as aligned").toBeLessThan(80);
  });

  it("still reaches the way out of a document with no sections", () => {
    // The fallback's original caller — the verdict's re-read document, divs
    // only, 244px of overflow — is gone (re-entry replays the sequence now).
    // The clamp-at-the-end viewport scroll stays: advanceSection is a shared
    // helper, and a caller whose sections are exhausted or absent must still
    // move rather than silently eat the tap.
    expect(advance).toMatch(/window\.scrollBy/);
  });

  it("lands immediately, for everyone", () => {
    /*
     * A smooth scroll is an animation the reader cannot cleanly interrupt. Tap,
     * then reach to drag inside those few hundred milliseconds, and the
     * animation wins: measured at 390x844, taking over 120ms in put the page at
     * 15px and it was hauled back to 126 and held. Cancelling on the press got
     * the common case to zero, but the race is structural — every fix bets
     * against frames already committed to the compositor.
     *
     * Nothing is lost. The verdict, which the reader has just tapped through
     * five times, never travels the viewport: it replaces content in place with
     * opacity 0->1 and y 10->0. Grace's sections carry the same reveal, so a tap
     * lands and the section fades in exactly as a verdict beat does — measured
     * after the change, opacity 0.48, 0.78, 0.90, 0.97, 1.00 over ~540ms while
     * the position never moved again. The glide was the odd one out, not the
     * animation.
     *
     * This also removes the reduced-motion branch: instant IS the reduced-motion
     * behaviour, so there is no longer a version of this that moves.
     */
    expect(advance).toMatch(/const behavior = "auto" as const/);
    expect(advance, "the smooth scroll is back").not.toMatch(/"smooth"/);
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
  it("grace shows no cue, because grace no longer scrolls", () => {
    /*
     * Grace was a scroll with a bobbing chevron on every screen, and once its
     * first hint retired the chevron was the only thing moving: the eye goes
     * to motion first, and that motion said "leave this". It is a beat
     * sequence now, cued exactly as the verdict is — the same sentence and the
     * same dots — so a down arrow here would point at a gesture that is no
     * longer how the screen works.
     */
    expect(grace).not.toMatch(/ScrollCue/);
    expect(grace).not.toMatch(/rotate-45|&darr;/);
  });

  it("the verdict shows no scroll cue and no down arrow, because nothing scrolls", () => {
    /*
     * The verdict advances by TAP on every beat, one beat to a screen, and a
     * reader walking back from grace replays the same sequence from the
     * charge — there is no second layout with anything below the fold. A down
     * arrow is the page's own vocabulary for "scroll", pointed at a gesture
     * that does nothing: readers reported trying to scroll the beats and
     * getting nothing. The persistent "click anywhere, or press space"
     * affordance is what belongs on this screen, and it stays.
     *
     * The cue and its arrow were legitimate here once — the re-read used to
     * be a separate 1088px "document" whose only control sat below the fold
     * at 390×844. Replay-from-the-start (owner ruling, 2026-08-15) deleted
     * that layout, and the cue's reason went with it.
     */
    expect(verdict).not.toMatch(/&darr;/);
    expect(verdict).not.toMatch(/ScrollCue/);
  });
});
