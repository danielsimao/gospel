"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { DeathCounter } from "@/components/eternity/death-counter";
import { trackVerdictReached, trackVerdictRow } from "@/lib/analytics";
import { splitConfession, type ConfessionTone } from "@/lib/confession";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { TestMessages } from "@/lib/types";

interface VerdictScreenProps {
  messages: { title: string };
  testMessages: TestMessages;
}

/*
 * The sentence, delivered one beat at a time — and kept on the page once heard.
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
 * So each beat lands alone at full size, and the door does not exist until the
 * last one. Four devices, in order of how much work they do:
 *
 *   1. The exit is withheld for four beats.
 *   2. The count is the only thing that does not resolve — it keeps moving
 *      while the reader is held.
 *   3. Gold arrives exactly once, on ground the red has drained out of. The
 *      reader has seen nothing but red for ninety seconds.
 *   4. The last words are a question, at the foot of the record it questions.
 *
 * ── Heard beats recede; they do not vanish ─────────────────────────────────
 *
 * Beats used to replace each other, which gave this screen two faces: the
 * performance, and a separate "document" layout for a reader walking back from
 * grace — a page they had never seen, reached by a link that promised a
 * re-read. Now a heard beat recedes — caption scale, dimmed, above the beat
 * being heard — and the door beat settles the whole record to full strength in
 * one column. The final frame of the performance IS the re-read: walking back
 * from grace renders exactly the screen the reader left, because there is only
 * one layout to render.
 *
 * The recession is drastic by design, and the old eight-block screen is why:
 * it failed because GUILTY and the live count shared a frame at equal weight,
 * so two heroes fought. Accumulation puts them back in one frame, so a receded
 * beat drops to caption scale at under half opacity — the beat being heard has
 * to win by an order of magnitude, not a nudge. The count is the one receded
 * beat that keeps its glow and keeps moving: small and alive, never large and
 * competing. Everything brightens together only at the door, where nothing is
 * being heard any more and the record is the point.
 *
 * Advanced by tap, not by timer. A timed sequence that removes content the
 * reader is still reading needs a pause control to satisfy WCAG 2.2.2, and the
 * control undercuts the effect it exists to protect. Tap costs nothing and is
 * better rhetoric besides: the reader turns each page of their own sentence,
 * which makes the final tap onto grace a decision rather than an arrival.
 */
const BEATS = ["charge", "confession", "count", "claim", "door"] as const;

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

/*
 * What a beat is doing on screen right now.
 *
 * hero    — the beat being heard: full size, alone in its weight class.
 * receded — already heard while a later beat is speaking: caption scale,
 *           dimmed to less than half, so it is memory rather than competition.
 * settled — the record, once the door arrives: caption scale at full strength.
 *           This is also exactly the state a reader walking back from grace
 *           mounts into, which is what makes back-navigation land on a page
 *           they have already seen.
 */
type BeatPresence = "hero" | "receded" | "settled";

/** Class-change transitions do the recession; framer only ever runs a beat's
    entrance. Opacity, size and shadow all settle on this one curve. */
const RECEDE =
  "transition-all duration-500 ease-[var(--ease-out-strong)] motion-reduce:transition-none";

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
   * mid-exit and re-rendered the departing verdict: measured at 390×844, one
   * frame after the tap the whole record brightened over the door and stayed
   * for ~115ms until grace mounted. The screen was showing its own settled
   * layout on the way out.
   *
   * A mount-time read is also simply the truth: "did this reader arrive here
   * having already seen grace" cannot change while they are looking at it. The
   * shell keys each phase, so walking back from grace remounts this component and
   * the question is asked again then, which is the only moment it can differ.
   */
  const [returning] = useState(state.graceReached);

  // A returning reader mounts on the door beat, which IS the settled record —
  // the same frame their forward pass ended on. There is no second layout.
  const [beatIndex, setBeatIndex] = useState(returning ? LAST_BEAT : 0);
  const isLastBeat = beatIndex >= LAST_BEAT;

  /** Accumulation: a beat exists from the moment it is heard. */
  const shown = (i: number) => beatIndex >= i;

  const presence = (i: number): BeatPresence =>
    isLastBeat ? "settled" : i === beatIndex ? "hero" : "receded";

  /** Receded beats dim below half so the hero wins outright; the settled
      record returns to full strength because nothing competes with it. */
  const presenceOpacity = (i: number) =>
    presence(i) === "receded" ? "opacity-40" : "opacity-100";

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
  const beatEls = useRef<(HTMLDivElement | null)[]>([]);
  const doorRef = useRef<HTMLButtonElement>(null);
  const firstRenderRef = useRef(true);
  useEffect(() => {
    const isMount = firstRenderRef.current;
    firstRenderRef.current = false;
    // Both guards are the mount, reached two ways: beat 0 for a first arrival,
    // and the door beat for a reader coming back from grace.
    if (isMount || beatIndex === 0) return;
    // At the door the way on is the one thing left to activate, so focus goes
    // to it rather than to the record above it.
    if (beatIndex >= LAST_BEAT) doorRef.current?.focus();
    else beatEls.current[beatIndex]?.focus();
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


  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-7 pt-14 pb-[calc(5.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] sm:px-16 lg:px-28">
      {/*
       * The wash drains at the door, so the way on arrives on ground that is
       * no longer red — everything since the landing screen has been. A
       * returning reader mounts with it already drained: the record is not the
       * sentence being passed a second time.
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
       * One gesture for the whole screen, carried by two elements in turn.
       *
       * While beats are being heard, a real full-screen <button> advances the
       * sequence — reachable by Tab, activatable by space or enter, announced
       * as an action. It covers the screen because on touch the target is the
       * screen, and a pointer on a desktop has nothing else to aim at.
       *
       * At the door the way on becomes a visible button inside the record's own
       * column, and a <button> cannot contain a <button> — so the full-screen
       * element switches to grace's tap-surface idiom: aria-hidden, out of the
       * tab order, under the real control in z. Assistive tech gets the named
       * door; a thumb keeps the contract the last four beats taught. Stated
       * cost, same as grace pays: text on the settled record cannot be
       * selected. The record is short and the trade buys one interaction model
       * for the whole screen.
       */}
      {!isLastBeat ? (
        <button
          type="button"
          onClick={advance}
          aria-label={testMessages.nextLabel}
          /* The focus ring is the screen edge because the control is the screen —
             that is honest rather than decorative. Thin and inset, though: at 2px
             full-bleed it read as a border the design had grown, not as a
             transient indicator. #D4A843 at 70% measures ~4.4:1 on #060404, past
             the 3:1 that 1.4.11 asks of a focus indicator. */
          className="absolute inset-0 z-20 cursor-pointer outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-[6px] focus-visible:outline-[#D4A843]/70"
        />
      ) : (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          data-slot="verdict-tap-surface"
          onClick={(event) => {
            /* Blur for the reason grace's surface does: a focused aria-hidden
               element makes the browser refuse the hiding and put an unnamed
               control into the accessibility tree. */
            event.currentTarget.blur();
            handleBridgeClick();
          }}
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        />
      )}

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 text-center sm:max-w-2xl sm:gap-8 lg:max-w-4xl">
        {shown(0) && (
          <div
            ref={(el) => {
              beatEls.current[0] = el;
            }}
            tabIndex={-1}
            className={`outline-none ${RECEDE} ${presenceOpacity(0)}`}
          >
            <m.p
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: EASE_OUT_STRONG }}
              className={`font-score font-bold uppercase leading-none tracking-[0.06em] text-red-500 ${RECEDE} ${
                presence(0) === "hero"
                  ? "text-[62px] sm:text-[112px] lg:text-[150px]"
                  : "text-[26px] sm:text-[40px] lg:text-[48px]"
              }`}
              style={{
                textShadow:
                  presence(0) === "hero"
                    ? "0 0 90px rgba(239,68,68,0.4)"
                    : "0 0 40px rgba(239,68,68,0.25)",
              }}
            >
              {messages.title.replace(/\.$/, "")}
            </m.p>
          </div>
        )}

        {/*
         * The payload. Heard as a hero it has a screen's weight to itself, so
         * it does not have to shout to win — 29px on a phone, and capped by
         * measure rather than grown to fill a desktop. Centred text past ~60
         * characters a line stops being readable, and this is the sentence
         * that has to land. Receded it keeps its tones: the admitted and the
         * evaded stay distinguishable at every size, because the distinction
         * is content, not styling.
         */}
        {shown(1) && (
          <div
            ref={(el) => {
              beatEls.current[1] = el;
            }}
            tabIndex={-1}
            className={`outline-none ${RECEDE} ${presenceOpacity(1)}`}
          >
            <m.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT_STRONG }}
              className={`font-medium tracking-[-0.02em] ${CONFESSION_PLAIN} ${RECEDE} ${
                presence(1) === "hero"
                  ? "text-[29px] leading-[1.26] sm:text-[42px] sm:leading-[1.24] lg:text-[46px]"
                  : "text-[15px] leading-[1.5] sm:text-[18px] lg:text-[19px]"
              }`}
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
          </div>
        )}

        {/*
         * The one thing that does not resolve. Under tap-advance it holds for
         * as long as the reader looks at it, which is strictly better than the
         * old 2.5s window: the number climbs while they sit with it. Receded
         * it keeps its glow and keeps counting — the device survives at small
         * size because motion, not scale, is what it runs on.
         */}
        {shown(2) && (
          <div
            ref={(el) => {
              beatEls.current[2] = el;
            }}
            tabIndex={-1}
            className={`flex flex-col items-center outline-none ${RECEDE} ${presenceOpacity(2)}`}
          >
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
                className={`text-center font-mono font-extrabold leading-none tabular-nums text-red-500 ${RECEDE} ${
                  presence(2) === "hero"
                    ? "text-[76px] sm:text-[128px] lg:text-[150px]"
                    : "text-[30px] sm:text-[44px] lg:text-[48px]"
                }`}
                style={{
                  textShadow:
                    presence(2) === "hero"
                      ? "0 0 70px rgba(239,68,68,0.3)"
                      : "0 0 30px rgba(239,68,68,0.25)",
                }}
              />
              <p
                className={`italic leading-relaxed text-white/60 ${RECEDE} ${
                  presence(2) === "hero"
                    ? "mt-4 text-sm sm:text-[19px] lg:text-xl"
                    : "mt-1.5 text-[11px] sm:text-[13px]"
                }`}
              >
                {testMessages.verdict.deathLineTemplate}
              </p>
              <p
                className={`leading-relaxed text-red-400/85 ${RECEDE} ${
                  presence(2) === "hero"
                    ? "mt-2 text-sm sm:text-[19px] lg:text-xl"
                    : "mt-1 text-[11px] sm:text-[13px]"
                }`}
              >
                {testMessages.verdict.deathLineImplication}
              </p>
            </m.div>
          </div>
        )}

        {/*
         * Their own claim, answered — and the law that answers it. Only when
         * they made a claim: someone who reached the test without passing the
         * question has nothing to quote back, and this is testimony, so there
         * is nothing to infer when it is absent. James 2:10 carries the beat
         * alone in that case, which is the argument the six questions build.
         */}
        {shown(3) && (
          <div
            ref={(el) => {
              beatEls.current[3] = el;
            }}
            tabIndex={-1}
            className={`flex flex-col items-center outline-none ${RECEDE} ${presenceOpacity(3)}`}
          >
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT_STRONG }}
              className="flex flex-col items-center"
            >
              {state.selfRating && (
                <p
                  className={`text-white/80 ${RECEDE} ${
                    presence(3) === "hero"
                      ? "text-[21px] leading-[1.4] sm:text-[30px] lg:text-[34px]"
                      : "text-[13px] leading-[1.5] sm:text-[15px] lg:text-[16px]"
                  }`}
                >
                  {testMessages.verdict.selfRatingMirror[state.selfRating]}
                </p>
              )}
              <p
                className={`max-w-xl italic text-white/55 ${RECEDE} ${
                  presence(3) === "hero"
                    ? `${state.selfRating ? "mt-8 sm:mt-10" : ""} text-[15px] leading-[1.8] sm:text-lg`
                    : `${state.selfRating ? "mt-3" : ""} text-[12px] leading-[1.7] sm:text-[13px]`
                }`}
              >
                &ldquo;{testMessages.verdict.scripture}&rdquo;
              </p>
              {/* red-400/75 is the AA floor for text this size on #060404
                  (≈4.6:1). red-400/70 measures 4.1:1 and fails 1.4.3. */}
              <p
                className={`font-mono uppercase tracking-[2px] text-red-400/75 ${RECEDE} ${
                  presence(3) === "hero"
                    ? "mt-3 text-[10px] sm:text-xs"
                    : "mt-2 text-[9px] sm:text-[10px]"
                }`}
              >
                {testMessages.verdict.scriptureRef}
              </p>
            </m.div>
          </div>
        )}

        {/*
         * The way on, at the foot of the record it questions. The one gold
         * thing in the flow — GUILTY and the count are both set with a
         * coloured glow of their own colour; this is the same treatment, which
         * makes the change of colour the whole event.
         *
         * A real, visible button rather than words inside the full-screen
         * control: the record above it is content a screen reader should reach
         * without walking through an unlabelled overlay, and the tap surface
         * behind this covers the thumb's version of the same intent. No arrow
         * under it — nothing is below the fold, and an arrow pointing down is
         * the page's own vocabulary for "scroll".
         */}
        {isLastBeat && (
          <m.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            className="relative z-20"
          >
            <button
              type="button"
              ref={doorRef}
              onClick={handleBridgeClick}
              className="cursor-pointer rounded-lg px-4 py-2 outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#D4A843]/70"
            >
              <span
                className="text-[26px] font-medium leading-[1.3] tracking-[-0.02em] text-[#D4A843] sm:text-[34px] lg:text-[40px]"
                style={{ textShadow: "0 0 70px rgba(212,168,67,0.35)" }}
              >
                {testMessages.verdict.bridgeButton}
              </span>
            </button>
          </m.span>
        )}
      </div>

      {/* Where the reader is, and the first signal that the colour of the flow
          has changed: the last dot is gold, and it turns as the door arrives.
          One layout means the pager stays for the settled record too — there
          it simply reads "the end", which is where a returning reader is. */}
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
       * The affordance, on every beat including the settled record, worded for
       * the device: a thumb taps, a pointer has nothing to aim at. One layout
       * means it is finally always true — the full-screen control exists on
       * every beat, as a labelled button while beats are heard and as the tap
       * surface behind the door once the record settles.
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
