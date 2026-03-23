"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useGameState } from "@/components/game-provider";
import { Landing } from "@/components/landing";
import { QuestionCard } from "@/components/question-card";
import { ScoreBar } from "@/components/score-bar";
import { VerdictScreen } from "@/components/verdict-screen";
import { GraceScreen } from "@/components/grace-screen";
import { InvitationScreen } from "@/components/invitation-screen";
import { trackGameAbandoned } from "@/lib/analytics";
import { QUESTION_CONFIGS } from "@/lib/questions";
import type { Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface GameShellProps {
  messages: Messages;
  locale: Locale;
}

export function GameShell({ messages, locale }: GameShellProps) {
  const state = useGameState();

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "game",
      message: `Phase: ${state.phase}`,
      level: "info",
      data: { phase: state.phase, score: state.score },
    });
  }, [state.phase, state.score]);

  useEffect(() => {
    function handleBeforeUnload() {
      if (state.phase === "playing") {
        const currentConfig = QUESTION_CONFIGS[state.currentQuestion];
        trackGameAbandoned(
          currentConfig?.id ?? 0,
          state.score,
          Date.now() - state.startedAt,
          locale,
        );
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.phase, state.currentQuestion, state.score, state.startedAt, locale]);

  return (
    <main className="relative min-h-dvh flex flex-col">
      {state.phase === "playing" && <ScoreBar score={state.score} />}

      {state.phase === "landing" && (
        <Landing messages={messages.landing} locale={locale} />
      )}

      {state.phase === "playing" && (
        <QuestionCard
          question={messages.questions[state.currentQuestion]}
          questionIndex={state.currentQuestion}
          score={state.score}
          locale={locale}
        />
      )}

      {state.phase === "verdict" && (
        <VerdictScreen messages={messages.verdict} state={state} />
      )}

      {state.phase === "grace" && (
        <GraceScreen messages={messages.grace} />
      )}

      {state.phase === "invitation" && (
        <InvitationScreen
          messages={messages}
          locale={locale}
          state={state}
        />
      )}
    </main>
  );
}
