import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Grace is one scroll, and these are the properties that make that safe.
 *
 * This file used to pin the accordion — which rung was open, and how long the
 * continue pill waited. Both are gone: the chain was five taps in a flow that
 * already cost five more in the verdict, and every tap is a place to leave. The
 * assertions below replace them rather than sit alongside them, because a test
 * describing a mechanic that no longer exists is worse than no test.
 *
 * Source assertions in the idiom of stage-css.test.ts: this is JSX and vitest
 * runs in `environment: "node"`, so there is no layout or observer here.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const grace = readFileSync(join(ROOT, "src", "components", "grace-screen.tsx"), "utf8");

/** The comments narrate the mechanic that was removed and quote its names, so
    every assertion reads the file with comments stripped. */
const code = grace.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("grace is a scroll, not a staircase", () => {
  it("keeps no gate between the announcement and the decision", () => {
    // The accordion's whole vocabulary. Any of these coming back means a rung
    // is being withheld again, which is the Law's mechanic borrowed for grace.
    for (const gone of ["allBeatsRevealed", "activeIndex", "revealedCount", "PILL_DELAY_MS"]) {
      expect(code, `"${gone}" is back in grace-screen`).not.toContain(gone);
    }
  });

  it("leaves exactly one control on the screen, and it goes to the decision", () => {
    expect(code.match(/onClick=\{handleContinue\}/g) ?? []).toHaveLength(1);
    expect(code).toContain('dispatch({ type: "SHOW_INVITATION" })');
  });
});

describe("the scroll reveal cannot move the page", () => {
  it("animates opacity and transform only", () => {
    // A reveal that animated height or max-height would change the length of
    // the page under a moving thumb. The transition list is the guard.
    const transition = code.match(/transition-\[[^\]]+\]/g) ?? [];
    expect(transition.length).toBeGreaterThan(0);
    for (const t of transition) {
      expect(t, `${t} animates a layout property`).not.toMatch(/height|width|padding|margin/);
    }
  });

  it("hides nothing when there is no observer to bring it back", () => {
    // Server-rendered HTML carries the whole argument, and a reader without JS
    // — or without IntersectionObserver — must get the gospel, not a blank
    // page. Sections start visible; only the measured off-screen ones are
    // hidden, and the bail-out has to come before that measurement.
    expect(code).toMatch(/useState<boolean\[\]>\(\(\) =>\s*new Array\(REVEAL_SECTIONS\)\.fill\(true\)/);
    const bailOut = code.indexOf('if (typeof IntersectionObserver === "undefined") return;');
    const firstHide = code.indexOf("setShown(");
    expect(bailOut).toBeGreaterThan(-1);
    expect(bailOut).toBeLessThan(firstHide);
  });

  it("breaks the turn out of its column with a margin, not a transform", () => {
    // The codebase's documented idiom: an inline transform on an element framer
    // also animates silently wins over the animation.
    expect(code).toContain("mx-[calc(50%-50vw)]");
    expect(code).not.toMatch(/translateX\(-50%\)|scaleX/);
  });
});

describe("the funnel still reports", () => {
  it("counts a movement as reached when it is scrolled into view", () => {
    expect(code).toMatch(/trackGraceBeatRevealed\(index\)/);
    expect(code).toMatch(/dispatch\(\{ type: "REVEAL_GRACE_BEAT", count: index \+ 1 \}\)/);
  });

  it("reports each movement once, however often it re-enters the viewport", () => {
    // Scrolling up and back down re-fires an IntersectionObserver. The reducer
    // guard is monotonic so the dispatch is harmless, but the analytics call is
    // not idempotent.
    expect(code).toMatch(/reportedRef\.current\.has\(index\)/);
    expect(code).toMatch(/reportedRef\.current\.add\(index\)/);
  });

  it("covers every beat the copy carries", () => {
    // BEAT_SECTIONS gates which sections report. If it drifts below the number
    // of beats, the last movements go dark in the funnel and nothing else fails.
    const beatSections = Number(code.match(/const BEAT_SECTIONS = (\d+)/)?.[1]);
    const en = JSON.parse(readFileSync(join(ROOT, "src", "messages", "en.json"), "utf8"));
    expect(beatSections).toBe(en.grace.beats.length);
  });
});
