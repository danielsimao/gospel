import { NextResponse, after, type NextRequest } from "next/server";
import { getPreferredLocale } from "@/lib/i18n";
import { resolveGoLink, type GoLink } from "@/lib/go-links";
import { POSTHOG_HOST, POSTHOG_KEY } from "@/lib/posthog";

/**
 * The one hop between a printed QR and the site.
 *
 * Locale-less on purpose, which is why `proxy.ts` has to skip `go/`: without
 * that exclusion the proxy's deep-link branch prepends a locale and the scan
 * spends a redirect getting to `/en/go/…` before this handler is ever reached.
 * The locale is decided here instead, from the reader's own `accept-language`.
 *
 * `force-dynamic` and `no-store` together are the point of the whole route. A
 * cached redirect is a printed link that cannot be re-pointed — the browser
 * would keep sending the reader to last year's destination, and the paper on
 * the wall would have no way to say otherwise.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  /* Lowercased before lookup: a code read off paper gets capitalised by
     keyboards and mail clients on the way in, the same reason proxy.ts
     normalises a miscased locale segment rather than 404ing it. */
  const normalized = code.trim().toLowerCase();

  const locale = getPreferredLocale(request.headers.get("accept-language"));
  const { link, known, path } = resolveGoLink(
    normalized,
    locale,
    request.nextUrl.searchParams,
  );

  // After the response, never before it: the redirect is what the reader is
  // waiting on, and a slow analytics host must not hold up a scan.
  after(() => recordScan(normalized, link, known));

  return NextResponse.redirect(new URL(path, request.nextUrl.origin), {
    status: 307,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * The scan itself, counted anonymously.
 *
 * Everything on the site is gated behind consent, so a reader who scans and
 * then declines the banner is invisible — which means the top of a print funnel
 * is unmeasurable exactly where it matters: 200 scans and 12 consents is a
 * campaign working and a banner losing, and it currently looks identical to 12
 * scans.
 *
 * So this is a counter and nothing else. One fixed `distinct_id` for every scan
 * ever, `$process_person_profile: false` so no person is created, geoip off and
 * the IP zeroed so no location is derived. There is nobody in this event to
 * identify, which is why it does not need consent to exist.
 */
async function recordScan(code: string, link: GoLink, known: boolean) {
  // Preview deployments share the production project token; without this every
  // test scan of a branch build lands in the same funnel as the street.
  if (!POSTHOG_KEY || process.env.VERCEL_ENV !== "production") return;

  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: "qr_scanned",
        distinct_id: "qr-scan",
        properties: {
          code,
          known,
          campaign: link.campaign,
          source: link.source,
          $process_person_profile: false,
          $geoip_disable: true,
          $ip: "0.0.0.0",
        },
      }),
    });
  } catch {
    // A counter is not worth a failed redirect, and this runs after the
    // response has already gone out.
  }
}
