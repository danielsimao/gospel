"use client";

import { useEffect, useRef, memo } from "react";

const DEATHS_PER_SECOND = 1.8;
const DEATHS_PER_MS = DEATHS_PER_SECOND / 1000;
/** Duration of the count-up animation in ms (page-load counters only). */
const COUNT_UP_MS = 1500;

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
 * Inline script that paints the live deaths-today number during HTML parse,
 * BEFORE first paint. Without it the span SSRs "0" and the post-hydration
 * count-up makes every digit-growth repaint a new (larger) LCP candidate —
 * pinning LCP to hydration + animation end instead of first paint.
 * Kept dependency-free and duplicated from the module constants above
 * because it executes before any bundle loads.
 */
const PREPAINT_SCRIPT = `(function(){var s=document.currentScript,e=s&&s.previousElementSibling;if(!e)return;var n=new Date(),m=new Date(n);m.setUTCHours(0,0,0,0);e.textContent=Math.floor((n-m)*${DEATHS_PER_MS}).toLocaleString();})()`;

/**
 * The span's server-rendered content, hoisted to a module constant.
 *
 * The identity of this object is the whole point. React's hydration path only
 * COMPARES what it finds in the DOM — verified in react-dom 19.2.4,
 * `prepareToHydrateHostInstance` — so the pre-painted number survives hydration
 * untouched. What overwrote it was the UPDATE path: `updateProperties` calls
 * `setProp` for any prop whose identity changed, and `setProp`'s
 * dangerouslySetInnerHTML branch ends in an unconditional
 * `domElement.innerHTML = …`. Written inline as `{{ __html: "0" }}` this was a
 * fresh object on every render, so the first parent re-render after mount — the
 * homepage re-renders when the journey snapshot arrives — reset the counter to
 * "0", and the next rAF tick restored it. On a throttled phone that landed 2.6
 * seconds in, long after the reader had read the number.
 *
 * A stable object never compares unequal, so `setProp` is never called and the
 * pre-paint survives for good.
 */
const SEED_HTML = { __html: "0" } as const;

export const DeathCounter = memo(function DeathCounter({
  className,
  style,
  fromMidnight = false,
  baseMs = 0,
}: DeathCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const targetBase = fromMidnight ? getMsSinceMidnightUTC() : baseMs;
    const animStart = Date.now();

    let raf: number;
    function tick() {
      const elapsed = Date.now() - animStart;
      const realCount = Math.floor((targetBase + elapsed) * DEATHS_PER_MS);

      let displayed = realCount;
      if (!fromMidnight && elapsed < COUNT_UP_MS && realCount > 0) {
        // Page-load counters keep the count-up drama; fromMidnight counters
        // must NOT re-animate from 0 — the pre-paint script already painted
        // the live value, and growing repaints would push LCP out again.
        displayed = Math.floor(easeOutCubic(elapsed / COUNT_UP_MS) * realCount);
      }

      const text = displayed.toLocaleString();
      // Write only on change — this loop runs at frame rate but the value
      // changes ~2×/second.
      if (ref.current && ref.current.textContent !== text) {
        ref.current.textContent = text;
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
      style={{ ...style, display: "inline-block", minWidth: "7ch", textAlign: "center" }}
      dangerouslySetInnerHTML={SEED_HTML}
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
