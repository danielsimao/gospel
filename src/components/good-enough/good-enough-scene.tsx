"use client";

import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BarTrack } from "./bar-track";
import { Reveal } from "./reveal";
import { barAfter, ceilingLineIndex, GOAL_PCT } from "@/lib/good-enough";
import { readJourney } from "@/lib/journey-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
import {
  trackGoodEnoughViewed,
  trackGoodEnoughTapped,
  trackGoodEnoughRevealed,
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
  const viewedRef = useRef(false);
  const revealedRef = useRef(false);

  const state = barAfter(taps);

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
          fillPct={state.fillPct}
          atCeiling={state.atCeiling}
          goalLabel={copy.goalLabel}
          crowdLabel={copy.crowdLabel}
          shudderKey={state.deadTaps}
        />
      </div>

      {/* mt-9, not mt-5: the crowd's label is absolutely positioned just below
          the track so the bars can share the reader's baseline, and at the
          tighter margin the two lines of mono collided. */}
      <p className="mt-9 font-mono text-[11px] uppercase tracking-[2px] text-white/50">
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
      <div className="mt-7">
        <Button
          variant="red"
          mist={!state.revealed}
          onClick={() => {
            setTaps((n) => n + 1);
            trackGoodEnoughTapped(taps + 1, locale);
          }}
          className={state.revealed ? "opacity-45 transition-opacity" : "transition-opacity"}
        >
          {copy.buttonLabel}
        </Button>
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
