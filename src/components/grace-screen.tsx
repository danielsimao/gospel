"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { GraceRecord } from "@/components/grace-record";
import { ScrollCue } from "@/components/shared/scroll-cue";
import { buildRecord } from "@/lib/confession";
import { trackGraceViewed } from "@/lib/analytics";
import {
  trackGraceRevealed,
  trackGraceBeatRevealed,
  trackGraceTapAdvance,
} from "@/lib/eternity-analytics";
import { advanceSection } from "@/lib/advance-section";
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
    record: React.ComponentProps<typeof GraceRecord>["messages"];
  };
  /** The six charge nouns, keyed by commandment. Passed in rather than read
      from the whole message tree: the record needs this one map and nothing
      else, and it is the same map the verdict's confession sentence uses. */
  verdictLabels: Record<string, string>;
  /**
   * The verdict's advance hint, verbatim, in both its forms.
   *
   * `grace.tapContinue` stays orphaned: it exists, it says "Toca para
   * continuar", and it is touch-only wording on a screen a desktop reader also
   * meets. The verdict already solved that with a pair of strings and a
   * pointer-fine swap, and using ITS pair rather than adding a third phrasing
   * means the sentence at the seam is the one the reader has already followed
   * five times — which is the entire point of showing it here.
   */
  advanceHint: { touch: string; pointer: string };
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
 * persuades by accumulation. So it is delivered that way here: nothing is
 * withheld, and no gate stands between one movement and the next.
 *
 * ── Tapping, which is not a gate ────────────────────────────────────────────
 *
 * A reader arrives here having tapped five times — the verdict is a full-screen
 * button and every beat advances from anywhere on it. Grace then changed the
 * contract without saying so, and a tester duly tapped the middle of the
 * announcement, got nothing, and was stranded on the one screen in the flow
 * whose job is to answer a question the screen before it just asked.
 *
 * So the gesture carries over: the whole screen is a tap target that moves the
 * page on by one section. It is deliberately NOT the accordion coming back.
 * Every word is in the DOM from the first paint, a scroll reaches all of it,
 * and the tap only moves the viewport — it withholds nothing, which is the
 * distinction that matters here. Withholding is the Law's instrument.
 *
 * The surface retires at the last section, where the Continue button and the
 * walk-back link live: an invisible control over a real choice is the one place
 * this trade stops being worth it.
 *
 * Cost, stated plainly: text cannot be selected on this screen while the
 * surface is up. There is nothing to copy and no link to reach in the argument,
 * so it is paid willingly — and `grace_tap_advance` reports whether anything
 * was bought with it.
 *
 * ── One screen per section ──────────────────────────────────────────────────
 *
 * Every section claims a full viewport and centres its own content. That is a
 * consequence of the tap, not a taste: the movements were 832, 509, 692, 529,
 * 506, 104, 440 and 248px tall, so a tap that centred the next one left the
 * tail of the last still on screen and the head of the next already showing —
 * two movements visible at once, out of a page whose whole argument is that
 * each step follows from the one before it. Sized to the viewport, a tap lands
 * on exactly one movement and the beat is the frame.
 *
 * It is also what the verdict does. Every beat there is one screen, and grace
 * reading as a continuous scroll of ragged blocks was the seam showing from the
 * other side.
 *
 * `svh`, not `dvh`, and on a long scroller that is the difference between calm
 * and seasick. `dvh` tracks the viewport as the phone's URL bar collapses and
 * expands, so mid-drag every one of these eight sections would grow or shrink,
 * the document height would change under the reader's thumb, and the words they
 * were holding would move. `svh` is fixed at the bar-expanded size: the page
 * stops resizing itself while being read, at the price of a strip of ground
 * below the fold once the bar retracts, which on a black background is nothing.
 * The shell keeps `min-h-dvh` — it is one screen, it never scrolls, and there
 * it is the right unit.
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

/** The announcement, four movements, the scripture, and the record with the way
    on beneath it. Only the four movements carry beat analytics; see
    BEAT_SECTIONS. */
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

export function GraceScreen({ messages, verdictLabels, advanceHint, onBack }: GraceScreenProps) {
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
  /*
   * Which movements have already been reported — seeded from what the session
   * remembers, not started empty.
   *
   * Empty on every mount was a real overcount: back and forward are a single
   * gesture here and remount this screen routinely, so a reader glancing back
   * at the verdict and returning re-reported every movement they had already
   * passed. The reducer's guard is monotonic and rejected the regressive state,
   * which is exactly why nobody noticed — the STATE was right while the events
   * were duplicated, and the events are what the funnel is built from.
   *
   * `graceBeatsRevealed` is persisted and counts movements reached, so indices
   * below it have been reported by definition.
   */
  const reportedRef = useRef<Set<number>>(
    /*
     * Clamped, because this count comes out of storage and storage holds
     * whatever was last written there. Used raw as an array length it is a
     * loaded gun: a value above BEAT_SECTIONS silently suppresses real beat
     * events, and Infinity or a large number from a corrupted or hand-edited
     * session throws or allocates until the tab dies. The only meaningful
     * values are the four movement indices.
     */
    new Set(
      Array.from(
        {
          length: Math.min(
            Math.max(Math.trunc(state.graceBeatsRevealed) || 0, 0),
            BEAT_SECTIONS,
          ),
        },
        (_, i) => i,
      ),
    ),
  );

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

  /*
   * Whether the reader has reached the way out — tracked separately from
   * `shown`, and that separation is load-bearing.
   *
   * `shown` starts all-true so a reader without JS, or without an
   * IntersectionObserver, gets the whole argument rather than a blank screen.
   * Deriving "has reached the end" from it inherits that default backwards: the
   * observer-less fallback would mean the reader is treated as having arrived
   * before they have started, and the tap surface and its cue would never
   * render at all — the affordance silently absent in exactly the environment
   * the fallback exists to protect.
   *
   * So this starts false and only the observer, or a mount-time measurement,
   * can set it.
   */
  const [reachedWayOut, setReachedWayOut] = useState(false);

  /*
   * Whether the reader has moved yet, which is what the hint is waiting on.
   *
   * The capability stays for the whole visit; the sentence teaching it does
   * not. A reader who has advanced once knows how, and a line of type repeated
   * over six screens of the gospel is noise laid over the argument. This is the
   * asymmetry that matters: retire the hint, never the gesture.
   */
  const [hasMoved, setHasMoved] = useState(false);

  /*
   * Whether the observer that retires the tap surface actually exists.
   *
   * This is the correction to a fix that overshot. Deriving "has reached the
   * way out" from `shown` meant an observer-less reader counted as arrived
   * before starting, and the surface never appeared; giving it its own state
   * starting false fixed that and created the opposite, worse bug — with no
   * observer, nothing can ever set it true, so a `fixed inset-0` button sits
   * over the Continue button and the walk-back link for the whole visit and
   * the flow has no exit.
   *
   * A shortcut whose retirement depends on a mechanism must not outlive the
   * mechanism. No observer, no surface: the argument still scrolls, the cue is
   * still there, and every control still answers a click.
   */
  const [observerActive, setObserverActive] = useState(false);

  useIsomorphicLayoutEffect(() => {
    // No observer, no reveal: everything stays visible rather than staying
    // hidden. The argument is the point; the animation is not.
    if (typeof IntersectionObserver === "undefined") return;

    setObserverActive(true);

    const els = sectionRefs.current;
    setShown(
      els.map((el) =>
        el ? el.getBoundingClientRect().top < window.innerHeight * SEED_THRESHOLD : true,
      ),
    );

    /*
     * Nothing seeds `reachedWayOut` — only the observer sets it, and that is
     * deliberate.
     *
     * A mount-time measurement was here, for a viewport tall enough to hold the
     * way out at first paint. It cannot happen: every section claims a full
     * viewport, so the last one is always seven screens down. What it CAN do is
     * fire wrongly. This effect runs before the shell's phase-change scroll
     * reaches the top, so a reader returning by back or forward while the page
     * is still scrolled deep measures the way out as already in view — and
     * `reachedWayOut` is monotonic, so the surface would be gone for the whole
     * re-read.
     */

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.reveal);
          if (Number.isNaN(index)) continue;


          setShown((prev) =>
            prev[index] ? prev : prev.map((v, j) => (j === index ? true : v)),
          );
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: `0px 0px -${Math.round((1 - SEED_THRESHOLD) * 100)}% 0px` },
    );

    /*
     * A beat is read when it is the thing on the screen, not when it peeks.
     *
     * Both jobs used to run off the observer above, whose threshold is
     * deliberately early: a section is revealed once its top passes 90% of the
     * viewport, so it is never still fading while the reader looks straight at
     * it. Early is right for opacity and wrong for a funnel — it counts a
     * movement as read from a sliver at the bottom edge. Measured at 390x844,
     * arriving at one section put the next one's top at 838 against a 760
     * threshold: 78px from marking a beat nobody had reached, and about 28px on
     * a bar-collapsed viewport.
     *
     * This root is the top 5% of the screen, so a section reports only once it
     * has actually come to the top — which is what the tap does, and what a
     * scroll does on the way past. The trade is an undercount rather than an
     * overcount: a fast flick can skip a band this thin. That is the right
     * direction for a number the owner will judge printed campaigns by.
     */
    /*
     * The surface retires when the control it must not cover appears.
     *
     * This used to hang off the reveal observer firing for the last section,
     * and that threshold is the wrong one twice over. It fires when the section
     * has merely entered the bottom 10% of the screen — so the tap died while
     * the reader was still on the scripture, one screen early, which is the
     * seam defect this whole surface exists to fix, in miniature. And moving it
     * later would be worse: any moment where the surface is up while the
     * Continue button is on screen is a moment where tapping the button
     * advances the page instead.
     *
     * Observing the control itself makes the two impossible to get out of step,
     * whatever the section heights or thresholds become later. It appears; the
     * surface goes.
     */
    const wayOnObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setReachedWayOut(true);
      },
      { threshold: 0 },
    );
    if (wayOnRef.current) wayOnObserver.observe(wayOnRef.current);

    const readObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.reveal);
          if (Number.isNaN(index)) continue;
          if (index >= BEAT_SECTIONS || reportedRef.current.has(index)) continue;

          /* The reducer's guard is monotonic, so a reader scrolling back up and
             down again re-dispatches harmlessly — but trackGraceBeatRevealed is
             not idempotent, hence the set. */
          reportedRef.current.add(index);
          trackGraceBeatRevealed(index);
          dispatch({ type: "REVEAL_GRACE_BEAT", count: index + 1 });
        }
      },
      { rootMargin: "0px 0px -95% 0px" },
    );

    for (const el of els) if (el) observer.observe(el);
    for (const el of els.slice(0, BEAT_SECTIONS)) if (el) readObserver.observe(el);
    return () => {
      observer.disconnect();
      readObserver.disconnect();
      wayOnObserver.disconnect();
    };
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
      // 40px rather than any movement: a rubber-band bounce at the top of an
      // iOS page fires this without the reader having gone anywhere.
      if (window.scrollY > 40) setHasMoved(true);
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

  /*
   * A tap is a press that did not travel.
   *
   * Browsers already suppress the click that ends a scroll drag, but a short
   * flick that barely moves the page is close enough to a tap that the click
   * survives — and on a screen where the whole viewport is the control, that
   * would jump the reader a section they did not ask for, mid-gesture. Ten
   * pixels is the same slop a native tap allows.
   */
  const pressRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const TAP_SLOP = 10;


  /** Scopes the section hop to grace's own sections — see lib/advance-section
      for what an unscoped query matches instead. */
  const containerRef = useRef<HTMLDivElement | null>(null);

  /** The forward control, watched so the tap surface retires exactly when it
      appears — see the observer that uses it. */
  const wayOnRef = useRef<HTMLDivElement | null>(null);

  function handleSurfaceDown(event: React.PointerEvent<HTMLButtonElement>) {
    /*
     * Primary contact, primary button, nothing else.
     *
     * Without the button test a right-click advances the page while the context
     * menu opens on top of it. Without `isPrimary`, a second finger during a
     * two-finger gesture overwrites the first one's start point, and whichever
     * contact lifts first is measured against the wrong origin.
     */
    if (!event.isPrimary || event.button !== 0) return;
    pressRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    /*
     * Capture, so the release comes back here wherever the finger ends up.
     *
     * Without it a primary press that lifts outside the element leaves its
     * origin behind — and a mouse always reuses pointerId 1, so the very next
     * right-click's release matched that stale press by id and advanced the
     * page from a button we had deliberately ignored on the way down.
     */
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is a belt to the braces below, not a requirement.
    }
  }

  /**
   * Once a press has travelled, it is a scroll and not a tap — so release the
   * capture and let the browser own the gesture.
   *
   * Capture exists so a primary press cannot lift somewhere else and be left on
   * record. It must not outlast the moment the reader is plainly dragging: held
   * through a drag it keeps routing moves here while the page is trying to
   * scroll under them.
   */
  function handleSurfaceMove(event: React.PointerEvent<HTMLButtonElement>) {
    const start = pressRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) <= TAP_SLOP) return;
    pressRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Already released by the browser starting its own scroll.
    }
  }

  /** A press that was cancelled — the browser taking over for a scroll or a
      system gesture — is not a tap, and its start point must not survive to be
      measured against some later pointerup. */
  function handleSurfaceCancel(event: React.PointerEvent<HTMLButtonElement>) {
    if (pressRef.current?.pointerId === event.pointerId) pressRef.current = null;
  }

  function handleSurfaceUp(event: React.PointerEvent<HTMLButtonElement>) {
    // The same test as the press. A secondary button's release must not be
    // measured against a primary press that is still on record.
    if (!event.isPrimary || event.button !== 0) return;
    const start = pressRef.current;
    // Matched by id: the pointer that went down is the only one that can lift.
    if (!start || start.pointerId !== event.pointerId) return;
    pressRef.current = null;
    const travelled = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (travelled > TAP_SLOP) return;

    /*
     * Blur for the same reason the cue does it: clicking a <button> focuses it,
     * and a focused aria-hidden element makes the browser refuse the hiding and
     * put an unnamed control into the accessibility tree.
     */
    event.currentTarget.blur();

    /*
     * The control may already be on screen even though the observer has not
     * said so yet — IntersectionObserver callbacks are asynchronous, so the
     * surface outlives the control's arrival by at least a frame. A human
     * cannot tap in that window after SEEING the button, but they do not have
     * to: the tap that brings the control into view is followed by a second tap
     * before the callback runs, and that one lands on the surface. With no
     * section left to advance to it falls through to a viewport of scrollBy,
     * which pulls the button away exactly as the reader reaches for it.
     *
     * So the geometry is read here, synchronously, at the moment of the press.
     * The observer remains the primary signal; this is the frame it cannot
     * cover.
     */
    const wayOn = wayOnRef.current?.getBoundingClientRect();
    if (wayOn && wayOn.top < window.innerHeight) {
      setReachedWayOut(true);
      return;
    }

    const target = advanceSection(containerRef.current);
    if (!target) return;
    setHasMoved(true);
    trackGraceTapAdvance();
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

      {/*
       * The strip along the bottom that the cue owns, reserved by every section
       * so centred text can never be laid under it.
       *
       * Measured at 390x844: the cue box sits at 605-730 and the record
       * section's last line reached 602 — three pixels of clearance, which is
       * coincidence rather than design. It fails outright with the consent
       * banner up, which lifts the cue by --consent-h to about 545 and puts
       * roughly 69px of that section's text behind it — and the banner is
       * showing for exactly the readers seeing this for the first time.
       *
       * 9rem covers the cue's own box plus its 3.5rem offset; --consent-h moves
       * with the banner. Sections centre their content in what is left, so the
       * axis being centred is the readable area rather than the raw viewport.
       */}
      <div
        ref={containerRef}
        className="relative z-10 mx-auto w-full max-w-lg px-5 sm:px-6"
        style={{ "--grace-cue-band": "calc(9rem + var(--consent-h, 0px))" } as React.CSSProperties}
      >
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
        <section className="flex min-h-[calc(100svh-0.75rem)] flex-col items-center justify-center pb-[calc(8vh+var(--grace-cue-band))] text-center">
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
          className={`relative mx-[calc(50%-50vw)] flex min-h-[calc(100svh-0.75rem)] flex-col justify-center overflow-hidden px-5 pt-[8vh] pb-[calc(8vh+var(--grace-cue-band))] sm:px-6 ${revealClass(0)}`}
        >
          {/*
           * The dock, dimmed — the empty rail behind the reader's own
           * imagined standing-there, not a scene to look at. Deliberately
           * quieter than the turn's full-bleed courtroom below: that panel is
           * the screen's one hinge, and giving every movement the same
           * full-strength treatment would flatten it. Radial-masked and
           * low-opacity like the homepage's band textures, red-tinted
           * because this is still the Law (see this section's own doc
           * comment above) — no gold here, docs/graphics/PROMPTS.md §31.
           *
           * Full-bleed width (the turn's own breakout, `mx-[calc(50%-50vw)]`)
           * even though the treatment stays dim — measured on desktop at the
           * narrow reading-column width and it read as a hard-edged box
           * floating in black, the exact "panel the band is sitting in"
           * failure band-texture.tsx's own comment warns about. Width fixes
           * that; the dim mask is what still keeps it well short of the
           * turn's own full-strength hero.
           */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
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
          <div className="relative mx-auto w-full max-w-lg">
            {/*
             * text-shadow, contrast fix not decoration: this eyebrow's
             * red-400/70 already sits under the 4.5:1 AA floor against pure
             * black (measured 4.0:1) — the dock behind it pushes that as low
             * as 2.35:1 at its brightest sampled point. A dark halo behind
             * the glyphs holds contrast up regardless of what's behind them.
             * Scoped to this section alone: the sitewide 4.0:1 baseline on
             * every other eyebrow is a separate, pre-existing issue this PR
             * doesn't own.
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
          </div>
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
          className={`mx-[calc(50%-50vw)] flex min-h-[calc(100svh-0.75rem)] flex-col justify-center overflow-hidden px-5 pt-[8vh] pb-[calc(8vh+var(--grace-cue-band))] sm:px-6 ${revealClass(1)}`}
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(239,68,68,0.07) 0%, rgba(212,168,67,0.10) 52%, transparent 100%), linear-gradient(to bottom, rgba(6,4,4,0.35) 0%, rgba(6,4,4,0.62) 100%), url(/graphics/courtroom.avif)",
            backgroundSize: "cover, cover, cover",
            backgroundPosition: "center, center, center bottom",
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
          className={`relative mx-[calc(50%-50vw)] flex min-h-[calc(100svh-0.75rem)] flex-col justify-center overflow-hidden px-5 pt-[8vh] pb-[calc(8vh+var(--grace-cue-band))] sm:px-6 ${revealClass(2)}`}
        >
          {/*
           * Reused, not regenerated — the empty tomb already argues this
           * exact claim on who-is-jesus's own topic page (§17): the
           * resurrection is the credential that makes this someone the
           * payer. Dimmed and radial-masked here rather than the full-
           * strength framed treatment its topic page gives it — atmosphere,
           * not a second cover. docs/graphics/PROMPTS.md §32. Full-bleed
           * width for the same reason Movement I is — see its own comment.
           */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
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
          <div className="relative mx-auto w-full max-w-lg">
            {/* text-shadow, contrast fix: 5.4:1 against pure black but the
                tomb's own rim-lit edge can reach bright enough locally to
                drop that under 3:1. Same fix as Movement I's eyebrow. */}
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
          </div>
        </section>

        {/* 5 · Movement IV — the response. The imperative, and it arrives last
            by design: the indicative has had four screens to land first. */}
        <section
          ref={setSectionRef(3)}
          data-reveal="3"
          className={`relative mx-[calc(50%-50vw)] flex min-h-[calc(100svh-0.75rem)] flex-col justify-center overflow-hidden px-5 pt-[8vh] pb-[calc(8vh+var(--grace-cue-band))] sm:px-6 ${revealClass(3)}`}
        >
          {/*
           * Reused, not regenerated — what-is-repentance's own turn (§27,
           * the hairpin track) is this movement's exact subject: "Repent —
           * turn from your sin." Same dimmed, radial-masked, full-bleed
           * treatment as Movement III. docs/graphics/PROMPTS.md §32.
           */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
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
          <div className="relative mx-auto w-full max-w-lg">
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
          </div>
        </section>

        {/* 6 · The promise. */}
        <section
          ref={setSectionRef(4)}
          data-reveal="4"
          className={`flex min-h-[calc(100svh-0.75rem)] flex-col justify-center pt-[8vh] pb-[calc(8vh+var(--grace-cue-band))] ${revealClass(4)}`}
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

        {/*
         * 7 · The record, and the way on, on one screen.
         *
         * The four movements say what happened in general: a judge, a penalty,
         * someone who paid. This says it about the reader, out of their own six
         * answers, and it is deliberately the last thing before the decision
         * rather than the first thing on the screen. Opening grace with a charge
         * sheet would restate the Law at the moment the flow is supposed to
         * announce; ending with one lands the general truth on the particular
         * reader while they still have the question in front of them.
         *
         * The forward control used to have a screen to itself, and measurement
         * is what ended that: 112px of content in an 832px section, 87% empty,
         * holding "E agora?" and a re-read link. That is not weight given to the
         * decision, it is a gesture charged for nothing — the same argument that
         * deleted the accordion, since every gate is a place to leave. Merged,
         * the reader's own charge sheet is the thing the button acts on, and the
         * question the button asks is the one the record raises. Combined
         * content measures 496px against ~675px of usable height.
         *
         * The record carries no animation of its own. The section reveal is the
         * only entrance — the version that arrived with the accordion wrapped it
         * in a framer fade with its own delay, which inside a revealing section
         * would run two entrances over one element.
         */}
        {/*
         * The one section that does NOT reserve the cue's band, and reserves the
         * consent banner instead.
         *
         * Reaching this section is what retires the cue and the tap surface, so
         * by the time it is aligned there is nothing at the bottom of the screen
         * to hide behind — and holding 144px back for it made the merged section
         * 881px against an 844 viewport, which no longer fits at all. What DOES
         * still sit at the bottom is the consent banner, and it covers the one
         * control this screen exists for: measured at 320x568, the button's own
         * centre point belonged to the banner rather than the button.
         */}
        <section
          ref={setSectionRef(5)}
          data-reveal="5"
          className={`flex min-h-[calc(100svh-0.75rem)] flex-col justify-center pt-[8vh] pb-[calc(8vh+env(safe-area-inset-bottom)+var(--consent-h,0px))] ${revealClass(5)}`}
        >
          <GraceRecord
            rows={buildRecord(state.answers, verdictLabels)}
            messages={messages.record}
          />

          <div ref={wayOnRef} className="mt-12 flex flex-col items-center">
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
          </div>
        </section>
      </div>

      {/*
       * The tap surface, and the cue that names it.
       *
       * Two elements rather than one because a <button> cannot contain a
       * <button>: the surface takes the taps, and the cue — the codebase's
       * pointer-events-none wrapper idiom, as on the verdict document — sits
       * above it and stays the visible affordance.
       *
       * Both retire together at the last section. The cue used to live inside
       * the announcement and end with it, which meant the affordance vanished
       * exactly when the reader had five more movements to travel; it is fixed
       * to the viewport now, so it keeps saying "there is more below" for as
       * long as that is true.
       *
       * z-30 puts the surface over the argument and under the consent banner's
       * z-50 — the banner's own buttons must stay reachable.
       */}
      {observerActive && !reachedWayOut && (
        <>
          <button
            type="button"
            /* Hidden from assistive tech and out of tab order together, for the
               reason scroll-cue.tsx sets out: everything this reaches is already
               next in reading order, and space/PageDown already do the right
               thing on a document that scrolls. It is a shortcut for a thumb,
               never the only route. */
            aria-hidden="true"
            tabIndex={-1}
            data-slot="grace-tap-surface"
            onPointerDown={handleSurfaceDown}
            onPointerMove={handleSurfaceMove}
            onPointerUp={handleSurfaceUp}
            onPointerCancel={handleSurfaceCancel}
            onMouseDown={(event) => event.preventDefault()}
            className="fixed inset-0 z-30 cursor-pointer bg-transparent"
          />
          <m.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="pointer-events-none fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] z-40 flex justify-center"
          >
            {/* A scrim, because the cue no longer sits on an empty screen. On
                the announcement it had a viewport to itself; travelling with the
                reader it lands on body text — measured over the John 3:16
                blockquote — and gold-on-italic at this size is noise for both.
                Radial rather than a full-width band: it separates the chevron
                without dimming a stripe of the argument. */}
            <span
              className="flex flex-col items-center justify-center gap-2 px-8 py-4"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(6,4,4,0.92) 0%, rgba(6,4,4,0.6) 45%, transparent 72%)",
              }}
            >
              <ScrollCue />
              {/*
               * The verdict's sentence, verbatim, and keyed on the pointer
               * rather than the width for the reason set out there: a tablet is
               * 768 wide and touch, so a width query tells the device most
               * likely to be held in two hands to press space.
               *
               * It says tap and the page also scrolls. That is incomplete
               * rather than untrue, and scrolling is the instinct nobody has to
               * be told about — the reader who needs a sentence here is the one
               * who arrived having tapped five times and found nothing.
               */}
              {!hasMoved && (
                <span className="text-center font-mono text-[9px] uppercase tracking-[2.4px] text-white/30 sm:text-[11px]">
                  <span className="pointer-fine:hidden">{advanceHint.touch}</span>
                  <span className="hidden pointer-fine:inline">{advanceHint.pointer}</span>
                </span>
              )}
            </span>
          </m.span>
        </>
      )}
    </div>
  );
}
