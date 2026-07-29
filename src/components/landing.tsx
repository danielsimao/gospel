"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

  /*
   * One ref per state rather than one shared between them. During a swap both
   * children are mounted — the outgoing one is still playing its exit — and a
   * single ref would be set and cleared by whichever unmounted last, leaving
   * the box measuring the wrong element or nothing at all.
   */
  const questionRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState<number | null>(null);

  /*
   * Before paint, not after: measured in useEffect, the first frame of every
   * swap still carries the previous height and the transition starts from a
   * visible jump.
   */
  useLayoutEffect(() => {
    const el = rating === null ? questionRef.current : replyRef.current;
    if (!el) return;

    const measure = () => setBoxHeight(el.getBoundingClientRect().height);
    measure();

    // Content reflows after the swap too — a line re-wrapping at a new width,
    // a font landing — and the box has to follow rather than hold a stale
    // height that clips the reply or leaves a gap under it.
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [rating]);

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

      {/*
       * The question and its reply are different heights — 241px against 339px,
       * measured. Two things had to be solved together.
       *
       * `mode="wait"` ran the exit to completion before the entrance began,
       * which measured three frames of an empty screen. It is gone: the two
       * states now overlap, stacked absolutely so neither pushes the other.
       *
       * And the box itself snapped those 98px in a single frame, which threw
       * every line below it — the heading jumped 49px because this column is
       * vertically centred. Framer's `layout` and `mode="popLayout"` both fix
       * that, and both need layout projection from `domMax`; this app loads
       * `domAnimation` on purpose and the upgrade costs ~10kb for one screen.
       * So the height is measured and handed to a CSS transition instead —
       * the same thing Radix does for accordion content.
       *
       * The two headings occupy the same spot, so a plain crossfade shows one
       * word ghosted through another. Blur bridges that in general, and it was
       * tried here — but animating `filter` on display text re-rasterises every
       * glyph on every frame, which shimmers, and framer leaves the element on
       * `blur(0px)` afterwards so it stays on its own raster layer. The
       * heading visibly flickered.
       *
       * Timing does the same job for free: the outgoing state leaves quickly
       * and the incoming one waits out most of that exit, so the overlap is
       * short enough that neither heading is readable through the other. Only
       * opacity and transform animate, and both are composited.
       */}
      {/*
       * Absolute children have no height of their own, so before the first
       * measurement this box collapsed to zero and then jumped to its real
       * height — 0.036 CLS on this route, in a column that is vertically
       * centred, so everything above it moved 120px as well.
       *
       * A min-height per breakpoint would have been magic numbers that rot the
       * moment the copy changes. Instead the first render leaves the active
       * state in normal flow, so the box is the right height in the server's
       * own HTML; it only goes absolute once a measurement exists to hold that
       * height. Nothing moves, and there is no constant to keep in sync.
       */}
      <div
        style={boxHeight === null ? undefined : { height: boxHeight }}
        className="relative w-full transition-[height] duration-300 ease-[var(--ease-out-strong)] motion-reduce:transition-none"
      >
      <AnimatePresence initial={false}>
        {rating === null ? (
          <m.div
            key="question"
            ref={questionRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -8,
              transition: { duration: 0.2, ease: EASE_OUT_STRONG },
            }}
            transition={{
              duration: 0.24,
              ease: EASE_OUT_STRONG,
              // The entrance waits out most of the exit. Enough overlap that
              // the screen is never empty, little enough that the two headings
              // are legible through each other.
              opacity: { duration: 0.22, delay: 0.06, ease: EASE_OUT_STRONG },
            }}
            className={`flex flex-col items-center ${
              boxHeight === null ? "" : "absolute inset-x-0 top-0"
            }`}
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
            ref={replyRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -8,
              transition: { duration: 0.2, ease: EASE_OUT_STRONG },
            }}
            transition={{
              duration: 0.24,
              ease: EASE_OUT_STRONG,
              // The entrance waits out most of the exit. Enough overlap that
              // the screen is never empty, little enough that the two headings
              // are legible through each other.
              opacity: { duration: 0.22, delay: 0.06, ease: EASE_OUT_STRONG },
            }}
            className={`flex flex-col items-center ${
              boxHeight === null ? "" : "absolute inset-x-0 top-0"
            }`}
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
      </div>
    </m.div>
  );
}
