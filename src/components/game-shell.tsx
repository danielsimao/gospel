"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "@/lib/analytics";
import { emitStorageChange } from "@/lib/client-storage";
import { QUESTION_CONFIGS } from "@/lib/questions";
import {
  readSession,
  clearSession,
  type SavedSession,
} from "@/lib/test-session-storage";
import type { Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface GameShellProps {
  messages: Messages;
  locale: Locale;
}

export function GameShell({ messages, locale }: GameShellProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  // Read any saved session once on mount. Only show the resume dialog if
  // the current state is still on landing — once the user begins (or resumes)
  // a session, this stays null for the lifetime of the component.
  const [pendingResume, setPendingResume] = useState<SavedSession | null>(() =>
    typeof window === "undefined" ? null : readSession(),
  );

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

    // Persist test completion so other pages (learn) can check
    if (state.phase === "verdict" || state.phase === "grace" || state.phase === "invitation") {
      try {
        localStorage.setItem("test_completed", "1");
        emitStorageChange();
      } catch {}
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

        {state.phase === "grace" && <GraceScreen messages={messages.grace} />}

        {state.phase === "invitation" && (
          <InvitationScreen
            messages={messages}
            locale={locale}
            startedAt={state.startedAt}
            invitationResponse={state.invitationResponse}
            onResponse={(response) =>
              dispatch({ type: "SET_INVITATION_RESPONSE", response })
            }
          />
        )}
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
