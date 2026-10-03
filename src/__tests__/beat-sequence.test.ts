import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BEAT_LOCK_MS,
  SWIPE_MIN_PX,
  TAP_SLOP_PX,
  WHEEL_GAP_MS,
  WHEEL_MIN_PX,
  feedWheel,
  isTap,
  keyDirection,
  swipeDirection,
  wheelPixels,
  type WheelBurst,
} from "@/lib/beat-gestures";

/**
 * The verdict and grace are one instrument: whatever a reader reaches for means
 * "next", and "next" is exactly one beat.
 *
 * The rules are pure functions and are tested as behaviour. How the two screens
 * are wired to them is JSX and window listeners, and vitest runs in
 * `environment: "node"`, so that half is pinned in source, in the idiom of
 * stage-css.test.ts.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const read = (...p: string[]) => strip(readFileSync(join(ROOT, ...p), "utf8"));

const hook = read("src", "lib", "use-beat-gestures.ts");
const beatStrip = read("src", "components", "shared", "beat-strip.tsx");
const verdict = read("src", "components", "verdict-screen.tsx");
const grace = read("src", "components", "grace-screen.tsx");

const key = (k: string, extra: Partial<Parameters<typeof keyDirection>[0]> = {}) =>
  keyDirection({ key: k, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false, repeat: false, ...extra });

const FREE = { atStart: true, atEnd: true };

describe("the keys a reader already knows from a document", () => {
  it("go on with Space, Enter, ↓, → and PageDown", () => {
    for (const k of [" ", "Enter", "ArrowDown", "ArrowRight", "PageDown"]) expect(key(k), k).toBe("next");
  });

  it("go back with Shift+Space, ↑, ← and PageUp", () => {
    expect(key(" ", { shiftKey: true })).toBe("prev");
    for (const k of ["ArrowUp", "ArrowLeft", "PageUp"]) expect(key(k), k).toBe("prev");
  });

  it("ignore a held key — auto-repeat is not a series of decisions", () => {
    expect(key(" ", { repeat: true })).toBeNull();
  });

  it("leave modified keys to the browser and the system", () => {
    expect(key("ArrowLeft", { altKey: true })).toBeNull();
    expect(key(" ", { ctrlKey: true })).toBeNull();
    expect(key("ArrowRight", { metaKey: true })).toBeNull();
  });

  it("ignore everything else", () => {
    for (const k of ["a", "Tab", "Escape", "Home"]) expect(key(k), k).toBeNull();
  });
});

describe("a tap is a press that did not travel", () => {
  it("allows a native tap's slop and no more", () => {
    expect(isTap(0, 0)).toBe(true);
    expect(isTap(TAP_SLOP_PX, 0)).toBe(true);
    expect(isTap(TAP_SLOP_PX, 1)).toBe(false);
  });
});

describe("a swipe moves one beat, from the edge of the one on screen", () => {
  it("goes on when the finger moves up the glass, back when it moves down", () => {
    expect(swipeDirection(0, SWIPE_MIN_PX, FREE)).toBe("next");
    expect(swipeDirection(0, -SWIPE_MIN_PX, FREE)).toBe("prev");
  });

  it("ignores a short drag", () => {
    expect(swipeDirection(0, SWIPE_MIN_PX - 1, FREE)).toBeNull();
  });

  it("ignores a mostly sideways drag — that is the system's back gesture", () => {
    expect(swipeDirection(200, 100, FREE)).toBeNull();
  });

  it("scrolls a beat taller than the screen before it leaves it", () => {
    // Words still below the fold: the swipe is the browser's, not ours.
    expect(swipeDirection(0, 200, { atStart: true, atEnd: false })).toBeNull();
    expect(swipeDirection(0, -200, { atStart: false, atEnd: true })).toBeNull();
  });
});

describe("a wheel or trackpad gesture moves one beat however long it runs", () => {
  /** Feeds a stream of events `gap` ms apart and returns every move it fired. */
  function stream(deltas: number[], gap: number, edges = FREE, start = 1000) {
    let burst: WheelBurst | null = null;
    const fired: string[] = [];
    deltas.forEach((d, i) => {
      const r = feedWheel(burst, start + i * gap, d, edges);
      burst = r.burst;
      if (r.fire) fired.push(r.fire);
    });
    return fired;
  }

  it("turns a trackpad fling into exactly one move", () => {
    // Forty events of decaying inertia, 16ms apart.
    const fling = Array.from({ length: 40 }, (_, i) => Math.max(1, 60 - i * 1.5));
    expect(stream(fling, 16)).toEqual(["next"]);
  });

  it("does nothing until the gesture has travelled far enough to mean it", () => {
    expect(stream([WHEEL_MIN_PX / 4, WHEEL_MIN_PX / 4], 16)).toEqual([]);
  });

  it("starts a new gesture after a pause", () => {
    expect(stream([100, 100], WHEEL_GAP_MS + 1)).toEqual(["next", "next"]);
  });

  it("goes back on an upward scroll", () => {
    expect(stream([-100], 16)).toEqual(["prev"]);
  });

  it("leaves a whole gesture to the browser when there is more of the beat to show", () => {
    // Decided at the burst's start: by the end of a fling the page has reached
    // its edge, and every gesture would look like one that meant to leave.
    expect(stream([100, 100, 100], 16, { atStart: true, atEnd: false })).toEqual([]);
  });

  it("measures lines and pages in pixels", () => {
    expect(wheelPixels(3, 1, 800)).toBe(48);
    expect(wheelPixels(1, 2, 800)).toBe(800);
    expect(wheelPixels(120, 0, 800)).toBe(120);
  });
});

describe("the hook that wires the rules to the page", () => {
  it("ignores a second move inside the lock, so a double tap cannot skip a beat", () => {
    expect(BEAT_LOCK_MS).toBeGreaterThanOrEqual(250);
    // Shorter than either screen's entrance, so a reader at their own pace never meets it.
    expect(BEAT_LOCK_MS).toBeLessThan(550);
    const move = hook.slice(hook.indexOf("const move = useCallback("));
    expect(move).toMatch(/if \(now < lockedUntil\.current\) return;\s*lockedUntil\.current = now \+ BEAT_LOCK_MS;/);
  });

  it("listens for every way a reader says go on", () => {
    for (const event of ["keydown", "touchstart", "touchmove", "touchend", "touchcancel", "wheel"]) {
      expect(hook, event).toMatch(new RegExp(`addEventListener\\("${event}"`));
      expect(hook, `${event} is never removed`).toMatch(new RegExp(`removeEventListener\\("${event}"`));
    }
    // Passive: nothing here may hold up a scroll the browser owns.
    for (const event of ["touchstart", "touchmove", "touchend", "wheel"]) {
      expect(hook).toMatch(new RegExp(`addEventListener\\("${event}", \\w+, \\{ passive: true \\}\\)`));
    }
  });

  it("does not let a swipe back reload the page", () => {
    // Swipe down at the top is Chrome's pull-to-refresh, and here it is back.
    expect(hook).toMatch(/root\.style\.overscrollBehaviorY = "none"/);
    expect(hook).toMatch(/root\.style\.overscrollBehaviorY = previousOverscroll/);
  });

  it("leaves other controls their own keys, and never moves twice for one press", () => {
    expect(hook).toMatch(/if \(!onSurface && target\?\.closest\(OWN_CONTROLS\)\) return;/);
    // The surface is a <button>: Space and Enter click it, and the click moves.
    expect(hook).toMatch(/if \(onSurface && \(event\.key === " " \|\| event\.key === "Enter"\)\) return;/);
  });

  it("keeps Space for the page where a beat cannot be left", () => {
    // On grace's record, Space still scrolls a record taller than the screen.
    const keydown = hook.slice(hook.indexOf("function onKeyDown"), hook.indexOf("let touch"));
    expect(keydown.indexOf("return;", keydown.indexOf("!next : !prev"))).toBeLessThan(
      keydown.indexOf("event.preventDefault()"),
    );
  });

  it("decides 'more to show' from the beat's words, not from whether the page scrolls", () => {
    // A beat that scrolled by 7px of its own padding had every word on screen,
    // and a tap that paged through "the rest" of it was a dud.
    expect(hook).toMatch(/document\.querySelector\(`\[\$\{BEAT_WORDS_ATTR\}\]`\)/);
    expect(verdict).toMatch(/data-beat-words/);
    expect(grace).toMatch(/\[BEAT_WORDS_ATTR\]: true/);
  });

  it("does not count the end of a drag as a tap", () => {
    expect(hook).toMatch(/if \(start && !isTap\(event\.clientX - start\.x, event\.clientY - start\.y\)\) return;/);
  });
});

describe("one instrument on both screens", () => {
  it("wires the verdict and grace to the same gestures", () => {
    for (const [name, screen] of [["verdict", verdict], ["grace", grace]] as const) {
      expect(screen, name).toMatch(/useBeatGestures\(\{/);
      expect(screen, name).toMatch(/\{\.\.\.surfaceProps\}/);
      expect(screen, name).toMatch(/<BeatStrip/);
    }
  });

  it("makes Space work on every verdict beat, not only the last", () => {
    // The verdict's hint said "or press space" and four of five beats ignored
    // it: focus sat on a beat that was not a control, and nothing listened.
    expect(verdict).not.toMatch(/onClick=\{isLastBeat \? handleBridgeClick : advance\}/);
    expect(verdict).toMatch(/if \(isLastBeat\) handleBridgeClick\(\);\s*else advance\(\);/);
  });

  it("lets the verdict go back a beat, but never out of the verdict", () => {
    expect(verdict).toMatch(/canPrev: beatIndex > 0/);
    expect(grace).toMatch(/canPrev: beat > 0/);
  });

  it("gives both the same hint, in the same words, worded for the device", () => {
    expect(beatStrip).toMatch(/pointer-fine:hidden">\{hint\.touch\}/);
    expect(beatStrip).toMatch(/hidden pointer-fine:inline">\{hint\.pointer\}/);
    expect(verdict).toMatch(/advanceHintTouch/);
    expect(grace).toMatch(/advanceHint: \{ touch: string; pointer: string \}/);
    expect(grace, "grace invented a third phrasing").not.toMatch(/tapContinue\}/);
  });

  it("gives every dot a slot a finger can hit, and makes only reached dots buttons", () => {
    expect(beatStrip).toMatch(/flex size-6 items-center justify-center/);
    expect(beatStrip).toMatch(/const reachable = navigation \? i <= navigation\.furthest : false;/);
    expect(beatStrip).toMatch(/if \(!navigation \|\| !reachable\) \{/);
    expect(beatStrip).toMatch(/aria-current=\{isCurrent \? "step" : undefined\}/);
  });

  it("keeps decorative dots away from assistive technology, and real ones in reach", () => {
    expect(beatStrip).toMatch(/aria-hidden=\{navigation \? undefined : "true"\}/);
    expect(beatStrip).toMatch(/aria-label=\{navigation\.labels\[i\]\}/);
  });

  it("lets a tap between dots fall through to the surface", () => {
    // The row takes no input; only a dot button does.
    expect(beatStrip).toMatch(/className="pointer-events-none absolute inset-x-0 bottom-\[calc\(1\.15625rem/);
    expect(beatStrip).toMatch(/className="pointer-events-auto flex size-6/);
  });
});
