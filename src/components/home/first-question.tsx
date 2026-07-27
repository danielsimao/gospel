"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackHomeFirstQuestionAnswered } from "@/lib/eternity-analytics";
import type { AnswerType } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export interface FirstQuestionCopy {
  /** "Question 1 of 6" — makes the commitment visible, and small. */
  label: string;
  text: string;
  honestLabel: string;
  justifyLabel: string;
}

/**
 * The test's first question, asked on the front door.
 *
 * This replaces the "Take the test" button for new visitors rather than
 * sitting beside it — two asks would give a first-time reader something to
 * decide between, which is the friction this removes. It is not a teaser
 * either: question 1 of the real test IS the lying question, so answering
 * here answers it for real.
 *
 * Both answers navigate to /test?q1=… and land on question 1 already
 * answered, with its follow-up pressing. Jumping to question 2 instead would
 * skip that press — the method's core move, and the first one, which sets the
 * pattern for the whole test.
 *
 * The "1 of 6" label also stops this competing with the page's h1 above it;
 * without it the reader meets two questions stacked and cannot tell which one
 * the buttons answer.
 */
export function FirstQuestion({
  copy,
  locale,
}: {
  copy: FirstQuestionCopy;
  locale: Locale;
}) {
  const router = useRouter();

  function answer(choice: AnswerType) {
    trackHomeFirstQuestionAnswered(choice, locale);
    router.push(`/${locale}/test?q1=${choice}`);
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

      <div className="mt-6 flex w-full gap-2">
        <Button variant="red" size="sm" onClick={() => answer("honest")} className="flex-1">
          {copy.honestLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => answer("justify")} className="flex-1">
          {copy.justifyLabel}
        </Button>
      </div>
    </div>
  );
}
