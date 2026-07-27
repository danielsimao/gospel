"use client";

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BarTrack } from "./bar-track";
import { Reveal } from "./reveal";
import {
  barAfter,
  ceilingLineIndex,
  rollCeiling,
  CEILING_MAX_PCT,
  GOAL_PCT,
} from "@/lib/good-enough";
import { readJourney } from "@/lib/journey-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
import {
  trackGoodEnoughViewed,
  trackGoodEnoughTapped,
  trackGoodEnoughRevealed,
  trackGoodEnoughReplayed,
  trackGoodEnoughCtaClicked,
} from "@/lib/eternity-analytics";
import type { GoodEnoughMessages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export function GoodEnoughScene({
  copy,
  locale,
}: {
  copy: GoodEnoughMessages;
  locale: Locale;
}) {
  const [taps, setTaps] = useState(0);
  /*
   * This life's ceiling. Rolled on the first tap rather than during render, so
   * the server and the first client render cannot disagree — at zero taps the
   * bar is empty and the readout is the full gap, identical whatever the roll.
   * `null` until then, and reset to `null` by "try again" so the next play
   * draws again.
   */
  const [ceiling, setCeiling] = useState<number | null>(null);
  const [plays, setPlays] = useState(0);
  const viewedRef = useRef(false);
  const revealedRef = useRef(false);

  const state = barAfter(taps, ceiling ?? CEILING_MAX_PCT);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    trackGoodEnoughViewed(locale);
  }, [locale]);

  useEffect(() => {
    if (!state.revealed || revealedRef.current) return;
    revealedRef.current = true;
    trackGoodEnoughRevealed(state.taps, locale);
  }, [state.revealed, state.taps, locale]);

  const line = state.atCeiling
    ? copy.ceilingLines[ceilingLineIndex(state.deadTaps, copy.ceilingLines.length)]
    : null;

  return (
    <div className="flex w-full flex-col items-center">
      <p className="max-w-sm text-center text-[15px] leading-relaxed text-white/72">
        {copy.prompt}
      </p>

      <div className="mt-9 w-full max-w-sm">
        <BarTrack
          key={plays}
          fillPct={state.fillPct}
          ceilingPct={state.ceilingPct}
          atCeiling={state.atCeiling}
          goalLabel={copy.goalLabel}
        />
      </div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[2px] text-white/50">
        <span className="tabular-nums text-red-400/85">
          {Math.round(state.shortPct)}%
        </span>{" "}
        {copy.shortLabel}
      </p>

      {/* The reader's own press changes text elsewhere on the page, so a screen
          reader has to hear the outcome of it. Six or seven changes across the
          whole visit — nothing like a ticking counter. */}
      <div aria-live="polite" className="w-full">
        <AnimatePresence mode="wait">
          {line && (
            <m.p
              key={line}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
              className="mx-auto mt-4 max-w-sm text-center text-[13px] leading-relaxed text-white/70"
            >
              {line}
            </m.p>
          )}
        </AnimatePresence>
      </div>

      {/* Never removed, never disabled. The reader stops, not the page — which
          is the whole argument: they prove for themselves that more effort
          changes nothing, rather than being told so by a machine that quit on
          them. It only loses emphasis once the turn has landed, so the gold CTA
          is the one bright thing left. */}
      <div className="mt-7 flex flex-col items-center">
        <Button
          variant="red"
          mist={!state.revealed}
          onClick={() => {
            // Roll this life's ceiling on the first press of the play. Doing it
            // here rather than during render keeps the server and the first
            // client render identical, since an untouched bar looks the same at
            // every ceiling.
            if (ceiling === null) setCeiling(rollCeiling());
            const next = taps + 1;
            setTaps(next);
            trackGoodEnoughTapped(next, locale);
          }}
          className={state.revealed ? "opacity-45 transition-opacity" : "transition-opacity"}
        >
          {copy.buttonLabel}
        </Button>

        {/* Only offered once the turn has landed — before that it would read as
            "this one doesn't count", which is the opposite of the point. After
            it, replaying IS the argument: a different number, the same answer.
            It also matters on a page built to be handed to somebody else, who
            would otherwise be given a bar that is already spent. */}
        {state.revealed && (
          <button
            type="button"
            onClick={() => {
              setTaps(0);
              setCeiling(null);
              setPlays((n) => n + 1);
              revealedRef.current = false;
              trackGoodEnoughReplayed(plays + 1, locale);
            }}
            className="mt-3 inline-flex min-h-[32px] items-center text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/80"
          >
            {copy.tryAgainLabel}
          </button>
        )}
      </div>

      {state.revealed && (
        <Reveal
          copy={copy.reveal}
          locale={locale}
          onCtaClick={() => {
            // Read at click time, never during render: this is localStorage, and
            // branching the UI on it would risk a hydration flicker on the one
            // control that matters. The destination never changes — /test is
            // already the router for a returning reader — but knowing how many
            // arrivals had been through the flow is the number that says whether
            // this page recruits strangers or entertains regulars.
            const hadCompletedTest = readJourney().testCompletedAt !== null;
            trackGoodEnoughCtaClicked(locale, hadCompletedTest, state.taps);
          }}
        />
      )}

      <p className="sr-only">
        The bar can be filled to {Math.round(state.fillPct)} percent of the
        required {GOAL_PCT} percent.
      </p>
    </div>
  );
}
