import { NextResponse, after, type NextRequest } from "next/server";
import { POSTHOG_HOST, POSTHOG_KEY } from "@/lib/posthog";

/**
 * The anonymous verdict counter — the true denominator behind "1 passou".
 *
 * Everything else on the site is consent-gated, so the consented
 * `verdict_reached` event undercounts by exactly the decline rate, and the
 * homepage's score band would be built on a number known to be wrong. This is
 * the same trade the QR scan counter already made, for the same reason: a
 * counter with nobody in it needs nobody's consent. One fixed `distinct_id`
 * for every verdict ever, no person profile, geoip off, IP zeroed — there is
 * no reader in this event, only arithmetic.
 *
 * POST and not GET so a crawler prefetching URLs cannot inflate the score.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Preview deployments share the production token; without this, walking a
  // branch build would count as a verdict on the homepage of the real site.
  if (POSTHOG_KEY && process.env.VERCEL_ENV === "production") {
    after(() => recordVerdict(request.headers.get("accept-language")));
  }
  // 204 either way: the client fires and forgets, and the band must never
  // learn anything from this route's answer.
  return new NextResponse(null, { status: 204 });
}

async function recordVerdict(acceptLanguage: string | null) {
  try {
    const response = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: "verdict_reached_anon",
        distinct_id: "verdict-anon",
        properties: {
          // The one property worth keeping: which locale's Law convicted.
          // Coarse (a language, not a place) and shared by millions.
          locale: acceptLanguage?.toLowerCase().startsWith("pt") ? "pt" : "en",
          $process_person_profile: false,
          $geoip_disable: true,
          $ip: "0.0.0.0",
        },
      }),
    });
    if (!response.ok) {
      console.warn(`[verdict-count] not recorded: PostHog answered ${response.status}`);
    }
  } catch (error) {
    console.warn("[verdict-count] not recorded:", error);
  }
}
