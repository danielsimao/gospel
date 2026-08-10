import { NextResponse } from "next/server";
import { mintVerdictToken } from "@/lib/verdict-token";

/**
 * Mints the proof a verdict row needs — see src/lib/verdict-token.ts for
 * what the token is and why the ledger cannot accept a row without one.
 *
 * A separate route rather than a field on api/trial-count's answer because
 * that beacon is sent with `sendBeacon`, which cannot read a response at
 * all. It stays a fire-and-forget 204 (its own comment explains why the
 * band must never learn anything from it); this is the request that wants an
 * answer.
 *
 * Deliberately unauthenticated and cheap: the token it hands out is worth
 * nothing on its own. It only becomes a row after MIN_AGE_MS has passed and
 * the nonce survives the unique constraint, so minting a thousand of these
 * buys a thousand tokens and no verdicts.
 */
export const dynamic = "force-dynamic";

export async function POST() {
  const token = mintVerdictToken();
  if (!token) return new NextResponse(null, { status: 204 });
  return NextResponse.json(
    { token },
    // Never cached, by any layer: two readers sharing a token would mean the
    // second one's row collides on the nonce and is silently dropped.
    { headers: { "Cache-Control": "no-store" } },
  );
}
