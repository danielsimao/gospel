import { geolocation } from "@vercel/functions";
import { NextResponse, after, type NextRequest } from "next/server";
import { sql } from "@/lib/db";

/**
 * One row in our own ledger — the write side of the score band's list.
 *
 * Fires from the same guarded spot in verdict-screen.tsx that already sends
 * `verdict_reached` to PostHog, and only when the reader has granted
 * analytics consent (the caller checks; this route has no way to verify it
 * itself, same trust boundary the PostHog SDK call already crosses). Writes
 * to our own Postgres instead of relying on PostHog's HogQL endpoint to
 * answer the ledger's read — see db/migrations/0001_verdicts.sql for why.
 *
 * Geolocation comes from Vercel's own edge-derived headers (`@vercel/functions`'s
 * `geolocation()`), not PostHog's — no external geoip call on the write path,
 * and no raw IP is ever read or stored. A request Vercel could not geolocate
 * to a country is dropped rather than written with a blank one: the read
 * side's k-anonymity grouping already assumes every stored row has a real
 * country (see test-stats.ts), and a placeholder row would be exactly the
 * kind of invented testimony this ledger refuses to show.
 *
 * POST and not GET, same reason as trial-count: a crawler prefetching a URL
 * must never be able to write a row.
 */
export const dynamic = "force-dynamic";

interface VerdictBody {
  visitorId?: unknown;
}

export async function POST(request: NextRequest) {
  // Preview deployments must never write to the real ledger.
  if (sql && process.env.VERCEL_ENV === "production") {
    const body = (await request.json().catch(() => null)) as VerdictBody | null;
    const visitorId = typeof body?.visitorId === "string" ? body.visitorId : "";
    const { city, country: countryCode } = geolocation(request);
    if (visitorId && countryCode) {
      after(() => recordVerdict(visitorId, countryCode, city ?? ""));
    }
  }
  // 204 either way: fire and forget, the client learns nothing from this.
  return new NextResponse(null, { status: 204 });
}

async function recordVerdict(visitorId: string, countryCode: string, city: string) {
  if (!sql) return;
  try {
    // The English name is derived from the code rather than asked of
    // Vercel, which only ever gives the alpha-2 form — see VerdictRow's own
    // comment on why `country` exists at all (a fallback for a code the
    // reader's locale can't render, not the primary label).
    const country =
      new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
    await sql`
      insert into verdicts (country, country_code, city, visitor_id)
      values (${country}, ${countryCode}, ${city}, ${visitorId})
    `;
  } catch (error) {
    console.warn("[verdict] not recorded:", error);
  }
}
