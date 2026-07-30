"use client";

import { useEffect, useRef, useState, memo } from "react";

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
function updateCells(host: HTMLElement, text: string, animate: boolean): void {
  if (host.childElementCount !== text.length) {
    buildCells(host, text);
    return;
  }

  for (let i = 0; i < text.length; i++) {
    const cell = host.children[i] as HTMLElement | undefined;
    const glyph = cell?.firstElementChild as HTMLElement | undefined;
    if (!cell || !glyph || glyph.textContent === text[i]) continue;

    if (!animate || typeof glyph.animate !== "function") {
      glyph.textContent = text[i];
      continue;
    }

    const leaving = glyph.cloneNode(true) as HTMLElement;
    leaving.style.position = "absolute";
    leaving.style.insetInlineStart = "0";
    leaving.style.top = "0";
    leaving.style.width = "100%";
    cell.appendChild(leaving);

    const exit = leaving.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
      { duration: ROLL_MS, easing: ROLL_EASING, fill: "forwards" },
    );
    // Removed on finish AND on cancel: an unmount mid-roll cancels the
    // animation, and a clone left behind would sit frozen over the live glyph.
    exit.onfinish = () => leaving.remove();
    exit.oncancel = () => leaving.remove();

    glyph.textContent = text[i];
    glyph.animate(
      [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
      { duration: ROLL_MS, easing: ROLL_EASING },
    );
  }
}

/**
 * Inline script that paints the live deaths-today number during HTML parse,
 * BEFORE first paint. Without it the span carries whatever the build produced
 * and the correction arrives at hydration, which on a phone is seconds later.
 * Kept dependency-free and duplicated from the module constants above because
 * it executes before any bundle loads.
 *
 * It writes `textContent`, not `innerHTML`. That is the whole difference
 * between this working and not, and it is worth spelling out.
 *
 * The span used to be handed `dangerouslySetInnerHTML={{ __html: "0" }}` on the
 * theory that React treats innerHTML as opaque and would leave the pre-painted
 * value alone. That was true of React 18. React 19 changed it: with
 * `dangerouslySetInnerHTML` and `suppressHydrationWarning` together, hydration
 * no longer bails out of the subtree — it proceeds and re-applies the server's
 * HTML (facebook/react#32975). Measured on this branch, the counter showed the
 * right number, dropped to a bare "0" at hydration, and came back one frame
 * later; throttled to a phone that "0" landed 2.6 seconds in, long after the
 * reader had read the number.
 *
 * Text children plus `suppressHydrationWarning` is the pattern Next documents
 * for exactly this (its guide on preventing flash before hydration), and its
 * rule is the one that matters here: for a text mismatch under
 * `suppressHydrationWarning`, React keeps the DOM and discards its own output.
 * The DOM wins. So the script writes text and React never overwrites it.
 *
 * The digit cells are built by the effect rather than emitted here. First paint
 * only needs the right number; the cell structure is only needed to animate,
 * and it is measured to occupy the same box as the plain text it replaces.
 */
const PREPAINT_SCRIPT = `(function(){var s=document.currentScript,e=s&&s.previousElementSibling;if(!e)return;var n=new Date(),m=new Date(n);m.setUTCHours(0,0,0,0);e.textContent=Math.floor((n-m)*${DEATHS_PER_MS}).toLocaleString();})()`;

/**
 * The value React renders as the span's children.
 *
 * Only the deaths-today counter seeds itself live. Server-side that is the
 * build's own clock, stale by design — the script above corrects it before the
 * first paint, and on a soft navigation this runs in the browser and is simply
 * right either way.
 *
 * The page-load counters seed "0" on purpose, because 0 is where they start:
 * they exist to count up to their value over COUNT_UP_MS, and seeding the
 * answer would show the total, snap back, and climb to it again — which is the
 * fault this whole change is fixing, just moved to the verdict screen.
 *
 * Held in state with a lazy initialiser so it is computed once. Recomputing per
 * render would change the children React holds, and React would then patch the
 * text on any re-render, wiping the digit cells the effect built.
 */
function initialText(fromMidnight: boolean): string {
  if (!fromMidnight) return "0";
  return Math.floor(getMsSinceMidnightUTC() * DEATHS_PER_MS).toLocaleString();
}

export const DeathCounter = memo(function DeathCounter({
  className,
  style,
  fromMidnight = false,
  baseMs = 0,
}: DeathCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [seed] = useState(() => initialText(fromMidnight));

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

    function tick() {
      if (!host) return;

      /*
       * If anything outside this loop has replaced the contents — a React
       * re-render patching the text, an extension, a devtools edit — the cells
       * are gone and `lastText` no longer describes what is on screen. Forcing
       * a rebuild costs one frame and stops the display sitting on a stale
       * value until the next tick happens to differ.
       */
      if (lastText && host.childElementCount !== lastText.length) lastText = "";

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
    return () => cancelAnimationFrame(raf);
  }, [fromMidnight, baseMs]);

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
    >
      {/*
        Text children, and `suppressHydrationWarning` above. Under that flag a
        text mismatch resolves in the DOM's favour, so the value the pre-paint
        script wrote survives hydration. `dangerouslySetInnerHTML` used to sit
        here for the same purpose and no longer works — see PREPAINT_SCRIPT.

        The children never change after the first render (state, lazily
        initialised), so React has nothing to patch on a re-render either, and
        the digit cells the effect builds are left alone.
      */}
      {seed}
    </span>
  );

  if (!fromMidnight) return span;

  return (
    <>
      {span}
      <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
    </>
  );
});
