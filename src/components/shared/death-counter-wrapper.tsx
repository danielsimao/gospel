"use client";

import { usePathname } from "next/navigation";
import { StickyDeathCounter } from "./sticky-death-counter";

interface DeathCounterWrapperProps {
  label: string;
  liveBadge: string;
}

/** Pages that show the sticky death counter. */
const SHOW_PATTERNS = [
  /^\/[a-z]{2}$/, // home: /en, /pt
  /^\/[a-z]{2}\/test$/, // test: /en/test, /pt/test
];

export function DeathCounterWrapper({ label, liveBadge }: DeathCounterWrapperProps) {
  const pathname = usePathname();
  const show = SHOW_PATTERNS.some((p) => p.test(pathname));

  if (!show) return null;
  return <StickyDeathCounter label={label} liveBadge={liveBadge} />;
}
