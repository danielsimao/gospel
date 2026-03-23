"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { FollowUp } from "@/components/follow-up";
import {
  trackQuestionAnswered,
  trackFollowupShown,
} from "@/lib/analytics";
import { QUESTION_CONFIGS } from "@/lib/questions";
import type { AnswerType } from "@/lib/types";
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
}

export function QuestionCard({
  question,
  questionIndex,
  score,
}: QuestionCardProps) {
  const dispatch = useGameDispatch();
  const [answered, setAnswered] = useState<AnswerType | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const advance = useCallback(() => {
    dispatch({ type: "ADVANCE_AFTER_FOLLOWUP" });
  }, [dispatch]);

  useEffect(() => {
    setAnswered(null);
    setShowFollowUp(false);
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [questionIndex]);

  function handleAnswer(answer: AnswerType) {
    if (answered) return;

    setAnswered(answer);
    dispatch({ type: "ANSWER_QUESTION", answer });

    const config = QUESTION_CONFIGS[questionIndex];
    const drain = answer === "honest" ? config.honestDrain : config.justifyDrain;
    const newScore = Math.max(0, score - drain);

    trackQuestionAnswered(
      question.id,
      question.commandment,
      answer,
      newScore,
      0,
    );

    if (answer === "justify") {
      timersRef.current.push(
        setTimeout(() => {
          setShowFollowUp(true);
          trackFollowupShown(question.id);
        }, 800),
      );
      timersRef.current.push(
        setTimeout(() => {
          advance();
        }, 3500),
      );
    } else {
      timersRef.current.push(
        setTimeout(() => {
          advance();
        }, 1200),
      );
    }
  }

  const bgOpacity = Math.max(0, 0.05 - questionIndex * 0.006);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: `rgba(255, 255, 255, ${bgOpacity})` }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <p className="text-xs uppercase tracking-widest text-white/30 mb-6">
            {question.commandment}
          </p>

          <h2 className="text-2xl font-semibold leading-snug sm:text-3xl max-w-lg">
            {question.text}
          </h2>

          {!answered && (
            <div className="mt-10 flex flex-col gap-3 w-full max-w-xs sm:flex-row sm:max-w-md sm:gap-4">
              <button
                onClick={() => handleAnswer("honest")}
                className="rounded-lg border border-white/20 px-6 py-4 text-base font-medium transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px] w-full"
              >
                {question.honestLabel}
              </button>
              <button
                onClick={() => handleAnswer("justify")}
                className="rounded-lg border border-white/10 px-6 py-4 text-base text-white/60 font-medium transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px] w-full"
              >
                {question.justifyLabel}
              </button>
            </div>
          )}

          {answered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10"
            >
              {showFollowUp && <FollowUp text={question.followUp} />}
              {!showFollowUp && answered === "honest" && (
                <p className="text-sm text-white/40">...</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
