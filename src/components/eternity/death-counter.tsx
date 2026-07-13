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

export const DeathCounter = memo(function DeathCounter({
  className,
  style,
  fromMidnight = false,
}: DeathCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const targetBase = fromMidnight ? getMsSinceMidnightUTC() : 0;
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
  }, [fromMidnight]);

  const span = (
    <span
      ref={ref}
      suppressHydrationWarning
      className={className}
      style={{ ...style, display: "inline-block", minWidth: "7ch", textAlign: "center" }}
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
