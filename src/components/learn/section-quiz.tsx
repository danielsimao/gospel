"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { readQuizAnswer, writeQuizAnswer } from "@/lib/learn-quiz-storage";

interface SectionQuizProps {
  quiz: {
    question: string;
    options: string[];
    correct: number;
    reveal: string;
  };
  topicSlug: string;
  sectionIndex: number;
}

function QuizOption({
  text,
  state,
  onClick,
}: {
  text: string;
  state: "idle" | "correct" | "wrong-selected" | "wrong";
  onClick: () => void;
}) {
  const base =
    "w-full rounded-lg border px-4 py-3 text-left text-sm leading-snug transition-all duration-300 cursor-pointer";

  const styles = {
    idle: "border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/75",
    correct: "border-[#D4A843]/40 bg-[#D4A843]/[0.06] text-[#D4A843]",
    "wrong-selected": "border-white/[0.08] bg-white/[0.02] text-white/40",
    wrong: "border-white/[0.04] bg-transparent text-white/25",
  };

  return (
    <button onClick={onClick} disabled={state !== "idle"} className={`${base} ${styles[state]}`}>
      <span className="flex items-start gap-2">
        {state === "wrong-selected" && (
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
        )}
        {state === "correct" && (
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A843]" />
        )}
        <span>{text}</span>
      </span>
    </button>
  );
}

export function SectionQuiz({ quiz, topicSlug, sectionIndex }: SectionQuizProps) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(readQuizAnswer(topicSlug, sectionIndex));
  }, [topicSlug, sectionIndex]);

  const answered = selected !== null;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    writeQuizAnswer(topicSlug, sectionIndex, index);
  }

  function getState(i: number): "idle" | "correct" | "wrong-selected" | "wrong" {
    if (!answered) return "idle";
    if (i === quiz.correct) return "correct";
    if (i === selected) return "wrong-selected";
    return "wrong";
  }

  return (
    <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 sm:p-6">
      {/* Label */}
      <div className="mb-3 flex items-center gap-2">
        <span className="h-px w-4 bg-[#D4A843]/30" />
        <span className="font-mono text-[9px] uppercase tracking-[2.5px] text-[#D4A843]/50">
          Reflect
        </span>
      </div>

      {/* Question */}
      <p className="text-[15px] font-semibold leading-snug text-white/85 sm:text-base">
        {quiz.question}
      </p>

      {/* Options */}
      <div className="mt-4 flex flex-col gap-2">
        {quiz.options.map((option, i) => (
          <motion.div
            key={i}
            animate={{ opacity: answered && i !== quiz.correct && i !== selected ? 0.5 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <QuizOption
              text={option}
              state={getState(i)}
              onClick={() => handleSelect(i)}
            />
          </motion.div>
        ))}
      </div>

      {/* Reveal */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-4 border-l-2 border-[#D4A843]/30 pl-4"
        >
          <p className="text-sm leading-relaxed text-white/55">
            {quiz.reveal}
          </p>
        </motion.div>
      )}
    </div>
  );
}
