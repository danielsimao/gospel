"use client";

import { DeathCounter } from "@/components/eternity/death-counter";

interface StickyDeathCounterProps {
  /** Label text shown after the counter (e.g., "died today"). */
  label: string;
  /** Short uppercase text for the live indicator badge (e.g., "live"). */
  liveBadge: string;
}

/**
 * Fixed-top emergency-broadcast strip with pulsing live indicator and
 * deaths-today counter. Shared between the eternity ticker and the test game.
 */
export function StickyDeathCounter({ label, liveBadge }: StickyDeathCounterProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-red-950/40 bg-[#060404]/[0.94] backdrop-blur-xl">
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
        {/* Live indicator */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
          </span>
          <span className="hidden text-[9px] font-mono font-semibold uppercase tracking-[2px] text-red-400/75 sm:inline">
            {liveBadge}
          </span>
        </div>

        {/* Divider */}
        <span className="hidden h-3 w-px shrink-0 bg-white/[0.06] sm:inline-block" />

        {/* Counter + label — truncate to prevent overflow */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <DeathCounter className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-red-400 tracking-wider sm:text-sm" />
          <span className="truncate text-[9px] tracking-wide text-white/60 sm:text-[10px] sm:tracking-widest">
            {label}
          </span>
        </div>
      </div>

      {/* Thin red accent line at bottom */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
    </div>
  );
}
