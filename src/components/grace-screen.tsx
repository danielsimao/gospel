"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { GraceRecord } from "@/components/grace-record";
import { BeatStrip } from "@/components/shared/beat-strip";
import { buildRecord } from "@/lib/confession";
import { trackGraceViewed } from "@/lib/analytics";
import {
  trackGraceRevealed,
  trackGraceBeatRevealed,
  trackGraceTapAdvance,
} from "@/lib/eternity-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { BEAT_WORDS_ATTR, useBeatGestures } from "@/lib/use-beat-gestures";

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
    /* `grace.tapContinue` is deliberately absent. It is touch-only wording on a
       screen a desktop reader also meets; the verdict's pair of strings below
       already solved that. The key still exists in both locales — orphaning a
       string is cheaper to undo than deleting one. */
    /* `grace.rereadVerdict` is deliberately absent too, and orphaned in both
       locales rather than deleted: the way back to the verdict is the shell's
       chip, and a backward link under the forward control is the worst place
       to offer it. */
    record: React.ComponentProps<typeof GraceRecord>["messages"];
  };
  /** The six charge nouns, keyed by commandment. Passed in rather than read
      from the whole message tree: the record needs this one map and nothing
      else, and it is the same map the verdict's confession sentence uses. */
  verdictLabels: Record<string, string>;
  /**
   * The verdict's advance hint, verbatim, in both its forms. The sentence at
   * the seam is the one the reader has just followed five times, which is the
   * whole point of showing it here — the same instrument, now in gold.
   */
  advanceHint: { touch: string; pointer: string };
  /** The surface's accessible name — the verdict's own, for the same control. */
  nextLabel: string;
}

/*
 * Grace, one beat at a time — the verdict's instrument, in gold.
 *
 * This screen was a scroll: seven full-viewport sections in one long document,
 * with a tap surface laid over it that jumped a section at a time. Both
 * gestures worked, and that was the problem. Measured at 390x844:
 *
 *   - Three quick flicks, about five seconds, carried a reader from the
 *     announcement to "So what now?". The second flick alone travelled 3,000px,
 *     past "Someone pays the fine in full" and "That someone is Jesus Christ".
 *     Read at a normal pace the argument takes about a minute. The Law could
 *     not be skimmed; the answer to it could.
 *   - One ordinary swipe settled 524px down — the tail of one movement and the
 *     head of the next on one screen, on a page whose argument is that each
 *     step follows from the one before it.
 *   - Once the first hint retired, the only thing left moving on each screen
 *     was a bobbing down-chevron: the eye goes to motion first, and the motion
 *     said "leave this". The owner, who knows this flow better than anyone, did
 *     not know the screen answered a tap.
 *
 * So grace now works exactly as the verdict does. One beat on the screen,
 * replaced in place. Whatever the reader reaches for — a tap anywhere, a swipe
 * up, the wheel, Space, ↓ or → — moves exactly one beat on; the opposites move
 * one back. Same hint, same dots, same place. Nothing on the screen moves but
 * the beat arriving.
 *
 * ── Why this is not the accordion coming back ──────────────────────────────
 *
 * The accordion was removed because withholding is the Law's instrument: one
 * rung open and three greyed labels, the argument visibly locked away. Nothing
 * is locked here. Every beat is whole when it arrives, and there are no
 * greyed rungs — there is the beat, and the reader's own hand turning to the
 * next one. That is pacing, and it is how the courtroom analogy is actually
 * delivered: out loud, one sentence after another. Nobody skims a speaker.
 *
 * The number of taps did not change. A reader who tapped through the scroll
 * tapped six times; they still do. What went is the skim.
 *
 * ── Re-reading ──────────────────────────────────────────────────────────────
 *
 * Back one beat is the mirror of forward and needs no teaching. The dots go
 * further: they are buttons for every beat already reached, and never for one
 * that has not been — the first pass is paced, the second is free. Once the
 * reader has reached the decision every beat is reached, so the decision's
 * "← Grace" chip lands on the announcement (the argument builds, so it is
 * re-read forwards, which is also the owner's 2026-08-15 rule for the
 * verdict) with every dot open, and the way back to the decision is two taps:
 * the last dot, then "So what now?".
 *
 * There is no server-rendered grace to protect. The flow lives in client
 * state and grace is only ever reached by a dispatch, so the one-beat-at-a-time
 * render cannot hide the argument from a reader without JavaScript — that
 * reader never gets past the landing.
 */

const BEATS = ["announcement", "problem", "payment", "payer", "response", "promise", "record"] as const;
const LAST_BEAT = BEATS.length - 1;

/** The four movements are beats 1–4, and only they carry beat analytics. */
const FIRST_MOVEMENT = 1;
const MOVEMENTS = 4;

/**
 * The record's arrival, in three steps.
 *
 * The record is grace's peak: the reader's own charges, "Ability to pay: none",
 * and then PAID IN FULL across it. It used to arrive in one frame with the
 * button beside it, so the stamp, the record and the way on all asked for the
 * same glance. Now the record lands, the stamp lands on it, and only then is
 * there a way on.
 *
 * The stamp lands by itself, never on the reader's tap. A tap that produced
 * "Paid in full" would read as the tap paying — docs/METHOD.md, "No
 * decisionism": nothing may promise that a tap saves. Someone else paid; the
 * reader watches it land.
 *
 * Only the first time. A reader coming back to their own record — from the
 * decision, or a beat back and forward again — is shown it already stamped,
 * as the decision screen does for a reader returning to their own answer.
 */
type RecordStage = "waiting" | "stamped" | "open";
const STAMP_DELAY_MS = 900;
const WAY_ON_DELAY_MS = 1700;

/** The beat's ground fades in; its words rise in after it, as a verdict beat's
    do. Opacity and transform only, so an arriving beat never moves the page.
    The words carry the marker the gestures measure to decide whether any of
    them are still below the fold. */
const BEAT_ENTRANCE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, ease: EASE_OUT_STRONG },
} as const;
const WORDS_ENTRANCE = {
  [BEAT_WORDS_ATTR]: true,
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay: 0.05, ease: EASE_OUT_STRONG },
} as const;

/*
 * Every beat is a full-width frame that centres its words between the shell's
 * edge chips and the strip at the bottom — the verdict's own insets, so a
 * beat's words sit where the verdict's did. A beat taller than the screen
 * grows past it and the page scrolls; the gestures show the rest of it before
 * they leave it.
 *
 * A beat's ground is `fixed inset-0`, like the verdict's wash, not absolute
 * to the frame: the shell pads the flow by 12px at the top, and a ground
 * clipped to the frame left a dark band across the courtroom on desktop. Fixed,
 * it is the screen's ground, and it holds still under a beat that scrolls.
 * Only opacity is animated on the frame — a transform there would make it the
 * containing block for these, and pin them to the frame again.
 */
const BEAT_FRAME =
  "relative z-10 flex flex-1 flex-col justify-center overflow-hidden px-5 pt-14 pb-[calc(5.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] outline-none sm:px-6";

/**
 * Beats reached, from the persisted count — clamped, because it comes out of
 * storage and storage holds whatever was last written there. Used raw, a value
 * past the end would unlock beats nobody has seen, and a corrupted one could
 * be anything at all.
 */
function clampReached(count: number): number {
  return Math.min(Math.max(Math.trunc(count) || 0, 0), BEATS.length);
}

export function GraceScreen({ messages, verdictLabels, advanceHint, nextLabel }: GraceScreenProps) {
  const dispatch = useGameDispatch();
  const state = useGameState();

  /*
   * Whether this is the reader's first arrival. Back and forward remount this
   * screen routinely, so every analytics event has to be once-per-session
   * rather than once-per-mount, or the metrics inflate with every glance back.
   * graceReached cannot answer it — SHOW_GRACE sets it before this renders.
   * The beat count can: it is persisted and starts at 0.
   */
  const firstVisitRef = useRef(state.graceBeatsRevealed === 0 && !state.invitationReached);

  const [beat, setBeat] = useState(0);
  const [recordStage, setRecordStage] = useState<RecordStage>("waiting");

  /*
   * How far the reader has been. Reaching the decision means every beat was
   * reached, whatever the count says — a session from before the count meant
   * beats still opens every dot to a reader re-reading from the decision.
   */
  const reached = state.invitationReached ? BEATS.length : clampReached(state.graceBeatsRevealed);
  const furthest = Math.max(reached - 1, beat);
  const deepestRef = useRef(0);

  /*
   * Every move goes through here, so a beat is reported the first time it is
   * reached and never again — in an event handler rather than an effect,
   * because "first time" is a fact about the moment of arriving and an effect
   * that runs twice would decide it twice.
   */
  function goTo(target: number) {
    if (target === beat || target < 0 || target > LAST_BEAT) return;
    const firstTime = target >= reached;
    if (firstTime) {
      if (target >= FIRST_MOVEMENT && target < FIRST_MOVEMENT + MOVEMENTS) {
        trackGraceBeatRevealed(target - FIRST_MOVEMENT);
      }
      dispatch({ type: "REVEAL_GRACE_BEAT", count: target + 1 });
    }
    if (target === LAST_BEAT) setRecordStage(firstTime ? "waiting" : "open");
    deepestRef.current = Math.max(deepestRef.current, target);
    setBeat(target);
  }

  /** A dot: back to anywhere already reached, never past it. */
  function jumpTo(target: number) {
    if (target > furthest) return;
    goTo(target);
  }

  const { surfaceProps } = useBeatGestures({
    beat,
    canNext: beat < LAST_BEAT,
    canPrev: beat > 0,
    onMove: (direction, input) => {
      if (direction === "prev") {
        goTo(beat - 1);
        return;
      }
      goTo(beat + 1);
      if (input === "tap") trackGraceTapAdvance();
    },
  });

  // Arriving is reaching the announcement. Idempotent: the reducer's count is
  // monotonic, so a remount re-dispatching 1 changes nothing.
  useEffect(() => {
    dispatch({ type: "REVEAL_GRACE_BEAT", count: 1 });
  }, [dispatch]);

  // One step of the record's arrival at a time. Scheduling only the next step
  // means an effect that re-runs reschedules the same step rather than
  // starting a second clock.
  useEffect(() => {
    if (beat !== LAST_BEAT || recordStage === "open") return;
    const next: RecordStage = recordStage === "waiting" ? "stamped" : "open";
    const delay = recordStage === "waiting" ? STAMP_DELAY_MS : WAY_ON_DELAY_MS - STAMP_DELAY_MS;
    const timer = setTimeout(() => setRecordStage(next), delay);
    return () => clearTimeout(timer);
  }, [beat, recordStage]);

  /*
   * Focus follows the beat, as on the verdict: a screen reader's cursor lands
   * on the new content and nothing is announced on a timer. Skipped on mount,
   * where the shell has already moved focus to the phase.
   */
  const beatRef = useRef<HTMLElement>(null);
  const firstBeatRef = useRef(true);
  useEffect(() => {
    if (firstBeatRef.current) {
      firstBeatRef.current = false;
      return;
    }
    // Only the section for this beat: the ref is shared by all seven and a
    // stale one must not take focus on its way out.
    const section = beatRef.current;
    if (section?.dataset.beat === String(beat)) section.focus({ preventScroll: true });
  }, [beat]);

  // Idempotent: the verdict's door is what dispatches SHOW_GRACE, and the
  // reducer refuses it from any phase but the verdict. Kept so the screen still
  // records its own arrival if it is ever mounted another way.
  useEffect(() => {
    dispatch({ type: "SHOW_GRACE" });
  }, [dispatch]);

  /*
   * Dwell time, and how far in the reader got. The second number used to be
   * scroll depth; with no scroll it is the deepest beat reached as a share of
   * the way to the record, which is what scroll depth was standing in for.
   * Only the first visit is measured — a walk back to the verdict unmounts
   * this screen, and reporting every departure would bury the genuine dwell
   * time under short re-reads.
   */
  useEffect(() => {
    const start = Date.now();
    const wasFirstVisit = firstVisitRef.current;
    const deepest = deepestRef;
    return () => {
      if (wasFirstVisit) {
        trackGraceViewed(Date.now() - start, Math.round((deepest.current / LAST_BEAT) * 100));
      }
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

  const [problem, payment, payer, response] = messages.beats;

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Ambient wash, fixed so it holds still while the beats change over it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/*
       * The surface: the whole screen, as on the verdict. A real <button>, so
       * it is reachable by Tab, activated by Space or Enter, and announced as
       * the action it is. Nothing about it looks like a button; it is doing
       * accessibility work, not visual work.
       *
       * Gone on the record. That beat ends in the way to the decision, and an
       * invisible control over a real one is where this trade stops paying —
       * the reader who has been tapping the middle of the screen for twelve
       * beats meets one where the middle does nothing, and has to look for the
       * way on. That is the brake before the decision, and it is meant.
       */}
      {beat < LAST_BEAT && (
        <button
          type="button"
          {...surfaceProps}
          aria-label={nextLabel}
          className="absolute inset-0 z-20 cursor-pointer outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-[6px] focus-visible:outline-[#D4A843]/70"
        />
      )}

      {/*
       * 0 · The announcement.
       *
       * A screen of it, alone. The verdict's door asked "Is there any hope?" and
       * this is the reply — same colour, one step larger, in the same place,
       * because the reply should not be quieter than the question. Both strings
       * are committed vocabulary and go in verbatim.
       *
       * "But God…" (Ephesians 2:4) sits above rather than below, and that is
       * doctrinal rather than visual: alone and at this size, "Someone paid
       * your fine" stops naming a topic and declares something to this reader
       * — before repentance is named at all, four beats on. The verse frames it
       * as the scriptural turn rather than a personal guarantee.
       */}
      {beat === 0 && (
        <m.section
          ref={beatRef}
          data-beat="0"
          tabIndex={-1}
          {...BEAT_ENTRANCE}
          className={`${BEAT_FRAME} items-center text-center`}
        >
          <m.div {...WORDS_ENTRANCE} className="flex flex-col items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#D4A843]/60 sm:text-xs">
              {messages.beatsHeading}
            </span>
            <span
              className="text-[33px] font-semibold leading-[1.24] tracking-[-0.025em] text-[#D4A843] sm:text-[46px] lg:text-[56px]"
              style={{ textShadow: "0 0 70px rgba(212,168,67,0.32)" }}
            >
              {messages.label}
            </span>
          </m.div>
        </m.section>
      )}

      {/*
       * 1 · Movement I — the problem, in the Law's colour.
       *
       * Still red, because it is still the Law: a just judge, a penalty, and no
       * ability to pay. METHOD.md is explicit that this step cannot be cut —
       * without the courtroom, "someone pays" has no venue and no legal force —
       * and it is what gives the turn after it something to resolve.
       */}
      {beat === 1 && (
        <m.section
          ref={beatRef}
          data-beat="1"
          tabIndex={-1}
          {...BEAT_ENTRANCE}
          className={BEAT_FRAME}
        >
          {/*
           * The dock, dimmed — the empty rail behind the reader's own imagined
           * standing-there, not a scene to look at. Deliberately quieter than
           * the turn's full-strength courtroom: that is the screen's one hinge,
           * and giving every movement the same treatment would flatten it.
           * Radial-masked and low-opacity like the homepage's band textures,
           * red-tinted because this is still the Law — no gold here,
           * docs/graphics/PROMPTS.md §31. The frame is the full width of the
           * screen, so it never reads as a box floating in black.
           */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 overflow-hidden"
            style={{
              opacity: 0.16,
              maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)",
              backgroundImage:
                "linear-gradient(rgba(239,68,68,0.35), rgba(239,68,68,0.35)), url(/graphics/dock.avif)",
              backgroundSize: "cover, cover",
              backgroundPosition: "center, center",
              backgroundBlendMode: "color, normal",
            }}
          />
          <m.div {...WORDS_ENTRANCE} className="relative mx-auto w-full max-w-lg">
            {/*
             * text-shadow, a contrast fix and not decoration: this eyebrow's
             * red-400/70 already sits under the 4.5:1 AA floor against pure
             * black (measured 4.0:1), and the dock behind it pushes that as low
             * as 2.35:1 at its brightest point. A dark halo holds contrast up
             * whatever is behind the glyphs.
             */}
            <p
              className="font-mono text-[9px] uppercase tracking-[2.6px] text-red-400/70"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
            >
              {problem?.label}
            </p>
            <h2 className="mt-4 text-[25px] font-semibold leading-[1.22] tracking-[-0.024em] text-white/95 sm:text-[30px]">
              {problem?.headline}
            </h2>
            <p className="mt-4 border-l border-red-500/30 pl-4 text-[14px] leading-relaxed text-white/55 sm:text-[15px]">
              {problem?.subtitle}
            </p>
          </m.div>
        </m.section>
      )}

      {/*
       * 2 · The turn.
       *
       * Full-strength, and the only place in grace where the flow's two colours
       * meet in one element: the red of the beat before resolves to gold under
       * the beat where someone pays — the hinge of the analogy given the whole
       * screen.
       *
       * Two background layers, swapped at `sm`, rather than `cover` alone.
       * `courtroom.avif` is portrait, composed against a phone; at desktop
       * widths `cover` scales it by width alone and blows the floor-light
       * detail up into a blob overlapping the heading. `courtroom-wide.avif`
       * is the same scene composed landscape, so `cover` asks it for the crop
       * it was made for.
       */}
      {beat === 2 && (
        <m.section
          ref={beatRef}
          data-beat="2"
          tabIndex={-1}
          {...BEAT_ENTRANCE}
          className={BEAT_FRAME}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 sm:hidden"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(239,68,68,0.07) 0%, rgba(212,168,67,0.10) 52%, transparent 100%), linear-gradient(to bottom, rgba(6,4,4,0.35) 0%, rgba(6,4,4,0.62) 100%), url(/graphics/courtroom.avif)",
              backgroundSize: "cover, cover, cover",
              backgroundPosition: "center, center, center bottom",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 hidden sm:block"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(239,68,68,0.07) 0%, rgba(212,168,67,0.10) 52%, transparent 100%), linear-gradient(to bottom, rgba(6,4,4,0.35) 0%, rgba(6,4,4,0.62) 100%), url(/graphics/courtroom-wide.avif)",
              backgroundSize: "cover, cover, cover",
              backgroundPosition: "center, center, center",
            }}
          />
          <m.div {...WORDS_ENTRANCE} className="relative mx-auto w-full max-w-lg">
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
          </m.div>
        </m.section>
      )}

      {/* 3 · Movement III — the payer, named. */}
      {beat === 3 && (
        <m.section
          ref={beatRef}
          data-beat="3"
          tabIndex={-1}
          {...BEAT_ENTRANCE}
          className={BEAT_FRAME}
        >
          {/*
           * Reused, not regenerated — the empty tomb already argues this exact
           * claim on who-is-jesus's own topic page (§17): the resurrection is
           * the credential that makes this someone the payer. Dimmed and
           * radial-masked here — atmosphere, not a second cover.
           * docs/graphics/PROMPTS.md §32.
           */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 overflow-hidden"
            style={{
              opacity: 0.16,
              maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)",
              backgroundImage:
                "linear-gradient(rgba(212,168,67,0.35), rgba(212,168,67,0.35)), url(/graphics/covers/who-is-jesus.avif)",
              backgroundSize: "cover, cover",
              backgroundPosition: "center, center",
              backgroundBlendMode: "color, normal",
            }}
          />
          <m.div {...WORDS_ENTRANCE} className="relative mx-auto w-full max-w-lg">
            {/* text-shadow, contrast fix: 5.4:1 against pure black, but the
                tomb's own rim-lit edge can drop that under 3:1 locally. Same
                fix as Movement I's eyebrow. */}
            <p
              className="font-mono text-[9px] uppercase tracking-[2.6px] text-[#D4A843]/75"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
            >
              {payer?.label}
            </p>
            <h2 className="mt-4 text-[25px] font-semibold leading-[1.22] tracking-[-0.024em] text-[#D4A843] sm:text-[30px]">
              {payer?.headline}
            </h2>
            <p className="mt-4 border-l border-[#D4A843]/30 pl-4 text-[14px] leading-relaxed text-white/60 sm:text-[15px]">
              {payer?.subtitle}
            </p>
          </m.div>
        </m.section>
      )}

      {/* 4 · Movement IV — the response. The imperative, and it arrives last
          by design: the indicative has had four beats to land first. */}
      {beat === 4 && (
        <m.section
          ref={beatRef}
          data-beat="4"
          tabIndex={-1}
          {...BEAT_ENTRANCE}
          className={BEAT_FRAME}
        >
          {/*
           * Reused, not regenerated — what-is-repentance's own turn (§27, the
           * hairpin track) is this movement's exact subject: "Repent — turn
           * from your sin." Same dimmed, radial-masked treatment as Movement
           * III. docs/graphics/PROMPTS.md §32.
           */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 overflow-hidden"
            style={{
              opacity: 0.16,
              maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)",
              backgroundImage:
                "linear-gradient(rgba(212,168,67,0.35), rgba(212,168,67,0.35)), url(/graphics/covers/what-is-repentance.avif)",
              backgroundSize: "cover, cover",
              backgroundPosition: "center, center",
              backgroundBlendMode: "color, normal",
            }}
          />
          <m.div {...WORDS_ENTRANCE} className="relative mx-auto w-full max-w-lg">
            {/* text-shadow, contrast fix: same reasoning as Movement III's
                eyebrow — the hairpin track's lit dust can read bright enough
                locally to threaten AA against the gold at 75% opacity. */}
            <p
              className="font-mono text-[9px] uppercase tracking-[2.6px] text-[#D4A843]/75"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
            >
              {response?.label}
            </p>
            <h2 className="mt-4 text-[25px] font-semibold leading-[1.22] tracking-[-0.024em] text-[#D4A843] sm:text-[30px]">
              {response?.headline}
            </h2>
            <p className="mt-4 border-l border-[#D4A843]/30 pl-4 text-[14px] leading-relaxed text-white/60 sm:text-[15px]">
              {response?.subtitle}
            </p>
          </m.div>
        </m.section>
      )}

      {/* 5 · The promise. */}
      {beat === 5 && (
        <m.section
          ref={beatRef}
          data-beat="5"
          tabIndex={-1}
          {...BEAT_ENTRANCE}
          className={BEAT_FRAME}
        >
          <m.div {...WORDS_ENTRANCE} className="relative mx-auto w-full max-w-lg">
            <blockquote className="border-l border-[#D4A843]/30 pl-4">
              <p className="text-[15px] italic leading-[1.8] text-white/60 sm:text-base">
                &ldquo;{messages.scripture}&rdquo;
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
                {messages.scriptureRef}
              </p>
            </blockquote>
          </m.div>
        </m.section>
      )}

      {/*
       * 6 · The record, and the way on.
       *
       * The four movements say what happened in general: a judge, a penalty,
       * someone who paid. This says it about the reader, out of their own six
       * answers, and it is deliberately the last beat rather than the first.
       * Opening grace with a charge sheet would restate the Law at the moment
       * the flow is supposed to announce; ending with one lands the general
       * truth on the particular reader while the question is still in front of
       * them.
       *
       * The way on shares the beat with the record because the record is the
       * thing it acts on, and a screen holding only a button is a gesture
       * charged for nothing. It is held back until the stamp has landed — see
       * RecordStage — and gated by visibility rather than opacity alone: a
       * button at opacity 0 is an invisible click target, which this codebase
       * has been caught by before. Its space is held from the start, so the
       * record does not move when it arrives.
       */}
      {beat === LAST_BEAT && (
        <m.section
          ref={beatRef}
          data-beat="6"
          tabIndex={-1}
          {...BEAT_ENTRANCE}
          className={BEAT_FRAME}
        >
          <m.div {...WORDS_ENTRANCE} className="relative mx-auto w-full max-w-lg">
            <GraceRecord
              rows={buildRecord(state.answers, verdictLabels)}
              messages={messages.record}
              stamped={recordStage !== "waiting"}
            />

            <div
              className={`mt-10 flex flex-col items-center transition-opacity duration-500 ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
                recordStage === "open" ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              <Button variant="gold" mist onClick={handleContinue}>
                {messages.continueLabel}
                <ButtonArrow />
              </Button>
            </div>
          </m.div>
        </m.section>
      )}

      <BeatStrip
        count={BEATS.length}
        current={beat}
        currentClassName="bg-[#D4A843]"
        hint={beat < LAST_BEAT ? advanceHint : null}
        navigation={{
          labels: [
            messages.label,
            ...messages.beats.map((movement) => movement.label),
            messages.scriptureRef,
            messages.record.eyebrow,
          ],
          furthest,
          onSelect: jumpTo,
        }}
      />
    </div>
  );
}
