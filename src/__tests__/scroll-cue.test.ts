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
    // The verdict's re-read document is built from divs and overflows by only
    // 244px; one viewport of scroll clamps at the end, which is exactly enough
    // to bring its forward control into view.
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

describe("grace carries the verdict's gesture across the seam", () => {
  /*
   * A reader arrives at grace having tapped five times — the verdict is a
   * full-screen button and every beat advances from anywhere on it. Grace then
   * changed the contract silently: a tester tapped the middle of the
   * announcement, got nothing, and was stranded on the screen whose job is to
   * answer the question the screen before it just asked.
   */
  it("makes the whole screen a tap target", () => {
    expect(grace).toMatch(/data-slot="grace-tap-surface"/);
    expect(grace).toMatch(/className="fixed inset-0 z-30/);
    expect(grace).toMatch(/advanceSection\(containerRef\.current\)/);
  });

  it("retires the surface off the control it must not cover", () => {
    /*
     * This used to hang off the reveal observer firing for the last section, and
     * that threshold is wrong twice over. It fires when the section has merely
     * entered the bottom 10% of the screen, so the tap died while the reader was
     * still on the scripture — one screen early, which is the seam defect this
     * surface exists to fix, in miniature. Moving it later would be worse: any
     * moment where the surface is up while the Continue button is on screen is a
     * moment where tapping the button advances the page instead.
     *
     * Observing the control itself is what makes the two impossible to get out
     * of step, whatever section heights or thresholds become later.
     */
    expect(grace).toMatch(/\{observerActive && !reachedWayOut && \(/);
    expect(grace).toMatch(/wayOnObserver = new IntersectionObserver/);
    expect(grace).toMatch(/wayOnObserver\.observe\(wayOnRef\.current\)/);
    expect(grace).toMatch(/<div ref=\{wayOnRef\}/);
    expect(grace).toMatch(/wayOnObserver\.disconnect\(\)/);

    /*
     * The options are the test, not decoration. `threshold: 0` fires the moment
     * any part of the control crosses the edge; `threshold: 1` would wait for
     * all of it and leave the surface over a button the reader can already see,
     * and a negative rootMargin would do the same by shrinking the root.
     */
    const wayOnObserver = grace.slice(
      grace.indexOf("const wayOnObserver = new IntersectionObserver"),
      grace.indexOf("if (wayOnRef.current) wayOnObserver.observe"),
    );
    expect(wayOnObserver.length, "could not isolate the observer").toBeGreaterThan(0);
    expect(wayOnObserver).toMatch(/\{ threshold: 0 \}/);
    expect(wayOnObserver, "a margin would shrink the root and retire it late").not.toMatch(
      /rootMargin/,
    );
    expect(wayOnObserver).toMatch(/setReachedWayOut\(true\)/);

    /*
     * And the frame the observer cannot cover. IntersectionObserver callbacks
     * are asynchronous, so the surface outlives the control's arrival by at
     * least a frame — long enough for the second of two fast taps to land on it
     * while the button is already on screen, where it falls through to a
     * viewport of scrollBy and pulls the button away. The press reads the
     * geometry itself.
     */
    expect(grace).toMatch(/const wayOn = wayOnRef\.current\?\.getBoundingClientRect\(\)/);
    expect(grace).toMatch(/if \(wayOn && wayOn\.top < window\.innerHeight\)/);
    const guard = grace.slice(grace.indexOf("const wayOn = wayOnRef.current?"));
    expect(
      guard.indexOf("setReachedWayOut(true)"),
      "the synchronous guard does not retire the surface",
    ).toBeLessThan(guard.indexOf("advanceSection("));
    // …and NOT off a section index in the reveal observer, which is where it was.
    expect(grace, "the surface retires on a section threshold again").not.toMatch(
      /index === REVEAL_SECTIONS - 1\) setReachedWayOut/,
    );
    // The ref must be on the element holding the forward control, not elsewhere.
    const wayOn = grace.slice(grace.indexOf("<div ref={wayOnRef}"));
    expect(wayOn.slice(0, 400)).toContain("handleContinue");
  });

  it("does not re-report movements the reader already reached", () => {
    /*
     * `reportedRef` started empty on every mount, and back/forward are a single
     * gesture here that remounts this screen routinely — so a reader glancing
     * back at the verdict and returning re-reported every movement they had
     * already passed. The reducer's monotonic guard rejected the regressive
     * state, which is why nobody noticed: the STATE stayed right while the
     * EVENTS duplicated, and the events are what the funnel is built from.
     */
    expect(grace).toMatch(/state\.graceBeatsRevealed/);
    /*
     * Clamped, because the count comes out of storage and storage holds
     * whatever was last written there. Raw as an array length it is a loaded
     * gun: above BEAT_SECTIONS it silently suppresses real beat events, and
     * Infinity or a large number from a corrupted session throws or allocates
     * until the tab dies.
     */
    expect(grace).toMatch(/Math\.min\(/);
    expect(grace).toMatch(/BEAT_SECTIONS,?\s*\)/);
    expect(grace).toMatch(/Math\.trunc\(state\.graceBeatsRevealed\)/);
    expect(grace, "the report set starts empty again").not.toMatch(
      /reportedRef = useRef<Set<number>>\(new Set\(\)\)/,
    );
  });

  it("does not outlive the mechanism that retires it", () => {
    /*
     * The correction to a fix that overshot. Deriving "has arrived" from
     * `shown` meant an observer-less reader counted as arrived before starting
     * and never got the surface; its own state starting false fixed that and
     * created the opposite, worse bug — nothing can set it true without an
     * observer, so a `fixed inset-0` button sits over the Continue button and
     * the walk-back link for the whole visit and the flow has no exit.
     *
     * No observer, no surface. The argument still scrolls and every control
     * still answers a click.
     */
    expect(grace).toMatch(/\{observerActive && !reachedWayOut && \(/);
    expect(grace).toMatch(/setObserverActive\(true\)/);
    // Set inside the effect, after the bail-out — not unconditionally.
    const effect = grace.slice(grace.indexOf("useIsomorphicLayoutEffect"));
    const bail = effect.indexOf('if (typeof IntersectionObserver === "undefined") return;');
    expect(bail, "the observer bail-out is gone").toBeGreaterThan(-1);
    expect(effect.indexOf("setObserverActive(true)")).toBeGreaterThan(bail);
  });

  it("never guesses that the way out has been reached", () => {
    /*
     * A mount-time seed was here for a viewport tall enough to hold the way out
     * at first paint. With every section a full viewport that cannot happen —
     * but it CAN fire wrongly: the layout effect runs before the shell's
     * phase-change scroll reaches the top, so a reader returning by back or
     * forward while still scrolled deep measured the way out as already in
     * view. `reachedWayOut` is monotonic, so the surface vanished for the whole
     * re-read.
     */
    expect(grace, "the mount seed is back").not.toMatch(/seeded\[REVEAL_SECTIONS - 1\]/);
    /*
     * Exactly two setters, and both are measurements of where the control
     * actually is: the observer, and the synchronous rect check in the press
     * that covers the frame the observer's async callback cannot. A third would
     * mean something is guessing again — a mount-time seed of this flag is what
     * previously made the surface vanish for a whole re-read.
     */
    const setters = grace.match(/setReachedWayOut\(true\)/g) ?? [];
    expect(setters.length, "something other than a measurement sets it").toBe(2);
    expect(grace).toMatch(/if \(entry\.isIntersecting\) setReachedWayOut\(true\)/);
    expect(grace).toMatch(/wayOn\.top < window\.innerHeight\) \{\s*setReachedWayOut\(true\)/);
  });

  it("does not inherit 'has arrived' from the everything-visible fallback", () => {
    /*
     * `shown` starts all-true so a reader without JS or without an
     * IntersectionObserver gets the whole argument rather than a blank screen.
     * Deriving "has reached the way out" from it inherits that default
     * backwards: in an observer-less environment every value stays true, the
     * reader is treated as having arrived before starting, and the tap surface
     * and cue never render — the affordance missing in exactly the environment
     * the fallback exists to protect.
     *
     * So it is its own state, starting false, and only a measurement can set it.
     */
    expect(grace).toMatch(/useState\(false\)/);
    expect(grace, "the way-out signal is derived from `shown` again").not.toMatch(
      /reachedWayOut = shown\[/,
    );
    // Set by a measurement, never derived: the observer watching the forward
    // control is the only thing that may raise it. (Where it lives is pinned by
    // "retires the surface off the control it must not cover" above.)
    expect(grace).toMatch(/if \(entry\.isIntersecting\) setReachedWayOut\(true\)/);
  });

  it("ignores a press that travelled, so a flick is not a tap", () => {
    /*
     * Browsers suppress the click that ends a scroll drag, but a short flick
     * that barely moves the page still delivers one — and with the viewport as
     * the control that jumps a section the reader did not ask for, mid-gesture.
     */
    expect(grace).toMatch(/onPointerDown=\{handleSurfaceDown\}/);
    expect(grace).toMatch(/onPointerUp=\{handleSurfaceUp\}/);
    expect(grace).toMatch(/travelled > TAP_SLOP\) return/);
  });

  it("gets out of the reader's way the moment they touch the screen", () => {
    /*
     * A tap starts a smooth scroll of a few hundred milliseconds, and a reader
     * who reaches to drag inside that window was fighting an animation that
     * won. Measured at 390x844: taking over 120ms in put the page at 15px and
     * the animation hauled it back to 126 and held. Pull, snap back, and only
     * when the animation finishes does the page answer the finger.
     *
     * A programmatic scroll aborts the running animation, so the press itself
     * cancels it — before the drag, not during. With the finger down 80ms
     * before it moves (faster than any human), the yank measures zero; only a
     * synthetic same-tick drag still catches the last committed frames.
     *
     * And once a press has plainly travelled it is a scroll, not a tap, so the
     * capture is released and the browser owns the gesture.
     */
    // The press used to have to cancel a running animation. There is no
    // animation now, so the cancel is gone with it — a tap lands, and a drag
    // that follows starts from where the reader can see.
    expect(grace).not.toMatch(/window\.scrollTo\(window\.scrollX, window\.scrollY\)/);
    expect(grace).toMatch(/onPointerMove=\{handleSurfaceMove\}/);
    expect(grace).toMatch(/releasePointerCapture\(event\.pointerId\)/);
  });

  it("only lets the pointer that went down be the one that lifts", () => {
    /*
     * Without an id, a second finger's pointerdown overwrites the first's start
     * point and whichever contact lifts first is measured against the wrong
     * origin — a two-finger gesture advances the page. A cancelled press (the
     * browser taking over for a scroll) must clear its own start point too, or
     * it survives to be measured against some later, unrelated pointerup.
     */
    expect(grace).toMatch(/pointerId: event\.pointerId/);
    expect(grace).toMatch(/start\.pointerId !== event\.pointerId\) return/);
    expect(grace).toMatch(/onPointerCancel=\{handleSurfaceCancel\}/);
    expect(grace).toMatch(/pressRef\.current\?\.pointerId === event\.pointerId/);
  });

  it("does not advance on a right-click or a secondary contact", () => {
    /*
     * A right-click fires the same pointerdown/pointerup pair, and would move
     * the page out from under the context menu it just opened.
     *
     * Guarded at BOTH ends, and the release is the half that is easy to miss:
     * a mouse always reuses pointerId 1, so a primary press that lifted
     * somewhere else stayed on record and the next right-click's release
     * matched it by id and advanced. Capture is what stops the press escaping
     * in the first place.
     */
    const guards = grace.match(/!event\.isPrimary \|\| event\.button !== 0\) return/g) ?? [];
    expect(guards.length, "only one end of the press is guarded").toBe(2);
    expect(grace).toMatch(/setPointerCapture\(event\.pointerId\)/);
  });

  it("needs no bookkeeping to know what the next section is", () => {
    /*
     * While the hop was animated, its destination spent most of the animation
     * still below half the viewport — so it still answered "what is next", and
     * a second tap re-aimed at the section already being travelled to. That
     * needed a remembered target, a settle deadline and a scrollend listener to
     * correct, and each was its own source of wrongness.
     *
     * Landing immediately, the section a tap arrives at is at the top of the
     * screen and no longer a candidate. The next tap finds the next one. All of
     * it goes, and this test exists so none of it comes back without the
     * animation that justified it.
     */
    expect(grace).not.toMatch(/lastTargetRef|SCROLL_SETTLE_MS|scrollend/);
    expect(advance).not.toMatch(/skipPast/);
    expect(grace).toMatch(/const target = advanceSection\(containerRef\.current\);/);
  });

  it("counts a tap only when it actually moved the reader", () => {
    // advanceSection returns null at the end of the document; counting that as
    // an advance inflates the one number the surface is being judged on.
    expect(grace).toMatch(/if \(!target\) return;/);
  });

  it("keeps the surface out of the accessibility tree, and out of tab order", () => {
    // Space and PageDown already do the right thing on a document that scrolls,
    // and everything the surface reaches is next in reading order anyway. Both
    // halves of the focus dance are load-bearing — see scroll-cue.tsx.
    const slot = grace.indexOf('data-slot="grace-tap-surface"');
    expect(slot, "no tap surface to check").toBeGreaterThan(-1);
    const surface = grace.slice(grace.lastIndexOf("<button", slot), grace.indexOf("/>", slot));
    expect(surface).toMatch(/aria-hidden="true"/);
    expect(surface).toMatch(/tabIndex=\{-1\}/);
    expect(grace).toMatch(/onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
    expect(grace).toMatch(/currentTarget\.blur\(\)/);
  });

  it("keeps the cue alive for as long as there is more below", () => {
    /*
     * The cue used to live inside the announcement and end with it, so the
     * affordance vanished exactly when the reader still had five movements to
     * travel. Fixed to the viewport, it retires with the surface.
     */
    expect(grace).toMatch(/pointer-events-none fixed inset-x-0 bottom-\[calc\([^\]]*--consent-h/);
    expect(grace).not.toMatch(/absolute bottom-\[calc\([^\]]*--consent-h[^\]]*\]"\s*>\s*<ScrollCue/);
  });

  it("keeps its text out of the strip the cue sits in", () => {
    /*
     * The tap aligns the section BOX; nothing in that calculation knows the cue
     * exists. Measured at 390x844: the cue box occupies 605-730 and the record
     * section's last line reached 602 — three pixels, which is coincidence, not
     * clearance. With the consent banner up the cue lifts by --consent-h to
     * about 545 and roughly 69px of that section's text sits behind it, for
     * exactly the readers meeting the page for the first time.
     *
     * So every section reserves the band, and centres its content in what is
     * left: the axis being centred is the readable area, not the raw viewport.
     */
    const grace2 = grace;
    expect(grace2).toMatch(/--grace-cue-band/);
    expect(grace2).toMatch(/calc\(9rem \+ var\(--consent-h, 0px\)\)/);
    const sections = grace2.match(/<section\b[\s\S]*?>/g) ?? [];
    for (const [i, section] of sections.entries()) {
      expect(section, `section ${i} lays text under the cue`).toMatch(
        /pb-\[calc\(8vh\+var\(--grace-cue-band\)\)\]|pb-\[calc\(8vh\+env\(safe-area-inset-bottom\)/,
      );
    }
  });

  it("gives every section a screen of its own", () => {
    /*
     * The movements were 832, 509, 692, 529, 506, 104, 440 and 248px tall, so a
     * tap that centred the next one left the tail of the last on screen and the
     * head of the next already showing — two movements at once, on a page whose
     * argument is that each step follows from the one before it.
     *
     * Counted, not sampled: one short section is all it takes for a tap to land
     * on two.
     */
    // The announcement carries no data-reveal, so the page renders one more
    // section than REVEAL_SECTIONS counts. Derived rather than hard-coded: a
    // movement added later must arrive sized like the rest.
    const revealSections = Number(grace.match(/const REVEAL_SECTIONS = (\d+)/)?.[1]);
    const sections = grace.match(/<section\b[\s\S]*?>/g) ?? [];
    expect(sections.length, "grace lost its sections").toBe(revealSections + 1);
    for (const [i, section] of sections.entries()) {
      /*
       * `svh`, not `dvh`. On a phone `dvh` tracks the viewport as the URL bar
       * collapses and expands, so mid-drag all eight sections would resize, the
       * document height would change under the reader's thumb, and the words
       * they were holding would move — which reads as the page fighting them,
       * and is most obvious when a section is centred. `svh` is fixed at the
       * bar-expanded size, so the page stops resizing itself while being read.
       *
       * Not reproducible in desktop touch emulation, which has no URL bar to
       * collapse — this test is the record of why the unit is what it is.
       */
      expect(section, `section ${i} does not claim a screen`).toMatch(
        /min-h-\[calc\(100svh-0\.75rem\)\]/,
      );
      expect(section, `section ${i} resizes with the URL bar`).not.toMatch(/dvh/);
    }
  });

  it("names the gesture in the words the reader already followed", () => {
    /*
     * The seam is the defect: five taps on the verdict, then a screen that
     * changed the contract silently. Repeating the verdict's OWN sentence says
     * "same rules here" better than any new phrasing could — and reusing its
     * two strings rather than adding a third means they cannot drift.
     *
     * `grace.tapContinue` stays orphaned: it is touch-only wording, and the
     * verdict already solved that with a pair keyed on the pointer.
     */
    expect(grace).toMatch(/advanceHint: \{ touch: string; pointer: string \}/);
    expect(grace).toMatch(/\{advanceHint\.touch\}/);
    expect(grace).toMatch(/\{advanceHint\.pointer\}/);
    expect(shell).toMatch(/advanceHintTouch/);
    expect(shell).toMatch(/advanceHintPointer/);
    // Keyed on the pointer, not the width: a tablet is 768 wide and touch.
    expect(grace).toMatch(/pointer-fine:hidden/);
    expect(grace, "grace invented a third phrasing").not.toMatch(/tapContinue\}/);
  });

  it("retires the hint after the reader moves, and only the hint", () => {
    /*
     * The capability stays for the whole visit; the sentence teaching it does
     * not. Retire the gesture instead and the screen becomes a mode change —
     * same page, different rules, triggered by something the reader did earlier
     * and will not remember doing.
     */
    expect(grace).toMatch(/\{!hasMoved && \(/);
    // Both routes count as moving, and one regex matching either lets the
    // other be deleted: a tap that advances…
    expect(grace).toMatch(/setHasMoved\(true\);\s*\n\s*trackGraceTapAdvance\(\)/);
    // A rubber-band bounce at the top of an iOS page is not moving.
    expect(grace).toMatch(/window\.scrollY > 40\) setHasMoved\(true\)/);
    // The surface itself is NOT gated on hasMoved — only on the way out, and
    // on the observer that can retire it.
    expect(grace).toMatch(/\{observerActive && !reachedWayOut && \(/);
    expect(grace).not.toMatch(/!hasMoved && !reachedWayOut|!reachedWayOut && !hasMoved/);
  });

  it("puts the way on under the record, not on a screen of its own", () => {
    /*
     * The forward control had a viewport to itself: 112px of content in an 832px
     * section, 87% empty, holding "E agora?" and a re-read link. That is not
     * weight given to the decision, it is a gesture charged for nothing — the
     * argument that deleted the accordion, since every gate is a place to leave.
     *
     * Merged, the reader's own charge sheet is the thing the button acts on.
     * Combined content measures 496px against ~675px of usable height.
     */
    const sections = grace.match(/<section\b[\s\S]*?<\/section>/g) ?? [];
    const withRecord = sections.filter((sec) => sec.includes("<GraceRecord"));
    expect(withRecord.length, "the record moved or was duplicated").toBe(1);
    expect(withRecord[0], "the way on is not with the record").toContain("handleContinue");
    expect(withRecord[0], "the walk-back link is not with the record").toContain("onBack");
    // …and nothing is left holding only a button.
    const buttonOnly = sections.filter(
      (sec) => sec.includes("handleContinue") && !sec.includes("<GraceRecord"),
    );
    expect(buttonOnly.length, "a screen still holds only the forward control").toBe(0);
  });

  it("counts a beat as read when it is the thing on the screen", () => {
    /*
     * Both jobs used to run off one observer, whose threshold is deliberately
     * early — a section reveals once its top passes 90% of the viewport, so it
     * is never still fading while the reader looks at it. Early is right for
     * opacity and wrong for a funnel: it counted a movement as read from a
     * sliver at the bottom edge. Measured at 390x844, arriving at one section
     * put the next one's top at 838 against a 760 threshold — 78px from marking
     * a beat nobody had reached, and about 28px on a bar-collapsed viewport.
     *
     * The reporting root is now the top 5% of the screen. The trade is an
     * undercount rather than an overcount, which is the right direction for a
     * number that will be used to judge printed campaigns.
     */
    expect(grace).toMatch(/readObserver = new IntersectionObserver/);
    expect(grace).toMatch(/rootMargin: "0px 0px -95% 0px"/);
    // The reveal observer must NOT be the one reporting beats any more.
    const revealObserver = grace.slice(
      grace.indexOf("const observer = new IntersectionObserver"),
      grace.indexOf("const readObserver = new IntersectionObserver"),
    );
    expect(revealObserver.length, "could not isolate the reveal observer").toBeGreaterThan(0);
    expect(revealObserver, "the reveal threshold still reports beats").not.toMatch(
      /trackGraceBeatRevealed/,
    );
    // Both are torn down.
    expect(grace).toMatch(/readObserver\.disconnect\(\)/);
  });

  it("reports the tap, because the surface costs something", () => {
    // Text selection on this screen is the price. `grace_tap_advance` is how we
    // find out whether anything was bought with it.
    expect(grace).toMatch(/trackGraceTapAdvance\(\)/);
  });

  it("scopes the hop to grace's own sections", () => {
    /*
     * The consent banner is a <section> — deliberately, so its text belongs to a
     * landmark — fixed to the bottom of the viewport and LAST in document order.
     * On the final section it is the only thing matching "starts in the lower
     * half of the screen", and scrollIntoView on a fixed element does nothing:
     * the tap silently fails. Guarded twice, because the verdict's cue passes no
     * root and met the same banner.
     */
    expect(advance).toMatch(/\(root \?\? document\)\.querySelectorAll/);
    expect(advance).toMatch(/getComputedStyle\(section\)\.position !== "fixed"/);
    expect(grace).toMatch(/ref=\{containerRef\}/);
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
