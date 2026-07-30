"use client";

import { useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useGameDispatch, useGameState } from "@/components/game-provider";
import { FollowUp } from "@/components/follow-up";
import { ExaminationLedger } from "@/components/examination-ledger";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackQuestionAnswered, trackFollowupShown, trackAnswerChanged } from "@/lib/analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { QUESTION_CONFIGS, TOTAL_QUESTIONS } from "@/lib/questions";
import type { AnswerType, TestMessages } from "@/lib/types";

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
  testMessages,
}: QuestionCardProps) {
  const dispatch = useGameDispatch();
  const state = useGameState();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const answered = state.currentAnswer;
  const showFollowUp = state.showFollowUp;

  // Advancing is a reducer move, including off the last question — the whole
  // flow is one route again, so the verdict arrives in the same commit as the
  // phase change. While the phases were separate routes this had to navigate,
  // and the gap between the dispatch and the route landing is what repainted
  // the finished test as its own start screen for the length of the
  // navigation.
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
      }, FOLLOWUP_DELAY_MS),
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [answered, dispatch, question.id, showFollowUp]);

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
    /* pt-2, not py-6: the shell's pt-3 plus this puts the ledger's label on the
       same line as the fixed exit chip, which is what the departed deaths strip
       used to occupy. Bottom padding is unchanged. */
    <div className="grid flex-1 grid-rows-[auto_1fr] px-4 pt-2 pb-6 sm:px-6">
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

      {/*
       * Row 2: the card, pinned to a top offset chosen to meet the screen
       * before it.
       *
       * Pinned rather than centred, because the card grows by up to 176px when
       * it is answered — measured — and centring would lift the question by
       * half of that at the moment the follow-up press appears beneath it. The
       * question sits still at every state; only the reply grows downward.
       *
       * The offset itself is what changed. At 7vh the question landed 136px
       * above where the landing screen's heading had just been, so beginning
       * the test threw the reader's eye upward across a crossfade. The landing
       * is centred and does not have this constraint; the card cannot be, so
       * the offset does the meeting instead. 22vh puts the question within
       * ~10px of the reply heading it replaces, and nothing overflows: checked
       * on 667, 844, 932 and desktop, where the tallest answered state — the
       * denial, with its follow-up — still ends well above the fold.
       */}
      <div className="flex w-full max-w-xs flex-col items-center self-start justify-self-center pt-[22vh] sm:max-w-sm sm:pt-[24vh]">
          <AnimatePresence mode="popLayout">
            <m.div
              key={questionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: EASE_OUT_STRONG }}
              className="w-full"
            >
              {/*
               * A ruled region of the page, not a panel.
               *
               * This was a rounded, bordered, gradient-filled card. Six elements
               * inside a lit box read as a form to fill in, and every one of
               * them is load-bearing — so the box was the part to remove, not
               * the contents. What gives the card its structure now is the
               * rules: a case line above, a divider between the two verdicts.
               *
               * The separate "Commandment VII" eyebrow is folded into that case
               * line. It and the commandment's own name were two labels for one
               * thing, and the name is the one carrying the Law.
               *
               * The question grows to 20px. Without a panel it is the only thing
               * holding the hierarchy, and at 17px it no longer did.
               */}
              <div className="relative w-full">
                {/* Case line. The count lives in the ledger directly above, so
                    it is deliberately not repeated here. */}
                <p className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
                  {testMessages.commandmentLabel} {roman}
                </p>
                {/* The rule draws itself, left to right, like a line being
                    ruled on a sheet. scaleX only — composited, and no layout to
                    shift. MotionConfig reducedMotion="user" stops it for readers
                    who ask. */}
                <m.span
                  aria-hidden="true"
                  className="mt-2.5 block h-px origin-left bg-red-500/25"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT_STRONG }}
                />

                {/* The Law is the blade, not a caption */}
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[2px] text-white/75">
                  {question.commandment}
                </p>

                {/* Question text */}
                <p className="mt-2.5 text-[20px] font-semibold leading-[1.28] tracking-[-0.015em] text-white/95 sm:text-[21px]">
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
                      className="mt-6 border-t border-white/[0.08] pt-1"
                    >
                      {/*
                       * Two verdicts either side of a hairline, rather than two
                       * filled buttons. With no panel around them, filled pills
                       * became the heaviest thing on screen and pulled rank over
                       * the question. min-h-[44px] keeps the tap target honest
                       * now that the fill is gone.
                       */}
                      <div className="grid grid-cols-[1fr_1px_1fr] items-stretch">
                        <button
                          type="button"
                          onClick={() => handleAnswer("honest")}
                          className="min-h-[44px] rounded-lg px-2 text-[13.5px] font-semibold text-red-400 transition-colors hover:bg-red-500/[0.07] hover:text-red-300"
                        >
                          {question.honestLabel}
                        </button>
                        <span aria-hidden="true" className="bg-white/[0.08]" />
                        <button
                          type="button"
                          onClick={() => handleAnswer("justify")}
                          className="min-h-[44px] rounded-lg px-2 text-[13.5px] font-semibold text-white/60 transition-colors hover:bg-white/[0.03] hover:text-white/80"
                        >
                          {question.justifyLabel}
                        </button>
                      </div>
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
                          <m.span
                            aria-hidden="true"
                            className="block h-px origin-left bg-red-500/30"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.45, ease: EASE_OUT_STRONG }}
                          />
                          <div className="flex items-center gap-2 pt-3">
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
                          <m.span
                            aria-hidden="true"
                            className="block h-px origin-left bg-red-500/30"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.45, ease: EASE_OUT_STRONG }}
                          />
                          <div className="flex items-center gap-2 pt-3">
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
