"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackGraceViewed } from "@/lib/analytics";
import {
  trackGraceRevealed,
  trackGraceBeatRevealed,
} from "@/lib/eternity-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

interface GraceScreenProps {
  messages: {
    scripture: string;
    scriptureRef: string;
    continueLabel: string;
    label: string;
    beatsHeading: string;
    /** Four movements of the courtroom analogy, in Comfort's load-bearing
        order. `label` names the movement; the headline states it; the subtitle
        argues it. See docs/METHOD.md § "Grace — the courtroom analogy". */
    beats: Array<{ label: string; headline: string; subtitle: string }>;
    /* `grace.tapContinue` is deliberately absent. It said "Tap to continue",
       which is the wrong instruction for a page that scrolls, and the cue below
       the announcement is a chevron rather than a word. The key still exists in
       both locales — orphaning a string is cheaper to undo than deleting one,
       and the owner's PT pass is open. */
    rereadVerdict: string;
  };
  /** Walks back one history entry, so the browser stack and the reducer agree. */
  onBack: () => void;
}

/*
 * Grace, as one scroll.
 *
 * It used to be five taps: an answer frame the reader tapped away, then a
 * four-rung accordion advanced one rung at a time, then Continue. The verdict
 * before it costs five more, so a reader crossed ten gates between the sixth
 * commandment and the decision, and every gate is a place to leave.
 *
 * The mechanic was also arguing against itself. This file's own comment said
 * the chain was "deliberately the opposite of the verdict's mechanic — the Law
 * works by surprise, grace works by clarity" — and then hid three of its four
 * beats behind taps. Withholding is the Law's instrument. Borrowed here it made
 * the argument impossible to see as an argument: one rung open, three greyed
 * labels, and no way to feel the case accumulate.
 *
 * The courtroom analogy is delivered out loud as continuous speech, and it
 * persuades by accumulation. So it is delivered that way here. One tap remains
 * in grace, and it is the one that leaves for the decision.
 *
 * ── The shape, and why gold sits where it does ──────────────────────────────
 *
 * docs/METHOD.md holds two rules that pull against each other. Gold "arrives
 * once, and its arrival is the event"; and grace must answer the verdict door's
 * question — "Is there any hope?" — immediately, "rather than three beats
 * later". A scroll could satisfy either: open quietly and spend gold on a
 * full-bleed turn later, or open at full volume.
 *
 * It opens at full volume. The door asks a question and the first frame is the
 * answer, in gold, alone — which is also the indicative-before-imperative rule,
 * since the announcement lands before repentance is named in movement IV. The
 * turn later is therefore not a second arrival: it is the proof landing. Red
 * recalls the courtroom in movement I, and the full-bleed panel resolves it
 * back to gold on the beat where someone pays.
 *
 * No new copy. Every string is the one that was already there, in the order it
 * was already in — the four beats map one-to-one onto the four movements.
 */

/** The announcement, four movements, the scripture, the way on. Only the four
    movements carry beat analytics; see BEAT_SECTIONS. */
const REVEAL_SECTIONS = 6;
const BEAT_SECTIONS = 4;

/**
 * How far up the viewport a section must come before it counts as read.
 *
 * A section is marked when its top passes 90% of the viewport height — early
 * enough that it is never still fading while the reader is looking straight at
 * it, late enough that a fast scroll does not mark the whole page at once.
 */
const SEED_THRESHOLD = 0.9;

export function GraceScreen({ messages, onBack }: GraceScreenProps) {
  const dispatch = useGameDispatch();
  const state = useGameState();
  const startTime = useRef(0);

  /*
   * No `returning` branch anywhere in this file, and its absence is the point.
   * The accordion needed one: a reader coming back from the decision had to be
   * given every rung open, or they would have met a collapsed chain they had
   * already walked. A scroll is the same document on the first visit and the
   * fifth, so there is nothing to restore and no second layout to keep in sync.
   */

  /*
   * Whether this is the reader's first arrival. Back and forward are a single
   * gesture here, so this screen unmounts and remounts routinely — every
   * analytics event has to be once-per-session rather than once-per-mount, or
   * the metrics inflate with every glance backwards.
   *
   * graceReached cannot answer it: SHOW_GRACE sets it and is dispatched by the
   * verdict's own door tap, so it is already true by the time this component
   * first renders.
   *
   * graceBeatsRevealed is the honest signal — persisted, starts at 0, and only
   * moves when the reader actually reaches a movement. It is more honest now
   * than it was: nothing dispatches it on arrival any more, so it stays 0 until
   * the reader scrolls off the announcement and into the argument.
   */
  const firstVisitRef = useRef(
    state.graceBeatsRevealed === 0 && !state.invitationReached,
  );

  const maxScrollDepth = useRef(0);

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const reportedRef = useRef<Set<number>>(new Set());

  /*
   * Every section starts visible and only the off-screen ones are hidden, in a
   * layout effect, before paint.
   *
   * The obvious way round — start hidden, reveal on intersection — breaks twice.
   * Server-rendered HTML would carry the whole argument at opacity 0, so a
   * reader without JS gets a blank screen where the gospel should be; and the
   * sections already on screen at mount would flash out and back in. Seeding
   * from a measurement costs one synchronous re-render and avoids both.
   */
  const [shown, setShown] = useState<boolean[]>(() =>
    new Array(REVEAL_SECTIONS).fill(true),
  );

  useIsomorphicLayoutEffect(() => {
    // No observer, no reveal: everything stays visible rather than staying
    // hidden. The argument is the point; the animation is not.
    if (typeof IntersectionObserver === "undefined") return;

    const els = sectionRefs.current;
    setShown(
      els.map((el) =>
        el ? el.getBoundingClientRect().top < window.innerHeight * SEED_THRESHOLD : true,
      ),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.reveal);
          if (Number.isNaN(index)) continue;

          /*
           * Reaching a movement is what "revealing a beat" now means. The old
           * screen could only know this from a tap; a scroll knows it better,
           * because the reader had to bring the words into view to trigger it.
           *
           * The reducer's guard is monotonic, so a reader scrolling back up and
           * down again re-dispatches harmlessly — but trackGraceBeatRevealed is
           * not idempotent, hence the set.
           */
          if (index < BEAT_SECTIONS && !reportedRef.current.has(index)) {
            reportedRef.current.add(index);
            trackGraceBeatRevealed(index);
            dispatch({ type: "REVEAL_GRACE_BEAT", count: index + 1 });
          }

          setShown((prev) =>
            prev[index] ? prev : prev.map((v, j) => (j === index ? true : v)),
          );
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: `0px 0px -${Math.round((1 - SEED_THRESHOLD) * 100)}% 0px` },
    );

    for (const el of els) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [dispatch]);

  // Idempotent: the verdict's bridge is what dispatches SHOW_GRACE, and the
  // reducer refuses it from any phase but the verdict. Kept so the screen still
  // records its own arrival if it is ever mounted another way.
  useEffect(() => {
    dispatch({ type: "SHOW_GRACE" });
  }, [dispatch]);

  /*
   * Scroll depth, which finally measures something.
   *
   * This screen never scrolled — every beat was a swap inside one viewport — so
   * the depth handed to trackGraceViewed was structurally 0 for every reader.
   * The whole argument is now below the fold by construction, so the number
   * reports how much of it was actually travelled.
   */
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
      // Only the first visit is measured. This fires on unmount, and a back
      // press to re-read the verdict unmounts the screen — so reporting every
      // departure would bury the genuine dwell time under short re-reads.
      if (wasFirstVisit) trackGraceViewed(Date.now() - start, maxDepth.current);
    };
  }, []);

  useEffect(() => {
    if (!firstVisitRef.current) return;
    trackGraceRevealed();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
  }, []);

  function handleContinue() {
    dispatch({ type: "SHOW_INVITATION" });
  }

  const setSectionRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  };

  /** Opacity and transform only, so a revealing section never changes the
      height of the page under the reader's thumb. */
  const revealClass = (index: number) =>
    `transition-[opacity,transform] duration-700 ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
      shown[index] ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
    }`;

  const [problem, payment, payer, response] = messages.beats;

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Ambient wash, fixed so it does not travel with the scroll. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-lg px-5 sm:px-6">
        {/*
         * 1 · The announcement.
         *
         * A full viewport of it, alone. The verdict's door asked "Is there any
         * hope?" and this is the reply — same colour, one step larger, because
         * the reply should not be quieter than the question. Both strings are
         * committed vocabulary and go in verbatim.
         *
         * "But God…" (Ephesians 2:4) sits above rather than below, and that is
         * doctrinal rather than visual: alone and at this size, "Someone paid
         * your fine" stops naming a topic and declares something to this reader
         * — before repentance is named at all, four movements down. The verse
         * frames it as the scriptural turn rather than a personal guarantee.
         *
         * The shell is min-h-dvh and adds 12px of its own top padding, so a
         * child claiming a full viewport on top of that scrolls by exactly that
         * much. Hence the subtraction.
         */}
        {/* `relative` is load-bearing: the scroll cue below is absolutely
            positioned, and without a containing block here it resolved against
            the page wrapper and landed 3,367px down — at the foot of the whole
            argument, where a cue to start scrolling is worse than none. */}
        <section className="relative flex min-h-[calc(100dvh-0.75rem)] flex-col items-center justify-center text-center">
          <m.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            className="flex flex-col items-center gap-4"
          >
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

          {/* A chevron rather than a word: the gesture is universal, and a
              label here would be new copy in both locales for something the
              shape already says. Decorative, so the argument below is what a
              screen reader meets next. */}
          <m.span
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="absolute bottom-[calc(3.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] flex flex-col items-center gap-2"
          >
            <span className="h-8 w-px bg-gradient-to-b from-transparent to-[#D4A843]/40" />
            {/* Two borders on a rotated square. An SVG would need a title to
                satisfy the a11y lint, and titling a decoration is worse than
                not having one — this has no accessible surface at all. */}
            <span className="size-[7px] rotate-45 border-r border-b border-[#D4A843]/55" />
          </m.span>
        </section>

        {/*
         * 2 · Movement I — the problem, in the Law's colour.
         *
         * Still red, because it is still the Law: a just judge, a penalty, and
         * no ability to pay. METHOD.md is explicit that this step cannot be cut
         * — without the courtroom, "someone pays" has no venue and no legal
         * force — and it is what gives the panel below it something to resolve.
         */}
        <section
          ref={setSectionRef(0)}
          data-reveal="0"
          className={`py-[18vh] ${revealClass(0)}`}
        >
          <p className="font-mono text-[9px] uppercase tracking-[2.6px] text-red-400/70">
            {problem?.label}
          </p>
          <h2 className="mt-4 text-[25px] font-semibold leading-[1.22] tracking-[-0.024em] text-white/95 sm:text-[30px]">
            {problem?.headline}
          </h2>
          <p className="mt-4 border-l border-red-500/30 pl-4 text-[14px] leading-relaxed text-white/55 sm:text-[15px]">
            {problem?.subtitle}
          </p>
        </section>

        {/*
         * 3 · The turn.
         *
         * Full-bleed, and the only place in grace where the flow's two colours
         * meet in one element. The reader scrolls out of the Law's red and the
         * page resolves to gold underneath the beat where someone pays — the
         * hinge of the analogy given the width of the screen.
         *
         * `mx-[calc(50%-50vw)]` is this codebase's breakout idiom: a margin,
         * not a transform, because a transform here would collide with anything
         * framer animates on the same element.
         */}
        <section
          ref={setSectionRef(1)}
          data-reveal="1"
          className={`mx-[calc(50%-50vw)] flex min-h-[82dvh] flex-col justify-center overflow-hidden px-5 py-[12vh] sm:px-6 ${revealClass(1)}`}
          style={{
            background:
              "linear-gradient(to bottom, rgba(239,68,68,0.07) 0%, rgba(212,168,67,0.10) 52%, transparent 100%)",
          }}
        >
          <div className="mx-auto w-full max-w-lg">
            <p className="font-mono text-[9px] uppercase tracking-[2.6px] text-[#D4A843]/75">
              {payment?.label}
            </p>
            <h2
              className="mt-4 text-[27px] font-semibold leading-[1.2] tracking-[-0.026em] text-[#D4A843] sm:text-[34px]"
              style={{ textShadow: "0 0 60px rgba(212,168,67,0.22)" }}
            >
              {payment?.headline}
            </h2>
            <p className="mt-4 border-l border-[#D4A843]/30 pl-4 text-[14px] leading-relaxed text-white/60 sm:text-[15px]">
              {payment?.subtitle}
            </p>
          </div>
        </section>

        {/* 4 · Movement III — the payer, named. */}
        <section
          ref={setSectionRef(2)}
          data-reveal="2"
          className={`py-[16vh] ${revealClass(2)}`}
        >
          <p className="font-mono text-[9px] uppercase tracking-[2.6px] text-[#D4A843]/75">
            {payer?.label}
          </p>
          <h2 className="mt-4 text-[25px] font-semibold leading-[1.22] tracking-[-0.024em] text-[#D4A843] sm:text-[30px]">
            {payer?.headline}
          </h2>
          <p className="mt-4 border-l border-[#D4A843]/30 pl-4 text-[14px] leading-relaxed text-white/60 sm:text-[15px]">
            {payer?.subtitle}
          </p>
        </section>

        {/* 5 · Movement IV — the response. The imperative, and it arrives last
            by design: the indicative has had four screens to land first. */}
        <section
          ref={setSectionRef(3)}
          data-reveal="3"
          className={`py-[16vh] ${revealClass(3)}`}
        >
          <p className="font-mono text-[9px] uppercase tracking-[2.6px] text-[#D4A843]/75">
            {response?.label}
          </p>
          <h2 className="mt-4 text-[25px] font-semibold leading-[1.22] tracking-[-0.024em] text-[#D4A843] sm:text-[30px]">
            {response?.headline}
          </h2>
          <p className="mt-4 border-l border-[#D4A843]/30 pl-4 text-[14px] leading-relaxed text-white/60 sm:text-[15px]">
            {response?.subtitle}
          </p>
        </section>

        {/* 6 · The promise, then the way on. */}
        <section
          ref={setSectionRef(4)}
          data-reveal="4"
          className={revealClass(4)}
        >
          <blockquote className="border-l border-[#D4A843]/30 pl-4">
            <p className="text-[15px] italic leading-[1.8] text-white/60 sm:text-base">
              &ldquo;{messages.scripture}&rdquo;
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
              {messages.scriptureRef}
            </p>
          </blockquote>
        </section>

        <section
          ref={setSectionRef(5)}
          data-reveal="5"
          className={`flex flex-col items-center pt-14 pb-[calc(5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] ${revealClass(5)}`}
        >
          <Button variant="gold" mist onClick={handleContinue}>
            {messages.continueLabel}
            <ButtonArrow />
          </Button>

          {/* Quiet walk-back — re-reading the verdict, not reopening it. Walks
              one history entry back rather than dispatching directly, so the
              browser stack and the reducer stay in agreement. */}
          <button
            type="button"
            onClick={onBack}
            className="mt-8 inline-flex min-h-[32px] items-center text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
          >
            {messages.rereadVerdict}
          </button>
        </section>
      </div>
    </div>
  );
}
