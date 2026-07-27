"use client";

import { m, AnimatePresence } from "framer-motion";
import { GOAL_PCT } from "@/lib/good-enough";

/**
 * The track, the fill, and the line.
 *
 * An earlier version also drew fourteen other people's bars at the ceiling, to
 * make the failure global rather than personal. It was cut, for two reasons
 * that both matter more than the argument it was making. It landed on the exact
 * beat the reader's own bar stops — the most important moment on the page —
 * and a spread of bars is a *distribution*, which implies a tail: the eye hunts
 * for the tallest one and infers that somebody, somewhere, might reach the
 * line. That is the single inference this page cannot allow, and the reveal
 * copy states the same claim in a way a chart cannot: nobody.
 *
 * The globalising work is now done by the roll instead. Each play draws a
 * different ceiling, so a reader who presses "try again" generates the spread
 * themselves, one life at a time, and every one of them stops.
 */
export function BarTrack({
  fillPct,
  ceilingPct,
  atCeiling,
  goalLabel,
}: {
  fillPct: number;
  ceilingPct: number;
  atCeiling: boolean;
  goalLabel: string;
}) {
  return (
    <div className="flex w-full items-end justify-center">
      <div className="relative h-48 w-14 shrink-0">
        <div className="absolute inset-0 rounded-md border border-white/12 bg-white/[0.03]" />

        {/* The line. Present from the first frame — the standard was never a
            secret, only the reader's distance from it. */}
        <div
          className="absolute -left-2.5 -right-2.5 border-t border-dashed border-[#d4a843]/70"
          style={{ bottom: `${GOAL_PCT}%` }}
        >
          <span className="absolute right-0 -top-4 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[#d4a843]/90">
            {goalLabel}
          </span>
        </div>

        {/* inset-0, not inset-x-0 bottom-0. A percentage height resolves against
            the containing block, and a bottom-anchored wrapper with no height of
            its own is zero tall — the fill computed to 0px while the readout
            correctly said otherwise. */}
        <m.div
          animate={atCeiling ? { x: [0, -2, 2, 0] } : { x: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Height as a plain inline style with a CSS transition rather than a
              framer `animate`. Height is not a transform, so the global
              reducedMotion="user" would suppress a framer height animation
              outright — leaving reduced-motion readers a bar that never moves,
              on a page whose entire argument is the bar moving. */}
          <div
            className="absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-red-500/85 to-red-500/45 transition-[height] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ height: `${fillPct}%` }}
          />
        </m.div>

        {/* The hard stop. Answers "why can't I keep going" with a picture rather
            than a rule: nothing was taken away, the bar has nowhere left to go. */}
        <AnimatePresence>
          {atCeiling && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.26 }}
              className="absolute -left-1.5 -right-1.5 h-[3px] rounded-sm bg-white/30"
              style={{ bottom: `${ceilingPct}%` }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
