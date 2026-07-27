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
          className="absolute inset-x-0 bottom-0"
        >
          <m.div
            className="w-full rounded-b-md bg-gradient-to-t from-red-500/85 to-red-500/45"
            animate={{ height: `${fillPct}%` }}
            transition={{ duration: 0.17, ease: EASE_OUT_STRONG }}
            style={{ height: 0 }}
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
            className="flex h-48 min-w-0 flex-1 flex-col justify-end"
          >
            <div className="flex h-full items-end gap-[3px]" aria-hidden="true">
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
            <p className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/40">
              {crowdLabel}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
