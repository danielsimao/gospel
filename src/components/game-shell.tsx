"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/nextjs";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { Landing } from "@/components/landing";
import { QuestionCard } from "@/components/question-card";
import { VerdictScreen } from "@/components/verdict-screen";
import { GraceScreen } from "@/components/grace-screen";
import { InvitationScreen } from "@/components/invitation-screen";
import { ResumeDialog } from "@/components/resume-dialog";
import {
  trackGameAbandoned,
  trackTestResumed,
  trackTestRestarted,
  trackTestBack,
} from "@/lib/analytics";
import { QUESTION_CONFIGS } from "@/lib/questions";
import {
  readSession,
  clearSession,
  type SavedSession,
} from "@/lib/test-session-storage";
import { markTestCompleted, saveInvitationResponse } from "@/lib/journey-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
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

export function GameShell({ messages, locale }: GameShellProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  // Current-state mirror for the once-registered popstate handler.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // Read any saved session post-mount (server renders no dialog; a lazy
  // initializer here caused hydration mismatches for resuming users). Only
  // show the resume dialog while the state is still on landing — once the
  // user begins (or resumes) a session, this stays null.
  const [pendingResume, setPendingResume] = useState<SavedSession | null>(null);

  useEffect(() => {
    // Deferred one frame: reading localStorage after paint keeps hydration
    // stable and satisfies react-hooks/set-state-in-effect.
    const id = requestAnimationFrame(() => setPendingResume(readSession()));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleResumeContinue() {
    if (!pendingResume) return;
    trackTestResumed(pendingResume.phase, locale);
    dispatch({
      type: "RESUME_SESSION",
      session: {
        phase: pendingResume.phase,
        currentQuestion: pendingResume.currentQuestion,
        score: pendingResume.score,
        answers: pendingResume.answers,
        currentAnswer: pendingResume.currentAnswer,
        showFollowUp: pendingResume.showFollowUp,
        startedAt: pendingResume.startedAt,
        completedAt: pendingResume.completedAt,
        questionStartedAt: pendingResume.questionStartedAt,
        savedAt: pendingResume.savedAt,
        graceReached: pendingResume.graceReached,
        invitationReached: pendingResume.invitationReached,
        invitationResponse: pendingResume.invitationResponse,
      },
    });
    setPendingResume(null);
  }

  function handleResumeStartOver() {
    trackTestRestarted(locale);
    clearSession();
    setPendingResume(null);
  }

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "game",
      message: `Phase: ${state.phase}`,
      level: "info",
      data: { phase: state.phase, score: state.score },
    });

    // Persist test completion so other pages (home, learn, nav) can check
    if (state.phase === "verdict" || state.phase === "grace" || state.phase === "invitation") {
      markTestCompleted();
    }

  }, [state.phase, state.score]);

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

      {/* Back link — always visible */}
      <Link
          href={`/${locale}`}
          aria-label={messages.test.backLabel}
          className="fixed left-3 top-12 z-40 flex items-center gap-1 rounded-md border border-white/[0.06] bg-[#060404]/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[2px] text-white/70 backdrop-blur-sm transition-colors hover:border-white/15 hover:text-white/60 sm:left-4 sm:top-14 sm:text-[10px]"
        >
          <span aria-hidden="true">&larr;</span>
          <span>{messages.test.backLabel}</span>
        </Link>

      {/* Content (offset below sticky bar) */}
      <div className="relative z-[1] flex flex-1 flex-col pt-10">
        <AnimatePresence mode="wait" initial={false}>
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
                locale={locale}
                testMessages={messages.test}
              />
            )}

            {state.phase === "verdict" && (
              <VerdictScreen
                messages={messages.verdict}
                testMessages={messages.test}
                state={state}
              />
            )}

            {state.phase === "grace" && (
              <GraceScreen
                messages={messages.grace}
                returning={state.invitationReached}
                onBack={() => {
                  viaLinkRef.current = true;
                  window.history.back();
                }}
              />
            )}

            {state.phase === "invitation" && (
              <InvitationScreen
                messages={messages}
                locale={locale}
                startedAt={state.startedAt}
                invitationResponse={state.invitationResponse}
                onResponse={(response) => {
                  saveInvitationResponse(response);
                  dispatch({ type: "SET_INVITATION_RESPONSE", response });
                }}
                onBack={() => {
                  viaLinkRef.current = true;
                  window.history.back();
                }}
              />
            )}
          </m.div>
        </AnimatePresence>
      </div>

      <ResumeDialog
        open={!!pendingResume && state.phase === "landing"}
        title={messages.resumeDialog.title}
        continueLabel={messages.resumeDialog.continueLabel}
        startOverLabel={messages.resumeDialog.startOverLabel}
        onContinue={handleResumeContinue}
        onStartOver={handleResumeStartOver}
      />
    </main>
  );
}
