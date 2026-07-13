"use client";

import { useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { FollowUp } from "@/components/follow-up";
import { ExaminationLedger } from "@/components/examination-ledger";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackQuestionAnswered, trackFollowupShown } from "@/lib/analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { QUESTION_CONFIGS, TOTAL_QUESTIONS } from "@/lib/questions";
import type { AnswerType, TestMessages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface QuestionCardProps {
  question: {
    id: number;
    text: string;
    commandment: string;
    honestLabel: string;
    justifyLabel: string;
    followUp: string;
    honestFollowUp: string;
  };
  questionIndex: number;
  score: number;
  locale: Locale;
  testMessages: TestMessages;
}

// Roman numerals for commandment (9th → IX, etc.)
const COMMANDMENT_ROMAN: Record<string, string> = {
  "1st": "I",
  "2nd": "II",
  "3rd": "III",
  "4th": "IV",
  "5th": "V",
  "6th": "VI",
  "7th": "VII",
  "8th": "VIII",
  "9th": "IX",
  "10th": "X",
};

export function QuestionCard({
  question,
  questionIndex,
  score,
  testMessages,
}: QuestionCardProps) {
  const dispatch = useGameDispatch();
  const state = useGameState();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const answered = state.currentAnswer;
  const showFollowUp = state.showFollowUp;

  const advance = useCallback(() => {
    dispatch({ type: "ADVANCE_AFTER_FOLLOWUP" });
  }, [dispatch]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (answered !== "justify" || showFollowUp) {
      return;
    }

    timersRef.current.push(
      setTimeout(() => {
        dispatch({ type: "SHOW_FOLLOWUP" });
        trackFollowupShown(question.id);
      }, 600),
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [answered, dispatch, question.id, questionIndex, showFollowUp]);

  function handleAnswer(answer: AnswerType) {
    if (answered) return;
    const timeOnQuestion = state.questionStartedAt
      ? Date.now() - state.questionStartedAt
      : 0;
    dispatch({ type: "ANSWER_QUESTION", answer });

    const config = QUESTION_CONFIGS[questionIndex];
    if (!config) return;
    const drain = answer === "honest" ? config.honestDrain : config.justifyDrain;
    const newScore = Math.max(0, score - drain);

    trackQuestionAnswered(
      question.id,
      question.commandment,
      answer,
      newScore,
      timeOnQuestion,
    );
  }

  const config = QUESTION_CONFIGS[questionIndex];
  const ordinal = config?.commandment ?? "";
  const roman = COMMANDMENT_ROMAN[ordinal] ?? ordinal;
  const isLastQuestion = questionIndex >= TOTAL_QUESTIONS - 1;
  const canShowVerdictShortcut = state.answers.length >= 3 && !isLastQuestion;

  return (
    <div className="grid flex-1 grid-rows-[auto_1fr_auto] px-4 py-6 sm:px-6">
      {/* Row 1: Examination ledger — pinned to top; enters just behind the
          card on phase entry (mounts once, not per question) */}
      <m.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: EASE_OUT_STRONG }}
      >
        <ExaminationLedger
          currentQuestion={questionIndex}
          answers={state.answers}
          testMessages={testMessages}
        />
      </m.div>

      {/* Row 2: Card area + verdict shortcut — pinned to a stable top offset */}
      <div className="flex w-full max-w-xs flex-col items-center self-start justify-self-center pt-[7vh] sm:max-w-sm sm:pt-[9vh]">
          <AnimatePresence mode="popLayout">
            <m.div
              key={questionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: EASE_OUT_STRONG }}
              className="w-full"
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 sm:p-7">
                {/* Commandment accent */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-px w-6 bg-red-500/40" />
                  <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
                    {testMessages.commandmentLabel} {roman}
                  </span>
                </div>

                {/* Commandment scripture (from i18n) — the Law is the blade, not a caption */}
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[2px] text-white/75">
                  {question.commandment}
                </p>

                {/* Question text */}
                <p className="text-[17px] font-semibold leading-snug text-white/95 sm:text-lg">
                  {question.text}
                </p>

                {/* Buttons */}
                <AnimatePresence mode="wait">
                  {!answered ? (
                    <m.div
                      key="buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-5 flex gap-2"
                    >
                      <Button variant="red" size="sm" onClick={() => handleAnswer("honest")} className="flex-1">
                        {question.honestLabel}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAnswer("justify")} className="flex-1">
                        {question.justifyLabel}
                      </Button>
                    </m.div>
                  ) : (
                    <m.div
                      key="response"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="mt-4"
                    >
                      {answered === "honest" ? (
                        <>
                          {/* Verdict word */}
                          <div className="flex items-center gap-2 border-t border-red-900/30 pt-3">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            <p className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-red-400">
                              {testMessages.verdictLabels[config?.commandment ?? ""] ?? testMessages.answeredBadge}
                            </p>
                          </div>
                          {/* Honest follow-up text */}
                          <m.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="mt-2.5 text-[13px] italic leading-relaxed text-white/60"
                          >
                            {question.honestFollowUp}
                          </m.p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 border-t border-red-900/30 pt-3">
                            <span className="h-1 w-1 rounded-full bg-red-500" />
                            <p className="font-mono text-[10px] font-semibold uppercase tracking-[2px] text-red-400/80">
                              {testMessages.justifiedBadge}
                            </p>
                          </div>
                          {answered === "justify" && <FollowUp text={question.followUp} />}
                        </>
                      )}

                      {/* Action button */}
                      <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: answered === "justify" ? 0.6 : 0.5,
                        }}
                        className="mt-4"
                        onAnimationComplete={() => {
                          // Scroll the Next button into view after it fades in
                          const el = document.querySelector('[data-slot="action-buttons"]');
                          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }}
                        data-slot="action-buttons"
                      >
                        <Button variant="ghost" size="sm" onClick={advance} className="w-full">
                          {isLastQuestion
                            ? testMessages.seeVerdictLabel
                            : testMessages.nextLabel}
                          <ButtonArrow />
                        </Button>
                      </m.div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </m.div>
          </AnimatePresence>
          <div className="mt-4 flex h-9 items-center justify-center">
            {canShowVerdictShortcut && (
              <m.button
                type="button"
                onClick={() => dispatch({ type: "SHOW_VERDICT" })}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="group inline-flex items-center gap-2.5 rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[2.5px] text-red-400/65 transition-colors hover:text-red-400 focus-visible:text-red-400 focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="h-px w-5 bg-red-500/45 transition-all duration-300 group-hover:w-9 group-hover:bg-red-500"
                />
                <span>{testMessages.seeVerdictLabel}</span>
                <span
                  aria-hidden="true"
                  className="text-[13px] transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </m.button>
            )}
          </div>
      </div>

      {/* Row 3: Answered chips — pinned to bottom */}
      <div className="flex min-h-[76px] flex-col items-center justify-start gap-3">
        {state.answers.length > 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 flex w-full max-w-xs flex-wrap justify-center gap-1.5 sm:max-w-sm"
          >
            {state.answers.map((answer, i) => {
              const label = testMessages.verdictLabels[answer.commandment];
              if (!label) return null;
              const isJustified = answer.answer === "justify";
              return (
                <m.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isJustified ? 0.5 : 1, scale: 1 }}
                  transition={{ duration: 0.18, ease: EASE_OUT_STRONG }}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${
                    isJustified
                      ? "border-dashed border-red-900/30 bg-red-950/10"
                      : "border-red-900/40 bg-red-950/25"
                  }`}
                >
                  <span className="font-mono text-[9px] tabular-nums text-red-400/75">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] lowercase italic text-red-400/85">
                    {label}
                  </span>
                </m.div>
              );
            })}
          </m.div>
        )}
      </div>
    </div>
  );
}
