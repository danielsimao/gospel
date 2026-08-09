import { NextResponse, after, type NextRequest } from "next/server";
import { POSTHOG_HOST, POSTHOG_KEY } from "@/lib/posthog";

/**
 * The anonymous trial counter — the true denominator behind "1 passou".
 *
 * Fires when a reader steps into the Law (test_landing's handleBegin), not
 * when they reach the verdict screen. James 2:10 — keep the whole law and
 * stumble in one point, guilty of all — is the app's own argument for the
 * verdict, and it does not require finishing: a reader who answers one
 * question and closes the tab is already convicted by it. Counting only
 * `verdict_reached` would erase every one of them from "N stood trial",
 * which is exactly the gap this route used to leave (it fired at the verdict,
 * named `verdict_reached_anon`, before the redefinition this comment
 * documents).
 *
 * Everything else on the site is consent-gated, so the consented
 * `game_started` event undercounts by exactly the decline rate, and the
 * homepage's score band would be built on a number known to be wrong. This is
 * the same trade the QR scan counter already made, for the same reason: a
 * counter with nobody in it needs nobody's consent. One fixed `distinct_id`
 * for every trial ever, no person profile, geoip off, IP zeroed — there is
 * no reader in this event, only arithmetic.
 *
 * POST and not GET so a crawler prefetching URLs cannot inflate the score.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Preview deployments share the production token; without this, walking a
  // branch build would count as a trial on the homepage of the real site.
  if (POSTHOG_KEY && process.env.VERCEL_ENV === "production") {
    /*
     * The route locale the trial was actually stood under, sent by the
     * beacon. Accept-Language is only the fallback: it names the browser's
     * tongue, and a pt reader on an English browser (or the reverse) was
     * being filed under the wrong Law. Validated against the two locales
     * that exist rather than trusted — this endpoint accepts anonymous POSTs.
     */
    const param = request.nextUrl.searchParams.get("locale");
    const locale =
      param === "pt" || param === "en"
        ? param
        : request.headers.get("accept-language")?.toLowerCase().startsWith("pt")
          ? "pt"
          : "en";
    after(() => recordTrial(locale));
  }
  // 204 either way: the client fires and forgets, and the band must never
  // learn anything from this route's answer.
  return new NextResponse(null, { status: 204 });
}

async function recordTrial(locale: "en" | "pt") {
  try {
    const response = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: "trial_stood_anon",
        distinct_id: "trial-stood",
        properties: {
          // The one property worth keeping: which locale's Law convicted.
          // Coarse (a language, not a place) and shared by millions.
          locale,
          $process_person_profile: false,
          $geoip_disable: true,
          $ip: "0.0.0.0",
        },
      }),
    });
    if (!response.ok) {
      console.warn(`[trial-count] not recorded: PostHog answered ${response.status}`);
    }
  } catch (error) {
    console.warn("[trial-count] not recorded:", error);
  }
}
