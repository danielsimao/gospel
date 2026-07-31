"use client";

import { useEffect, useRef, useState, useCallback, createRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackGraceViewed } from "@/lib/analytics";
import {
  trackGraceRevealed,
  trackGraceBeatRevealed,
} from "@/lib/eternity-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";

interface GraceScreenProps {
  messages: {
    scripture: string;
    scriptureRef: string;
    continueLabel: string;
    label: string;
    beatsHeading: string;
    beats: Array<{ headline: string; subtitle: string }>;
    tapContinue: string;
    rereadVerdict: string;
  };
  /** Walks back one history entry, so the browser stack and the reducer agree. */
  onBack: () => void;
}

export function GraceScreen({ messages, onBack }: GraceScreenProps) {
  const dispatch = useGameDispatch();
  const state = useGameState();
  // Re-read: once the invitation has been reached, coming back here replays
  // nothing — every beat is already open.
  const returning = state.invitationReached;
  const startTime = useRef(0);

  /*
   * Whether this is the reader's first arrival. Back and forward are a single
   * gesture here, so this screen unmounts and remounts routinely — every
   * analytics event has to be once-per-session rather than once-per-mount, or
   * the metrics inflate with every glance backwards.
   *
   * graceReached cannot answer it, and the version that used it was reading a
   * flag that is always already set.
   *
   * SHOW_GRACE sets graceReached AND is dispatched by the verdict's own door
   * tap (game-reducer.ts:151-157), so by the time this component first renders
   * the flag is true. `useRef(!state.graceReached)` was therefore false on a
   * genuine first arrival, which means trackGraceRevealed, trackGraceBeatRevealed(0)
   * and trackGraceViewed have never fired for a real reader — the grace funnel
   * has been dark since the guard was written.
   *
   * graceBeatsRevealed is the honest signal: persisted, starts at 0, and only
   * moves when the reader opens a beat themselves. It is still 0 on a refresh
   * taken before that first tap, so this can over-count a reader who reloads
   * without engaging — which is a far smaller error than counting nobody.
   */
  const firstVisitRef = useRef(
    state.graceBeatsRevealed === 0 && !state.invitationReached,
  );

  /*
   * The answer, before the argument.
   *
   * The verdict's last frame now withholds everything except one gold question
   * on black — "Is there any hope?" — and the reader taps it to get here. What
   * they used to arrive at was a header, a heading, and then beat one: "You're
   * guilty. The fine is eternal." The verdict restated, after five beats spent
   * establishing exactly that. The actual answer was two taps further on.
   *
   * Meanwhile "Someone paid your fine" already sat in the eyebrow above the
   * whole argument, so the conclusion was on screen from the first frame while
   * the argument opened by re-proving guilt. This does not add the answer; it
   * stops burying it.
   *
   * Same place, same colour, same size as the question it replies to. No new
   * copy: both strings are committed vocabulary and go in verbatim.
   *
   * "But God…" sits above rather than below, and that placement is doing
   * doctrinal work rather than visual work. At 33px alone, "Someone paid your
   * fine" stops naming a topic and becomes a declaration to this reader —
   * before repentance is named at all, in beat five. Ephesians 2:4 above it
   * frames the line as the scriptural turn rather than a personal guarantee.
   *
   * Shown on a first arrival only — the same signal the analytics now use, for
   * the same reason. Once the reader has opened a beat of the argument, or has
   * ever reached the decision, this frame is skipped: the question has been
   * answered once and does not need answering again on the way back.
   */
  const [showAnswer, setShowAnswer] = useState(firstVisitRef.current);

  // Idempotent: the verdict's bridge is what dispatches SHOW_GRACE, and the
  // reducer refuses it from any phase but the verdict. Kept so the screen still
  // records its own arrival if it is ever mounted another way.
  useEffect(() => {
    dispatch({ type: "SHOW_GRACE" });
  }, [dispatch]);
  const maxScrollDepth = useRef(0);

  // Beat 1 is reserved in the layout from mount to avoid a content shift
  // when it fades in. Subsequent beats are revealed by user tap, which
  // intentionally shifts the page.
  //
  // Seeded from the persisted count so a refresh mid-argument does not throw
  // away beats the reader already opened. graceReached cannot serve here: it
  // is true from the moment grace is entered, so seeding from it would hand a
  // first-time reader all eight at once and destroy the reveal.
  const [revealedCount, setRevealedCount] = useState(
    returning ? messages.beats.length : Math.max(1, state.graceBeatsRevealed),
  );
  // The spotlight beat. Follows the newest reveal, but tapping any earlier
  // beat moves it back — re-reading the argument is supported, not punished.
  const [activeIndex, setActiveIndex] = useState(0);
  const allBeatsRevealed = revealedCount >= messages.beats.length;
  const [beatRefs] = useState(() => messages.beats.map(() => createRef<HTMLDivElement>()));

  // Track scroll depth + time
  useEffect(() => {
    startTime.current = Date.now();

    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = scrollHeight - clientHeight;
      const depth = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
      if (depth > maxScrollDepth.current) maxScrollDepth.current = depth;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    const start = startTime.current;
    const maxDepth = maxScrollDepth;
    const wasFirstVisit = firstVisitRef.current;
    return () => {
      window.removeEventListener("scroll", handleScroll);
      // Only the first visit is measured. This fires on unmount, and with real
      // routes a back press to re-read the verdict unmounts the screen — so
      // reporting every departure would bury the genuine dwell time under a
      // pile of two-second re-reads.
      if (wasFirstVisit) trackGraceViewed(Date.now() - start, maxDepth.current);
    };
  }, []);

  // Track grace phase entry. Beat 1 is already present in the layout
  // (see useState above) — its visual fade-in is delayed via motion
  // transition so the title animates first without causing a layout shift.
  //
  // Guarded on graceReached, not invitationReached: re-entering grace before
  // ever reaching the decision is now one back press away, and the old guard
  // counted every one of those as a fresh reveal.
  useEffect(() => {
    if (!firstVisitRef.current) return;
    trackGraceRevealed();
    trackGraceBeatRevealed(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
  }, []);

  const handleTapContinue = useCallback(() => {
    if (revealedCount >= messages.beats.length) return;
    const nextBeat = revealedCount;
    trackGraceBeatRevealed(nextBeat);
    setRevealedCount(nextBeat + 1);
    // Persisted so a refresh resumes the argument where the reader left it.
    dispatch({ type: "REVEAL_GRACE_BEAT", count: nextBeat + 1 });
    setActiveIndex(nextBeat);
    // Scroll to the newly revealed beat after a short delay for the animation
    setTimeout(() => {
      beatRefs[nextBeat]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [beatRefs, revealedCount, messages.beats.length, dispatch]);

  function handleContinue() {
    dispatch({ type: "SHOW_INVITATION" });
  }

  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];  // more slots than beats, harmless

  if (showAnswer) {
    return (
      /* flex-1 without min-h-dvh. The shell is already min-h-dvh and adds 12px
         of its own top padding, so a child claiming a full viewport on top of
         that made this frame 849px in an 837 viewport — 12px of scroll on a
         screen whose entire content is two centred lines. */
      <div className="relative flex flex-1 flex-col">
        {/* Gold blooming from centre, where the verdict's red drained out of
            the same spot one tap ago. Stronger than the argument's ambient
            wash below, because this frame is the moment the colour of the
            flow changes. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(212,168,67,0.15) 0%, transparent 62%)",
          }}
        />

        {/*
         * One control, covering the screen, exactly as the verdict's beats do —
         * the reader has just tapped four of them and this is the fifth gesture
         * in the same sequence. A real <button> so it is reachable by Tab and
         * activatable by space; nothing about it looks like one.
         *
         * Its accessible name is the answer, which is what activating it means:
         * carry on into why.
         */}
        <button
          type="button"
          onClick={() => setShowAnswer(false)}
          className="relative z-10 flex flex-1 cursor-pointer flex-col items-center justify-center px-7 outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-[6px] focus-visible:outline-[#D4A843]/70"
        >
          <m.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            className="flex flex-col items-center gap-4 text-center"
          >
            {/* Ephesians 2:4. The hinge of the whole flow, and here the frame
                around the claim under it rather than a heading competing with
                it. Verbatim — the vocabulary map holds this one unchanged. */}
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#D4A843]/60 sm:text-xs">
              {messages.beatsHeading}
            </span>
            <span
              className="text-[33px] font-semibold leading-[1.24] tracking-[-0.025em] text-[#D4A843] sm:text-[46px] lg:text-[56px]"
              style={{ textShadow: "0 0 70px rgba(212,168,67,0.32)" }}
            >
              {messages.label}
            </span>
          </m.span>
        </button>

        <p className="pointer-events-none absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-10 text-center font-mono text-[9px] uppercase tracking-[2.4px] text-white/30 sm:text-[11px]">
          {messages.tapContinue}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col min-h-dvh">
      {/* Warm radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-24">
        <div className="max-w-lg w-full">
          {/* Label */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <span className="h-px w-6 bg-[#D4A843]/40" />
            <span className="font-mono text-[9px] uppercase tracking-[3px] text-[#D4A843]/70">
              {messages.label}
            </span>
            <span className="h-px w-6 bg-[#D4A843]/40" />
          </m.div>

          {/*
           * No heading here any more.
           *
           * "But God…" was a 30px gold h2 at the top of this screen. The answer
           * frame one tap earlier now shows the same two strings at 33px, so
           * keeping both meant the reader met them twice, in swapped order,
           * within one gesture — the eyebrow restating the conclusion above an
           * argument, which is the exact fault the answer frame exists to fix,
           * doubled instead of removed.
           *
           * The eyebrow above stays. An eyebrow captioning the screen the
           * reader just tapped through is orientation, not repetition, and it
           * is what a reader who re-enters grace from the decision — and so
           * never sees the answer frame — has to tell them where they are.
           *
           * Ephesians 2:4 is not lost: it carries the answer frame, which is a
           * louder place for the hinge than a subheading was.
           */}

          {/* Beats */}
          {/* aria-live: beats are revealed by taps — announce each arrival
              to screen readers instead of silently growing the page. */}
          <div aria-live="polite" className="mt-10 text-left">
            {messages.beats.map((beat, i) => {
              const isRevealed = i < revealedCount;
              // Once every beat is revealed the spotlight lifts entirely —
              // the whole argument reads as one document before Continue.
              const isActive = allBeatsRevealed || i === activeIndex;
              const isGold = i >= 2;

              if (!isRevealed) return null;

              return (
                <m.div
                  key={i}
                  ref={beatRefs[i]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    // Rest state stays readable (this is the gospel argument,
                    // not decoration) while the active beat still leads.
                    opacity: isActive ? 1 : 0.6,
                    y: 0,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: i === 0 && !returning ? 1.5 : 0 }}
                  onClick={allBeatsRevealed ? undefined : () => setActiveIndex(i)}
                  role={allBeatsRevealed ? undefined : "button"}
                  tabIndex={allBeatsRevealed ? undefined : 0}
                  onKeyDown={
                    allBeatsRevealed
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveIndex(i);
                          }
                        }
                  }
                  className={`border-t border-white/[0.04] py-4 first:border-t-0 first:pt-0 ${
                    allBeatsRevealed ? "" : "cursor-pointer"
                  }`}
                >
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[2.5px] text-[#D4A843]/70">
                    {ROMAN[i] ?? String(i + 1)}
                  </p>
                  <p
                    className={`text-lg font-semibold leading-snug sm:text-xl ${
                      isGold ? "text-[#D4A843]" : "text-white/95"
                    }`}
                  >
                    {beat.headline}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60 sm:text-sm">
                    {beat.subtitle}
                  </p>
                </m.div>
              );
            })}
          </div>

          {/* Tap to continue pill — fades out when the last beat is revealed */}
          <AnimatePresence>
            {revealedCount > 0 && !allBeatsRevealed && (
              <m.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0 } }}
                transition={{ duration: 0.4, delay: 2.2 }}
                className="mt-6 flex justify-center"
              >
                <Button variant="gold" size="sm" mist onClick={handleTapContinue}>
                  <span className="font-mono text-[10px] uppercase tracking-[2.5px]">
                    {messages.tapContinue}
                  </span>
                  <ButtonArrow direction="down" />
                </Button>
              </m.div>
            )}
          </AnimatePresence>

          {/* Scripture + Continue — after all beats */}
          <AnimatePresence>
            {allBeatsRevealed && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <m.blockquote
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mt-8 border-l border-[#D4A843]/30 pl-4 text-left"
                >
                  <p className="text-[15px] italic leading-[1.8] text-white/60 sm:text-base">
                    &ldquo;{messages.scripture}&rdquo;
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
                    {messages.scriptureRef}
                  </p>
                </m.blockquote>

                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="mt-10"
                >
                  <Button variant="gold" mist onClick={handleContinue}>
                    {messages.continueLabel}
                    <ButtonArrow />
                  </Button>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Quiet walk-back — re-reading the verdict, not reopening it. Walks
              one history entry back rather than dispatching directly, so the
              browser stack and the reducer stay in agreement: the shell's
              popstate handler is the single place a backward move is turned
              into an action. */}
          {/* Last in, deliberately. It had no entrance at all, so the one
              control on this screen that matters least was the first thing on
              it — present at frame 0 while the label, the heading, the first
              beat and the continue button were all still arriving. It now
              trails the continue button, and comes in slowly. A returning
              reader has seen the screen, so it need not make them wait. */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: returning ? 0.4 : 2.6 }}
            className="mt-8 flex justify-center"
          >
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[32px] items-center text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
            >
              {messages.rereadVerdict}
            </button>
          </m.div>
        </div>
      </div>
    </div>
  );
}
