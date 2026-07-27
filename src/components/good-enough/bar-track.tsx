"use client";

import { m, AnimatePresence } from "framer-motion";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { CEILING_PCT, GOAL_PCT, CROWD_PCT } from "@/lib/good-enough";

/**
 * The track, the fill, the line, and — once the bar has stopped — everyone
 * else's.
 *
 * Two things are drawn only when the bar reaches its ceiling, and both are
 * arguments rather than decoration:
 *
 *  - The lip. A hard stop rendered across the top of the fill, so "why can't I
 *    keep going" is answered by the picture instead of by a rule. Nothing is
 *    taken away; the bar simply has nowhere left to go.
 *  - The crowd. Other people's bars, some higher than the reader's and some
 *    lower, none of them remotely near the line. This is Romans 3:23's "all"
 *    in the bar's own language, and it is what turns the failure from "I was
 *    bad at this" into "it stops there for everyone" — which is the difference
 *    between a reader who tries again and a reader who listens.
 */
export function BarTrack({
  fillPct,
  atCeiling,
  goalLabel,
  crowdLabel,
  shudderKey,
}: {
  fillPct: number;
  atCeiling: boolean;
  goalLabel: string;
  crowdLabel: string;
  /** Changes on every dead tap, so the fill can twitch without re-mounting. */
  shudderKey: number;
}) {
  return (
    <div className="flex w-full items-end justify-center gap-5">
      {/* The reader's bar */}
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

        <m.div
          key={shudderKey}
          animate={
            atCeiling && shudderKey > 0
              ? { x: [0, -2, 2, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.22, ease: "easeOut" }}
          // inset-0, not inset-x-0 bottom-0. A percentage height resolves
          // against the containing block, and a bottom-anchored wrapper with no
          // height of its own is zero tall — so the fill computed to 0px while
          // the readout underneath correctly said 34%. The bar reported the
          // right number and drew nothing.
          className="absolute inset-0"
        >
          {/* Height as a plain inline style with a CSS transition rather than a
              framer `animate`. Height is not a transform, so the global
              reducedMotion="user" would suppress a framer height animation
              outright — leaving reduced-motion readers a bar that never moves,
              on a page whose entire argument is the bar moving. CSS covers
              both: the transition runs normally, motion-reduce drops it to an
              instant and still-correct height. */}
          <div
            className="absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-red-500/85 to-red-500/45 transition-[height] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ height: `${fillPct}%` }}
          />
        </m.div>

        <AnimatePresence>
          {atCeiling && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.26 }}
              className="absolute -left-1.5 -right-1.5 h-[3px] rounded-sm bg-white/30"
              style={{ bottom: `${CEILING_PCT}%` }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Everyone else */}
      <AnimatePresence>
        {atCeiling && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative h-48 min-w-0 flex-1"
          >
            {/* Absolute, so these share the reader's baseline exactly. When the
                label lived inside the same flex column it ate height and pushed
                the crowd ~20px above the reader's bar — and a comparison drawn
                off two different baselines is not a comparison, which is the
                one job this row has. */}
            <div className="absolute inset-0 flex items-end gap-[3px]" aria-hidden="true">
              {CROWD_PCT.map((pct, i) => (
                <m.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + i * 0.035,
                    ease: EASE_OUT_STRONG,
                  }}
                  className="min-w-0 flex-1 rounded-t-[2px] bg-white/18"
                />
              ))}
            </div>
            <p className="absolute -bottom-5 left-0 font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/40">
              {crowdLabel}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
