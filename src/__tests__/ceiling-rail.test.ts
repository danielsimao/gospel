import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The step bar's two layouts, and the one that is easy to break by accident.
 *
 * The phone and the desktop had different problems and only one was real.
 * Measured at 1512: 384px of bar, 59px steps, 512px of clearance to the exit
 * chip — nothing cramped, nothing colliding. Measured at 390: 230px of bar,
 * 35px steps, and the last step passing nine pixels UNDER the exit.
 *
 * So the phone puts the rail on the ceiling, full bleed, where there is no
 * chip to clear and no centre to hold (63px steps, about what the desktop
 * already had), and the counter takes the corner the rail leaves empty. From
 * sm up the centred ledger is untouched, because widening it buys nothing and
 * a full-bleed rail across 1512 reads as browser chrome.
 *
 * Source assertions in the idiom of flow-column.test.ts and
 * bottom-inset.test.ts: these are Tailwind classes inside JSX, and vitest runs
 * in `environment: "node"`, so there is no layout here to observe as behaviour.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const ledger = strip(read("src", "components", "examination-ledger.tsx"));
const questionCard = strip(read("src", "components", "question-card.tsx"));

describe("the rail on the ceiling, on the phone only", () => {
  it("pins the bar to the top edge, full bleed, and returns it to the flow at sm", () => {
    const bar = ledger.slice(ledger.indexOf('role="progressbar"'));
    expect(bar, "the rail left the top edge").toMatch(/fixed inset-x-0 top-\[env\(safe-area-inset-top\)\]/);
    // Back to the centred, in-flow bar from sm — the desktop had no problem to
    // solve, and a 1512-wide rail is six 250px blocks that measure nothing.
    expect(bar, "the desktop lost its centred bar").toMatch(/sm:static/);
    expect(bar, "the desktop bar lost its width cap").toMatch(/sm:max-w-sm/);
  });

  it("clears the status bar rather than sitting under it", () => {
    // top-0 puts the rail beneath the status bar on a home-screen install.
    const bar = ledger.slice(ledger.indexOf('role="progressbar"'));
    expect(bar, "the rail is back at a bare top-0").not.toMatch(/\btop-0\b/);
    expect(bar).toMatch(/top-\[env\(safe-area-inset-top\)\]/);
  });

  it("puts the counter in the corner the rail vacates, on the exit's line", () => {
    // left-3 and h-8 are the exit chip's own inset and height, so the two
    // corners answer each other instead of merely both being present.
    expect(ledger, "the counter is no longer anchored opposite the exit").toMatch(
      /fixed left-3 top-\[calc\(0\.875rem\+env\(safe-area-inset-top\)\)\] z-40 flex h-8 items-center/,
    );
    expect(ledger, "the counter does not return to the flow at sm").toMatch(/sm:static/);
  });

  it("gives the counter the same safe-area term as the rail beside it", () => {
    // The rail sits at the top edge and clears the notch; the counter sits
    // 14px below the SAME edge. With a bare top-3.5 the rail cleared a status
    // bar that the counter it belongs with slid under -- the defect this
    // component's own comment describes fixing, left half-fixed.
    const rail = ledger.slice(ledger.indexOf('role="progressbar"'));
    expect(rail, "the rail lost its safe-area term").toMatch(
      /top-\[env\(safe-area-inset-top\)\]/,
    );
    const counter = ledger.slice(0, ledger.indexOf('role="progressbar"'));
    expect(counter, "the counter has no safe-area term").toMatch(
      /env\(safe-area-inset-top\)/,
    );
  });

  it("holds the active step still for a reader who asked for stillness", () => {
    /*
     * `MotionConfig reducedMotion="user"` neuters transform and layout
     * animations, not opacity keyframes, so this glow kept pulsing under the
     * preference -- forever, on a rail now pinned to the top of every phone
     * screen in the flow. The hook has to be asked directly.
     */
    expect(ledger, "the ledger no longer reads the motion preference").toMatch(
      /useReducedMotion/,
    );
    expect(ledger, "the pulsing glow ignores the preference again").toMatch(
      /animate=\{reduceMotion \? \{ opacity: 1 \} : \{ opacity: \[0\.5, 1, 0\.5\] \}\}/,
    );
    expect(ledger, "the repeat survives under reduced motion").toMatch(
      /reduceMotion\s*\?\s*\{ duration: 0 \}/,
    );
  });

  it("squares the rail's ends on the phone and keeps them round at sm", () => {
    // A pill-ended segment reads as a floating chip; welded to the edge it
    // should read as a rule. Every segment state has to agree.
    // Lookbehind, not lookahead: the breakpoint prefixes the utility, so an
    // unguarded `rounded-full` is one with no `sm:` immediately BEFORE it.
    expect(ledger, "a segment is still pill-ended on the phone").not.toMatch(
      /(?<!sm:)rounded-full/,
    );
    // Counted on the guarded utility, not on the pair being adjacent: one
    // segment carries a background between `rounded-none` and its `sm:` twin.
    const squared = ledger.match(/\brounded-none\b/g) ?? [];
    const restored = ledger.match(/\bsm:rounded-full\b/g) ?? [];
    expect(squared.length, "a segment state lost its squared phone end").toBe(5);
    expect(restored.length, "a segment state lost its round desktop end").toBe(5);
  });
});

describe("nothing may transform the ledger's wrapper", () => {
  it("enters on opacity alone, because a transform would unmoor the fixed rail", () => {
    /*
     * This is the invisible one. A transformed ancestor becomes the containing
     * block for a `fixed` descendant, so the y:-4 this wrapper used to animate
     * would hang the ceiling rail and the counter off the wrapper instead of
     * the viewport for the length of the entry — the rail would start 4px low
     * and slide, on the one element whose whole job is to be welded to the
     * edge. Opacity creates a stacking context but no containing block.
     *
     * Verified in-browser at the time of the change: 64 frames sampled across
     * the entry, the rail anchored at left 0 / top 0 / width 390 in every one,
     * with no transformed ancestor at any point.
     */
    const wrapper = questionCard.slice(
      questionCard.indexOf("<m.div"),
      questionCard.indexOf("<ExaminationLedger"),
    );
    expect(wrapper.length, "the ledger's animated wrapper moved or vanished").toBeGreaterThan(0);
    expect(wrapper, "the wrapper animates a transform again").not.toMatch(/\by:\s*-?\d/);
    expect(wrapper, "the wrapper animates a transform again").not.toMatch(/\b(x|scale|rotate):/);
    expect(wrapper).toMatch(/initial=\{\{ opacity: 0 \}\}/);
    expect(wrapper).toMatch(/animate=\{\{ opacity: 1 \}\}/);
  });
});
