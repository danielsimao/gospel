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
  /**
   * Set when the reader has walked back into the test from a later stage.
   *
   * The screen is the one they lived: same ledger, same eyebrow, same question,
   * same answered state. What changes is that it reports rather than records —
   * every dispatch is inert, `answer` comes from the stored testimony instead
   * of live state, and the two walk controls replace Next's single one.
   */
  review?: {
    answer: AnswerType;
    /** Walks toward question I; at I, leaves the corridor the way it was entered. */
    onBack: () => void;
    /** Walks toward VI; at VI, leaves forward — as "See the verdict" always did. */
    onNext: () => void;
  };
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
  review,
}: QuestionCardProps) {
  const dispatch = useGameDispatch();
  const state = useGameState();
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  /*
   * In review the answer is the recorded one and the follow-up is already
   * open. Live, both come from state — the reader is mid-beat and the
   * follow-up is still on its timer. Reading them through one pair of names
   * keeps the JSX below identical for both, which is the point: one screen,
   * not two that must be kept in step.
   */
  const answered = review ? review.answer : state.currentAnswer;
  const showFollowUp = review ? true : state.showFollowUp;

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

    // Nothing to pace in review: the beat was lived once and its follow-up is
    // rendered open from the first frame.
    if (review || answered !== "justify" || showFollowUp) {
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
  }, [answered, dispatch, question.id, showFollowUp, review]);

  function handleAnswer(answer: AnswerType) {
    // Testimony is recorded and there is no way back — the reducer's own rule,
    // enforced here too so a revisited screen can never write.
    if (review || answered) return;
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
    /*
     * pt-2, not py-6: the shell's pt-3 plus this puts the ledger's label on the
     * same line as the fixed exit chip, which is what the departed deaths strip
     * used to occupy.
     *
     * The bottom is the contested edge. Three things claim it and only one of
     * them is in the layout: the answer buttons (anchored here), the iOS home
     * indicator (34px of reserved gesture area) and the consent banner (fixed,
     * 58px, first visit only). 1.5rem is the original pb-6; the other two terms
     * are what the buttons have to clear in order to be tappable. Both resolve
     * to zero where they do not apply, so a returning reader on Android gets
     * exactly the spacing this screen has always had.
     */
    <div className="grid flex-1 grid-rows-[auto_1fr] px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] sm:px-6">
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
       * against where the reply heading actually sits, not calculated.
       *
       * It carries the whole responsive rule, because the question is the one
       * thing that never moves at any size. 24vh on a phone puts it high enough
       * for the actions to reach the bottom edge; 36vh from sm up puts the
       * unanswered group on the optical centre instead, since the actions no
       * longer travel there. Below 500px tall — a landscape phone — 12vh, where
       * the only thing that matters is that all of it fits at once.
       */}
      {/* The short-viewport clause exists because of the reserve above it. A
          landscape phone is 390 tall: ledger 49, offset 101, content ~180, and
          the banner's 50 tipped the unanswered screen 16px into scrolling,
          which it never did before. 12vh buys back 55.

          It does not rescue the answered state, and does not pretend to. That
          already overflowed a 390-tall viewport by 106px before any of this —
          measured on the branch with these classes stashed — because a
          question, a verdict, a follow-up, a Next and a chip do not fit in 390
          pixels at any offset. This rule costs 8 of those 106. Fixing the rest
          means smaller type in landscape, which is a design change and not
          this one. */}
      <div className="flex w-full min-h-0 max-w-xs flex-col justify-self-center pt-[24vh] pb-2 sm:max-w-sm sm:pt-[36vh] [@media(max-height:500px)]:pt-[12vh]">
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
                 the question instead of sitting in the thumb zone.

                 sm:flex-none because at that size nothing below is stretching:
                 the spacer is fixed, so a wrapper that still filled the row
                 would leave the answered chips stranded at the bottom edge —
                 measured 340px below the group they belong to, alone on a
                 1280x900 window. Sized to its content, they follow it. */
              className="flex w-full min-h-0 flex-1 flex-col sm:flex-none"
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

                {/*
                 * The gap that absorbs the answer — but only on a phone.
                 *
                 * Below sm it grows, which is what pushes the two verdicts to
                 * the bottom edge and into the thumb zone. Six questions plus a
                 * tap on every denial is six to twelve taps in one sitting, and
                 * that is the case reach is worth buying.
                 *
                 * At sm and above there is no thumb to reach with, and the same
                 * rule opened 435px of nothing between the question and the
                 * buttons on a 900-tall window. A void is pure cost once the
                 * reach it bought is worthless, so the gap stops growing and
                 * the actions sit with the question they answer.
                 */}
                <div className="min-h-6 flex-1 sm:h-8 sm:flex-none" />

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
                      {/*
                        * The mark the verdict arrives on.
                        *
                        * It used to be a hairline inside the 320px column, and
                        * a reply that changes what the reader is called was
                        * separated from the question by the same weight of line
                        * the app uses between two paragraphs. Full-bleed and at
                        * 2px it reads as a division of the screen rather than a
                        * gap in a column — the same border-y-2 border-red-500
                        * that frames GUILTY on the verdict screen, one beat
                        * lighter.
                        *
                        * A rule, not a filled surface. Every judgment mark in
                        * this app is a border on the same black ground; the one
                        * filled, bottom-docked panel in the codebase is the
                        * cookie banner, and a verdict that borrows its material
                        * reads as chrome.
                        *
                        * The breakout is margin, not transform: framer-motion
                        * animates `y` on this block, which writes the same
                        * transform property a -translate-x-1/2 would need, and
                        * the inline style wins. Percentage margins resolve
                        * against the column, so 50%-50vw is exactly the 35px
                        * each side that reaches the screen edge. Below sm on a
                        * desktop window the scrollbar makes 50vw wider than the
                        * content box; the shell's overflow-x-hidden clips it.
                        *
                        * Only the rule goes full width. The words stay in the
                        * measure they were set in.
                        */}
                      <div
                        aria-hidden="true"
                        className="mx-[calc(50%-50vw)] border-t-2 border-red-500/25 sm:mx-0"
                      />
                      {answered === "honest" ? (
                        <>
                          {/* Verdict word */}
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
                          <div className="flex items-center gap-2 pt-3">
                            <span className="h-1 w-1 rounded-full bg-red-500" />
                            <p className="font-mono text-[10px] font-semibold uppercase tracking-[2px] text-red-400/80">
                              {testMessages.justifiedBadge}
                            </p>
                          </div>
                          {answered === "justify" && <FollowUp text={question.followUp} />}
                        </>
                      )}

                      {/* The correction is the reply to the follow-up press, so it
                          only exists on the denial path: they deny, the follow-up
                          presses, and this is how they answer it. After an honest
                          admission it would be a retraction offered at the exact
                          moment conviction lands — so it isn't rendered there.

                          Above Next, not below it. The verse presses and there
                          are two replies to it: accept the charge, or retract.
                          Sitting after Next it answered nothing, because the
                          reader had already been handed the way out of the beat.
                          Both now arrive on the same 0.6s delay — one decision
                          with two doors, not a control and then an afterthought.

                          Deliberately not a button beside Next either. A
                          retraction at equal weight in the thumb zone is a
                          mis-tap that undoes a confession. */}
                      {answered === "justify" && !review && (
                        <m.button
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                          onClick={() => {
                            trackAnswerChanged(question.id, answered);
                            dispatch({ type: "UNDO_ANSWER" });
                          }}
                          className="mt-4 inline-flex min-h-[32px] items-center font-mono text-[10px] uppercase tracking-[1.6px] text-white/60 transition-colors hover:text-white/80"
                        >
                          <span className="border-b border-white/15 pb-0.5">
                            {testMessages.changeAnswerLabel}
                          </span>
                        </m.button>
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
                          // Note this reads the slot, not a ref: the retraction
                          // now renders above it and neither is the last child.
                          // Scroll the Next button into view after it fades in
                          const el = document.querySelector('[data-slot="action-buttons"]');
                          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }}
                        data-slot="action-buttons"
                      >
                        {/*
                         * Live: one control, Next, exactly as it always was.
                         *
                         * In review: Back joins it, and it is the only control
                         * the whole spine adds — the Law never offered one,
                         * because going backwards through it was not a thing a
                         * reader could do. It takes Next's own size and
                         * variant, mirrored, so nothing about the row is a new
                         * idea. Next keeps its live meaning: walk forward, and
                         * at question VI "See the verdict" leaves the test the
                         * same way it did the first time.
                         */}
                        {review ? (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={review.onBack}
                              className="flex-1"
                            >
                              <ButtonArrow direction="left" />
                              {testMessages.flow.back}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={review.onNext}
                              className="flex-1"
                            >
                              {isLastQuestion
                                ? testMessages.seeVerdictLabel
                                : testMessages.nextLabel}
                              <ButtonArrow />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={advance} className="w-full">
                            {isLastQuestion
                              ? testMessages.seeVerdictLabel
                              : testMessages.nextLabel}
                            <ButtonArrow />
                          </Button>
                        )}
                      </m.div>

                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </m.div>
          </AnimatePresence>
          {/*
            * No running list here.
            *
            * It was a chip per answer, below the Next button, and it was the
            * third copy of the same six facts. The ledger above already encodes
            * every answer and how it was given; the verdict word 100px up the
            * screen states the current one in the same words the chip used; and
            * the verdict screen's confession sentence names all six again, in
            * prose that distinguishes what was admitted from what was evaded —
            * which chips cannot do.
            *
            * verdict-screen.tsx reached this conclusion one screen later and
            * left the reasoning in place: an evidence list there "would have
            * restated the confession sentence above ... while adding ~270px
            * that pushed the CTA off a 390x844 viewport". The same argument
            * holds here, where the chips restated a bar and a badge instead of
            * a sentence, and cost ~90px below the primary action on the most
            * crowded screen in the flow.
            *
            * The method agrees. The summing up is the verdict's beat — the
            * names land together, once, or they land six times and the sentence
            * becomes a recap.
            *
            * What this does give up: the chips were the only self-authored
            * thing on the screen, and a screen reader now has no way to review
            * earlier answers mid-test (the ledger exposes only aria-valuenow).
            * Nothing depends on knowing them and the confession states them
            * all, but it is a subtraction, not a free one.
            *
            * state.answers is untouched — the ledger and the confession both
            * still read it.
            */}
      </div>
    </div>
  );
}
