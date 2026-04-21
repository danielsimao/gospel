"use client";

import { useEffect, useRef, memo } from "react";

const DEATHS_PER_SECOND = 1.8;
const DEATHS_PER_MS = DEATHS_PER_SECOND / 1000;

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

export const DeathCounter = memo(function DeathCounter({
  className,
  style,
  fromMidnight = false,
}: DeathCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const baseRef = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    baseRef.current = fromMidnight ? getMsSinceMidnightUTC() : 0;
    startTime.current = Date.now();

    let raf: number;
    function tick() {
      const elapsedMs = Date.now() - startTime.current;
      const totalMs = baseRef.current + elapsedMs;
      const count = Math.floor(totalMs * DEATHS_PER_MS);
      if (ref.current) {
        ref.current.textContent = count.toLocaleString();
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
      style={{ ...style, display: "inline-block", minWidth: "7ch" , textAlign: "center" }}
    >
      0
    </span>
  );
});
