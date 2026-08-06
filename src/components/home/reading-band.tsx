"use client";

import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import type { Locale } from "@/lib/i18n";

export interface ReadingDay {
  title: string;
  passage: string;
  keyVerse: string;
}

interface ReadingBandProps {
  locale: Locale;
  label: string;
  /** "Day" — prefixes the number, so the band never hardcodes English. */
  dayLabel: string;
  /** Shown in place of a day once all seven are read. */
  completeDescription: string;
  days: ReadingDay[];
  /** How many days this reader has finished, from useJourney. */
  completed: number;
}

/** How much of a verse fits on one line of a band row without crowding it. */
const VERSE_LIMIT = 96;

function trimVerse(verse: string): string {
  if (verse.length <= VERSE_LIMIT) return verse;
  const cut = verse.slice(0, VERSE_LIMIT);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : VERSE_LIMIT)}…`;
}

/**
 * The reading plan, showing the day the reader is actually on.
 *
 * It used to be a row reading "Seven days in John / Seven days in the Gospel of
 * John." — the label restated as its own description, in a section where the
 * blog showed a real headline and the topics showed real questions. What the
 * plan has is better than a description of it: a title, a passage and a verse
 * for each of seven days.
 *
 * Progress-aware because the data was already here. `useJourney` counts the
 * days read, so a reader who is three days in meets day four rather than being
 * sent back to the beginning. Finished readers get the completion line instead;
 * there is no eighth day to offer, and repeating day seven would read as though
 * their progress had been lost.
 */
export function ReadingBand({
  locale,
  label,
  dayLabel,
  completeDescription,
  days,
  completed,
}: ReadingBandProps) {
  if (days.length === 0) return null;

  const finished = completed >= days.length;
  // completed is a count, so it doubles as the index of the next unread day.
  const day = finished ? null : days[Math.min(completed, days.length - 1)];

  return (
    <div className="mt-14 w-full max-w-md text-left sm:max-w-2xl">
      <BandSpine label={label} />
      <div className="border-y border-white/[0.06]">
        <Link
          href={`/${locale}/reading-plan`}
          className="group flex items-start gap-3 border-t border-white/[0.06] px-3 py-3.5 transition-colors first:border-t-0 hover:bg-white/[0.015]"
        >
          <span className="min-w-0 flex-1">
            {day ? (
              <>
                <span className="block text-[15px] font-semibold text-white/85 transition-colors group-hover:text-white">
                  {dayLabel} {completed + 1} &middot; {day.title}
                </span>
                <span className="mt-1 block font-mono text-[11px] tracking-[1px] text-white/45">
                  {day.passage}
                </span>
                <span className="mt-2.5 block border-l border-white/[0.14] pl-3 text-[12.5px] italic leading-relaxed text-white/55">
                  &ldquo;{trimVerse(day.keyVerse)}&rdquo;
                </span>
              </>
            ) : (
              <span className="block text-[15px] font-semibold text-white/85 transition-colors group-hover:text-white">
                {completeDescription}
              </span>
            )}
          </span>
          <span
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-white/30 transition-transform group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
