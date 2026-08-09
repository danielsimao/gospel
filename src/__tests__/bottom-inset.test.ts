import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Structural checks on the test screen's edge contracts — the bottom edge it
 * shares with the consent banner and the home indicator, and the horizontal
 * breakout the verdict's rule depends on.
 *
 * The behaviour itself cannot be tested here. Vitest runs in
 * `environment: "node"`, so there is no layout, no ResizeObserver and no
 * `env(safe-area-inset-bottom)` to resolve; under jsdom there would still be no
 * layout engine to give the banner a height. Asserting the overlap is gone
 * would be asserting a fiction.
 *
 * What these can do is pin the contract, which has three ends and no type to
 * connect them: the banner writes `--consent-h`, the question card reserves it,
 * and globals.css registers it so the reserve can be moved rather than
 * switched. Any one deleted on its own restores a measured bug — a fixed banner
 * covering 26 of the answer buttons' 44 pixels on a first visit, or the page
 * jumping 29-60px the instant that banner is answered — and nothing else in the
 * codebase would notice.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const banner = readFileSync(join(ROOT, "src", "components", "shared", "consent-banner.tsx"), "utf8");
const questionCard = readFileSync(join(ROOT, "src", "components", "question-card.tsx"), "utf8");
const css = readFileSync(join(ROOT, "src", "app", "globals.css"), "utf8");

/** Comments in both files describe the bug and quote the property, so every
    assertion reads the code with comments stripped. Matching the raw text would
    let a deleted implementation pass on the strength of the comment explaining
    why it exists. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const bannerCode = code(banner);
const cardCode = code(questionCard);

describe("consent banner height reserve", () => {
  it("publishes its measured height as --consent-h", () => {
    expect(bannerCode).toMatch(/setProperty\(\s*["']--consent-h["']/);
  });

  it("measures the rendered element rather than hard-coding a height", () => {
    // The banner is 58px in English on a wide phone, taller when the message
    // wraps and taller again in Portuguese. A constant would be right once.
    expect(bannerCode).toMatch(/getBoundingClientRect\(\)\.height/);
    expect(bannerCode).toMatch(/ResizeObserver/);
  });

  it("takes its inline properties off once the banner has gone", () => {
    // The tidy-up, and — where a length cannot be transitioned — the release
    // itself. Either way it happens on exit-complete: dropping the reserve
    // outright while the banner is still on screen uncovers the controls
    // underneath it.
    expect(bannerCode).toMatch(/onExitComplete/);
    expect(bannerCode).toMatch(/removeProperty\(\s*["']--consent-h["']/);
    expect(bannerCode).toMatch(/removeProperty\(\s*["']--consent-h-timing["']/);
  });

  it("keeps its own controls out of the home indicator", () => {
    // Accept and Decline sat 12px above the bottom edge, inside the 34px iOS
    // reserves for the swipe-up gesture.
    expect(bannerCode).toMatch(/pb-\[calc\([^\]]*env\(safe-area-inset-bottom\)/);
  });
});

describe("the reserve travels rather than jumps", () => {
  /*
   * The other half of the same bug. Reserving the banner's height stopped the
   * banner covering anything; opening and closing that reserve in one frame
   * then moved the page under the reader instead. Measured at 390x844 on the
   * home hero: tapping Accept dropped the rate cards 29px and the scroll cue
   * 60px in a single frame — the hero's flex spacers hand half the released
   * reserve to the cards and all of it to the cue — and the same jump ran in
   * reverse a moment after hydration, when the banner first published a height.
   *
   * The fix is that the reserve moves on the banner's own curve, so the content
   * rises as the banner slides in and follows it down as it leaves. Both ends
   * are needed and neither is visible from the other: CSS cannot transition an
   * unregistered custom property, and a registration with nothing setting the
   * timing transitions over 0s.
   */
  it("registers --consent-h, because an unregistered property cannot animate", () => {
    const block = css.match(/@property --consent-h\s*\{[^}]*\}/)?.[0];
    expect(block, "--consent-h is not registered; the reserve snaps again").toBeDefined();
    expect(block).toMatch(/syntax:\s*["']<length>["']/);
    // Every consumer is a descendant of <html>, which is where the value is set.
    expect(block).toMatch(/inherits:\s*true/);
    // The reserve is zero before the banner mounts and on every visit that never
    // sees one, which is most of them.
    expect(block).toMatch(/initial-value:\s*0px/);
  });

  it("transitions it on the element the banner writes to", () => {
    const rule = css.match(/\nhtml \{[^}]*\}/)?.[0];
    expect(rule, "no html transition for the reserve").toBeDefined();
    expect(rule).toMatch(/transition:\s*--consent-h var\(--consent-h-timing/);
    // 0s by default: with no banner mounted nothing has asked for the move.
    expect(rule).toMatch(/var\(--consent-h-timing,\s*0s\)/);
  });

  it("moves the reserve on the same curves it hands framer", () => {
    /*
     * Two declarations of "150ms ease-in" is how the reserve and the banner
     * start leaving at different rates, and the content lands somewhere the
     * banner is not. So the curves are named once and the CSS twin is generated
     * from the same numbers.
     */
    expect(bannerCode).toMatch(/const ENTER = \{ duration: [\d.]+, ease: EASE_OUT_STRONG \}/);
    expect(bannerCode).toMatch(/const EXIT = \{ duration: [\d.]+, ease: \[[\d., ]+\] as const \}/);
    expect(bannerCode).toMatch(/cubic-bezier\(\$\{motion\.ease\.join\(","\)\}\)/);
    // …and framer is given those same objects, not literals beside them.
    expect(bannerCode).toMatch(/transition=\{ENTER\}/);
    expect(bannerCode).toMatch(/exit=\{\{[^}]*transition: EXIT/);
  });

  it("starts closing the reserve as the banner starts leaving", () => {
    // Not when it has left: 150ms of nothing, then a jump, is the jump.
    const answer = bannerCode.slice(bannerCode.indexOf("function answer("));
    expect(answer.length, "no single place where the answer is handled").toBeGreaterThan(0);
    expect(answer).toMatch(/setProperty\(\s*["']--consent-h-timing["'],\s*cssTiming\(EXIT\)\s*\)/);
    expect(answer).toMatch(/setProperty\(\s*["']--consent-h["'],\s*["']0px["']\s*\)/);
    // Both buttons go through it, so Decline cannot keep the old jump.
    expect(bannerCode).toMatch(/onClick=\{\(\) => answer\("denied"\)\}/);
    expect(bannerCode).toMatch(/onClick=\{\(\) => answer\("granted"\)\}/);
  });

  it("does not re-open the reserve behind a banner already leaving", () => {
    // The ResizeObserver outlives the answer by the length of the exit. A
    // height published in that window would put the space back with nothing
    // above it.
    expect(bannerCode).toMatch(/releasedRef/);
    const publish = bannerCode.slice(bannerCode.indexOf("const publish = ()"));
    expect(publish.slice(0, 200)).toMatch(/if \(releasedRef\.current\) return;/);
  });

  it("snaps at the old moment where a length cannot be transitioned", () => {
    /*
     * @property ships with CSS.registerProperty in every engine, so the one
     * detects the other. Without the guard, an engine that cannot transition
     * would apply 0px on the tap — the reserve gone while the banner still
     * covers what it was reserving, which is worse than the jump it replaces.
     */
    expect(bannerCode).toMatch(/registerProperty["']?\s+in CSS/);
    expect(bannerCode).toMatch(/if \(RESERVE_TRAVELS\) \{/);
  });

  it("gives a reader who asked for less motion the destination, not the trip", () => {
    // Per-selector, as everything else in that block is. framer's
    // reducedMotion="user" already drops the banner's slide, so the banner and
    // the space it claims still change together.
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    const rule = reduced.match(/\n {2}html \{[^}]*\}/)?.[0];
    expect(rule, "the reserve still travels under reduced motion").toBeDefined();
    expect(rule).toMatch(/transition:\s*none/);
  });
});

describe("the verdict's full-bleed rule", () => {
  // Also an edge contract, and a more fragile one: it looks like a candidate
  // for simplification and is not.
  it("breaks out with margin, never with a transform", () => {
    /*
     * framer-motion animates `y` on the block this rule sits in, which writes
     * the element's transform property from an inline style. A
     * `-translate-x-1/2` breakout writes the same property and loses, so the
     * rule would silently stop reaching the screen edge — visible only in the
     * answered state, on a phone, which is where nobody runs a class rename.
     */
    expect(cardCode).toContain("mx-[calc(50%-50vw)]");
    expect(cardCode).not.toMatch(/-translate-x-1\/2/);
  });

  it("returns to the column at sm, where full width would be a 1280px line", () => {
    expect(cardCode).toMatch(/mx-\[calc\(50%-50vw\)\][^"]*sm:mx-0/);
  });
});

describe("question card bottom reserve", () => {
  it("reserves the banner height and the safe-area inset together", () => {
    const padding = cardCode.match(/pb-\[calc\([^\]]+\)\]/)?.[0];
    expect(padding, "question-card has no calc() bottom padding").toBeDefined();
    expect(padding).toContain("env(safe-area-inset-bottom)");
    expect(padding).toContain("var(--consent-h,0px)");
  });

  it("keeps the original spacing when neither applies", () => {
    // pb-6. A returning reader on a device with no home indicator must get the
    // spacing this screen has always had, not a padding that only looks right
    // while something is overlapping it.
    expect(cardCode).toMatch(/pb-\[calc\(1\.5rem\+/);
  });

  it("defaults the variable, so the reserve is zero before the banner mounts", () => {
    // --consent-h is set from an effect. Without the 0px fallback the padding
    // is invalid on the server render and on every visit that never sees a
    // banner, which is most of them.
    expect(cardCode).toContain("var(--consent-h,0px)");
  });
});
