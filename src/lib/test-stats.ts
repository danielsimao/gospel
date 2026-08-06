/**
 * How many people have taken the test — the number behind "1 passed".
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
 * Distinct people who reached the verdict, or null when the number is not
 * available — no key configured, PostHog down, or an answer that does not
 * parse. Null is a supported result, not an error: the band renders a
 * count-less sentence that says the same thing.
 */
export async function fetchTestTakerCount(): Promise<number | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!apiKey) return null;

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
            // verdict_reached fires once when the six answers become the
            // verdict — the moment "took the test" honestly means something.
            // Distinct people, not events: a re-take is the same reader.
            query:
              "select count(distinct distinct_id) from events where event = 'verdict_reached'",
          },
        }),
        // The homepage is static; this revalidates it hourly. A count that is
        // an hour stale is indistinguishable from fresh on a number that only
        // ever grows.
        next: { revalidate: 3600 },
      },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { results?: unknown[][] };
    const raw = data.results?.[0]?.[0];
    const count = typeof raw === "number" ? Math.trunc(raw) : Number.NaN;
    // A count of zero is real (fresh project) but not worth printing — the
    // count-less sentence reads better than "0 people have taken this test".
    return Number.isFinite(count) && count > 0 ? count : null;
  } catch {
    return null;
  }
}
