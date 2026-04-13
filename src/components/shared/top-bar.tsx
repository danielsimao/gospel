"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeToStorage } from "@/lib/client-storage";
import { readProgress, getCompletedCount } from "@/lib/reading-storage";
import {
  trackTopBarLearnClicked,
  trackTopBarTestClicked,
  trackTopBarReadingClicked,
} from "@/lib/eternity-analytics";
import type { Locale } from "@/lib/i18n";

const TOTAL_READING_DAYS = 7;

type Stage = "pre-test" | "pre-reading" | "done";

interface TopBarMessages {
  brand: string;
  testLabel: string;
  readingLabel: string;
}

interface TopBarProps {
  locale: Locale;
  learnLabel: string;
  messages: TopBarMessages;
}

function readStage(): Stage {
  try {
    const testDone = localStorage.getItem("test_completed") === "1";
    if (!testDone) return "pre-test";
    const readingDone =
      getCompletedCount(readProgress(), TOTAL_READING_DAYS) >= TOTAL_READING_DAYS;
    return readingDone ? "done" : "pre-reading";
  } catch {
    return "pre-test";
  }
}

export function TopBar({ locale, learnLabel, messages }: TopBarProps) {
  // Initial render (SSR + first client render) uses "pre-test" so server HTML
  // matches client HTML on hydration. useEffect then pulls the real stage from
  // localStorage. Returning users will see a one-frame Test link, but no React
  // hydration warning.
  const [stage, setStage] = useState<Stage>("pre-test");

  useEffect(() => {
    const update = () => setStage(readStage());
    update();
    return subscribeToStorage(update);
  }, []);

  return (
    <div className="relative z-10 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
      <Link
        href={`/${locale}`}
        className="text-[13px] font-bold tracking-tight text-white/70 transition-colors hover:text-white/65"
      >
        {messages.brand}
      </Link>
      <nav className="flex items-center gap-4 text-[13px] font-medium tracking-tight">
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
        <Link
          href={`/${locale}/learn`}
          onClick={() => trackTopBarLearnClicked()}
          className="text-white/50 transition-colors hover:text-white/70"
        >
          {learnLabel}
        </Link>
      </nav>
    </div>
  );
}
