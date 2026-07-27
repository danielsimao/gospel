"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { Landing } from "@/components/landing";
import { QuestionCard } from "@/components/question-card";
import { ResumeDialog } from "@/components/resume-dialog";
import { trackTestResumed, trackTestRestarted } from "@/lib/analytics";
import {
  readSession,
  clearSession,
  type SavedSession,
} from "@/lib/test-session-storage";
import { furthestPhase, routeForPhase } from "@/lib/test-routes";
import type { Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface TestLandingProps {
  messages: Messages;
  locale: Locale;
}

/**
 * The landing screen and every question, on one route. Questions deliberately
 * never get URLs of their own: the method treats them as one-way, so giving
 * them history entries would hand the reader a back button into a question
 * they have already answered.
 *
 * The resume dialog lives here rather than in the layout — offering "pick up
 * where you left off" to someone already standing on /test/grace is nonsense.
 */
export function TestLanding({ messages, locale }: TestLandingProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const router = useRouter();

  const [pendingResume, setPendingResume] = useState<SavedSession | null>(null);

  useEffect(() => {
    // Deferred one frame: reading localStorage after paint keeps hydration
    // stable and satisfies react-hooks/set-state-in-effect.
    const id = requestAnimationFrame(() => {
      const saved = readSession();
      // Sessions now outlive the decision so the journey stays re-readable, so
      // "is there a session?" is no longer the same question as "is there
      // something to resume?". Offering "pick up where you left off" to a
      // reader who already answered would nag them forever.
      setPendingResume(saved && saved.invitationResponse === null ? saved : null);
    });
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
        graceBeatsRevealed: pendingResume.graceBeatsRevealed,
        invitationReached: pendingResume.invitationReached,
        invitationResponse: pendingResume.invitationResponse,
      },
    });
    // Route from what the session actually contains, not from its stored
    // phase — furthestPhase is derived from the answers and flags, so it
    // cannot disagree with them.
    const target = routeForPhase(furthestPhase(pendingResume), locale);
    setPendingResume(null);
    if (target !== `/${locale}/test`) router.push(target);
  }

  function handleResumeStartOver() {
    trackTestRestarted(locale);
    clearSession();
    setPendingResume(null);
  }

  return (
    <>
      {/* Binary, with no fall-through: a test in progress shows the question,
          anything else shows the front door. An earlier version branched on
          phase === "landing" for the door, which left this route rendering
          nothing at all when the reducer said "verdict" but the URL said /test
          — a blank page reachable by browser back. */}
      {state.phase === "playing" ? (
        <QuestionCard
          question={messages.questions[state.currentQuestion]!}
          questionIndex={state.currentQuestion}
          score={state.score}
          locale={locale}
          testMessages={messages.test}
        />
      ) : (
        <Landing messages={messages.landing} locale={locale} />
      )}

      {/* Offered whenever a test is not actively in progress — including after
          browser-back from the verdict, where the reducer still says "verdict"
          but the reader is looking at the front door. Without that, Begin would
          silently discard a completed test. */}
      <ResumeDialog
        open={!!pendingResume && state.phase !== "playing"}
        title={messages.resumeDialog.title}
        continueLabel={messages.resumeDialog.continueLabel}
        startOverLabel={messages.resumeDialog.startOverLabel}
        onContinue={handleResumeContinue}
        onStartOver={handleResumeStartOver}
      />
    </>
  );
}
