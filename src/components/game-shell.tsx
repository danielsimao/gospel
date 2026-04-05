"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { Landing } from "@/components/landing";
import { QuestionCard } from "@/components/question-card";
import { VerdictScreen } from "@/components/verdict-screen";
import { GraceScreen } from "@/components/grace-screen";
import { InvitationScreen } from "@/components/invitation-screen";
import { StickyDeathCounter } from "@/components/shared/sticky-death-counter";
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
  const dispatch = useGameDispatch();

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

      {/* Sticky death counter */}
      <StickyDeathCounter
        label={messages.test.counterLabel}
        liveBadge={messages.test.liveBadge}
      />

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
    </main>
  );
}
