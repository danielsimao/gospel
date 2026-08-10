"use client";

import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import type { VerdictRow } from "@/lib/test-stats";
import type { Locale } from "@/lib/i18n";

interface VerdictLedgerProps {
  locale: Locale;
  messages: {
    /** The pulsing badge: "ao vivo" / "live". */
    liveBadge: string;
    /** The verdict on every red row — "chumbaram" / "failed". Shared with the
        scoreline's caption, so the two renderings speak one vocabulary. */
    failedCaption: string;
    /** The verdict on the gold row: "passou" / "passed". */
    passedCaption: string;
    /** Where the one pass happened: "Jerusalém" / "Jerusalem". */
    ledgerPlace: string;
    /** When: "há 2000 anos" / "2,000 years ago". */
    ledgerWhen: string;
  };
  /** Real, consented verdicts, newest first. Never modelled — see test-stats. */
  rows: VerdictRow[];
}

function intlLocale(locale: Locale): string {
  return locale === "pt" ? "pt-PT" : "en-US";
}

/**
 * Where someone stood trial, said in the reader's own language.
 *
 * GeoIP answers "Brazil" whoever is asking, so composing the place upstream
 * would have printed "São Paulo, Brazil" on a Portuguese page — the site
 * dropping into English mid-sentence. The country code is carried down instead
 * and resolved here, per locale, which is also why this is a function of the
 * row rather than a string the server prepared.
 *
 * The city cannot get the same treatment: GeoIP's city names are a plain
 * string with no code behind them, so "Lisbon" stays "Lisbon" in both. That is
 * a limit of the data, not a decision — and it is why the country, the half
 * that CAN be said properly, is worth saying properly.
 */
function placeOf(row: VerdictRow, locale: Locale): string {
  let country = row.country;
  if (row.countryCode) {
    try {
      country =
        new Intl.DisplayNames([intlLocale(locale)], { type: "region" }).of(row.countryCode) ??
        row.country;
    } catch {
      // An ICU build without region names. The English name is still a place.
    }
  }
  return row.city ? `${row.city}, ${country}` : country;
}

/**
 * The date, day-granular and in UTC — what the SERVER renders.
 *
 * Pure from the timestamp, with the zone pinned, so the server and the client's
 * first render cannot disagree and there is nothing to suppress. It is also the
 * only form that survives being cached: the page revalidates hourly, and "4
 * minutes ago" baked into static HTML is a lie forty minutes later, while a
 * date is still a date. A reader without JavaScript keeps this version.
 */
function absoluteDate(at: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(at));
}

/**
 * The same moment as "4 minutes ago" — what the CLIENT writes over it.
 *
 * This is the row that carries the argument: the whole point of the ledger is
 * that the last line reads "2,000 years ago" in the column where every line
 * above it reads minutes. Intl does the wording, so Portuguese gets its own
 * idiom ("há 4 minutos", "ontem") rather than a hand-translated approximation.
 *
 * Floored at one minute — "0 seconds ago" and "this minute" are both worse
 * than "1 minute ago" — and clamped at zero, because a clock skewed a few
 * seconds fast would otherwise put a verdict in the future.
 */
function relativeTime(at: number, now: number, locale: Locale): string {
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const minutes = Math.floor(Math.max(0, now - at) / 60_000);
  if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}

/*
 * The ledger: every line the same verdict, until the last one.
 *
 * The scoreline next door argues the ratio with two numerals. This argues it
 * as a list, which is the same claim with a name on the end of it — James 2:10
 * read down a page. The format does the work: "2,000 years ago" sitting in the
 * column where the rows above say "4 minutes ago" is the whole point, and it is
 * why the times are formatted rather than printed as dates.
 *
 * Set in mono end to end, no score face. The grace record made this call first
 * and for the same reason: it is a document, and signage would break the one
 * thing a record imitates.
 *
 * Gold arrives last here too, but spatially rather than on a timer — it is the
 * final row, after the Law has finished reading. That ordering is in the markup
 * rather than in an effect, so it holds with JavaScript off, at any zoom, and
 * under reduced motion, with no way for a missed observer to leave the band
 * arguing only half of itself.
 */
export function VerdictLedger({ locale, messages, rows }: VerdictLedgerProps) {
  const listRef = useRef<HTMLOListElement | null>(null);
  /* The rows are server props and never change under the client, but the
     effect should still re-run if a navigation swaps them. */
  const signature = rows.map((row) => row.at).join("|");

  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    /* Written straight to textContent, off the render path — the same trade
       the count-up makes next door. React rendered the honest cached date;
       this replaces it with the honest live one. */
    const write = () => {
      for (const el of list.querySelectorAll<HTMLTimeElement>("time[data-live]")) {
        const at = Date.parse(el.dateTime);
        if (Number.isNaN(at)) continue;
        el.textContent = relativeTime(at, Date.now(), locale);
      }
    };

    write();
    // Not motion, so it survives reduced motion: a reader who lingers watches
    // "4 minutes ago" become "5 minutes ago", which is the liveness the badge
    // is claiming. The gold row is static markup and is never touched.
    const timer = setInterval(write, 60_000);
    return () => clearInterval(timer);
  }, [locale, signature]);

  return (
    <div className="py-6 sm:py-7">
      {/* The test page's own liveness mark, kept from the scoreline: a pulsing
          red point that stops moving but stays visible under reduced motion. */}
      <span className="mb-4 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[2px] text-red-400/70">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-red-500 animate-pulse motion-reduce:animate-none"
        />
        {messages.liveBadge}
      </span>

      <ol ref={listRef} className="font-mono text-[12px] leading-tight">
        {rows.map((row) => (
          <li
            key={row.at}
            /* A shade heavier than the texture behind it, so the rules read as
               the ledger's own structure rather than as more wall. */
            className="flex items-baseline justify-between gap-4 border-b border-white/[0.12] py-2.5"
          >
            <span className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
              <span className="truncate text-white/75">{placeOf(row, locale)}</span>
              <time
                dateTime={row.at}
                data-live=""
                className="whitespace-nowrap text-white/40 tabular-nums"
              >
                {absoluteDate(row.at, locale)}
              </time>
            </span>
            <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[1.6px] text-red-400">
              {messages.failedCaption}
            </span>
          </li>
        ))}

        {/* The row that needs no analytics, no consent and no JavaScript — and
            so is the one row that is never missing. */}
        <li className="mt-2 flex items-baseline justify-between gap-4 border-t border-[#D4A843]/35 pt-3.5">
          <span className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="truncate text-[#D4A843]">{messages.ledgerPlace}</span>
            <span className="whitespace-nowrap text-[#D4A843]/70 tabular-nums">
              {messages.ledgerWhen}
            </span>
          </span>
          <span
            className="shrink-0 font-mono text-[10.5px] uppercase tracking-[1.6px] text-[#D4A843]"
            style={{ textShadow: "0 0 24px rgba(212,168,67,0.6)" }}
          >
            {messages.passedCaption}
          </span>
        </li>
      </ol>
    </div>
  );
}
