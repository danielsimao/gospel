"use client";

import { useEffect, useRef, memo } from "react";

const DEATHS_PER_SECOND = 1.8;
const DEATHS_PER_MS = DEATHS_PER_SECOND / 1000;
/** Duration of the count-up animation in ms. */
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

export const DeathCounter = memo(function DeathCounter({
  className,
  style,
  fromMidnight = false,
}: DeathCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const targetBase = fromMidnight ? getMsSinceMidnightUTC() : 0;
    const targetCount = Math.floor(targetBase * DEATHS_PER_MS);
    const animStart = Date.now();

    let raf: number;
    function tick() {
      const elapsed = Date.now() - animStart;
      const realMs = targetBase + elapsed;
      const realCount = Math.floor(realMs * DEATHS_PER_MS);

      if (elapsed < COUNT_UP_MS && targetCount > 0) {
        // During count-up: ease from 0 toward the live value
        const progress = easeOutCubic(elapsed / COUNT_UP_MS);
        const displayed = Math.floor(progress * realCount);
        if (ref.current) ref.current.textContent = displayed.toLocaleString();
      } else {
        // After count-up: tick at real rate
        if (ref.current) ref.current.textContent = realCount.toLocaleString();
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fromMidnight]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ ...style, display: "inline-block", minWidth: "7ch", textAlign: "center" }}
    >
      0
    </span>
  );
});
