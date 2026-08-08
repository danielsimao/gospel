"use client";

import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import { DayTicketBody, type ReadingDay } from "@/components/shared/day-ticket";
import type { Locale } from "@/lib/i18n";

export type { ReadingDay };

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
 * The band owns only its frame: the centred spine, one gold-tinged Link that
 * lifts like every pressable surface, and the quiet continue line. What the
 * reader is shown about the day itself — eyebrow, title, verse, step bar —
 * is DayTicketBody, shared with the committed track's Read card so the two
 * surfaces cannot drift apart (see shared/day-ticket for the argument, and
 * for why there is no score face here).
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

  return (
    <div className="mt-24 w-full max-w-md text-left sm:max-w-2xl">
      <BandSpine label={label} />
      <Link
        href={`/${locale}/reading-plan`}
        className="group block rounded-2xl border border-[#D4A843]/[0.16] bg-gradient-to-b from-[#D4A843]/[0.035] to-[#D4A843]/[0.012] px-5 py-5 transition-[border-color,transform] duration-300 ease-[var(--ease-out-strong)] hover:-translate-y-0.5 hover:border-[#D4A843]/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-6"
      >
        <DayTicketBody
          dayProgress={dayProgress}
          completeDescription={completeDescription}
          days={days}
          completed={completed}
        />
        <span className="mt-3.5 flex items-center justify-between">
          {/* No door line once the plan is read — there is no day to continue
              to, and the card itself still opens the plan for a re-read. */}
          {!finished ? (
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
