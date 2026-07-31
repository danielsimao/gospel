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
    /** `label` is the rung: the one line that stays on screen while another
        beat is open, so the whole argument's shape is always readable. It is a
        compression of its own headline, never a separate claim. */
    beats: Array<{ label: string; headline: string; subtitle: string }>;
    tapContinue: string;
    rereadVerdict: string;
  };
  /** Walks back one history entry, so the browser stack and the reducer agree. */
  onBack: () => void;
}

/** How long the chain waits before offering the way to the next rung. Long
    enough that the first rung is read rather than skipped past. */
/*
 * How long the chain sits before its only forward control appears.
 *
 * 2200 was a reading pause for the first rung, and it was too long by more
 * than double: the pill is not decoration, it is the single way onward, and a
 * screen that offers no control for over two seconds reads as one that has
 * finished loading wrong. 900 still lets the rung's own entrance land first.
 */
const PILL_DELAY_MS = 900;

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
   * Same place and same colour as the question it replies to, and a step
   * larger, because the reply should not be quieter than the question. No new
   * copy: both strings are committed vocabulary and go in verbatim.
   *
   * "But God…" sits above rather than below, and that placement is doing
   * doctrinal work rather than visual work. At 33px alone, "Someone paid your
   * fine" stops naming a topic and becomes a declaration to this reader —
   * before repentance is named at all, in the last rung. Ephesians 2:4 above it
   * frames the line as the scriptural turn rather than a personal guarantee.
   *
   * Shown on a first arrival only — the same signal the analytics now use, for
   * the same reason. Once the reader has opened a beat of the argument, or has
   * ever reached the decision, this frame is skipped: the question has been
   * answered once and does not need answering again on the way back.
   */
  const [showAnswer, setShowAnswer] = useState(firstVisitRef.current);
  /*
   * The timer is keyed on showAnswer, not run once on mount. The answer frame
   * is an early return, so starting the clock behind it would either have the
   * pill waiting on a screen nobody is looking at, or — if guarded by a ref —
   * never start at all once the frame was dismissed, because the effect would
   * not re-run. Keyed this way it starts when the chain actually appears.
   */
  useEffect(() => {
    if (showAnswer || returning) return;
    const t = setTimeout(() => setPillReady(true), PILL_DELAY_MS);
    return () => clearTimeout(t);
  }, [showAnswer, returning]);

  // Idempotent: the verdict's bridge is what dispatches SHOW_GRACE, and the
  // reducer refuses it from any phase but the verdict. Kept so the screen still
  // records its own arrival if it is ever mounted another way.
  useEffect(() => {
    dispatch({ type: "SHOW_GRACE" });
  }, [dispatch]);
  const maxScrollDepth = useRef(0);

  // Every rung is in the DOM from mount now; revealing one changes a
  // max-height rather than adding it to the layout. What this count still
  // decides is how many rungs are open-able and when Continue appears.
  //
  // Seeded from the persisted count so a refresh mid-argument does not throw
  // away beats the reader already opened. graceReached cannot serve here: it
  // is true from the moment grace is entered, so seeding from it would open
  // every rung at once for a first-time reader and destroy the reveal.
  const [revealedCount, setRevealedCount] = useState(
    returning ? messages.beats.length : Math.max(1, state.graceBeatsRevealed),
  );
  /*
   * The open rung. Follows the newest reveal, and tapping any earlier rung
   * moves it back — re-reading is supported, not punished.
   *
   * Seeded from revealedCount rather than 0. revealedCount restores from
   * storage after a refresh but this did not, so a reader who reloaded at rung
   * IV came back with rung I open and the one they were reading collapsed.
   * Invisible while every revealed beat stayed expanded; not invisible once
   * only one is.
   */
  /*
   * The continue pill is gated, not faded in.
   *
   * It entered on a 2.2s motion delay, which left the chain's only forward
   * control clickable while invisible — the exact hazard the decision screen's
   * hold is written to avoid, in the file that comment was written next to.
   * The answer frame made it worse: that frame is an early return, so the pill
   * mounts fresh when the frame is dismissed and the 2.2s starts from there
   * rather than overlapping the screen's entrance.
   */
  const [pillReady, setPillReady] = useState(returning);

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, (returning ? messages.beats.length : Math.max(1, state.graceBeatsRevealed)) - 1),
  );
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

  // Track grace phase entry, once per genuine first arrival.
  //
  // Guarded on firstVisitRef — see its declaration for why neither graceReached
  // nor invitationReached can serve alone. The naming here used to claim
  // graceReached, which was both the wrong flag and the one that made these
  // three events dead for every real reader.
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
         * the reader has just tapped through all five of them, and this is the
         * next gesture in the same sequence. A real <button> so it is reachable by Tab and
         * activatable by space; nothing about it looks like one.
         *
         * Its accessible name is the answer, which is what activating it means:
         * carry on into why.
         */}
        <button
          type="button"
          onClick={() => {
            setShowAnswer(false);
            /*
             * Passing this frame is recorded, and it has to be.
             *
             * revealedCount seeds at Math.max(1, graceBeatsRevealed), so the
             * first tap-continue dispatches count 2 and beat 0 is never
             * written. graceBeatsRevealed therefore stayed 0 for a reader who
             * had passed this frame and read the first rung — and this screen's
             * entire first-visit signal is `graceBeatsRevealed === 0`. Any back
             * and forward before the second rung replayed this frame and
             * re-fired trackGraceRevealed and trackGraceBeatRevealed(0), which
             * is the inflation that signal exists to prevent.
             *
             * The reducer's guard is monotonic, so dispatching it again is a
             * no-op.
             */
            dispatch({ type: "REVEAL_GRACE_BEAT", count: 1 });
          }}
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
    /* No min-h-dvh: the shell already carries it and adds 12px of its own top
       padding, so claiming a full viewport on top of that put every grace
       screen 12px into scroll. flex-1 fills what is actually left. */
    <div className="relative flex flex-1 flex-col">
      {/* Warm radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-14">
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

          {/*
           * The chain.
           *
           * Every rung is on screen from the first frame — dim, a single line,
           * destination readable. Only one body is open at a time, so the 1,316px
           * measured on the five-beat wall this replaces
           * becomes one screen, and the reader knows the three
           * things the wall never told them: where they are, how much is left,
           * and what it is building to.
           *
           * This is deliberately the opposite of the verdict's mechanic. The
           * Law works by surprise, so it withholds what is coming. Grace works
           * by clarity: someone who can see the argument is four short steps
           * and where it ends is more willing to walk it, not less.
           *
           * The whole argument opens as one document for a reader who has
           * already been to the decision and come back. It does NOT open on
           * the last tap of a first walk, and that is a correction: it used
           * to, and the tap that revealed rung IV expanded the three rungs
           * above it in the same frame. Measured on a 390px viewport, the page
           * went from 844px to 1221px — half a viewport of new content — while
           * a smooth scroll to rung IV was already in flight, so the target
           * moved under the animation. The reader's own beat lurched.
           *
           * The document view survives where it costs nothing: a returning
           * reader gets it in their first painted frame, so there is no shift
           * to feel. On a first walk every earlier rung is still one tap away,
           * which is the same argument available without the avalanche.
           *
           * No aria-live any more, and its absence is the point. Every beat is
           * now in the DOM from mount rather than appearing on tap, so there
           * is no arrival to announce — a screen reader gets the whole
           * argument as ordinary content, which is the better reading of it.
           * The collapse is visual only.
           */}
          <div className="mt-10 text-left">
            {messages.beats.map((beat, i) => {
              const isOpen = returning || i === activeIndex;
              const isReached = i < revealedCount;
              // The hinge. Beat 0 is still Law — a judge, a sentence — and the
              // argument turns at 1, where someone pays. The colour turns with
              // it. Cutting the old first beat moved this from index 2 to 1.
              const isGold = i >= 1;

              return (
                <div
                  key={i}
                  ref={beatRefs[i]}
                  className="border-t border-white/[0.04] first:border-t-0"
                >
                  <button
                    type="button"
                    onClick={isReached ? () => setActiveIndex(i) : undefined}
                    disabled={!isReached}
                    className="flex w-full items-center gap-3 py-3.5 text-left disabled:cursor-default"
                  >
                    <span
                      className={`font-mono text-[9px] tracking-[2.5px] ${
                        isReached ? "text-[#D4A843]/70" : "text-white/20"
                      }`}
                    >
                      {ROMAN[i] ?? String(i + 1)}
                    </span>
                    <span
                      className={`flex-1 font-mono tracking-[0.3px] transition-colors duration-300 ${
                        isOpen
                          ? "text-[10px] text-white/25"
                          : isReached
                            ? "text-[11.5px] text-white/55 md:text-[13px]"
                            : "text-[11.5px] text-white/25 md:text-[13px]"
                      }`}
                    >
                      {beat.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`size-[5px] shrink-0 rounded-full transition-colors duration-300 ${
                        isOpen
                          ? isGold
                            ? "bg-[#D4A843]"
                            : "bg-white/75"
                          : isReached
                            ? isGold
                              ? "bg-[#D4A843]/55"
                              : "bg-white/40"
                            : "bg-white/12"
                      }`}
                    />
                  </button>

                  {/* The body. Collapsed by max-height rather than unmounted,
                      so the argument is always readable by a screen reader and
                      only the eye is spared. motion-reduce cuts the height
                      animation: MotionConfig reducedMotion="user" governs
                      framer's own animations and this is a CSS transition. */}
                  <div
                    className={`overflow-hidden transition-[max-height,opacity,padding] duration-[450ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
                      isOpen ? "max-h-[420px] pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p
                      className={`pl-7 text-lg font-semibold leading-snug sm:text-xl md:text-[22px] ${
                        isGold ? "text-[#D4A843]" : "text-white/95"
                      }`}
                    >
                      {beat.headline}
                    </p>
                    <p className="mt-2 pl-7 text-[13px] leading-relaxed text-white/60 sm:text-sm md:text-[15px]">
                      {beat.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tap to continue pill — fades out when the last beat is revealed */}
          <AnimatePresence>
            {revealedCount > 0 && !allBeatsRevealed && pillReady && (
              <m.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0 } }}
                transition={{ duration: 0.4 }}
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
                transition={{ duration: 0.45, delay: 0.1 }}
              >
                <m.blockquote
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="mt-8 border-l border-[#D4A843]/30 pl-4 text-left"
                >
                  <p className="text-[15px] italic leading-[1.8] text-white/60 sm:text-base">
                    &ldquo;{messages.scripture}&rdquo;
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
                    {messages.scriptureRef}
                  </p>
                </m.blockquote>

                {/* These delays nest: this button's clock runs inside the
                    wrapper's own fade, so 1.2 + 0.8 put the one control that
                    ends this screen at two full seconds after the last tap,
                    invisible for the first 1.2 of them. It read as broken. Now
                    it lands at 0.55 and settles by 1.0 — behind the rung that
                    is still opening, which is the beat it should follow, and
                    not a second behind that. */}
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.55 }}
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
