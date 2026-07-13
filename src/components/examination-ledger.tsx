"use client";

import { m } from "framer-motion";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import type { Answer, TestMessages } from "@/lib/types";

interface ExaminationLedgerProps {
  currentQuestion: number;
  answers: Answer[];
  testMessages: TestMessages;
}

const TRANSITION_CLASSES =
  "motion-safe:transition-colors motion-safe:duration-500 motion-safe:ease-[var(--ease-out-strong)]";

const JUSTIFY_DASH_PATTERN =
  "repeating-linear-gradient(to right, rgb(153 27 27 / 0.8) 0 3px, transparent 3px 6px)";

export function ExaminationLedger({
  currentQuestion,
  answers,
  testMessages,
}: ExaminationLedgerProps) {
  const displayIndex = currentQuestion + 1;

  return (
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

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={TOTAL_QUESTIONS}
        aria-valuenow={answers.length}
        aria-label={testMessages.caseLabel}
        className="flex w-full max-w-xs gap-1 sm:max-w-sm sm:gap-1.5"
      >
        {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
          const answered = answers[i];
          const isActive = i === currentQuestion && !answered;
          const resolved =
            i < currentQuestion || (i === currentQuestion && !!answered);

          if (isActive) {
            return (
              <div key={i} className="relative h-[2px] flex-1 rounded-full bg-red-500">
                <m.div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: "0 0 12px rgba(239,68,68,0.7)" }}
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
                />
              </div>
            );
          }

          if (resolved && answered?.answer === "honest") {
            return (
              <div
                key={i}
                className={`h-[2px] flex-1 rounded-full bg-red-500/85 ${TRANSITION_CLASSES}`}
              />
            );
          }

          if (resolved && answered?.answer === "justify") {
            return (
              <div
                key={i}
                className={`h-[2px] flex-1 rounded-full ${TRANSITION_CLASSES}`}
                style={{ backgroundImage: JUSTIFY_DASH_PATTERN }}
              />
            );
          }

          return (
            <div
              key={i}
              className={`h-[2px] flex-1 rounded-full bg-white/[0.06] ${TRANSITION_CLASSES}`}
            />
          );
        })}
      </div>
    </div>
  );
}
