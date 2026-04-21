"use client";

import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { FollowUp } from "@/components/follow-up";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackQuestionAnswered, trackFollowupShown } from "@/lib/analytics";
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

  // Guilt = inverse of score (display-only transform)
  const guilt = Math.min(100, Math.max(0, 100 - score));
  const displayIndex = questionIndex + 1;
  const config = QUESTION_CONFIGS[questionIndex];
  const ordinal = config?.commandment ?? "";
  const roman = COMMANDMENT_ROMAN[ordinal] ?? ordinal;
  const isLastQuestion = questionIndex >= TOTAL_QUESTIONS - 1;
  const canShowVerdictShortcut = state.answers.length >= 3 && !isLastQuestion;

  return (
    <div className="grid flex-1 grid-rows-[auto_1fr_auto] px-4 py-6 sm:px-6">
      {/* Row 1: Case header + guilt rail — pinned to top */}
      <div className="flex flex-col items-center">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
            {testMessages.caseLabel}
          </span>
          <span className="font-mono text-[9px] tabular-nums text-red-400/75">
            {String(displayIndex).padStart(2, "0")} /{" "}
            {String(TOTAL_QUESTIONS).padStart(2, "0")}
          </span>
        </div>

        <div className="w-full max-w-xs sm:max-w-sm">
          <div className="relative h-[2px] overflow-hidden rounded-full bg-white/[0.04]">
            <motion.div
              className="absolute inset-y-0 left-0 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              animate={{ width: `${guilt}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Card area — self-centered in the 1fr space */}
      <div className="w-full max-w-xs self-center justify-self-center sm:max-w-sm">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={questionIndex}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 sm:p-7">
                {/* Commandment accent */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-px w-6 bg-red-500/40" />
                  <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
                    {testMessages.commandmentLabel} {roman}
                  </span>
                </div>

                {/* Commandment scripture (from i18n) */}
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-white/50">
                  {question.commandment}
                </p>

                {/* Question text */}
                <p className="text-[17px] font-semibold leading-snug text-white/95 sm:text-lg">
                  {question.text}
                </p>

                {/* Buttons */}
                <AnimatePresence mode="wait">
                  {!answered ? (
                    <>
                      <motion.div
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
                      </motion.div>
                      {canShowVerdictShortcut && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="mt-3 flex justify-end"
                        >
                          <Button variant="red" size="sm" onClick={() => dispatch({ type: "SHOW_VERDICT" })}>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500/60" />
                            <span className="font-mono text-[10px] uppercase tracking-[1.5px]">
                              {testMessages.seeVerdictLabel}
                            </span>
                          </Button>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <motion.div
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
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="mt-2.5 text-[13px] italic leading-relaxed text-white/60"
                          >
                            {question.honestFollowUp}
                          </motion.p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 border-t border-red-900/30 pt-3">
                            <span className="h-1 w-1 rounded-full bg-red-500" />
                            <p className="font-mono text-[10px] font-semibold uppercase tracking-[2px] text-red-400/80">
                              {testMessages.justifiedBadge}
                            </p>
                          </div>
                          {showFollowUp && <FollowUp text={question.followUp} />}
                        </>
                      )}

                      {/* Action buttons */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: answered === "justify" ? 1.2 : 0.5,
                        }}
                        className="mt-4 flex gap-2"
                        onAnimationComplete={() => {
                          // Scroll the Next button into view after it fades in
                          const el = document.querySelector('[data-slot="action-buttons"]');
                          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }}
                        data-slot="action-buttons"
                      >
                        <Button variant="ghost" size="sm" onClick={advance} className="flex-1">
                          {isLastQuestion
                            ? testMessages.seeVerdictLabel
                            : testMessages.nextLabel}
                          <ButtonArrow />
                        </Button>
                        {canShowVerdictShortcut && (
                          <Button variant="red" size="sm" onClick={() => dispatch({ type: "SHOW_VERDICT" })}>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500/60" />
                            <span className="font-mono text-[10px] uppercase tracking-[1.5px]">
                              {testMessages.seeVerdictLabel}
                            </span>
                          </Button>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Row 3: Answered chips — pinned to bottom */}
      <div className="flex min-h-[40px] items-start justify-center">
        {state.answers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 flex w-full max-w-xs flex-wrap justify-center gap-1.5 sm:max-w-sm"
          >
            {state.answers.map((answer, i) => {
              const label = testMessages.verdictLabels[answer.commandment];
              if (!label) return null;
              const isJustified = answer.answer === "justify";
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${
                    isJustified
                      ? "border-dashed border-red-900/30 bg-red-950/10 opacity-50"
                      : "border-red-900/40 bg-red-950/25"
                  }`}
                >
                  <span className="font-mono text-[9px] tabular-nums text-red-400/75">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] lowercase italic text-red-400/85">
                    {label}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
