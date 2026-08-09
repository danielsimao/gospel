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
