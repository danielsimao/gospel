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
 * What these can do is pin the contract, which has exactly two ends and no
 * type to connect them: the banner writes `--consent-h`, and the question card
 * reserves it. Either half deleted on its own restores the bug — a fixed
 * banner covering 26 of the answer buttons' 44 pixels on a first visit — and
 * nothing else in the codebase would notice.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const banner = readFileSync(join(ROOT, "src", "components", "shared", "consent-banner.tsx"), "utf8");
const questionCard = readFileSync(join(ROOT, "src", "components", "question-card.tsx"), "utf8");

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

  it("releases the reserve when the banner has finished leaving", () => {
    // On exit-complete, not on the state change: clearing it as Accept is
    // tapped drops the reserve while the banner is still on screen.
    expect(bannerCode).toMatch(/onExitComplete/);
    expect(bannerCode).toMatch(/removeProperty\(\s*["']--consent-h["']/);
  });

  it("keeps its own controls out of the home indicator", () => {
    // Accept and Decline sat 12px above the bottom edge, inside the 34px iOS
    // reserves for the swipe-up gesture.
    expect(bannerCode).toMatch(/pb-\[calc\([^\]]*env\(safe-area-inset-bottom\)/);
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
