"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/nextjs";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { Landing } from "@/components/landing";
import { QuestionCard } from "@/components/question-card";
import { VerdictScreen } from "@/components/verdict-screen";
import { GraceScreen } from "@/components/grace-screen";
import { InvitationScreen } from "@/components/invitation-screen";
import {
  trackGameAbandoned,
  trackTestRestored,
  trackTestBack,
  trackTestExit,
} from "@/lib/analytics";
import { QUESTION_CONFIGS, TOTAL_QUESTIONS } from "@/lib/questions";
import { clearSession, readSession } from "@/lib/test-session-storage";
import { markTestCompleted } from "@/lib/journey-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import type { Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface GameShellProps {
  messages: Messages;
  locale: Locale;
}

const PHASE_ORDER = ["landing", "playing", "verdict", "grace", "invitation"] as const;

// Per-page-load nonce. Marker entries survive a reload with their state
// objects intact; without a nonce a stale marker from the previous load
// reads as a live entry and back can be mistaken for browser-forward. Every
// entry we stamp carries { n, i } so popstate can reject foreign markers and
// read the true stack index instead of guessing from the phase pair.
const HISTORY_NONCE = Math.random().toString(36).slice(2);

/*
 * The chassis both edge controls are built on: the exit at the right, the
 * walk-back at the left. One string because they were drifting apart a
 * property at a time — restyling the exit alone left the walk-back on the old
 * padding and the old fill, so they sat at different heights, in different
 * colours, on the same line.
 *
 * Sharing a chassis is not the same as looking alike, which the comment on the
 * exit below warns against for good reason: on grace, tapping the wrong one of
 * these costs the reader the whole flow. What tells them apart is what they
 * carry — an X against an arrow and a named destination — and which edge they
 * hold. What they share is height, inset, radius, fill and type, which is what
 * makes them read as two controls of one system rather than two accidents.
 *
 * The fill is light, not the page's own #060404. Measured behind these, the
 * backdrop IS #060404 on every screen they sit on, so a dark fill painted the
 * page onto the page and left the glyph held by a 6%-white hairline. shadcn's
 * outline variant does the same thing on dark themes, for the same reason
 * (`dark:bg-input/30`): on a dark ground a raised control reads by being
 * lighter than what it sits on, not by repeating it. The blur is for the
 * washes these cross at the verdict and grace, where the ground stops
 * being flat.
 *
 * h-8/h-9 are declared rather than derived from padding: the exit's square and
 * the walk-back's pill have different horizontal padding by nature, and a
 * shared height is the one property that has to survive that.
 *
 * The top inset carries a safe-area term for the same reason the examination
 * ledger's rail and counter do: these are fixed to the top edge, and on a
 * home-screen install a bare 14px puts them under the status bar. It resolves
 * to plain top-3.5 / sm:top-4 on every device without an inset, which is every
 * device this can be measured on in a desktop browser.
 */
const EDGE_CHIP =
  "fixed top-[calc(0.875rem+env(safe-area-inset-top))] z-40 flex h-8 items-center rounded-md border border-white/10 bg-white/[0.06] font-mono text-[9px] uppercase tracking-[2px] text-white/70 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.10] hover:text-white/90 sm:top-[calc(1rem+env(safe-area-inset-top))] sm:h-9 sm:text-[10px]";

export function GameShell({ messages, locale }: GameShellProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  // Current-state mirror for the once-registered popstate handler.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  /*
   * The exit control's revealed label — see the chrome block below for why the
   * first pointer tap only reveals.
   */
  const [exitRevealed, setExitRevealed] = useState(false);
  useEffect(() => {
    if (!exitRevealed) return;
    function onPointerDown(event: PointerEvent) {
      /*
       * Matched by data-slot rather than by a ref to the element, and that is
       * a fix rather than a preference. pointerdown runs BEFORE click, so a
       * press on the control itself that this listener fails to recognise
       * collapses the reveal a moment before the click arrives — and the click
       * handler, seeing a collapsed control, re-reveals instead of navigating.
       * The reader taps the X twice and stays exactly where they are. Measured:
       * the second tap never left /test.
       *
       * `closest` also answers for the icon inside, which is what a thumb
       * actually lands on; a containment test against a forwarded ref has to be
       * right about both the ref and the SVG to get the same answer.
       */
      const target = event.target as Element | null;
      if (target?.closest?.('[data-slot="test-exit"]')) return;
      setExitRevealed(false);
    }
    /*
     * Passive and non-capturing, and both matter: the tap that collapses this
     * must still reach whatever it landed on. A capturing listener — or a
     * backdrop element — would turn a label into a modal on screens whose
     * entire interaction model is "the screen is one button".
     */
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [exitRevealed]);

  /*
   * Restore a same-sitting session silently, with nothing asked.
   *
   * There used to be a dialog here — "pick up where you left off?", Continue or
   * Start over. It was removed because the test is six questions and about
   * ninety seconds: choosing between resuming and restarting costs a reader more
   * than simply answering again would, and it put a modal at the front door of a
   * flow that works hard to have no friction anywhere else.
   *
   * readSession now discards anything older than its resume window, so what
   * arrives here is always a refresh, a locked phone or a restored tab, not
   * somebody returning days later to a half-answered test they no longer feel.
   * Nothing to decide, so nothing is asked.
   */
  const restoredRef = useRef(false);
  /*
   * Before paint, not after.
   *
   * This ran inside a requestAnimationFrame, which is one paint too late: a
   * reader arriving from the homepage had already answered, and the landing
   * screen rendered its *question* for a frame before the seeded rating
   * swapped it for the reply. Recorded as a real sequence — "Are you a good
   * person?" then "You said you're a good person." — which is the screen
   * asking something the reader just answered.
   *
   * A layout effect runs after the DOM is built and before the browser paints,
   * so the question state never reaches the screen. Hydration is already done
   * by the time any effect runs, so reading storage here is no less stable
   * than it was a frame later.
   */
  useIsomorphicLayoutEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    /*
     * A tap on the homepage still outranks a resume, and now says so by
     * arriving in the route: the provider seeds `selfRating` before this runs,
     * so a seeded entry is recognised by reading state rather than storage.
     * Dropping such a reader into a half-finished test would ignore what they
     * did one second ago; a resume, by contrast, is inferred.
     *
     * Seeded, not started. The landing screen stays — it just replies to the
     * answer instead of asking for it again, and the reader begins the Law by
     * choosing to, from a screen that gave them a way to change their mind.
     */
    /*
     * `?start=1` is on the nav's "Take the Test" link (see top-bar). Without
     * it, a reader who answered the decision and came back inside the
     * thirty-minute window was restored onto the post-decision screen: an
     * encouragement and a forward button, no test, no way to start one. The
     * label promised something the page did not contain.
     *
     * Read AND consumed before anything below can return early, which is not
     * a tidiness preference — it is the whole safety of the flag. A reader
     * with no session yet (the common case: the nav is how a stranger starts)
     * hit `if (!saved) return` and left `?start=1` in the address bar, where
     * it stayed for the rest of the visit. It then fired on the next reload,
     * by which time there WAS a session — so a reader who reached the verdict
     * and whose phone locked came back to a cleared test and the landing
     * screen. The flag existed to prevent exactly that loss and, consumed one
     * `return` too late, caused it instead.
     *
     * Stripping is unconditional for the same reason: a seeded entry
     * (`selfRating`, below) also has to leave a clean URL behind it.
     */
    let startRequested = false;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      startRequested = url.searchParams.has("start");
      if (startRequested) {
        url.searchParams.delete("start");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
    }

    if (state.selfRating) return;

    const saved = readSession();
    // The whole saved record, not a field-by-field copy. Transcribing it is
    // how graceBeatsRevealed went missing here in the first place.
    if (!saved) return;

    /*
     * An entrance that asked for the test outranks a resume of one already
     * finished — but only past `playing`, and that is the point of the check.
     * A reader mid-test who stepped away to read something is still IN the
     * test: handing their answered questions back is what the link promised,
     * and discarding them is not. The failure only ever involved sessions
     * that were finished.
     *
     * Clearing is safe: what makes a reader "known" — completion, their
     * recorded response — lives in journey storage under its own key, not in
     * this one, so /next-steps still recognises them afterwards.
     */
    if (startRequested && saved.phase !== "playing") {
      clearSession();
      return;
    }

    dispatch({ type: "RESUME_SESSION", session: saved });
    trackTestRestored(saved.phase, locale);
  }, [dispatch, locale, state.selfRating]);

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "game",
      message: `Phase: ${state.phase}`,
      level: "info",
      data: { phase: state.phase, score: state.score },
    });

  }, [state.phase, state.score]);

  /*
   * Completion is the answer count, not the phase and certainly not a URL.
   * While the flow lived on routes this keyed off the route segment, so a cold
   * visit to /test/verdict permanently marked a stranger as having taken the
   * test. Phases cannot be typed any more, but the count is still the honest
   * condition and costs nothing to keep.
   */
  useEffect(() => {
    if (state.answers.length >= TOTAL_QUESTIONS) markTestCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the count is the trigger
  }, [state.answers.length]);

  // Scroll to top on phase transitions so focus lands on the new content, and
  // close the exit's revealed label with it: it was opened against a screen
  // the reader has now left, and a label that outlives its screen is a control
  // in an unexplained state.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setExitRevealed(false);
  }, [state.phase]);

  useEffect(() => {
    function handleBeforeUnload() {
      // Track abandonment for any phase past landing, except when the
      // invitation has already been answered (that's a completed session).
      if (state.phase === "landing") return;
      if (state.phase === "invitation" && state.invitationResponse) return;

      const currentConfig = QUESTION_CONFIGS[state.currentQuestion];
      trackGameAbandoned(
        currentConfig?.id ?? 0,
        state.score,
        Date.now() - state.startedAt,
        locale,
        state.phase,
      );
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    state.phase,
    state.currentQuestion,
    state.score,
    state.startedAt,
    state.invitationResponse,
    locale,
  ]);

  // --- Back-navigation history integration -------------------------------
  // One path: re-read links call history.back(); popstate dispatches the
  // reducer action. Entries exist only for verdict/grace/invitation —
  // questions are one-way and get none.
  const prevPhaseRef = useRef(state.phase);
  const depthRef = useRef(0); // entries pushed beyond the verdict baseline
  const unwindingRef = useRef(false);
  const viaLinkRef = useRef(false);
  // Set by the popstate handler before it dispatches: the phase change it
  // triggers is a MOVE along existing history, so the phase effect must sync
  // state without pushing a new entry (a re-push would clobber the forward
  // stack and double-count depth). depthRef is owned by the handler here.
  const poppingRef = useRef(false);
  /*
   * One walk-back may be in flight at a time. history.back() is asynchronous
   * and the screen visibly changes nothing until the popstate lands — an exit
   * of 0.09s plus an entrance of 0.2s — so an impatient second tap on the chip
   * or on grace's own link queued a SECOND traversal: back past the grace
   * entry AND the verdict baseline, whose popstate carries no marker, which
   * hands the navigation to the App Router. A control labelled "Verdict"
   * ejected the reader from /test entirely. The flag swallows every press
   * until the pending pop has arrived; popstate clears it whatever the pop
   * turns out to be, so a swallowed foreign marker cannot wedge it shut.
   */
  const backInFlightRef = useRef(false);
  /*
   * The unwind below is the OTHER traversal in this component, and it has to
   * queue behind a walk-back rather than stack on one.
   *
   * The chip and the three response buttons are gated on the same condition,
   * so both are live at once on the decision screen. Tap "Grace", then answer
   * before the pop lands — 0.29s of window — and the unwind fired
   * `history.go(-depth)` on top of a `history.back()` that had not arrived:
   * three entries travelled where two were meant to, past the verdict
   * baseline and out of /test. Exactly the ejection the flag above was added
   * to stop, through the one door that did not check it.
   */
  const pendingUnwindRef = useRef(false);

  function walkBack() {
    if (backInFlightRef.current) return;
    backInFlightRef.current = true;
    viaLinkRef.current = true;
    window.history.back();
  }

  /*
   * Back to the verdict baseline and strip our markers, so the next back press
   * leaves /test. Reads depthRef at call time rather than closing over it,
   * which is what makes deferring safe: by the time a deferred unwind runs,
   * the pop it waited for has already corrected the depth.
   */
  const unwindToBaseline = useCallback(() => {
    if (depthRef.current <= 0) return;
    unwindingRef.current = true;
    window.history.go(-depthRef.current);
    depthRef.current = 0;
  }, []);

  // See the ref's use on the phase panel below for why this is a callback ref
  // and why the first mount is skipped.
  const firstPhaseMountRef = useRef(true);
  const focusPhasePanel = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    if (firstPhaseMountRef.current) {
      firstPhaseMountRef.current = false;
      return;
    }
    el.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = state.phase;
    prevPhaseRef.current = curr;
    if (prev === curr) return;

    if (poppingRef.current) {
      // Phase change came from popstate — history already reflects it.
      poppingRef.current = false;
      return;
    }

    const forward = PHASE_ORDER.indexOf(curr) > PHASE_ORDER.indexOf(prev);
    const n = HISTORY_NONCE;

    if (curr === "verdict" && forward) {
      // Baseline — back from the verdict leaves /test, as today.
      window.history.replaceState(
        { ...window.history.state, gospelTestPhase: "verdict", n, i: 0 },
        "",
      );
      depthRef.current = 0;
      return;
    }

    if ((curr === "grace" || curr === "invitation") && forward) {
      if (prev === "landing") {
        // Resumed straight into a later phase — synthesize the stack so
        // the re-read links have real entries beneath them.
        window.history.replaceState(
          { ...window.history.state, gospelTestPhase: "verdict", n, i: 0 },
          "",
        );
        depthRef.current = 0;
        window.history.pushState({ gospelTestPhase: "grace", n, i: 1 }, "");
        depthRef.current = 1;
        if (curr === "invitation") {
          window.history.pushState({ gospelTestPhase: "invitation", n, i: 2 }, "");
          depthRef.current = 2;
        }
        return;
      }
      const i = depthRef.current + 1;
      window.history.pushState({ gospelTestPhase: curr, n, i }, "");
      depthRef.current = i;
    }
  }, [state.phase]);

  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      // The traversal a link-driven walk-back was waiting on has arrived —
      // whatever entry it landed on, the next press is a new gesture.
      backInFlightRef.current = false;
      if (unwindingRef.current) {
        // Landing event of the post-response unwind: strip the marker so
        // the next back press exits the page.
        unwindingRef.current = false;
        // Reset here too. This branch used to return without it, so a
        // link-driven walk-back that ended in an unwind left the flag set and
        // the NEXT genuine browser press reported itself as "link".
        viaLinkRef.current = false;
        window.history.replaceState(
          { ...window.history.state, gospelTestPhase: undefined, n: undefined, i: undefined },
          "",
        );
        return;
      }
      // Reset unconditionally — a link-driven back must not leave the flag
      // set for a later browser-driven press to misread.
      const via = viaLinkRef.current ? "link" : "browser";
      viaLinkRef.current = false;

      const entry = e.state as
        | { gospelTestPhase?: string; n?: string; i?: number }
        | null;
      const target = entry?.gospelTestPhase;
      if (!target) return; // left our range — App Router handles it
      if (entry?.n !== HISTORY_NONCE) return; // foreign marker (prior load) — inert

      const phase = prevPhaseRef.current;
      // Direction from the stamped index vs. our live depth, not the phase
      // pair (a stale pair could otherwise read backward as forward). The
      // phase pair still gates dispatch so illegal transitions stay inert.
      const i = entry.i ?? 0;
      const backward = i < depthRef.current;
      const forward = i > depthRef.current;

      /*
       * Depth mirrors where the BROWSER is, not what we chose to do about it.
       * It used to be set only on the dispatching branches, so an entry we
       * deliberately ignored — a recorded response refusing BACK_TO_GRACE,
       * below — left depth one ahead of the stack it claims to measure, and
       * the unwind that followed travelled one entry too far.
       */
      depthRef.current = i;

      // A response recorded while a walk-back was still travelling. The pop it
      // was waiting for has now landed and depth is accurate again, so the
      // unwind can run in its own turn rather than on top of it.
      if (pendingUnwindRef.current) {
        pendingUnwindRef.current = false;
        unwindToBaseline();
        return;
      }

      if (backward && target === "verdict" && phase === "grace") {
        trackTestBack("grace", "verdict", via);
        poppingRef.current = true;
        dispatch({ type: "BACK_TO_VERDICT" });
      } else if (backward && target === "grace" && phase === "invitation") {
        if (stateRef.current.invitationResponse) return; // recorded — inert
        trackTestBack("invitation", "grace", via);
        poppingRef.current = true;
        dispatch({ type: "BACK_TO_GRACE" });
      } else if (forward && target === "grace" && phase === "verdict") {
        poppingRef.current = true;
        dispatch({ type: "SHOW_GRACE" });
      } else if (forward && target === "invitation" && phase === "grace") {
        poppingRef.current = true;
        dispatch({ type: "SHOW_INVITATION" });
      }
      // Anything else: inert entry (e.g. stale forward after unwind).
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dispatch, unwindToBaseline]);

  // Response recorded → unwind our pushed entries so hardware back exits.
  const responseRef = useRef(state.invitationResponse);
  useEffect(() => {
    const had = responseRef.current;
    responseRef.current = state.invitationResponse;
    if (!had && state.invitationResponse && depthRef.current > 0) {
      // Queue behind a walk-back rather than stack on it — see
      // pendingUnwindRef. popstate runs the unwind once the pop has landed.
      if (backInFlightRef.current) {
        pendingUnwindRef.current = true;
        return;
      }
      unwindToBaseline();
    }
  }, [state.invitationResponse, unwindToBaseline]);

  /*
   * `overflow-x-clip` on <main> below, never `overflow-x-hidden` — this is a
   * touch-scroll bug, not a style preference.
   *
   * `overflow: hidden` on ONE axis makes the other axis compute to `auto`, so
   * hidden turned this element into a scroll container. It then held 12px of
   * internal overflow (the `pt-3` below), and on touch the compositor spent the
   * reader's first swipe scrolling MAIN by those 12px instead of chaining to the
   * document: measured on grace at 390×844 with touch emulation,
   * main.scrollTop 12 / window.scrollY 0, on a 3,871px page. "I cannot scroll."
   *
   * `clip` clips exactly the same overflow without ever becoming a scroll
   * container, so the gesture reaches the page. The full-bleed turn section in
   * grace (`mx-[calc(50%-50vw)]`) still needs the clipping, which is why this is
   * not simply removed.
   *
   * A wheel never reproduced it — desktop scrolling chains straight to the
   * document — so every measurement taken with a mouse looked correct.
   */
  return (
    <main className="relative min-h-dvh overflow-x-clip bg-[#060404] flex flex-col">
      {/* Radial vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

      {/*
       * The way out, on the right, as an icon.
       *
       * It used to be a labelled pill on the LEFT — "← Sair" — which put it in
       * back's position wearing back's glyph, and made it the identical twin of
       * the walk-back chip below: same border, same size, same arrow, same y,
       * the two of them differing only by which edge they clung to. On grace,
       * tapping the wrong one of those costs the reader the entire flow.
       *
       * So the two are told apart by everything at once. Back keeps the arrow,
       * the label and the left edge, because its whole value is naming where it
       * goes. Leaving takes the right edge and an X, which is the vocabulary
       * every reader already has for closing a layer — and honest here, because
       * /test IS a layer: it is the (immersive) route group, over the site
       * rather than in it.
       *
       * The vertical position is unchanged and was measured for a strip that no
       * longer exists: top-3.5 / sm:top-4 is where this sat once the sticky
       * deaths strip retired at the verdict (48-34, 56-40), which is where the
       * reader's eye already found it on the screens that mattered.
       *
       * ── One tap reveals, the second leaves ──────────────────────────────
       *
       * A bare X is quieter than a labelled pill, and a quiet control on a
       * screen whose whole surface is a button invites the exploratory tap. So
       * the first pointer tap only reveals the word: nothing is lost, nothing
       * navigates, and the reader reads what they are about to do before doing
       * it. That is worth a tap because the thing on the other side of it is a
       * ninety-second flow with no way back into the middle of it.
       *
       * Three rules make the reveal safe rather than modal:
       *
       *   1. It never swallows a tap. The collapse listener is passive and
       *      non-capturing, so the tap that dismisses this also does its own
       *      job — advancing a verdict beat, moving grace on a section. A
       *      reveal that ate the gesture would be a modal on a tap-anywhere
       *      screen, which is the seam defect this flow keeps paying for.
       *   2. Nothing collapses it on a timer. Same reasoning that keeps the
       *      verdict tap-advanced rather than timed: a control that vanishes
       *      while it is being read is a control the reader must chase.
       *   3. Keyboard and assistive tech skip the two-step entirely. The
       *      element is a real <Link> with the exit as its accessible name, so
       *      Enter navigates on the first press; `detail > 0` is what
       *      identifies a genuine pointer click, and only that path reveals.
       *      A touch-safety measure must not tax a screen reader.
       */}
      <Link
          data-slot="test-exit"
          href={`/${locale}`}
          aria-label={messages.test.backLabel}
          onClick={(event) => {
            // A keyboard or AT activation reports detail 0 — that goes
            // straight out, as rule 3 above.
            if (event.detail > 0 && !exitRevealed) {
              event.preventDefault();
              setExitRevealed(true);
              return;
            }
            // Revealed means this click is the second of a pointer's two
            // steps; anything reaching here unrevealed skipped it by design
            // (detail 0 — keyboard, voice, assistive tech).
            trackTestExit(state.phase, locale, exitRevealed ? "revealed" : "direct");
          }}
          /* `aspect-square` against the chassis height, rather than padding
             chosen to look square: 32px and 36px exactly, where the old
             px-2/py-1 gave a 32x22 rectangle. 36 is shadcn's own icon-button
             size. Revealing the label drops the square and lets the box grow
             rightward on its padding, the way any icon button that gains a
             badge does — the height never moves either way. */
          className={`${EDGE_CHIP} right-3 justify-center sm:right-4 ${
            exitRevealed ? "px-2.5" : "aspect-square"
          }`}
        >
          <X aria-hidden="true" className="size-3.5 sm:size-4" />
          {/* aria-hidden and animated: the link is named by its aria-label, so
              this span is purely visual and can appear from nothing without
              changing what the control announces. max-width rather than
              display, because width is animatable and `hidden` is not. */}
          <span
            aria-hidden="true"
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
              exitRevealed ? "ml-1.5 max-w-24 opacity-100" : "ml-0 max-w-0 opacity-0"
            }`}
          >
            {messages.test.backLabel}
          </span>
        </Link>

      {/*
       * The flow's own walk-back, visible — the seam the exit chip cannot
       * cover. "Backwards" used to be a link at the bottom of grace's seventh
       * viewport plus an unlabelled browser gesture; a reader wondering "can I
       * go back?" looked at the top of the screen and found only Exit, which
       * leaves the test entirely.
       *
       * Grace and the decision carry one; each absence elsewhere is a rule
       * rather than a gap. The landing and the questions get nothing because
       * the Law is one-way — testimony is recorded, not editable (see
       * UNDO_ANSWER's own guard). The verdict gets nothing because back from
       * the verdict IS Exit — the baseline history entry leaves /test, and two
       * chips saying different kinds of "back" at once would make the reader
       * guess.
       *
       * The decision screen's chip is owner-sanctioned (2026-08-15): walking
       * back from the decision and landing at the top of grace is intended,
       * so it may be named rather than left to a gesture nobody can see. What
       * the rule now governs is WHERE it lives, not whether it exists — this
       * is edge chrome naming a destination, never a control inside the choice
       * stack. invitation-screen.tsx still carries no walk-back of its own and
       * is not to acquire one: the three responses remain the only things on
       * that screen a reader chooses between, and retreat must not stand among
       * them.
       *
       * And it exists only while the invitation is unanswered. A recorded
       * response closes the book — BACK_TO_GRACE is refused by the reducer and
       * the shell unwinds its pushed entries — so a chip left up afterwards
       * would be a labelled affordance that does nothing.
       *
       * One position slot for both, because the two phases are mutually
       * exclusive and only ever one chip is up — the LEFT edge, which is where
       * back belongs and where the reader's thumb already reaches for it. The
       * exit gave that edge up to take the right one as an icon; see its own
       * comment above for why the two must not look alike.
       *
       * Labelled, where the exit is not, and that asymmetry is the design
       * rather than an inconsistency: this control's whole value is naming the
       * destination — "Verdict", "Grace" — because the reader is choosing to
       * go somewhere, not to close something.
       *
       * Same one path as grace's own bottom link: mark the gesture as
       * link-driven, walk one real history entry, and let popstate dispatch —
       * so the browser stack and the reducer cannot disagree.
       *
       * z-40, and that is load-bearing rather than styling: grace's tap
       * surface is fixed at z-30, so anything lower is a chip that ignores
       * every click for exactly as long as the surface is up.
       */}
      {state.phase === "grace" && (
        <button
          type="button"
          onClick={walkBack}
          className={`${EDGE_CHIP} left-3 gap-1 px-2.5 sm:left-4 sm:px-3`}
        >
          <span aria-hidden="true">&larr;</span>
          <span>{messages.test.backToVerdict}</span>
        </button>
      )}

      {state.phase === "invitation" && state.invitationResponse === null && (
        <button
          type="button"
          onClick={walkBack}
          className={`${EDGE_CHIP} left-3 gap-1 px-2.5 sm:left-4 sm:px-3`}
        >
          <span aria-hidden="true">&larr;</span>
          <span>{messages.test.backToGrace}</span>
        </button>
      )}

      {/* Just enough to clear the exit chip's top inset. This was pt-10 for the
          sticky deaths strip and pt-9 after it went, but the strip is what the
          space was for: with it gone the offset simply pushed the examination
          ledger 34px below the chip, so the top of the screen read as two
          header bands with a gap between them. The ledger now sits on the
          chip's own line — see the question card's top padding, which is the
          other half of that sum. */}
      <div className="relative z-[1] flex flex-1 flex-col pt-3">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={state.phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.09, ease: "linear" } }}
            /*
             * The exit is deliberately faster than the entrance, and that gap is
             * the point rather than a stylistic flourish.
             *
             * `mode="wait"` holds the incoming phase until the outgoing one has
             * finished leaving, so the exit duration is dead time in which the
             * next screen DOES NOT EXIST. Measured on verdict → grace at
             * 390×844: with a 0.2s exit the document stayed one viewport tall
             * and wheel input moved nothing until ~190ms, when grace finally
             * mounted. A swipe takes roughly 150–300ms, so the reader's first
             * gesture landed entirely inside that window and produced nothing —
             * "I tried to scroll and it ignored me".
             *
             * CPU throttling at 4× and 6× barely moved those numbers, which is
             * what identified it: this is a wall-clock animation, not work.
             *
             * Grace is where it bites, because grace is the only screen in the
             * flow taller than one viewport — everywhere else there is nothing
             * to scroll, so nobody could feel it.
             */
            transition={{ duration: 0.2, ease: EASE_OUT_STRONG }}
            /*
             * Focus follows the phase, or a keyboard reader loses their place
             * on every move. Activating the walk-back chip by keyboard walked
             * the phase correctly and then dropped activeElement to <body>,
             * so the next Tab restarted at the top of the document — and the
             * two chips this flow added exist to trigger exactly that move.
             *
             * A ref callback rather than the phase effect, because
             * `mode="wait"` mounts the incoming screen only after the outgoing
             * one has left: at effect time this element is still the old
             * phase's, or nothing at all. `preventScroll` leaves the scroll
             * reset to the effect that owns it, and the first mount is skipped
             * so a cold arrival is never yanked out of the document's start.
             */
            ref={focusPhasePanel}
            tabIndex={-1}
            className="flex flex-1 flex-col outline-none"
          >
            {state.phase === "landing" && (
              <Landing messages={messages.landing} locale={locale} />
            )}

            {state.phase === "playing" && (
              <QuestionCard
                question={messages.questions[state.currentQuestion]!}
                questionIndex={state.currentQuestion}
                score={state.score}
                testMessages={messages.test}
              />
            )}

            {state.phase === "verdict" && (
              <VerdictScreen
                messages={messages.verdict}
                testMessages={messages.test}
              />
            )}

            {state.phase === "grace" && (
              <GraceScreen
                messages={messages.grace}
                verdictLabels={messages.test.verdictLabels}
                /* The verdict's own hint strings, not a copy of them: the seam
                   should read as the same sentence the reader just followed five
                   times, and two keys saying the same thing drift. */
                advanceHint={{
                  touch: messages.test.verdict.advanceHintTouch,
                  pointer: messages.test.verdict.advanceHintPointer,
                }}
                /* No onBack, as on the decision screen: the walk-back is shell
                   chrome for both phases now, and neither screen renders one
                   among its own content. */
              />
            )}

            {/* No onBack, and that stays true now that the shell shows a chip
                for this phase: the walk-back is edge chrome above the screen,
                not a fourth thing inside the choice stack. The component is
                never handed a way back to render among its own responses. */}
            {state.phase === "invitation" && (
              <InvitationScreen messages={messages} locale={locale} />
            )}
          </m.div>
        </AnimatePresence>
      </div>

    </main>
  );
}
