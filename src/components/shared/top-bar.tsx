"use client";

import Link from "next/link";
import { useJourney, TOTAL_READING_DAYS } from "@/lib/use-journey";
import {
  trackTopBarLearnClicked,
  trackTopBarTestClicked,
  trackTopBarReadingClicked,
  trackTopBarBlogClicked,
} from "@/lib/eternity-analytics";
import type { Locale } from "@/lib/i18n";

interface TopBarMessages {
  brand: string;
  testLabel: string;
  readingLabel: string;
}

interface TopBarProps {
  locale: Locale;
  learnLabel: string;
  blogLabel: string;
  messages: TopBarMessages;
}

export function TopBar({ locale, learnLabel, blogLabel, messages }: TopBarProps) {
  const journey = useJourney();
  // Reading plan is discipleship — offer it only after a response to grace
  // (committed/thinking). Dismissed users said no and get no nudge here.
  // The test link serves visitors AND undecided users — for the undecided
  // it resumes their session at the verdict, the one door they still need.
  const stage: "pre-test" | "pre-reading" | "done" =
    journey.stage === "visitor" || journey.stage === "undecided"
      ? "pre-test"
      : (journey.stage === "committed" || journey.stage === "thinking") &&
          journey.readingDone < TOTAL_READING_DAYS
        ? "pre-reading"
        : "done";

  return (
    <header className="print-hide relative z-10 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
      <Link
        href={`/${locale}`}
        className="text-[13px] font-bold tracking-tight text-white/70 transition-colors hover:text-white/65"
      >
        {messages.brand}
      </Link>
      <nav
        aria-label={locale === "pt" ? "Navegação principal" : "Main navigation"}
        className="flex items-center gap-4 text-[13px] font-medium tracking-tight"
      >
        {stage === "pre-test" && (
          <Link
            href={`/${locale}/test`}
            onClick={() => trackTopBarTestClicked()}
            className="text-white/50 transition-colors hover:text-white/70"
          >
            {messages.testLabel}
          </Link>
        )}
        {stage === "pre-reading" && (
          <Link
            href={`/${locale}/reading-plan`}
            onClick={() => trackTopBarReadingClicked()}
            className="text-white/50 transition-colors hover:text-white/70"
          >
            {messages.readingLabel}
          </Link>
        )}
        {(journey.stage === "committed" || journey.stage === "thinking") && (
          <Link
            href={`/${locale}/blog`}
            onClick={() => trackTopBarBlogClicked()}
            className="text-white/50 transition-colors hover:text-white/70"
          >
            {blogLabel}
          </Link>
        )}
        <Link
          href={`/${locale}/learn`}
          onClick={() => trackTopBarLearnClicked()}
          className="text-white/50 transition-colors hover:text-white/70"
        >
          {learnLabel}
        </Link>
      </nav>
    </header>
  );
}
