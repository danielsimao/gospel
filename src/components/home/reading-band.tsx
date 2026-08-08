"use client";

import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import type { Locale } from "@/lib/i18n";

export interface ReadingDay {
  title: string;
  passage: string;
  keyVerse: string;
  keyVerseRef: string;
}

interface ReadingBandProps {
  locale: Locale;
  label: string;
  /** "Day {n} of {total}" — the ticket's eyebrow; never hardcodes English. */
  dayProgress: string;
  /** "Continue reading" — the ticket's quiet mono door. */
  continueLabel: string;
  /** Shown in place of a day once all seven are read. */
  completeDescription: string;
  days: ReadingDay[];
  /** How many days this reader has finished, from useJourney. */
  completed: number;
}

/**
 * The reading plan as a day ticket, for the reader who has reached the
 * verdict (the band is post-test — see the post-test-band rules).
 *
 * It used to be a row: medallion, "Day 4 · title", passage, a verse trimmed
 * at 96 characters, seven 12px dots. The ticket inverts the hierarchy around
 * the best line in the card — the verse itself, untrimmed, in the house gold
 * blockquote the committed stage already uses — under a mono eyebrow that
 * says where the reader is and what it costs in one glance ("DAY 4 OF 7 ·
 * JOHN 10:1–18"), the same register as the test's "6 QUESTIONS · 2 MINUTES".
 *
 * The dots became the step bar the app already speaks: days read in solid
 * gold, today breathing on the LIVE pulse the ask's first segment and the
 * score's stroke use, the rest dim. Two comparisons, no third branch for the
 * finished state — with all seven read, no segment matches `i === completed`,
 * so the pulse retires and the bar simply reads solid.
 *
 * No score face here, deliberately: Big Shoulders is scoped to surfaces that
 * declare (home-passed.test.ts pins this file against it). A reading surface
 * gets size, not signage.
 */
export function ReadingBand({
  locale,
  label,
  dayProgress,
  continueLabel,
  completeDescription,
  days,
  completed,
}: ReadingBandProps) {
  if (days.length === 0) return null;

  const finished = completed >= days.length;
  // completed is a count, so it doubles as the index of the next unread day.
  const day = finished ? null : days[Math.min(completed, days.length - 1)];
  const progressLine = dayProgress
    .replace("{n}", String(completed + 1))
    .replace("{total}", String(days.length));

  return (
    <div className="mt-24 w-full max-w-md text-left sm:max-w-2xl">
      <BandSpine label={label} />
      <Link
        href={`/${locale}/reading-plan`}
        className="group block rounded-2xl border border-[#D4A843]/[0.16] bg-gradient-to-b from-[#D4A843]/[0.035] to-[#D4A843]/[0.012] px-5 py-5 transition-[border-color,transform] duration-300 ease-[var(--ease-out-strong)] hover:-translate-y-0.5 hover:border-[#D4A843]/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-6"
      >
        {day ? (
          <>
            <span className="flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-[2.2px] text-[#D4A843]/80">
              {progressLine}
              <span aria-hidden="true" className="h-[0.7em] w-px bg-white/[0.14]" />
              <span className="tracking-[1.6px] text-white/40">{day.passage}</span>
            </span>
            <span className="mt-2 block text-[20px] font-bold tracking-[-0.01em] text-white/90 transition-colors group-hover:text-white">
              {day.title}
            </span>
            <span className="mt-3.5 block border-l border-[#D4A843]/35 pl-4 text-[15px] italic leading-[1.65] text-white/70">
              &ldquo;{day.keyVerse}&rdquo;
              <span className="mt-1.5 block font-mono text-[9px] not-italic uppercase tracking-[1.8px] text-white/40">
                {day.keyVerseRef}
              </span>
            </span>
          </>
        ) : (
          <span className="block text-[20px] font-bold tracking-[-0.01em] text-white/90 transition-colors group-hover:text-white">
            {completeDescription}
          </span>
        )}
        <span aria-hidden="true" className="mt-4.5 flex gap-1.5">
          {days.map((_, i) => (
            <i
              key={i}
              className={`h-[3px] flex-1 rounded-full ${
                i < completed
                  ? "bg-[#D4A843]/85"
                  : i === completed
                    ? "bg-[#D4A843]/50 animate-pulse motion-reduce:animate-none"
                    : "bg-white/[0.12]"
              }`}
            />
          ))}
        </span>
        <span className="mt-3.5 flex items-center justify-between">
          {/* No door line once the plan is read — there is no day to continue
              to, and the card itself still opens the plan for a re-read. */}
          {day ? (
            <span className="font-mono text-[9.5px] uppercase tracking-[1.8px] text-[#D4A843]/80">
              {continueLabel}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <span
            aria-hidden="true"
            className="text-white/40 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
          >
            &rarr;
          </span>
        </span>
      </Link>
    </div>
  );
}
