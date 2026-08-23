"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { DeathCounter } from "@/components/eternity/death-counter";
import {
  trackVerdictReached,
  trackVerdictRow,
  trackVerdictSwipe,
} from "@/lib/analytics";
import { splitConfession, type ConfessionTone } from "@/lib/confession";
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
 *
 * ── Walking back replays the performance ────────────────────────────────────
 *
 * A reader coming back from grace starts at the charge and taps through again,
 * exactly as they did the first time. Ruled by the owner (2026-08-15) over two
 * alternatives that both shipped briefly: a separate "document" layout that
 * showed the whole record at once (a page the forward pass never showed, so
 * "re-read the verdict" landed somewhere unfamiliar), and an accumulating
 * stack whose settled frame doubled as the re-read (which put GUILTY and the
 * live count back in one frame — the exact two-heroes failure this screen was
 * built to end — and brightened the record under gold's arrival).
 *
 * One layout, one contract: back means hearing it again, not consulting a
 * transcript. The reader's own record as a document lives where it always did,
 * in grace's record section, one screen forward. Testimony is untouched —
 * answers, score and completion survive the walk (BACK_TO_VERDICT re-reads,
 * never reopens) — and the count stays monotonic across re-entries because it
 * measures from startedAt, not from this screen's mount.
 */
const BEATS = ["charge", "confession", "count", "claim", "door"] as const;
type Beat = (typeof BEATS)[number];

const LAST_BEAT = BEATS.length - 1;

/*
 * The beat dots at the bottom are the page-control idiom, and readers who know
 * it try to swipe. Honoured — ruled by the owner (2026-08-23): a swipe LEFT
 * advances exactly as a tap does, on every beat including the door (fifty
 * pixels of deliberate travel is as much a decision as a tap); a swipe RIGHT
 * does nothing, so back keeps its one contract — the walk-back above, which
 * replays — and does not grow a second, quieter meaning that collides with the
 * OS's own edge-swipe-for-history. Both directions are recorded (see
 * trackVerdictSwipe) because a refused gesture is still testimony about what
 * the reader expected.
 *
 * Recognised at release, never tracked under the finger. A surface that let
 * the next beat follow the drag in would peek gold into the frame from the
 * claim beat — and gold arrives once, as an event (docs/METHOD.md). So there
 * is no onPointerMove here at all: finger down, finger up, decide.
 *
 * Between TAP_SLOP and SWIPE_MIN_PX is deliberately dead. A press that
 * travelled past tap slop is not a tap, and one that did not reach the swipe
 * threshold is not a swipe; a hesitant half-swipe right must not fall through
 * to the trailing click and advance a reader who was reaching for back.
 */
const SWIPE_MIN_PX = 50;
const TAP_SLOP = 10;

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
   * means "verdict fully seen". Analytics-only now — the layout no longer
   * branches on it, since a returning reader gets the same sequence from the
   * same first beat.
   *
   * Still read ONCE, at mount. Tapping the door dispatches SHOW_GRACE, which
   * sets the flag true while this screen is still playing its exit; when a
   * layout hung off a live read of it, the departing verdict re-rendered into
   * its other mode over the door (~115ms at 390×844). Nothing visual reads it
   * any more, but the mount-time read stays because it is simply the truth —
   * "did this reader arrive here having already seen grace" cannot change
   * while they are looking at it — and because it keeps the tracking guard
   * below immune to the same mid-exit flip.
   */
  const [returning] = useState(state.graceReached);

  /*
   * Every arrival starts at the charge — the first hearing and the fifth are
   * the same performance. See the walk-back section of this file's own
   * doc comment: back means hearing it again, and seeding a later beat is how
   * "re-read the verdict" once opened on a lone gold question with no verdict
   * on it.
   */
  const [beatIndex, setBeatIndex] = useState(0);
  const beat: Beat = BEATS[beatIndex] ?? "door";
  const isLastBeat = beatIndex >= LAST_BEAT;

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
      trackVerdictRow();
    }
  }, [state.answers, durationMs, returning]);

  // Forward moves are a dispatch. The shell watches the phase and stamps the
  // history entry, so back still works without the screen knowing about URLs.
  function handleBridgeClick() {
    dispatch({ type: "SHOW_GRACE" });
  }

  /*
   * The tap stays on click; the swipe lives on pointerup. Keyboard and
   * assistive tech activate a <button> through click — routing the tap through
   * pointer geometry would strand exactly the readers the element is a real
   * button for. What pointerup owns is the swipe, plus a suppression flag for
   * the click a mouse still fires after a drag: browsers only swallow the
   * click that ends a SCROLL drag, and nothing on this screen scrolls, so
   * without the flag a mouse swipe advanced twice — once as the swipe, once as
   * the click trailing it.
   *
   * The flag is cleared in two places, and the pointerdown one is the one that
   * matters: after a touch swipe no click follows at all, and a flag left
   * standing would swallow the reader's next honest tap.
   *
   * The guards are grace's tap surface guards (grace-screen.tsx), for grace's
   * reasons: primary contact and primary button at both ends, the release
   * matched to its press by pointerId, capture so a press cannot lift
   * elsewhere and stay on record, and a cancelled press — the browser taking
   * the gesture for itself — cleared rather than left to be measured against
   * some later release. touch-pan-y on the button is what keeps the browser
   * from taking the horizontal move at all: vertical stays the browser's
   * (there is nothing to scroll, so it costs nothing), sideways is ours.
   */
  const pressRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const suppressClickRef = useRef(false);

  function handleSurfaceDown(event: React.PointerEvent<HTMLButtonElement>) {
    suppressClickRef.current = false;
    if (!event.isPrimary || event.button !== 0) return;
    pressRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is a belt to the guards below, not a requirement.
    }
  }

  function handleSurfaceCancel(event: React.PointerEvent<HTMLButtonElement>) {
    if (pressRef.current?.pointerId === event.pointerId) pressRef.current = null;
  }

  function handleSurfaceUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const start = pressRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    pressRef.current = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const travelled = Math.hypot(dx, dy);
    // A tap — the click that follows owns it.
    if (travelled <= TAP_SLOP) return;
    suppressClickRef.current = true;
    // Travelled but not sideways enough, or more down than across: the dead
    // zone. Suppressed above, advanced nowhere.
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;
    trackVerdictSwipe(
      dx < 0 ? "left" : "right",
      beat,
      Math.round((start.x / window.innerWidth) * 100) / 100,
    );
    if (dx < 0) {
      if (isLastBeat) handleBridgeClick();
      else advance();
    }
  }

  function handleSurfaceClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (isLastBeat) handleBridgeClick();
    else advance();
  }


  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-7 pt-14 pb-[calc(5.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] sm:px-16 lg:px-28">
      {/*
       * The wash drains on the last beat, so the door arrives on ground that is
       * no longer red — everything since the landing screen has been. A replay
       * re-reddens it, which is correct for a replay: the reader asked to hear
       * the sentence again, not to be shown a softened copy of it.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 ease-[var(--ease-out-strong)] motion-reduce:transition-none"
        style={{
          opacity: isLastBeat ? 0 : 1,
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
      <button
        type="button"
        ref={doorRef}
        onClick={handleSurfaceClick}
        onPointerDown={handleSurfaceDown}
        onPointerUp={handleSurfaceUp}
        onPointerCancel={handleSurfaceCancel}
        aria-label={isLastBeat ? undefined : testMessages.nextLabel}
        /* The focus ring is the screen edge because the control is the screen —
           that is honest rather than decorative. Thin and inset, though: at 2px
           full-bleed it read as a border the design had grown, not as a
           transient indicator. #D4A843 at 70% measures ~4.4:1 on #060404, past
           the 3:1 that 1.4.11 asks of a focus indicator. */
        className="absolute inset-0 z-20 flex cursor-pointer touch-pan-y items-center justify-center px-7 outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-[6px] focus-visible:outline-[#D4A843]/70"
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
             */}
          </m.span>
        )}
      </button>

      <div
        ref={beatRef}
        tabIndex={-1}
        key={beat}
        className="relative z-10 flex w-full max-w-md flex-col items-center text-center outline-none sm:max-w-2xl lg:max-w-4xl"
      >
        {beat === "charge" && (
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
        {beat === "confession" && (
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
        {beat === "count" && (
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
        {beat === "claim" && (
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
            {/* red-400/85 over #060404 measures 5.29:1, clear of 1.4.3's 4.5
                floor for text this size. The /75 this replaces was recorded
                here as "≈4.6:1" and measured 4.29:1 — a FAILING value carried
                by a comment asserting it passed. The arithmetic had been done
                against Tailwind v3's red-400 (#f87171); this build is v4, where
                the colour resolves to rgb(255,100,103) and every alpha lands
                dimmer. Even the v3 figure was 4.46:1, so the ratio never
                passed under either palette. Same class, same reason, on the
                examination ledger, the landing eyebrow and the error page. */}
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[2px] text-red-400/85 sm:text-xs">
              {testMessages.verdict.scriptureRef}
            </p>
          </m.div>
        )}
      </div>

      {/* Where the reader is, and the first signal that the colour of the flow
          has changed: the last dot is gold, and it turns a beat before the
          button appears. */}
      {/* Both of these sit at the bottom edge, which on a first visit belongs
          to the fixed consent banner and on an iPhone to the home indicator.
          --consent-h is published by the banner; both terms resolve to 0 for a
          returning reader on a device without one. */}
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

      {/*
       * The affordance, on every beat including the last, and worded for the
       * device: a thumb taps, a pointer has nothing to aim at.
       *
       * The last beat used to go without, on the reasoning that the beats
       * before it teach the interaction. That had a hole in it, because a
       * reader could arrive at that beat cold.
       *
       * Persistent rather than revealed after an idle timer. A prompt that
       * appears once the reader stops moving says "you are doing it wrong" or
       * "hurry up", and this is the one screen in the app built to be sat with:
       * the count beat exists so that a number climbs while nothing happens.
       * Nudging there would break the thing the sequence is for. At 9px and 30%
       * opacity a permanent label costs the last frame almost nothing, and it
       * cannot arrive at the wrong moment because it never arrives.
       */}
      <p className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-10 text-center font-mono text-[9px] uppercase tracking-[2.4px] text-white/30 sm:text-[11px]">
        {/* Keyed on the pointer, not the width. At sm: a tablet is 768 wide and
            touch, so it was being told to click anywhere or press space — the
            wrong instrument, on the device most likely to be held in two hands
            for something this long. pointer-coarse is the input, which is what
            the sentence is actually about. */}
        <span className="pointer-fine:hidden">{testMessages.verdict.advanceHintTouch}</span>
        <span className="hidden pointer-fine:inline">{testMessages.verdict.advanceHintPointer}</span>
      </p>
    </div>
  );
}
