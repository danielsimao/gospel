"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/nextjs";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { Landing } from "@/components/landing";
import { QuestionCard } from "@/components/question-card";
import { VerdictScreen } from "@/components/verdict-screen";
import { GraceScreen } from "@/components/grace-screen";
import { FlowBand } from "@/components/flow-band";
import { InvitationScreen } from "@/components/invitation-screen";
import {
  trackGameAbandoned,
  trackTestRestored,
  trackTestBack,
} from "@/lib/analytics";
import { QUESTION_CONFIGS, TOTAL_QUESTIONS } from "@/lib/questions";
import { readSession } from "@/lib/test-session-storage";
import { furthestStageIndex, stageOfPhase, type FlowStage } from "@/lib/flow-stages";
import { markTestCompleted } from "@/lib/journey-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import type { GamePhase, Messages } from "@/lib/types";
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

export function GameShell({ messages, locale }: GameShellProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  // Current-state mirror for the once-registered popstate handler.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

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
    if (state.selfRating) return;

    const saved = readSession();
    // The whole saved record, not a field-by-field copy. Transcribing it is
    // how graceBeatsRevealed went missing here in the first place.
    if (!saved) return;
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

  // Scroll to top on phase transitions so focus lands on the new content
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  /*
   * The test region, entered from a later stage.
   *
   * View state, not journey state: the phase stays exactly what it was, the
   * reducer is never told, and nothing persists. A refresh mid-review lands
   * back on the decision, which is the right answer — the reader had not gone
   * anywhere. `index` is the question being read; `from` is the phase to
   * return to when Back walks off the front of the corridor.
   */
  const [review, setReview] = useState<{ index: number; from: GamePhase } | null>(null);

  /*
   * Band taps move the history stack rather than dispatching directly, so the
   * stack stays the single source of truth for where the reader is — the same
   * contract the re-read links already had. The popstate handler above turns
   * the landing entry into the right dispatches, including the two-step case.
   */
  const handleBandNavigate = useCallback(
    (stage: FlowStage) => {
      if (stage === "test") {
        setReview({ index: 0, from: stateRef.current.phase });
        return;
      }
      const targetPhase =
        stage === "verdict" ? "verdict" : stage === "paid" ? "grace" : "invitation";
      const targetDepth = targetPhase === "verdict" ? 0 : targetPhase === "grace" ? 1 : 2;
      const delta = targetDepth - depthRef.current;
      if (delta === 0) return;
      viaLinkRef.current = true;
      window.history.go(delta);
    },
    [],
  );
  // Set by the popstate handler before it dispatches: the phase change it
  // triggers is a MOVE along existing history, so the phase effect must sync
  // state without pushing a new entry (a re-push would clobber the forward
  // stack and double-count depth). depthRef is owned by the handler here.
  const poppingRef = useRef(false);

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
      if (unwindingRef.current) {
        // Landing event of the post-response unwind: strip the marker so
        // the next back press exits the page.
        unwindingRef.current = false;
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

      if (backward && target === "verdict" && phase === "grace") {
        trackTestBack("grace", "verdict", via);
        depthRef.current = i;
        poppingRef.current = true;
        dispatch({ type: "BACK_TO_VERDICT" });
      } else if (backward && target === "grace" && phase === "invitation") {
        if (stateRef.current.invitationResponse) return; // recorded — inert
        trackTestBack("invitation", "grace", via);
        depthRef.current = i;
        poppingRef.current = true;
        dispatch({ type: "BACK_TO_GRACE" });
      } else if (forward && target === "grace" && phase === "verdict") {
        depthRef.current = i;
        poppingRef.current = true;
        dispatch({ type: "SHOW_GRACE" });
      } else if (forward && target === "invitation" && phase === "grace") {
        depthRef.current = i;
        poppingRef.current = true;
        dispatch({ type: "SHOW_INVITATION" });
      } else if (backward && target === "verdict" && phase === "invitation") {
        /*
         * The two-step jump, which only the band can produce: `history.go(-2)`
         * fires one popstate landing on the verdict from the decision.
         *
         * The reducer has no action for it and should not grow one — each of
         * its backward moves guards on the phase it is leaving, and those
         * guards are the method's rules in code. So the chain is dispatched in
         * order instead: the decision's own rule (a recorded response closes
         * the book) still refuses the first step, and the second only runs
         * because the first legitimately landed on grace.
         */
        if (stateRef.current.invitationResponse) return; // recorded — inert
        trackTestBack("invitation", "verdict", via);
        depthRef.current = i;
        poppingRef.current = true;
        dispatch({ type: "BACK_TO_GRACE" });
        dispatch({ type: "BACK_TO_VERDICT" });
      } else if (forward && target === "invitation" && phase === "verdict") {
        // The same jump forward, for a reader who walked back and changed
        // their mind. Both steps are already legal from where they start.
        depthRef.current = i;
        poppingRef.current = true;
        dispatch({ type: "SHOW_GRACE" });
        dispatch({ type: "SHOW_INVITATION" });
      }
      // Anything else: inert entry (e.g. stale forward after unwind).
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dispatch]);

  // Response recorded → unwind our pushed entries so hardware back exits.
  const responseRef = useRef(state.invitationResponse);
  useEffect(() => {
    const had = responseRef.current;
    responseRef.current = state.invitationResponse;
    if (!had && state.invitationResponse && depthRef.current > 0) {
      unwindingRef.current = true;
      window.history.go(-depthRef.current);
      depthRef.current = 0;
    }
  }, [state.invitationResponse]);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#060404] flex flex-col">
      {/* Radial vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

      {/*
       * The only way out of the Law, and now the only thing at the top of it.
       *
       * It used to sit at top-12 / sm:top-14 — under the sticky deaths strip —
       * and translate up by the strip's own height (34px, 40px) once that strip
       * retired at the verdict, so the two read as one thing leaving. With the
       * strip gone there is nothing above it and nothing to retire, so it takes
       * the position it previously only reached at the verdict: 48-34 = 14px,
       * 56-40 = 16px, which is top-3.5 / sm:top-4. Same place the reader's eye
       * already found it on the screens that mattered, and it no longer moves.
       */}
      <Link
          href={`/${locale}`}
          aria-label={messages.test.backLabel}
          className="fixed left-3 top-3.5 z-40 flex items-center gap-1 rounded-md border border-white/[0.06] bg-[#060404]/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[2px] text-white/70 backdrop-blur-sm transition-colors hover:border-white/15 hover:text-white/80 sm:left-4 sm:top-4 sm:text-[10px]"
        >
          <span aria-hidden="true">&larr;</span>
          <span>{messages.test.backLabel}</span>
        </Link>

      {/* Just enough to clear the exit chip's top inset. This was pt-10 for the
          sticky deaths strip and pt-9 after it went, but the strip is what the
          space was for: with it gone the offset simply pushed the examination
          ledger 34px below the chip, so the top of the screen read as two
          header bands with a gap between them. The ledger now sits on the
          chip's own line — see the question card's top padding, which is the
          other half of that sum. */}
      <div className="relative z-[1] flex flex-1 flex-col pt-3">
        {/*
         * The band, on the stages that have something behind them.
         *
         * Not on the questions: they carry the examination ledger, which is a
         * finer-grained readout of the same journey, and stacking the two was
         * the collision this placement exists to avoid. Not on the answered
         * decision either — a recorded response closes the book, and the chrome
         * follows the same rule the reducer does.
         */}
        {review === null &&
          state.phase !== "landing" &&
          state.phase !== "playing" &&
          /* Never on the first run of the verdict. That screen strips itself to
             a sentence on black and the reader has nothing behind them worth
             offering — the band arrives only once they have been further and
             walked back. */
          !(state.phase === "verdict" && furthestStageIndex(state) <= 1) &&
          !(state.phase === "invitation" && state.invitationResponse) && (
            /* Its own line, below the fixed exit chip. On the chip's line it
               ran into it: "← EXIT" ends at 76px and a centred band on a 390
               viewport starts at 78. */
            <div className="px-4 pt-7 pb-1 sm:pt-8">
              <FlowBand
                current={stageOfPhase(state.phase) ?? "test"}
                furthest={furthestStageIndex(state)}
                onNavigate={handleBandNavigate}
                testMessages={messages.test}
                tone={
                  state.phase === "verdict"
                    ? "red"
                    : state.phase === "grace"
                      ? "gold"
                      : "plain"
                }
              />
            </div>
          )}

        {/*
         * The test region — the same question screen, revisited.
         *
         * Rendered in place of the phase rather than over it: this is a walk
         * along the spine, not a viewer floating above one. The reader left the
         * decision and is standing on question III; when they walk off either
         * end they are back where they were.
         */}
        {review !== null && (
          <m.div
            key={`review-${review.index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE_OUT_STRONG }}
            className="flex flex-1 flex-col"
          >
            <QuestionCard
              question={messages.questions[review.index]!}
              questionIndex={review.index}
              score={state.score}
              testMessages={messages.test}
              review={{
                answer: state.answers[review.index]?.answer ?? "honest",
                onBack: () =>
                  setReview((r) =>
                    r === null ? null : r.index === 0 ? null : { ...r, index: r.index - 1 },
                  ),
                onNext: () =>
                  setReview((r) =>
                    r === null || r.index >= TOTAL_QUESTIONS - 1
                      ? null
                      : { ...r, index: r.index + 1 },
                  ),
              }}
            />
          </m.div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {review === null && (
          <m.div
            key={state.phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_STRONG }}
            className="flex flex-1 flex-col"
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
<GraceScreen messages={messages.grace} />
            )}

            {state.phase === "invitation" && (
<InvitationScreen messages={messages} locale={locale} />
            )}
          </m.div>
          )}
        </AnimatePresence>
      </div>

    </main>
  );
}
