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
       * Row 2: one subject, filling the screen.
       *
       * The card is gone entirely — the screen is the card. The question holds
       * a fixed offset near the top and the two verdicts sit at the bottom, in
       * the thumb zone, with the space between them absorbing whatever the
       * answer brings. Both ends are therefore stationary: the question never
       * moves as the reply arrives, and the action never moves as the reply
       * grows above it. The old layout only held the first of those.
       *
       * The offset meets the landing screen it follows. That screen is centred
       * and this one cannot be — a centred question would rise when the reply
       * appears beneath it — so the offset does the meeting instead. Measured
       * against where the reply heading actually sits, not calculated. It also
       * closes some of the gap this layout opens between the question and the
       * thumb zone, which on a tall phone is the cost of anchoring the actions
       * to the bottom rather than to the question.
       */}
      <div className="flex w-full min-h-0 max-w-xs flex-col justify-self-center pt-[24vh] pb-2 sm:max-w-sm sm:pt-[26vh]">
          <AnimatePresence mode="popLayout">
            <m.div
              key={questionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: EASE_OUT_STRONG }}
              /* flex-1 and min-h-0: this wrapper sits between the sized row and
                 the card, so without them the card's height resolves against
                 nothing, the spacer collapses, and the actions ride up under
                 the question instead of sitting in the thumb zone. */
              className="flex w-full min-h-0 flex-1 flex-col"
            >
              <div className="flex w-full flex-1 flex-col">
                {/*
                 * One line of metadata, not three elements. The numeral, the
                 * Law and the old accent rule were all identifying the same
                 * commandment; here the numeral simply prefixes the name it
                 * belongs to, and the eye goes straight past it to the question.
                 */}
                <p className="font-mono text-[9.5px] uppercase tracking-[2.5px] text-white/45">
                  <span className="text-red-400/75">{roman}</span>
                  <span aria-hidden="true"> · </span>
                  {question.commandment}
                </p>

                {/* The one subject. At 28px it is the only thing on screen with
                    any weight, which is the whole argument of this layout. */}
                <p className="mt-5 text-[28px] font-semibold leading-[1.16] tracking-[-0.028em] text-white/95 sm:text-[31px]">
                  {question.text}
                </p>

                {/* Buttons */}
                {/* The gap that absorbs the answer. Both the question above
                    and the action below stay put; only this shrinks. */}
                <div className="min-h-6 flex-1" />

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
                      className="flex gap-2"
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
