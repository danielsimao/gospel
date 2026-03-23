"use client";

import { useGameState } from "@/components/game-provider";
import { Landing } from "@/components/landing";
import { QuestionCard } from "@/components/question-card";
import { ScoreBar } from "@/components/score-bar";
import { VerdictScreen } from "@/components/verdict-screen";
import { GraceScreen } from "@/components/grace-screen";
import { InvitationScreen } from "@/components/invitation-screen";
import type { Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface GameShellProps {
  messages: Messages;
  locale: Locale;
}

export function GameShell({ messages, locale }: GameShellProps) {
  const state = useGameState();

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
