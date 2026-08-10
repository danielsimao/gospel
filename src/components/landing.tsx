"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { SelfRating, type SelfRatingMessages } from "@/components/home/self-rating";
import { Button, ButtonArrow } from "@/components/ui/button";
import {
  requestVerdictToken,
  trackGameStarted,
  trackSelfRating,
  trackSelfRatingChanged,
} from "@/lib/analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";
import type { SelfRating as SelfRatingValue } from "@/lib/types";

/**
 * Set once, never cleared — not even by a retake. The homepage reads the
 * anonymous counter back as readers, not trials ("N chumbaram"), and the
 * consented twin is deduped by distinct_id in the same query; without this
 * marker a retake (fresh landing mount, same device) fired the beacon again
 * and counted one reader twice. Deliberately outside the test session
 * storage, whose whole record is erased by clearSession() on every retake
 * link.
 */
const TRIAL_COUNTED_KEY = "gospel-trial-counted";

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
  const router = useRouter();
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
    /*
     * Back to the unseeded route, because the URL currently asserts an answer
     * the reader is retracting — and a reload of /test/yes would silently put
     * them back on the reply they just left.
     *
     * `replace`, not `push`: Back should still return to the homepage, not to
     * the answer they rejected. The navigation remounts the provider, which
     * resets the reducer to a fresh landing state — that reset IS what this tap
     * means, so no dispatch is needed alongside it. Safe only because nothing
     * has been answered yet; once the Law starts the route never changes again.
     */
    router.replace(`/${locale}/test`);
  }

  function handleBegin() {
    trackGameStarted(locale);

    /*
     * The anonymous twin, for the homepage's score band. The consented event
     * above misses every reader who declined the banner, so the band's
     * denominator would be wrong by exactly the decline rate. sendBeacon
     * because the answer is never read and must never delay the transition
     * into the Law; guarded by TRIAL_COUNTED_KEY (see its comment) and by the
     * route itself outside production. The locale rides in the URL because
     * the route otherwise only has Accept-Language, which records the
     * browser's tongue, not the Law the reader is about to stand under. A
     * reader without sendBeacon or localStorage is a missed count, not an
     * error — the number is a floor by design.
     */
    try {
      if (localStorage.getItem(TRIAL_COUNTED_KEY) === null) {
        navigator.sendBeacon?.(`/api/trial-count?locale=${locale}`);
        localStorage.setItem(TRIAL_COUNTED_KEY, "1");
      }
    } catch {
      // Counting is never worth breaking the transition for.
    }

    /*
     * The score band's ledger needs proof that a trial was actually stood
     * before it will write a row at the other end, and this is the moment
     * that proof is minted (src/lib/verdict-token.ts). Unguarded by
     * TRIAL_COUNTED_KEY above, deliberately: that key makes the COUNT
     * once-per-reader-ever, but a retake is a real second verdict and
     * deserves its own token. Fire-and-forget, like everything else here.
     */
    requestVerdictToken();

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
      /*
       * The same column the questions use, at the same offset.
       *
       * This screen used to be the only one in the flow that centred itself,
       * horizontally and vertically. The six questions range left inside a
       * narrow centred column at `pt-[24vh] sm:pt-[36vh]` (question-card), and
       * arriving from a centred landing moved the heading on the handoff — the
       * reader's own question and the first commandment are the same beat, and
       * they sat in different places.
       *
       * Matching the offsets shares the structure: the eyebrow, the heading
       * below it at `mt-5`, and the column width are the same on both sides of
       * the handoff. Measured, the heading still lands 37px lower once the
       * test begins — the progress bar is in the flow above it and only exists
       * after the first question. That gap is the bar's own height, so closing
       * it would mean a constant here that breaks the moment the bar changes;
       * under the crossfade the two screens already share, it does not read as
       * movement.
       *
       * The bottom inset is the consent banner's, in the idiom of
       * question-card — top-anchored content only reaches it on a short
       * landscape viewport, and there it can be scrolled clear rather than
       * sitting under the banner.
       */
      className="mx-auto flex w-full max-w-[23rem] flex-1 flex-col px-6 pt-[24vh] pb-[calc(2rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] sm:max-w-[27rem] sm:pt-[36vh] [@media(max-height:500px)]:pt-[12vh]"
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
        {/* The closing rule went with the centring. A pair of rules brackets a
            label and reads as a centred device; ranged left, the second one
            hangs off the end of a two-letter word. */}
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
       * every line below it — the heading jumped 49px back when this column
       * was vertically centred, so half of any height change was taken out of
       * the space above. The column is top-anchored now and the heading no
       * longer moves, but the box still animates its own height: the two
       * states are absolutely stacked, so without it the outgoing state is
       * clipped the instant the incoming one is measured.
       * Framer's `layout` and `mode="popLayout"` both fix
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
       * height — 0.036 CLS on this route, and while the column was still
       * vertically centred everything above it moved 120px as well.
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
            className={`flex flex-col ${
              boxHeight === null ? "" : "absolute inset-x-0 top-0"
            }`}
          >
            {/* One step up from a commandment's 28px, and otherwise set the
                same way — this is the question the six are asked to answer,
                not a bigger species of thing. */}
            <h1 className="mt-5 text-[30px] font-bold leading-[1.16] tracking-[-0.028em] sm:text-[34px]">
              {messages.title}
            </h1>

            <SelfRating
              messages={messages.selfRating}
              onSelect={handleSelect}
              ariaLabel={messages.title}
              layout="stack"
              className="mt-8"
            />

            {/*
             * "God's Law. Six questions. One verdict." — what the reader is
             * agreeing to, not part of the question.
             *
             * It used to sit between the question and the three answers, which
             * put the terms of the test in the one gap the reader crosses to
             * answer it. Below the answers it is read on the way in and
             * available on the way back, and the question meets its answers
             * directly.
             *
             * The italic went with the move: in this app italic is scripture
             * and aside, and a hairline in judgment red says the same thing
             * about where this sentence comes from without borrowing a voice.
             */}
            <p className="mt-8 border-l border-red-500/30 pl-3 text-[12px] leading-relaxed text-white/50">
              {messages.subtitle}
            </p>
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
            className={`flex flex-col ${
              boxHeight === null ? "" : "absolute inset-x-0 top-0"
            }`}
          >
            {/* The claim, echoed. Not a heading for the page so much as the
                reader's own sentence handed back to them. */}
            <h1 className="mt-5 text-[30px] font-bold leading-[1.16] tracking-[-0.028em] sm:text-[34px]">
              {messages.reply[rating].heading}
            </h1>

            {/* Where that particular answer is weakest. Three answers, three
                different presses — see the reply Record in types. */}
            <p className="mt-5 text-[15px] leading-relaxed text-white/65 sm:text-base">
              {messages.reply[rating].body}
            </p>

            {/* One label for all three answers. Different CTAs per answer would
                make three answers into three products.
                `self-start` so the button is its own width in a column that no
                longer centres its children. */}
            <div className="mt-10 self-start">
              <Button variant="red" mist onClick={handleBegin}>
                {messages.cta}
                <ButtonArrow />
              </Button>
            </div>

            <button
              type="button"
              onClick={handleChange}
              className="mt-5 self-start text-[11px] text-white/55 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
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
