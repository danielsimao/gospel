"use client";

import { useEffect, useRef, memo } from "react";

const DEATHS_PER_SECOND = 1.8;
const DEATHS_PER_MS = DEATHS_PER_SECOND / 1000;
/** Duration of the count-up animation in ms (page-load counters only). */
const COUNT_UP_MS = 1500;

/**
 * How long one digit takes to roll out of its window and the next to arrive.
 *
 * At 1.8 deaths/second the number changes roughly every 555ms, so the roll has
 * to finish inside that gap — a longer one would still be mid-flight when the
 * next tick starts and the digit would never come to rest.
 */
const ROLL_MS = 380;
/** CSS twin of EASE_OUT_STRONG. Inlined: this runs outside React's style pipeline. */
const ROLL_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/** One turn of a wheel during the arrival spin. */
const INTRO_STEP_MS = 55;
/** Steps the leftmost column takes before settling. */
const INTRO_BASE_STEPS = 5;
/** Extra steps per column to the right, so the last digit rests last. */
const INTRO_STEPS_PER_COLUMN = 2;

/**
 * Marks the spin as spent for this tab.
 *
 * sessionStorage, not localStorage: the entrance should play once per visit,
 * not once per person. It survives a reload and same-tab navigation and dies
 * with the tab, which is what "again in the same window" means. A second tab
 * gets its own store and will replay it — correct, since that is a new visit
 * to a reader's eye.
 */
const INTRO_SESSION_KEY = "gospel-counter-intro";

function introAlreadyPlayed(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
  } catch {
    // Private mode or storage disabled. Treated as already played, so the
    // entrance is skipped rather than replayed on every single navigation.
    return true;
  }
}

function markIntroPlayed(): void {
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    // Nothing to do — the read above fails the same way and skips the spin.
  }
}

/*
 * One window per character, one glyph inside it.
 *
 * The window is what makes this read as an odometer rather than a text swap:
 * it is exactly one line tall with overflow clipped, so a glyph leaving through
 * the top and its replacement arriving from the bottom are both half-visible
 * for a moment, and the eye reads travel instead of a cut. `position:relative`
 * is for the outgoing clone, which is taken out of flow so it cannot widen the
 * cell while it leaves.
 *
 * Declared as strings because the pre-paint script below has to emit the same
 * markup before any stylesheet or bundle exists.
 */
const CELL_CSS =
  "position:relative;display:block;height:1em;line-height:1;overflow:hidden";
const GLYPH_CSS = "display:block";

interface DeathCounterProps {
  className?: string;
  style?: React.CSSProperties;
  /** If true, count from midnight UTC (deaths today). Otherwise from page load. */
  fromMidnight?: boolean;
  /**
   * Milliseconds already elapsed before mount. The counter counts up to this
   * value, then keeps climbing live. Used by the verdict screen to seed the
   * count with the test's own duration. Ignored when `fromMidnight` is set.
   */
  baseMs?: number;
  /**
   * Play the arrival spin — once per tab, on the first counter the reader
   * meets. Deliberately separate from `fromMidnight`: what the counter counts
   * and whether it makes an entrance are different questions, and only the
   * homepage hero wants the second one.
   */
  intro?: boolean;
}

function getMsSinceMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(0, 0, 0, 0);
  return now.getTime() - midnight.getTime();
}

/** Ease-out cubic: fast start, gentle landing. */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Rebuilds every cell from scratch.
 *
 * Only for a change in shape — the first mount, or the 99,999 → 100,000
 * crossing that adds a column. Character-level changes go through updateCells,
 * which leaves the surrounding cells alone.
 */
function buildCells(host: HTMLElement, text: string): void {
  host.textContent = "";
  for (const char of text) {
    const cell = document.createElement("span");
    cell.style.cssText = CELL_CSS;
    const glyph = document.createElement("span");
    glyph.style.cssText = GLYPH_CSS;
    glyph.textContent = char;
    cell.appendChild(glyph);
    host.appendChild(cell);
  }
}

/**
 * Rolls only the characters that actually changed.
 *
 * At 1.8/second the value moves by one or two, so between ticks only the last
 * digit or two differ — which is the whole reason this is worth doing per
 * character. The previous implementation replaced the entire string on every
 * tick, repainting six digits to show one of them change.
 *
 * The outgoing glyph is a clone rather than a second permanent child: the cell
 * holds exactly one in-flow glyph at rest, so its width is the character's own
 * advance and nothing has to be measured or hard-coded. Only transforms
 * animate, so both halves stay on the compositor.
 */
function rollCell(cell: HTMLElement, char: string, ms: number): void {
  const glyph = cell.firstElementChild as HTMLElement | undefined;
  if (!glyph || glyph.textContent === char) return;

  if (ms <= 0 || typeof glyph.animate !== "function") {
    glyph.textContent = char;
    return;
  }

  const leaving = glyph.cloneNode(true) as HTMLElement;
  leaving.style.position = "absolute";
  leaving.style.insetInlineStart = "0";
  leaving.style.top = "0";
  leaving.style.width = "100%";
  cell.appendChild(leaving);

  const exit = leaving.animate(
    [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
    { duration: ms, easing: ROLL_EASING, fill: "forwards" },
  );
  // Removed on finish AND on cancel: an unmount mid-roll cancels the
  // animation, and a clone left behind would sit frozen over the live glyph.
  exit.onfinish = () => leaving.remove();
  exit.oncancel = () => leaving.remove();

  glyph.textContent = char;
  glyph.animate(
    [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
    { duration: ms, easing: ROLL_EASING },
  );
}

function updateCells(host: HTMLElement, text: string, animate: boolean): void {
  if (host.childElementCount !== text.length) {
    buildCells(host, text);
    return;
  }

  for (let i = 0; i < text.length; i++) {
    const cell = host.children[i] as HTMLElement | undefined;
    if (cell) rollCell(cell, text[i], animate ? ROLL_MS : 0);
  }
}

/**
 * The arrival spin: every column runs up through the digits and settles into
 * the number that is already on screen, left to right.
 *
 * Not a ramp from zero. A counter climbing 0 → 155,203 grows its text
 * rectangle at every step, and each larger paint is a fresh LCP candidate —
 * which would date LCP to the end of the animation and undo the entire reason
 * PREPAINT_SCRIPT exists. Spinning keeps every column occupied, so the text
 * rectangle is the same size on the first frame as on the last and no new
 * candidate is ever produced. The drama is in the motion, not in the value.
 *
 * Later columns take more steps than earlier ones, so the number settles the
 * way a mechanical odometer does: the slow wheels stop first and the last
 * digit is still turning after the rest have come to rest.
 *
 * Returns how long the whole thing takes, so the caller knows when the live
 * value may take back over.
 */
function playIntro(host: HTMLElement, text: string, timeouts: number[]): number {
  let longest = 0;

  for (let i = 0; i < text.length; i++) {
    const cell = host.children[i] as HTMLElement | undefined;
    const target = Number(text[i]);
    // Separators have nothing to spin through, and spinning them would read as
    // a glitch rather than as a wheel.
    if (!cell || !Number.isInteger(target) || text[i] === " ") continue;

    const steps = INTRO_BASE_STEPS + i * INTRO_STEPS_PER_COLUMN;
    longest = Math.max(longest, steps * INTRO_STEP_MS);

    for (let step = 1; step <= steps; step++) {
      // Counted backwards from the target so the sequence always arrives from
      // below: the final step is target-1 → target, like a wheel coming to
      // rest, rather than an arbitrary digit snapping into place.
      const digit = (((target - (steps - step)) % 10) + 10) % 10;
      timeouts.push(
        window.setTimeout(
          () => rollCell(cell, String(digit), INTRO_STEP_MS),
          step * INTRO_STEP_MS,
        ),
      );
    }
  }

  return longest;
}

/**
 * Inline script that paints the live deaths-today number during HTML parse,
 * BEFORE first paint. Without it the span SSRs "0" and the post-hydration
 * count-up makes every digit-growth repaint a new (larger) LCP candidate —
 * pinning LCP to hydration + animation end instead of first paint.
 * Kept dependency-free and duplicated from the module constants above
 * because it executes before any bundle loads.
 *
 * It emits the same cell markup buildCells does, so the structure the roll
 * needs is already in the parse-time HTML. A library that renders its digits
 * into a shadow root cannot be reached from here, which is why this counter
 * rolls its own: the pre-paint value is worth more than the dependency.
 */
const PREPAINT_SCRIPT = `(function(){var s=document.currentScript,e=s&&s.previousElementSibling;if(!e)return;var n=new Date(),m=new Date(n);m.setUTCHours(0,0,0,0);var t=Math.floor((n-m)*${DEATHS_PER_MS}).toLocaleString(),h='';for(var i=0;i<t.length;i++){h+='<span style="${CELL_CSS}"><span style="${GLYPH_CSS}">'+t[i]+'</span></span>';}e.innerHTML=h;})()`;

export const DeathCounter = memo(function DeathCounter({
  className,
  style,
  fromMidnight = false,
  baseMs = 0,
  intro = false,
}: DeathCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const targetBase = fromMidnight ? getMsSinceMidnightUTC() : baseMs;
    const animStart = Date.now();
    const reduced =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    let raf: number;
    // Tracks the last string written rather than reading it back off the DOM:
    // mid-roll a cell holds two glyphs, so the DOM is not a clean record of it.
    let lastText = "";

    /*
     * The arrival spin, once per tab.
     *
     * It builds its own cells rather than spinning the ones the pre-paint
     * script wrote, and it does so from inside the first frame rather than
     * here. Both are forced by the same thing: hydration re-applies the
     * server's `dangerouslySetInnerHTML` and the span is briefly back to "0",
     * and measured, that reset lands a few milliseconds AFTER this effect runs
     * — cells built here were wiped the instant they appeared, leaving a bare
     * "0" on screen for the whole length of the spin. A frame's wait puts the
     * build on the far side of it.
     *
     * The reset itself predates this component's roll and is harmless to LCP:
     * "0" is smaller than what the pre-paint script already painted, so it
     * cannot become a new candidate.
     *
     * There is deliberately no deadline on how late the spin may start. A first
     * version skipped it when hydration was more than 600ms behind navigation,
     * on the theory that a reader who has already read the number would take a
     * late spin for a fault. That theory was untested and the threshold was
     * guesswork: throttled to a phone on 3G the effect ran at 1.5s or later and
     * the entrance simply never existed. A feature that silently disappears on
     * every real connection is worse than one that occasionally arrives late.
     */
    const introTimeouts: number[] = [];
    let introUntil = 0;
    let introPending = intro && !reduced?.matches && !introAlreadyPlayed();
    // Claimed up front, not when the spin starts: two counters mounting in the
    // same frame must not both decide they are the one that gets to play it.
    if (introPending) markIntroPlayed();

    function tick() {
      if (!host) return;

      if (introPending) {
        introPending = false;
        const text = Math.floor(targetBase * DEATHS_PER_MS).toLocaleString();
        buildCells(host, text);
        lastText = text;
        introUntil = Date.now() + playIntro(host, text, introTimeouts);
        raf = requestAnimationFrame(tick);
        return;
      }

      // The live value is held back until the wheels have stopped. Writing to a
      // cell mid-spin would cut one of its steps short and the column would
      // land on the wrong digit.
      if (Date.now() < introUntil) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - animStart;
      const realCount = Math.floor((targetBase + elapsed) * DEATHS_PER_MS);

      let displayed = realCount;
      // Page-load counters keep the count-up drama; fromMidnight counters
      // must NOT re-animate from 0 — the pre-paint script already painted
      // the live value, and growing repaints would push LCP out again.
      const countingUp = !fromMidnight && elapsed < COUNT_UP_MS && realCount > 0;
      if (countingUp) {
        displayed = Math.floor(easeOutCubic(elapsed / COUNT_UP_MS) * realCount);
      }

      const text = displayed.toLocaleString();
      // Write only on change — this loop runs at frame rate but the value
      // changes ~2×/second.
      if (text !== lastText) {
        /*
         * No roll during the count-up. There the value changes every frame, so
         * the ramp is already the motion; rolling on top of it would stack a
         * fresh 380ms animation on the same glyph 60 times a second and read
         * as a smear rather than a count.
         */
        updateCells(host, text, !countingUp && !reduced?.matches);
        lastText = text;
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // An unmount mid-spin would otherwise keep firing into a detached host.
      for (const id of introTimeouts) clearTimeout(id);
    };
  }, [fromMidnight, baseMs, intro]);

  const span = (
    <span
      ref={ref}
      suppressHydrationWarning
      className={className}
      /*
       * inline-flex, not inline-block. As inline-block the host still carries a
       * strut at the inherited line-height, and a line box has to hold both the
       * strut and the cells — measured, that made the hero counter 148px tall
       * against main's 128px and pushed the page down by 20px. Flex has no
       * strut: the line is exactly one cell tall. justify-content replaces the
       * text-align that centred the digits inside the reserved 7ch.
       */
      style={{
        ...style,
        display: "inline-flex",
        justifyContent: "center",
        minWidth: "7ch",
      }}
      // dangerouslySetInnerHTML keeps React from reconciling this text node at
      // hydration. With a plain "0" child, hydration patched the pre-painted
      // value back through React's virtual DOM, repainting the element ~3s in
      // — which registered as a fresh (and final) LCP candidate and pinned
      // LCP to hydration time. React treats innerHTML as opaque, so the
      // parse-time pre-paint survives untouched until the first rAF tick.
      dangerouslySetInnerHTML={{ __html: "0" }}
    />
  );

  if (!fromMidnight) return span;

  return (
    <>
      {span}
      <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
    </>
  );
});
