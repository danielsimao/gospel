"use client";

import { m, AnimatePresence } from "framer-motion";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { SelfRating, type SelfRatingMessages } from "@/components/home/self-rating";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackGameStarted, trackSelfRating, trackSelfRatingChanged } from "@/lib/analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";
import type { SelfRating as SelfRatingValue } from "@/lib/types";

interface LandingProps {
  messages: {
    title: string;
    cta: string;
    label: string;
    subtitle: string;
    selfRating: SelfRatingMessages;
    reply: Record<SelfRatingValue, { heading: string; body: string }>;
    changeAnswer: string;
  };
  locale: Locale;
}

/**
 * The threshold, in two beats: the question, then the reply to it.
 *
 * This screen used to state "Are you a good person?" and offer a Begin button
 * that collected nothing — a dead step, which is why the first version of this
 * work skipped it entirely and sent a homepage tap straight into commandment
 * one. That was the wrong correction. A tap that both records a claim and
 * changes the page gives one input two outcomes, leaves a mis-tap permanent,
 * and skips the moment where taking a position actually registers — which is
 * the whole reason for asking.
 *
 * So the screen stays and stops being dead. It answers back. In a live
 * encounter "do you consider yourself a good person?" is never followed by
 * silence and a commandment; it is followed by the claim being put against the
 * standard. That beat belongs here.
 *
 * Both entry points converge on the same rhythm — question, reply, begin.
 * A reader arriving from the homepage has already answered, so the shell seeds
 * the rating and this renders the reply directly; a reader arriving from the
 * nav answers here and the reply replaces the question in place.
 */
export function Landing({ messages, locale }: LandingProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const rating = state.selfRating;

  function handleSelect(value: SelfRatingValue) {
    dispatch({ type: "SET_SELF_RATING", rating: value });
    trackSelfRating(value, "test_landing");
  }

  /*
   * Recoverable right up until the Law begins. Three chips sit side by side and
   * nothing confirmed the tap before this screen existed, so a mis-tap was
   * recorded as testimony and quoted back at the verdict as though it were
   * meant. The reducer already refuses this once the phase is "playing", so the
   * window closes exactly where it should.
   */
  function handleChange() {
    if (rating) trackSelfRatingChanged(rating);
    dispatch({ type: "SET_SELF_RATING", rating: null });
  }

  function handleBegin() {
    trackGameStarted(locale);
    dispatch({ type: "START_GAME" });
  }

  return (
    <m.div
      /*
       * No entrance fade of its own. The shell already crossfades every phase
       * change, so fading this root as well compounded the two — the screen
       * arrived through a second, slower fade on top of the first, and the
       * staggered children below started from an already-fading parent.
       * One fade, from the shell; the stagger does the rest.
       */
      initial={false}
      // Still leaves upward as the first question arrives from the right, so
      // the two read as one movement rather than two screens swapping.
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    >
      {/* Docket label */}
      <m.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="flex items-center gap-2"
      >
        <span className="h-px w-6 bg-red-500/40" />
        <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
          {messages.label}
        </span>
        <span className="h-px w-6 bg-red-500/40" />
      </m.div>

      <AnimatePresence mode="wait" initial={false}>
        {rating === null ? (
          <m.div
            key="question"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
            className="flex flex-col items-center"
          >
            <h1 className="mt-5 max-w-md text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {messages.title}
            </h1>
            <p className="mt-4 max-w-sm text-xs italic text-white/60 sm:text-sm">
              {messages.subtitle}
            </p>
            <SelfRating
              messages={messages.selfRating}
              onSelect={handleSelect}
              ariaLabel={messages.title}
              className="mt-10"
            />
          </m.div>
        ) : (
          <m.div
            key="reply"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE_OUT_STRONG }}
            className="flex flex-col items-center"
          >
            {/* The claim, echoed. Not a heading for the page so much as the
                reader's own sentence handed back to them. */}
            <h1 className="mt-5 max-w-md text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {messages.reply[rating].heading}
            </h1>

            {/* Where that particular answer is weakest. Three answers, three
                different presses — see the reply Record in types. */}
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/65 sm:text-base">
              {messages.reply[rating].body}
            </p>

            {/* One label for all three answers. Different CTAs per answer would
                make three answers into three products. */}
            <div className="mt-10">
              <Button variant="red" mist onClick={handleBegin}>
                {messages.cta}
                <ButtonArrow />
              </Button>
            </div>

            <button
              type="button"
              onClick={handleChange}
              className="mt-5 text-[11px] text-white/55 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
            >
              {messages.changeAnswer}
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
