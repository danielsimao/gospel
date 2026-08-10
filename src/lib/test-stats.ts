/**
 * How many people have stood trial — the number behind "1 passed".
 *
 * Counted from the moment a reader steps into the Law (game_started /
 * trial_stood_anon), not from finishing it. James 2:10 — keep the whole law
 * and stumble in one point, guilty of all — is the app's own argument for the
 * verdict, and it does not wait for a reader to reach the verdict screen: one
 * abandoned question is already an admission. Counting only completions
 * (verdict_reached) would erase every abandoner from a claim that, by the
 * app's own doctrine, already convicts them.
 *
 * Server-side only, and the shape of every decision here is the same: the
 * homepage must never break, shift, or slow down because an analytics vendor
 * had a bad day. The count is a garnish on a sentence that works without it.
 *
 * Read with a PERSONAL API key (`phx_…`), which is why the variable is not
 * `NEXT_PUBLIC_` and must never become it: the project token in the client is
 * write-only by design, but a personal key can read every event in the
 * project. It exists only in Vercel's server env.
 *
 * The count is also a floor, not a total: analytics are consent-gated, so
 * every reader who declined the banner is invisible, and collection only
 * started 2026-07-12. The copy says "more than", which the undercount makes
 * true by construction.
 */

import { sql } from "@/lib/db";

const POSTHOG_API_HOST = process.env.POSTHOG_API_HOST || "https://eu.posthog.com";
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "221882";

/**
 * Distinct people who stood trial, or null when the number is not
 * available — no key configured, PostHog down, or an answer that does not
 * parse. Null is a supported result, not an error: it tells the homepage to
 * skip the band entirely rather than publish a number that isn't real.
 */
export async function fetchTestTakerCount(): Promise<number | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!apiKey) {
    // Silent to the reader (the band just doesn't render), loud in Vercel's
    // function logs (the operator's job) — without this line, a missing key
    // and a real PostHog outage both look like "the band is gone" with no
    // way to tell which. Fires once per revalidation window (the fetch below
    // is cached hourly), not once per request.
    console.warn("[test-stats] no count: no POSTHOG_PERSONAL_API_KEY configured");
    return null;
  }

  try {
    const response = await fetch(
      `${POSTHOG_API_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            /*
             * Two counters for one truth, and the larger wins.
             *
             * `game_started` is consent-gated, so it undercounts by the
             * decline rate but reaches back to launch. `trial_stood_anon`
             * counts everyone but only exists from the day the beacon shipped
             * (moved here from firing at the verdict — see trial-count's own
             * comment for why "stood trial" cannot wait for a verdict). Early
             * on the consented history is bigger; once the anonymous counter
             * has run for a while it overtakes and stays ahead. greatest() of
             * the two is a floor either way, which is what the band's copy
             * promises.
             *
             * Distinct people on the consented side (a retake is the same
             * reader); plain count on the anonymous side, whose distinct_id is
             * deliberately one value for everyone — dedupe there is the
             * client's once-per-trial guard.
             */
            query:
              "select greatest(" +
              "count(distinct if(event = 'game_started', distinct_id, null)), " +
              "countIf(event = 'trial_stood_anon')" +
              ") from events where event in ('game_started', 'trial_stood_anon')",
          },
        }),
        // The homepage is static; this revalidates it hourly. A count that is
        // an hour stale is indistinguishable from fresh on a number that only
        // ever grows.
        next: { revalidate: 3600 },
      },
    );
    if (!response.ok) {
      console.warn(`[test-stats] no count: PostHog answered ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { results?: unknown[][] };
    const raw = data.results?.[0]?.[0];
    const count = typeof raw === "number" ? Math.trunc(raw) : Number.NaN;
    if (!Number.isFinite(count)) {
      console.warn("[test-stats] no count: HogQL answer did not parse as a number");
      return null;
    }
    /*
     * The resolved count, in the operator's log.
     *
     * The four branches above all say why the number is missing; none said what
     * it was when it arrived, and the homepage cannot be read backwards to find
     * out. This is the only place the true figure is observable without a
     * PostHog login. Fires at build (once per locale) and hourly on
     * revalidation.
     */
    console.info(`[test-stats] PostHog answered ${count}`);
    // A count of zero is real (fresh project) but not worth publishing as a
    // number — null tells the homepage to skip the band entirely, which is
    // also the honest thing to show for a fresh project.
    return count > 0 ? count : null;
  } catch (error) {
    console.warn("[test-stats] no count:", error);
    return null;
  }
}

/**
 * One row of the ledger: where someone stood trial, and when.
 *
 * No identity of any kind survives into this shape — not the distinct_id the
 * query dedupes on, not an IP, not a coordinate. A place and a moment, which
 * is all the band renders.
 */
export interface VerdictRow {
  /** ISO 8601 in UTC. The client formats it; the server only passes it on. */
  at: string;
  /** Empty unless the city cleared LEDGER_CITY_MIN — see the threshold below. */
  city: string;
  /** GeoIP's own name, in English, and only the fallback for `countryCode`. */
  country: string;
  /** ISO 3166-1 alpha-2, so the band can say the country in the reader's own
      language. GeoIP answers "Brazil" whoever is asking, and a Portuguese page
      reading "São Paulo, Brazil" is the site speaking English mid-sentence. */
  countryCode: string;
}

/** How far back the ledger looks. Long enough that a quiet week still fills. */
export const LEDGER_WINDOW_DAYS = 30;

/**
 * How many distinct `distinct_id`s a city needs before the ledger will name
 * it — devices/browsers, not verified individual people (the same limit the
 * aggregate count above accepts: one person on two devices counts as two).
 *
 * k-anonymity, and it is the whole reason cities are allowed here at all.
 * "Someone in Óbidos failed, 3 minutes ago" is a sentence everyone in Óbidos
 * can resolve to a person; "Portugal" is not. The threshold is computed from
 * the data rather than from a population table, so a city earns its name by
 * having a crowd to hide in — and as traffic grows, more cities do.
 *
 * Counted by `distinct_id`, not by row: the query used to count raw
 * `verdict_reached` rows per city, so one reader retaking the test
 * LEDGER_CITY_MIN times from the same city could single-handedly name it —
 * a repeat visitor is not a crowd. Fixed by counting distinct `distinct_id`s
 * in the `crowded` CTE itself, not by the separate output-row dedup below
 * (which only decides which rows the ledger shows, after the naming decision
 * has already been made).
 *
 * Also keyed on (country, city), not city alone — GeoIP's city names are not
 * globally unique (there is more than one Springfield), and a bare city
 * grouping let a crowd in one country's Springfield name a different
 * country's Springfield too. Keyed on the country NAME rather than its
 * alpha-2 code deliberately: `country_code` is coalesced to `''` when GeoIP
 * has a country name but no code, and grouping on a value that can collapse
 * to the same blank for two different real countries reopens exactly the
 * collision this key exists to prevent. `country` has no such fallback — the
 * query's own `where` clause already requires it non-empty for every row
 * that reaches this CTE.
 */
export const LEDGER_CITY_MIN = 5;

/** Rows the band asks for. More is a wall; fewer is not a ledger. */
export const LEDGER_ROWS = 5;

/**
 * Neon's driver already parses `timestamptz` into a real `Date` (unlike the
 * ClickHouse HogQL endpoint this replaced, which answered a bare
 * `2026-08-09 12:34:56` — no `T`, no zone — that `new Date()` would have
 * silently misread as local time). Still rejected outright when it does not
 * parse, because a row whose time is a guess has no business in a ledger.
 */
function parseTimestamp(raw: unknown): string | null {
  const at = raw instanceof Date ? raw : new Date(typeof raw === "string" ? raw : Number.NaN);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/**
 * The last few verdicts, as places and times — the rows above Jerusalem.
 *
 * Read from our own `verdicts` table (see db/migrations/0001_verdicts.sql
 * and api/verdict/route.ts for the write side), not PostHog. It used to run
 * this same k-anonymity query as HogQL against PostHog's own query API,
 * which intermittently answered 400 under real production traffic — traced
 * to Vercel's runtime logs, replicated by hand, never a code defect, but a
 * real reliability gap: the homepage's own fail-safe (empty array, scoreline
 * takes the band back) was firing far more often than the underlying data
 * warranted. Moving the ledger's read onto a table this app owns removes the
 * external dependency from the read path entirely; PostHog still gets the
 * full `verdict_reached` event for every other kind of analysis.
 *
 * The aggregate count above it counts from stepping into the Law (see
 * fetchTestTakerCount), so the ledger is necessarily a subset of it: some who
 * stood trial finished, and only they can appear here.
 *
 * An empty array is a supported answer, not an error. The band falls back to
 * the scoreline, which argues the same thing with the number alone. Nothing
 * here is ever modelled or estimated: an invented row — a city nobody took
 * the test in — would be fabricated testimony, which is worse than an
 * invented rate, and neither ships.
 */
export async function fetchRecentVerdicts(): Promise<VerdictRow[]> {
  if (!sql) {
    console.warn("[test-stats] no ledger: no DATABASE_URL configured");
    return [];
  }

  try {
    /*
     * `crowded` is the k-anonymity pass: a city is named only once
     * LEDGER_CITY_MIN distinct visitors have stood trial from it, and every
     * other row falls back to its country. Keyed on (country, city), not
     * city alone, and on the country NAME rather than its code — same
     * reasoning as the HogQL version this replaced (see this function's own
     * prior comment in git history, or test-stats.ts's LEDGER_CITY_MIN doc).
     *
     * `count(distinct visitor_id)`, not `count(*)` — a bare row count let one
     * reader who retook the test LEDGER_CITY_MIN times name their own city
     * alone, which is not a crowd.
     */
    const results = await sql`
      with recent as (
        select created_at, country, country_code, city, visitor_id
        from verdicts
        where created_at > now() - (interval '1 day' * ${LEDGER_WINDOW_DAYS})
      ), crowded as (
        select country, city from recent where city != ''
        group by country, city
        having count(distinct visitor_id) >= ${LEDGER_CITY_MIN}
      )
      select created_at, country, country_code,
        case when city != '' and (country, city) in (select country, city from crowded)
          then city else '' end as city,
        visitor_id
      from recent
      order by created_at desc
      limit 60
    `;

    const readers = new Set<string>();
    const rows: VerdictRow[] = [];
    for (const result of results) {
      const at = parseTimestamp(result.created_at);
      const country = typeof result.country === "string" ? result.country.trim() : "";
      const rawCode =
        typeof result.country_code === "string" ? result.country_code.trim().toUpperCase() : "";
      const city = typeof result.city === "string" ? result.city.trim() : "";
      const reader = typeof result.visitor_id === "string" ? result.visitor_id : "";
      if (!at || !country) continue;
      if (reader) {
        if (readers.has(reader)) continue;
        readers.add(reader);
      }
      rows.push({
        at,
        city,
        country,
        // Only a well-formed alpha-2 travels; anything else would just be a
        // string the band has to guard again on the other side.
        countryCode: /^[A-Z]{2}$/.test(rawCode) ? rawCode : "",
      });
      if (rows.length >= LEDGER_ROWS) break;
    }

    // The operator's only view of what the homepage actually published, for
    // the same reason the count logs its answer: a working table and a
    // broken one otherwise look identical from outside.
    console.info(`[test-stats] ledger: ${rows.length} of ${results.length} rows`);
    return rows;
  } catch (error) {
    console.warn("[test-stats] no ledger:", error);
    return [];
  }
}
