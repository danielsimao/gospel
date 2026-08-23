import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The verdict's swipe, ruled by the owner (2026-08-23): left advances exactly
 * as a tap does — the door included — right does nothing, and both directions
 * are recorded. Source assertions in the idiom of scroll-cue.test.ts: vitest
 * runs in `environment: "node"`, so there is no gesture here to perform as
 * behaviour.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

/** The comments quote the very tokens asserted, so a deleted implementation
    would pass on its own prose. */
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const verdict = strip(read("src", "components", "verdict-screen.tsx"));
const analytics = strip(read("src", "lib", "analytics.ts"));

describe("the verdict's swipe surface", () => {
  it("recognises the swipe at release, never under the finger", () => {
    /*
     * A surface that tracked the drag would let the next beat follow the
     * finger in — and from the claim beat the next beat is the door, which
     * peeks gold into the frame before its arrival. Gold arrives once. So the
     * press is measured only when it lifts: no move handler exists to follow.
     */
    expect(verdict).toMatch(/onPointerDown=\{handleSurfaceDown\}/);
    expect(verdict).toMatch(/onPointerUp=\{handleSurfaceUp\}/);
    expect(verdict).not.toMatch(/onPointerMove/);
  });

  it("leaves the horizontal move to the page, not the browser", () => {
    // Without touch-pan-y the browser may claim the sideways drag for its own
    // gestures and answer with pointercancel — the swipe dies mid-flight.
    // pan-y, not none: vertical stays the browser's, which costs nothing on a
    // screen with nothing to scroll, and keeps pinch-zoom alive.
    expect(verdict).toMatch(/touch-pan-y/);
  });

  it("keeps the tap on click, where keyboard and assistive tech live", () => {
    /*
     * A <button> is activated through click by keyboard, voice and screen
     * readers. Routing the tap through pointer geometry would strand exactly
     * the readers the element is a real button for — so the click handler is
     * still the one that advances, and pointerup owns only the swipe.
     */
    expect(verdict).toMatch(/onClick=\{handleSurfaceClick\}/);
    expect(verdict).toMatch(
      /function handleSurfaceClick\(\) \{[\s\S]*?if \(isLastBeat\) handleBridgeClick\(\);\s*else advance\(\);/,
    );
  });

  it("suppresses the click a mouse fires after a drag, and only that click", () => {
    /*
     * Browsers only swallow the click that ends a SCROLL drag; nothing here
     * scrolls, so a mouse swipe is followed by a click on the same button and
     * advanced twice. The flag set at a travelled release eats it — and is
     * cleared again on the NEXT pointerdown, because after a touch swipe no
     * click follows at all and a standing flag would swallow the next honest
     * tap.
     */
    expect(verdict).toMatch(/suppressClickRef\.current = true/);
    expect(verdict).toMatch(
      /function handleSurfaceDown[\s\S]*?suppressClickRef\.current = false/,
    );
    expect(verdict).toMatch(
      /function handleSurfaceClick\(\) \{\s*if \(suppressClickRef\.current\) \{\s*suppressClickRef\.current = false;\s*return;/,
    );
  });

  it("has a dead zone between a tap and a swipe", () => {
    /*
     * Under TAP_SLOP the press is a tap and the trailing click owns it. Past
     * TAP_SLOP but short of SWIPE_MIN_PX — or more down than across — it is
     * neither, and must advance nowhere: a hesitant half-swipe right falling
     * through to the click would advance a reader who was reaching for back.
     */
    expect(verdict).toMatch(/if \(travelled <= TAP_SLOP\) return/);
    expect(verdict).toMatch(
      /if \(Math\.abs\(dx\) < SWIPE_MIN_PX \|\| Math\.abs\(dx\) <= Math\.abs\(dy\)\) return/,
    );
  });

  it("advances on left only; right is recorded and refused", () => {
    /*
     * Back keeps its one contract — the walk-back replays the section — and
     * does not grow a quieter second meaning that collides with the OS edge
     * swipe for history. But a refused gesture is still a reader saying what
     * they expected, so both directions reach the event, with the beat and
     * where on the screen the press began.
     */
    const up = verdict.slice(
      verdict.indexOf("function handleSurfaceUp"),
      verdict.indexOf("function handleSurfaceClick"),
    );
    expect(up.length, "could not isolate handleSurfaceUp").toBeGreaterThan(0);
    expect(up).toMatch(/trackVerdictSwipe\(\s*dx < 0 \? "left" : "right"/);
    // Every advance in the handler sits behind the left-only gate.
    const beforeGate = up.slice(0, up.indexOf("if (dx < 0)"));
    expect(beforeGate, "an advance escaped the left-only gate").not.toMatch(
      /advance\(\)|handleBridgeClick\(\)/,
    );
    // And the door opens to a swipe exactly as it does to a tap.
    expect(up).toMatch(/if \(isLastBeat\) handleBridgeClick\(\);\s*else advance\(\);/);
  });

  it("guards the press the way grace's surface does, at both ends", () => {
    /*
     * Primary contact and primary button on down AND up — a right-click fires
     * the same pair and a mouse always reuses pointerId 1. The release is
     * matched to its press by id, capture keeps a press from lifting elsewhere
     * and staying on record, and a cancelled press is cleared rather than left
     * to be measured against some later release.
     */
    const guards =
      verdict.match(/!event\.isPrimary \|\| event\.button !== 0\) return/g) ?? [];
    expect(guards.length).toBeGreaterThanOrEqual(2);
    expect(verdict).toMatch(/start\.pointerId !== event\.pointerId\) return/);
    expect(verdict).toMatch(/setPointerCapture\(event\.pointerId\)/);
    expect(verdict).toMatch(/onPointerCancel=\{handleSurfaceCancel\}/);
    expect(verdict).toMatch(/pressRef\.current\?\.pointerId === event\.pointerId/);
  });

  it("emits the event both directions, with the start position", () => {
    // start_x_fraction is the Android proxy: edge-born swipes are answered by
    // gesture nav with history back before the page sees them, so how tightly
    // the delivered ones cluster toward the edges is the measurable stand-in.
    expect(analytics).toMatch(/safeCapture\("verdict_swiped"/);
    expect(analytics).toMatch(/start_x_fraction: startXFraction/);
    expect(analytics).toMatch(/direction: "left" \| "right"/);
  });
});
