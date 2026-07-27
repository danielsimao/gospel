"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { FollowUp } from "@/components/follow-up";
import { ExaminationLedger } from "@/components/examination-ledger";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackQuestionAnswered, trackFollowupShown, trackAnswerChanged } from "@/lib/analytics";
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

/*
 * Reveal timings after an answer. The rule these follow: pace the message,
 * never the control. A beat before the follow-up presses is rhetoric and stays;
 * a Next button that simply isn't there yet is latency and doesn't.
 *
 * Before: badge 0.5s, Next 1.0s, follow-up text 1.4s — the control arrived
 * 400ms BEFORE the sentence that justifies it had finished. Now the sequence
 * lands in ~1.05s on the denial path and ~0.65s on the honest one, with the
 * message always completing first.
 */
const FOLLOWUP_DELAY_MS = 250;

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
  locale,
  testMessages,
}: QuestionCardProps) {
  const dispatch = useGameDispatch();
  const state = useGameState();
  const router = useRouter();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const answered = state.currentAnswer;
  const showFollowUp = state.showFollowUp;

  // Questions live on one route by design, so advancing between them is a
  // reducer move with no navigation. Only the last one crosses into a new
  // route — that is the point at which the verdict becomes a real URL.
  //
  // replace, not push: this is what makes "the verdict is the floor" real.
  // Questions are one-way, so the route that held them is replaced rather than
  // stacked, and back from the verdict leaves the test entirely instead of
  // returning to a start screen the reader is done with.
  //
  // The last question deliberately does NOT touch the reducer. /test renders
  // the front door for any phase that is not "playing", so flipping to
  // "verdict" here repainted the finished test as its own start screen for the
  // entire navigation — measured at 1.2s in dev: answer six questions, watch
  // them reset, then get the verdict. The verdict screen records the phase on
  // arrival instead, exactly as grace and the invitation already do.
  const [leaving, setLeaving] = useState(false);
  const advance = useCallback(() => {
    if (leaving) return;
    if (questionIndex >= TOTAL_QUESTIONS - 1) {
      setLeaving(true);
      router.replace(`/${locale}/test/verdict`);
      return;
    }
    dispatch({ type: "ADVANCE_AFTER_FOLLOWUP" });
  }, [dispatch, questionIndex, router, locale, leaving]);

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
      }, FOLLOWUP_DELAY_MS),
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

  return (
    <div className="grid flex-1 grid-rows-[auto_1fr] px-4 py-6 sm:px-6">
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
                      // mode="wait" means this exit blocks the response block
                      // from mounting, so its duration is a flat tax on every
                      // reveal below. Kept short for that reason.
                      transition={{ duration: 0.18 }}
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
                      transition={{ duration: 0.3, delay: 0.05 }}
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
                            transition={{ duration: 0.3, delay: 0.2 }}
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
                          duration: 0.3,
                          // Denial waits for the follow-up to land (it mounts at
                          // FOLLOWUP_DELAY_MS and fades over 0.3s); the honest
                          // path only waits for its own one-line reply.
                          delay: answered === "justify" ? 0.6 : 0.35,
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

                      {/* The correction is the reply to the follow-up press, so it
                          only exists on the denial path: they deny, the follow-up
                          presses, and this is how they answer it. After an honest
                          admission it would be a retraction offered at the exact
                          moment conviction lands — so it isn't rendered there. */}
                      {answered === "justify" && (
                        <m.button
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.75 }}
                          onClick={() => {
                            // Dead once the verdict is on its way. The card
                            // stays mounted for the length of that navigation,
                            // and an undo landing in that window would drop an
                            // answer the verdict has already been told to show.
                            if (leaving) return;
                            trackAnswerChanged(question.id, answered);
                            dispatch({ type: "UNDO_ANSWER" });
                          }}
                          className="mt-3 inline-flex min-h-[32px] items-center font-mono text-[10px] uppercase tracking-[1.6px] text-white/60 transition-colors hover:text-white/80"
                        >
                          <span className="border-b border-white/15 pb-0.5">
                            {testMessages.changeAnswerLabel}
                          </span>
                        </m.button>
                      )}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </m.div>
          </AnimatePresence>
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
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${
                      isJustified
                        ? "border-dashed border-red-900/30 bg-red-950/10"
                        : "border-red-900/40 bg-red-950/25"
                    }`}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-red-400/75">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[11px] lowercase italic text-red-400/85">
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
