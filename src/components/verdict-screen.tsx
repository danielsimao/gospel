"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { DeathCounter } from "@/components/eternity/death-counter";
import { trackVerdictReached } from "@/lib/analytics";
import { splitConfession, type ConfessionTone } from "@/lib/confession";
import { ScrollCue } from "@/components/shared/scroll-cue";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { TestMessages } from "@/lib/types";

interface VerdictScreenProps {
  messages: { title: string };
  testMessages: TestMessages;
}

/*
 * The sentence, delivered one beat at a time.
 *
 * The screen this replaces was eight centred blocks in a column — 889px of
 * content in an 844px viewport, so the way out sat below the fold. GUILTY and
 * the live count were the same colour, weight and frame, so two heroes fought;
 * and the confession, the one sentence built from what this reader just said,
 * was 16px between them.
 *
 * Stacking them differently would have fixed the hierarchy. It could not fix
 * the thing this screen is actually for: nothing can be withheld on a page that
 * shows its own ending. The reader could see the gold button while still
 * reading the charge, so there was nothing to wait for and no reason to want
 * the next screen.
 *
 * So the beats replace each other, and the door does not exist until the last
 * one. Four devices, in order of how much work they do:
 *
 *   1. The exit is withheld for four beats.
 *   2. The count is the only thing that does not resolve — it keeps moving
 *      while the reader is held.
 *   3. Gold arrives exactly once, on ground the red has drained out of. The
 *      reader has seen nothing but red for ninety seconds.
 *   4. The last words are a question, alone on a screen.
 *
 * Advanced by tap, not by timer. A timed sequence that removes content the
 * reader is still reading needs a pause control to satisfy WCAG 2.2.2, and the
 * control undercuts the effect it exists to protect. Tap costs nothing and is
 * better rhetoric besides: the reader turns each page of their own sentence,
 * which makes the final tap onto grace a decision rather than an arrival.
 */
const BEATS = ["charge", "confession", "count", "claim", "door"] as const;
type Beat = (typeof BEATS)[number];

const LAST_BEAT = BEATS.length - 1;

/*
 * One class per tone, as a total map rather than a ternary. The distinction is
 * content correctness, not styling: rendering an evaded commandment with the
 * same force as a confessed one states something the reader did not say. A
 * ternary made every tone that was not "admitted" render as a denial, so adding
 * a fourth would have been silent — this way it fails the build.
 *
 * Three levels, and the plain run is the quietest of them — see CONFESSION_PLAIN.
 * The order that matters is admitted > denied > plain: the reader owns the first,
 * the second is recorded rather than dismissed, and the third is grammar.
 */
const TONE_CLASS: Record<Exclude<ConfessionTone, "plain">, string> = {
  admitted: "text-red-400",
  denied: "text-white/75",
};

/*
 * The connective tissue — "You are", "— by your own admission" — set below both
 * name tones rather than above them.
 *
 * It used to inherit the paragraph at white/90 while denied names sat at
 * white/55. At 16px in the old layout that was invisible. At 29-46px it is not:
 * a reader who evaded all six got a screen where "You are" and "by your
 * evasions" were the loudest things on it and the six names had receded to the
 * dimmest, which reads as though nothing was found. Evasions are recorded, not
 * dismissed, and the sentence has to say so at every mix of answers — including
 * the two where one tone is absent entirely.
 *
 * white/55 measures ~5.6:1 on #060404, so the scaffolding stays legible; it is
 * simply no longer the thing the eye lands on.
 */
const CONFESSION_PLAIN = "text-white/55";

export function VerdictScreen({
  messages,
  testMessages,
}: VerdictScreenProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const hasTracked = useRef(false);
  /*
   * Grace is only reachable through the full verdict, so graceReached exactly
   * means "verdict fully seen" — re-entry replays nothing.
   *
   * Read ONCE, at mount, and that is load-bearing rather than a micro-optimisation.
   * Tapping the door dispatches SHOW_GRACE, which sets graceReached true — and
   * while this screen is still playing its exit. Read live, the flag flipped
   * mid-exit and re-rendered the departing verdict in document mode: measured at
   * 390×844, one frame after the tap the whole record — GUILTY, the confession,
   * the death count, the claim — slammed onto the screen over the door and stayed
   * for ~115ms until grace mounted, with the document growing 844 → 1088 under it.
   * The screen was showing its own re-read layout on the way out.
   *
   * A mount-time read is also simply the truth: "did this reader arrive here
   * having already seen grace" cannot change while they are looking at it. The
   * shell keys each phase, so walking back from grace remounts this component and
   * the question is asked again then, which is the only moment it can differ.
   */
  const [returning] = useState(state.graceReached);

  // Seeded to the end for a reader coming back from grace, though showAll
  // below means they see the document rather than any single beat — this now
  // only feeds isLastBeat and the pager, both of which the document hides.
  const [beatIndex, setBeatIndex] = useState(returning ? LAST_BEAT : 0);
  const beat: Beat = BEATS[beatIndex] ?? "door";
  const isLastBeat = beatIndex >= LAST_BEAT;

  /*
   * Re-entry shows the whole verdict at once, not the beat it ended on.
   *
   * "Re-read the verdict" walks one history entry back from grace, which
   * remounts this screen with graceReached already true — so it opened on the
   * last beat, and the last beat is a gold question with no verdict on it. A
   * link that promises to re-read the verdict was showing none of it.
   *
   * The sequence is for the first hearing. Someone who has heard it and came
   * back deliberately wants the record, so they get it as a document: the
   * charge, the confession, the count and their own claim in one column, with
   * the way on at the bottom. Grace already resolves the same way once its
   * chain is complete, and for the same reason.
   */
  const showAll = returning;

  /*
   * The re-read document overflows, and its only way forward is at the bottom
   * — but only sometimes. Measured at 390×844: the document is 1088px and the
   * "Is there any hope?" button sits at y=878, 34px below the fold, invisible.
   * The full-screen control does not exist in this mode (deliberately: see the
   * affordance note below), so a reader who clicked expecting the sequence's
   * behaviour got nothing at all, with no cue that scrolling was required.
   * That is a dead end, not a design.
   *
   * A fixed pill and a cue fix it, but only while it is true — and "the reader
   * has scrolled" is not the same fact as "the button is visible". A tall
   * desktop viewport, a short confession (the document's height tracks how
   * many charges were admitted), or a zoomed-out page can fit the whole
   * document without a scroll event ever firing, and a `scroll` listener never
   * retires there: the pill sits forever over a button that is already in
   * plain sight a few hundred pixels below it, duplicating it, and the cue
   * points down at nothing.
   *
   * So this watches the button itself rather than a gesture that might reveal
   * it. An IntersectionObserver's first callback fires as soon as it starts
   * observing — including when the target is already on screen — so a
   * document that never scrolls retires the pill and cue on its own, with no
   * scroll required. The same observer covers the scrolling case unchanged:
   * the callback fires again the moment the button crosses into view. One
   * mechanism answers both viewports, so the two can no longer fall out of
   * step with each other the way a scroll listener and a real layout could.
   */
  const bridgeRef = useRef<HTMLButtonElement>(null);
  const [bridgeInView, setBridgeInView] = useState(false);
  useEffect(() => {
    if (!showAll) return;
    // No observer, no retirement — the pill and cue simply stay, which is
    // the same "keep the affordance" default the sequence's own advance hint
    // and grace's reveal effect fall back to when this API is unavailable.
    if (typeof IntersectionObserver === "undefined") return;
    const el = bridgeRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setBridgeInView(true);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showAll]);

  const advance = useCallback(() => {
    setBeatIndex((i) => Math.min(i + 1, LAST_BEAT));
  }, []);

  /*
   * Focus follows the beat, and there is no live region.
   *
   * aria-live was and remains wrong here: the count's text node changes
   * ~2x/second, so a polite region containing it announces a new number
   * forever. Moving focus to the beat instead puts a screen reader's cursor on
   * the new content without announcing anything on a timer, and leaves the
   * number readable by navigation exactly as it is today.
   *
   * Skipped on mount so arriving at the verdict does not steal focus from
   * wherever the reader left it.
   */
  const beatRef = useRef<HTMLDivElement>(null);
  const doorRef = useRef<HTMLButtonElement>(null);
  const firstRenderRef = useRef(true);
  useEffect(() => {
    const isMount = firstRenderRef.current;
    firstRenderRef.current = false;
    // Both guards are the mount, reached two ways: beat 0 for a first arrival,
    // and the last beat for a reader coming back from grace.
    if (isMount || beatIndex === 0) return;
    // On the last beat the stage is empty — the question lives inside the
    // control — so focus goes to the control, which is also the only thing left
    // to activate.
    if (beatIndex >= LAST_BEAT) doorRef.current?.focus();
    else beatRef.current?.focus();
  }, [beatIndex]);

  const confession = splitConfession(state.answers, testMessages);

  // Active elapsed test time, frozen at the verdict. This is what analytics
  // reports. RESUME_SESSION rebases startedAt so time spent away from the tab
  // is excluded (game-reducer.ts:172-201), so a session resumed days later
  // still reports minutes, not days.
  //
  // Frozen at mount rather than read live, because SHOW_VERDICT below is what
  // sets completedAt: on a first arrival it is still null throughout this
  // render, and reading it directly would report a duration of 0. On a re-read
  // it is already set and this is exact.
  const [completedAtMs] = useState(() => state.completedAt ?? Date.now());
  const durationMs = Math.max(0, completedAtMs - state.startedAt);

  // What the live counter counts, which is NOT durationMs. durationMs stops at
  // completedAt, so seeding the counter with it meant the number climbed while
  // the reader sat here and then snapped back down on a re-read from grace —
  // a count that visibly goes backwards. Measuring from startedAt to now is
  // monotonic across re-reads and is literally what the copy claims ("since
  // you started"). Frozen at mount so re-renders don't restart the count-up.
  const [counterBaseMs] = useState(() =>
    state.startedAt > 0 ? Math.max(0, Date.now() - state.startedAt) : durationMs,
  );

  // Idempotent, and a guard rather than the mechanism: ADVANCE_AFTER_FOLLOWUP
  // is what moves the last question to the verdict. The reducer refuses this
  // unless every question is answered, so it can never manufacture a verdict.
  useEffect(() => {
    dispatch({ type: "SHOW_VERDICT" });
  }, [dispatch]);

  useEffect(() => {
    if (!hasTracked.current && !returning) {
      hasTracked.current = true;
      const totalHonest = state.answers.filter(
        (a) => a.answer === "honest",
      ).length;
      const totalJustify = state.answers.filter(
        (a) => a.answer === "justify",
      ).length;
      trackVerdictReached(totalHonest, totalJustify, durationMs);
    }
  }, [state.answers, durationMs, returning]);

  // Forward moves are a dispatch. The shell watches the phase and stamps the
  // history entry, so back still works without the screen knowing about URLs.
  function handleBridgeClick() {
    dispatch({ type: "SHOW_GRACE" });
  }


  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-7 pt-14 pb-[calc(5.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] sm:px-16 lg:px-28">
      {/*
       * The wash drains on the last beat, so the door arrives on ground that is
       * no longer red — everything since the landing screen has been.
       *
       * The document does not drain it to 0, though isLastBeat is true from
       * mount there too. A re-reader is past the pressure the sequence builds
       * beat by beat, so the full wash would be wrong — but the document is
       * still the verdict, not a neutral summary of it, and a fully drained
       * background made the re-read screen look like it had left red behind
       * entirely. 0.4 keeps the same judgment-red ellipse legible as
       * atmosphere rather than pressure: present at a glance, not competing
       * with the confession and count it sits behind.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 ease-[var(--ease-out-strong)] motion-reduce:transition-none"
        style={{
          opacity: showAll ? 0.4 : isLastBeat ? 0 : 1,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.12) 0%, transparent 62%)",
        }}
      />

      {/*
       * One control for the whole sequence, including the last beat.
       *
       * It is a real <button> and not a click handler on a div — that is what
       * makes this reachable by Tab, activatable by space or enter, and
       * announced as an action. Nothing about it looks like a button; the
       * element is doing accessibility work, not visual work.
       *
       * It covers the screen because on touch the target is the screen, and
       * because a pointer on a desktop has nothing else to aim at. The last
       * beat used to be the exception — a gold pill you had to hit, after four
       * beats that advanced from anywhere — which is two interaction models in
       * one screen, and put the only piece of chrome in the sequence at the one
       * moment that should be nothing but the question.
       *
       * So the question moved inside the control. On the last beat the button's
       * accessible name is the question itself, which is exactly what activating
       * it means; before that there is nothing to read and it carries a label.
       */}
      {!showAll && (
      <button
        type="button"
        ref={doorRef}
        onClick={isLastBeat ? handleBridgeClick : advance}
        aria-label={isLastBeat ? undefined : testMessages.nextLabel}
        /* The focus ring is the screen edge because the control is the screen —
           that is honest rather than decorative. Thin and inset, though: at 2px
           full-bleed it read as a border the design had grown, not as a
           transient indicator. #D4A843 at 70% measures ~4.4:1 on #060404, past
           the 3:1 that 1.4.11 asks of a focus indicator. */
        className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center px-7 outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-[6px] focus-visible:outline-[#D4A843]/70"
      >
        {/*
         * The one gold thing in the flow, and now the gold is the words rather
         * than a border around them. GUILTY and the count are both set with a
         * coloured glow of their own colour; this is the same treatment, which
         * makes the change of colour the whole event. The pill was diluting it.
         */}
        {isLastBeat && (
          <m.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            className="flex flex-col items-center gap-5"
          >
            <span
              className="text-[29px] font-medium leading-[1.3] tracking-[-0.02em] text-[#D4A843] sm:text-[40px] lg:text-[46px]"
              style={{ textShadow: "0 0 70px rgba(212,168,67,0.35)" }}
            >
              {testMessages.verdict.bridgeButton}
            </span>
            {/*
             * No arrow here, and its absence is the decision.
             *
             * A down arrow used to sit under this line, reasoned as "down, not
             * forward — grace is underneath this". True of the narrative, wrong
             * about the instrument: on this beat the whole screen is a button
             * and the gesture is a TAP, while an arrow pointing down is the
             * page's own vocabulary for "scroll". The persistent affordance
             * below already says click-or-space, so the arrow was the only
             * thing on screen contradicting it, and readers reported trying to
             * scroll here and getting nothing.
             *
             * The arrow survives in the showAll document below, where it is
             * finally telling the truth: there the forward control really is
             * further down the page, and scrolling really is required.
             */}
          </m.span>
        )}
      </button>
      )}

      <div
        ref={beatRef}
        tabIndex={-1}
        key={beat}
        className={`relative z-10 flex w-full max-w-md flex-col items-center text-center outline-none sm:max-w-2xl lg:max-w-4xl ${
          showAll ? "gap-14 py-6 sm:gap-16" : ""
        }`}
      >
        {(showAll || beat === "charge") && (
          <m.p
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: EASE_OUT_STRONG }}
            className="font-score text-[62px] font-bold uppercase leading-none tracking-[0.06em] text-red-500 sm:text-[112px] lg:text-[150px]"
            style={{ textShadow: "0 0 90px rgba(239,68,68,0.4)" }}
          >
            {messages.title.replace(/\.$/, "")}
          </m.p>
        )}

        {/*
         * The payload, alone on a screen. It was 16px between two larger red
         * objects; here nothing competes with it, so it does not have to shout
         * to win — 29px on a phone, and capped by measure rather than grown to
         * fill a desktop. Centred text past ~60 characters a line stops being
         * readable, and this is the sentence that has to land.
         */}
        {(showAll || beat === "confession") && (
          <m.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT_STRONG }}
            className={`text-[29px] font-medium leading-[1.26] tracking-[-0.02em] sm:text-[42px] sm:leading-[1.24] lg:text-[46px] ${CONFESSION_PLAIN}`}
          >
            {confession.map((segment, i) => {
              if (segment.tone === "plain") {
                return <Fragment key={i}>{segment.text}</Fragment>;
              }
              return (
                <span key={i} className={TONE_CLASS[segment.tone]}>
                  {segment.text}
                </span>
              );
            })}
          </m.p>
        )}

        {/*
         * The one thing that does not resolve. Under tap-advance it holds for
         * as long as the reader looks at it, which is strictly better than the
         * old 2.5s window: the number climbs while they sit with it.
         */}
        {(showAll || beat === "count") && (
          <m.div
            initial={{ opacity: 0, y: -14, scale: 1.06 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
            className="flex flex-col items-center"
          >
            <DeathCounter
              baseMs={counterBaseMs}
              // text-center: alignment inside the 7ch reserve is the caller's
              // now (see death-counter), and this column centres.
              className="text-center font-mono text-[76px] font-extrabold leading-none tabular-nums text-red-500 sm:text-[128px] lg:text-[150px]"
              style={{ textShadow: "0 0 70px rgba(239,68,68,0.3)" }}
            />
            <p className="mt-4 text-sm italic leading-relaxed text-white/60 sm:text-[19px] lg:text-xl">
              {testMessages.verdict.deathLineTemplate}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-red-400/85 sm:text-[19px] lg:text-xl">
              {testMessages.verdict.deathLineImplication}
            </p>
          </m.div>
        )}

        {/*
         * Their own claim, answered — and the law that answers it. Only when
         * they made a claim: someone who reached the test without passing the
         * question has nothing to quote back, and this is testimony, so there
         * is nothing to infer when it is absent. James 2:10 carries the beat
         * alone in that case, which is the argument the six questions build.
         */}
        {(showAll || beat === "claim") && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT_STRONG }}
            className="flex flex-col items-center"
          >
            {state.selfRating && (
              <p className="text-[21px] leading-[1.4] text-white/80 sm:text-[30px] lg:text-[34px]">
                {testMessages.verdict.selfRatingMirror[state.selfRating]}
              </p>
            )}
            <p
              className={`${state.selfRating ? "mt-8 sm:mt-10" : ""} max-w-xl text-[15px] italic leading-[1.8] text-white/55 sm:text-lg`}
            >
              &ldquo;{testMessages.verdict.scripture}&rdquo;
            </p>
            {/* red-400/75 is the AA floor for text this size on #060404
                (≈4.6:1). red-400/70 measures 4.1:1 and fails 1.4.3. */}
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[2px] text-red-400/75 sm:text-xs">
              {testMessages.verdict.scriptureRef}
            </p>
          </m.div>
        )}

        {/* The way on, for the document. The sequence carries its door inside
            the full-screen control, which does not exist here — so a re-reader
            would have had the whole verdict and no way forward. Same words,
            same gold, as an ordinary button because on this version it is one
            element among several rather than the only thing on screen. */}
        {showAll && (
          <button
            type="button"
            ref={bridgeRef}
            onClick={handleBridgeClick}
            className="inline-flex flex-col items-center gap-4 rounded-lg px-4 py-2 outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#D4A843]/70"
          >
            <span
              className="text-[26px] font-medium leading-[1.3] tracking-[-0.02em] text-[#D4A843] sm:text-[34px]"
              style={{ textShadow: "0 0 60px rgba(212,168,67,0.3)" }}
            >
              {testMessages.verdict.bridgeButton}
            </span>
            {/* Kept here, unlike the sequence's. On the document the arrow is
                telling the truth: this control really is further down the page. */}
            <span aria-hidden="true" className="text-2xl text-[#D4A843]/60">
              &darr;
            </span>
          </button>
        )}
      </div>

      {/* The way on itself, not just a cue toward it — fixed to the viewport so
          it is present in the very first frame of a re-entry, same string and
          same gold as the in-flow button below it; both dispatch the same
          handleBridgeClick. The in-flow button measures 34px below the fold at
          390×844, so without this a returning reader has no way forward until
          they scroll on faith. Reuses the consent-h + safe-area-inset-bottom
          anchor the cue below already establishes.
          Retires once the in-flow button is confirmed on screen — see
          bridgeInView above. That covers both viewports the scroll listener
          this replaced could not: a phone where the button is genuinely below
          the fold at mount, and a tall desktop viewport where it never was,
          so the observer's first callback fires immediately and the pill never
          shows at all. Once the real button is visible, a pill still floating
          over the record the reader is now reading is chrome competing with
          the thing it was built to reveal. */}
      {showAll && !bridgeInView && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-20 flex justify-center px-7">
          <button
            type="button"
            onClick={handleBridgeClick}
            className="pointer-events-auto rounded-full border border-[#D4A843]/25 bg-[#060404]/85 px-5 py-2.5 text-[15px] font-medium tracking-[-0.01em] text-[#D4A843] shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-sm outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#D4A843]/70 sm:text-base"
          >
            {testMessages.verdict.bridgeButton}
          </button>
        </div>
      )}

      {/* Fixed to the viewport, not the document: the button it points at can
          be below the fold, so a cue positioned in the document would be below
          the fold with it. On a viewport tall enough that the document never
          scrolls, the button was never below anything — bridgeInView is true
          from the observer's opening callback, before this ever has a chance
          to render, so the cue never appears to point at nothing. Retires with
          the pill, off the same signal — see bridgeInView above. */}
      {showAll && !bridgeInView && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-20 flex justify-center">
          <ScrollCue />
        </div>
      )}

      {/* Where the reader is, and the first signal that the colour of the flow
          has changed: the last dot is gold, and it turns a beat before the
          button appears. */}
      {/* Both of these sit at the bottom edge, which on a first visit belongs
          to the fixed consent banner and on an iPhone to the home indicator.
          --consent-h is published by the banner; both terms resolve to 0 for a
          returning reader on a device without one. */}
      {!showAll && (
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[calc(1.75rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-10 flex justify-center gap-2"
      >
        {BEATS.map((name, i) => (
          <span
            key={name}
            className={`h-[5px] w-[5px] rounded-full transition-colors duration-300 ${
              i === beatIndex
                ? isLastBeat
                  ? "bg-[#D4A843]"
                  : "bg-red-500"
                : "bg-white/15"
            }`}
          />
        ))}
      </div>
      )}

      {/*
       * The affordance, on every beat including the last, and worded for the
       * device: a thumb taps, a pointer has nothing to aim at.
       *
       * On every beat of the sequence, and on none of the document.
       *
       * The last beat used to go without, on the reasoning that the beats
       * before it teach the interaction. That had a hole in it, because a
       * reader could arrive at that beat cold.
       *
       * It is gone entirely when showAll is set, and that is not symmetry: the
       * document has no full-screen control, so "tap to continue" and "press
       * space" would both name something that is not there. An affordance
       * pointing at a control that does not exist is worse than no affordance,
       * and the pager above already draws the same line.
       *
       * Persistent rather than revealed after an idle timer. A prompt that
       * appears once the reader stops moving says "you are doing it wrong" or
       * "hurry up", and this is the one screen in the app built to be sat with:
       * the count beat exists so that a number climbs while nothing happens.
       * Nudging there would break the thing the sequence is for. At 9px and 30%
       * opacity a permanent label costs the last frame almost nothing, and it
       * cannot arrive at the wrong moment because it never arrives.
       */}
      {!showAll && (
      <p className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-10 text-center font-mono text-[9px] uppercase tracking-[2.4px] text-white/30 sm:text-[11px]">
        {/* Keyed on the pointer, not the width. At sm: a tablet is 768 wide and
            touch, so it was being told to click anywhere or press space — the
            wrong instrument, on the device most likely to be held in two hands
            for something this long. pointer-coarse is the input, which is what
            the sentence is actually about. */}
        <span className="pointer-fine:hidden">{testMessages.verdict.advanceHintTouch}</span>
        <span className="hidden pointer-fine:inline">{testMessages.verdict.advanceHintPointer}</span>
      </p>
      )}
    </div>
  );
}
