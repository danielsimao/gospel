"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { FollowUp } from "@/components/follow-up";
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
  const [answered, setAnswered] = useState<AnswerType | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const advance = useCallback(() => {
    dispatch({ type: "ADVANCE_AFTER_FOLLOWUP" });
  }, [dispatch]);

  useEffect(() => {
    setAnswered(null);
    setShowFollowUp(false);
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [questionIndex]);

  function handleAnswer(answer: AnswerType) {
    if (answered) return;

    setAnswered(answer);
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
      0,
    );

    // Show follow-up on justify (user controls advance via Next button)
    if (answer === "justify") {
      timersRef.current.push(
        setTimeout(() => {
          setShowFollowUp(true);
          trackFollowupShown(question.id);
        }, 600),
      );
    }
  }

  // Guilt = inverse of score (display-only transform)
  const guilt = Math.min(100, Math.max(0, 100 - score));
  const displayIndex = questionIndex + 1;
  const config = QUESTION_CONFIGS[questionIndex];
  const ordinal = config?.commandment ?? "";
  const roman = COMMANDMENT_ROMAN[ordinal] ?? ordinal;
  const isLastQuestion = questionIndex >= TOTAL_QUESTIONS - 1;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6">
      <div className="flex w-full max-w-md flex-col items-center">
        {/* Case header */}
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/50">
            {testMessages.caseLabel}
          </span>
          <span className="font-mono text-[9px] tabular-nums text-red-400/50">
            {String(displayIndex).padStart(2, "0")} /{" "}
            {String(TOTAL_QUESTIONS).padStart(2, "0")}
          </span>
        </div>

        {/* Guilt rail */}
        <div className="flex w-full max-w-xs items-center gap-2.5 sm:max-w-sm">
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-white/30">
            {testMessages.guiltLabel}
          </span>
          <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/[0.04]">
            <motion.div
              className="absolute inset-y-0 left-0 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              animate={{ width: `${guilt}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.6 }}
            key={guilt}
            className="min-w-[26px] text-right font-mono text-[11px] font-bold tabular-nums text-red-400"
          >
            {guilt}
          </motion.span>
        </div>

        {/* Question card */}
        <div className="relative mt-6 w-full max-w-xs sm:max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 sm:p-7">
                {/* Corner index badge */}
                <div className="absolute right-4 top-4 font-mono text-[10px] tabular-nums text-white/15">
                  {String(displayIndex).padStart(2, "0")}
                </div>

                {/* Commandment accent */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-px w-6 bg-red-500/40" />
                  <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/60">
                    Commandment {roman}
                  </span>
                </div>

                {/* Commandment scripture (from i18n) */}
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
                  {question.commandment}
                </p>

                {/* Question text */}
                <p className="text-[17px] font-semibold leading-snug text-white/95 sm:text-lg">
                  {question.text}
                </p>

                {/* Buttons */}
                <AnimatePresence mode="wait">
                  {!answered ? (
                    <motion.div
                      key="buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-5 flex gap-2"
                    >
                      <button
                        onClick={() => handleAnswer("honest")}
                        className="group relative flex-1 overflow-hidden rounded-xl border border-red-700/40 bg-red-950/40 px-4 py-3 text-sm font-semibold tracking-wide text-red-300 transition-all duration-300 hover:border-red-600/60 hover:bg-red-900/40 min-h-[48px]"
                      >
                        <span className="relative z-10">
                          {question.honestLabel}
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-red-900/0 via-red-700/20 to-red-900/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </button>
                      <button
                        onClick={() => handleAnswer("justify")}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm font-medium tracking-wide text-white/50 transition-all hover:border-white/15 hover:bg-white/[0.04] hover:text-white/70 min-h-[48px]"
                      >
                        {question.justifyLabel}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="response"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="mt-4"
                    >
                      <div className="flex items-center gap-2 border-t border-red-900/30 pt-3">
                        <span className="h-1 w-1 rounded-full bg-red-500" />
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[2px] text-red-400/80">
                          {answered === "honest"
                            ? testMessages.answeredBadge
                            : testMessages.justifiedBadge}
                        </p>
                      </div>
                      {showFollowUp && <FollowUp text={question.followUp} />}

                      {/* Next button */}
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: answered === "justify" ? 1.2 : 0.4,
                        }}
                        onClick={advance}
                        className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-4 py-2.5 text-xs font-medium tracking-wide text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white/85 min-h-[44px]"
                      >
                        <span>
                          {isLastQuestion
                            ? testMessages.seeVerdictLabel
                            : testMessages.nextLabel}
                        </span>
                        <span className="transition-transform group-hover:translate-x-0.5">
                          &rarr;
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Answered chips history */}
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
                  <span className="font-mono text-[9px] tabular-nums text-red-400/45">
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
