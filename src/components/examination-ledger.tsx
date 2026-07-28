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
        // items-center so the taller active step grows from the centre line
        // rather than pushing the row 1px taller and shifting the card.
        className="flex h-[3px] w-full max-w-xs items-center gap-1 sm:max-w-sm sm:gap-1.5"
      >
        {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
          const answered = answers[i];
          const isActive = i === currentQuestion && !answered;
          const resolved =
            i < currentQuestion || (i === currentQuestion && !!answered);

          /*
           * The step being asked, and deliberately not red. Red is this app's
           * judgment colour and belongs only to a recorded answer — using it
           * here too made the current step and an admitted commandment the same
           * mark, separated by 15% alpha on a two-pixel line, and had the bar
           * claiming a verdict on a question nobody had answered yet.
           *
           * Neutral and a pixel taller, so the three states differ on colour,
           * fill and height rather than on colour alone.
           */
          if (isActive) {
            return (
              <div key={i} className="relative h-[3px] flex-1 rounded-full bg-white/70">
                <m.div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: "0 0 10px rgba(255,255,255,0.55)" }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
                />
              </div>
            );
          }

          // Admitted: full red, no longer held at 85% to stay clear of the
          // active step it used to be confused with.
          if (resolved && answered?.answer === "honest") {
            return (
              <div
                key={i}
                className={`h-[2px] flex-1 self-center rounded-full bg-red-500 ${TRANSITION_CLASSES}`}
              />
            );
          }

          // Deflected: dashed, so the two answers are told apart without relying
          // on colour at all.
          if (resolved && answered?.answer === "justify") {
            return (
              <div
                key={i}
                className={`h-[2px] flex-1 self-center rounded-full ${TRANSITION_CLASSES}`}
                style={{ backgroundImage: JUSTIFY_DASH_PATTERN }}
              />
            );
          }

          // Not yet asked.
          return (
            <div
              key={i}
              className={`h-[2px] flex-1 self-center rounded-full bg-white/[0.06] ${TRANSITION_CLASSES}`}
            />
          );
        })}
      </div>
    </div>
  );
}
