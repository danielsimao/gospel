"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Button, ButtonArrow } from "@/components/ui/button";
import { FollowUp } from "@/components/follow-up";
import { EASE_OUT_STRONG } from "@/lib/motion";
import {
  trackHomeFirstQuestionAnswered,
  trackHomeFirstQuestionAdvanced,
} from "@/lib/eternity-analytics";
import type { AnswerType } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export interface FirstQuestionCopy {
  /** "Question 1 of 6" — makes the commitment visible, and small. */
  label: string;
  text: string;
  honestLabel: string;
  justifyLabel: string;
  /** The press, shown right here rather than after the page changes. */
  followUp: string;
  honestFollowUp: string;
  honestVerdictLabel: string;
  justifiedBadge: string;
  nextLabel: string;
}

/**
 * The test's first question, asked on the front door, and finished there.
 *
 * Question 1 of the real test IS the lying question, so answering here answers
 * it for real — this is not a teaser. It replaces the "Take the test" button
 * rather than sitting beside it; two asks would give a first-time reader
 * something to decide between, which is the friction this removes.
 *
 * The whole beat completes before navigating: the chosen answer stays visible
 * and selected, the badge lands, the follow-up presses, and only then does a
 * Next button appear. Navigating on the answer tap instead made the page change
 * under the reader at the exact moment they were looking for confirmation that
 * their tap registered — so the confirmation now happens where the tap did, and
 * the route change waits for an explicit forward action.
 *
 * Because the press happens here, /test opens at question 2 with question 1
 * already on the ledger.
 */
export function FirstQuestion({
  copy,
  locale,
}: {
  copy: FirstQuestionCopy;
  locale: Locale;
}) {
  const router = useRouter();
  const [answered, setAnswered] = useState<AnswerType | null>(null);

  function choose(choice: AnswerType) {
    if (answered) return;
    setAnswered(choice);
    trackHomeFirstQuestionAnswered(choice, locale);
  }

  function advance() {
    if (!answered) return;
    trackHomeFirstQuestionAdvanced(answered, locale);
    router.push(`/${locale}/test?q1=${answered}`);
  }

  return (
    <div className="mt-9 flex w-full max-w-sm flex-col items-center sm:mt-12">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
        <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
          {copy.label}
        </span>
        <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
      </div>

      <p className="mt-4 text-balance text-center text-[17px] font-semibold leading-snug text-white/95 sm:text-lg">
        {copy.text}
      </p>

      {/* Both answers stay on screen. The chosen one holds a selected state
          rather than blinking — a flashing control reads as a validation error,
          and WCAG 2.3.1 exists to keep repeated flashes off the page entirely. */}
      <div className="mt-6 flex w-full gap-2">
        <Button
          variant="red"
          size="sm"
          onClick={() => choose("honest")}
          disabled={answered !== null}
          className={`flex-1 transition-opacity ${
            answered && answered !== "honest" ? "opacity-35" : ""
          }`}
        >
          {copy.honestLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => choose("justify")}
          disabled={answered !== null}
          className={`flex-1 transition-opacity ${
            answered && answered !== "justify" ? "opacity-35" : ""
          }`}
        >
          {copy.justifyLabel}
        </Button>
      </div>

      <AnimatePresence>
        {answered && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05, ease: EASE_OUT_STRONG }}
            className="w-full"
          >
            <div className="mt-5 flex items-center gap-2 border-t border-red-900/30 pt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <p className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-red-400">
                {answered === "honest" ? copy.honestVerdictLabel : copy.justifiedBadge}
              </p>
            </div>

            {answered === "honest" ? (
              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-2.5 text-[13px] italic leading-relaxed text-white/60"
              >
                {copy.honestFollowUp}
              </m.p>
            ) : (
              <FollowUp text={copy.followUp} />
            )}

            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: answered === "justify" ? 0.6 : 0.35 }}
              className="mt-5"
            >
              <Button variant="gold" size="sm" mist onClick={advance} className="w-full">
                {copy.nextLabel}
                <ButtonArrow />
              </Button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
