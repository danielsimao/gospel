import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Proof that a row in the ledger came from a trial someone actually stood.
 *
 * The ledger's whole claim is that every row is a real verdict — an invented
 * row is fabricated testimony, which this app treats as worse than an
 * invented number. Without a token, `/api/verdict` had to trust a
 * client-supplied visitor id, so anything that can POST could have written
 * rows: five ids from one geolocated city clears the k-anonymity threshold
 * and starts naming that city under verdicts nobody reached.
 *
 * So the write path now demands a token minted when the reader stepped into
 * the Law, and the token is only worth what the three checks below make it
 * worth:
 *
 *   - signed with a server-only secret, so it cannot be forged client-side;
 *   - carrying its own issue time, so a token has to be old enough that a
 *     trial could plausibly have been taken under it (MIN_AGE_MS) and not so
 *     old that it has been sitting in a script's pocket (MAX_AGE_MS);
 *   - carrying a nonce the database stores under a unique constraint, so one
 *     token buys exactly one row and a replay collides instead of counting
 *     twice.
 *
 * What this does NOT do, stated plainly because the first version of this
 * comment got it wrong: it does not make fabricating a crowd cost time per
 * fake row. Minting is unauthenticated and free, and tokens age
 * CONCURRENTLY — five tokens minted in parallel are all redeemable after one
 * shared 20-second wait, so clearing LEDGER_CITY_MIN still costs about ten
 * requests and twenty seconds, not five separate trials. A thousand tokens
 * cost the same twenty seconds.
 *
 * So this is a speed bump and a replay guard, not proof of trial completion.
 * It closes the trivial version of the attack (a bare for-loop against
 * /api/verdict) and makes each forged row cost a distinct token, which is
 * worth having. The honest limit is that no token minted by a server for an
 * untrusted client can prove a human took a test; only something scarce to
 * the attacker (a rate limit on minting, keyed to something they cannot
 * cheaply multiply) changes the economics. That control does not exist yet
 * and is a deliberate open item, not an oversight.
 */

/**
 * A trial nobody could have taken. The test is six questions with an
 * animated transition between each; the fastest a real reader can reach the
 * verdict is well over this. Tokens redeemed sooner did not come from a
 * reader.
 */
const MIN_AGE_MS = 20_000;

/** Long enough for a reader who wandered off mid-trial and came back. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Server-only, and never `NEXT_PUBLIC_`. `VERDICT_TOKEN_SECRET` if it is
 * set; otherwise derived from `DATABASE_URL`, which is already required for
 * this route to write at all and never leaves the server — so the token
 * check cannot silently degrade to "unsigned" just because one env var was
 * missed during setup. Returns null only when neither exists, and the
 * caller treats that as "no token can be verified", refusing the write
 * rather than accepting an unsigned one.
 */
function secret(): string | null {
  const explicit = process.env.VERDICT_TOKEN_SECRET;
  if (explicit) return explicit;
  const derived = process.env.DATABASE_URL;
  return derived ? `verdict-token:${derived}` : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** A token for a reader who has just stepped into the Law, or null. */
export function mintVerdictToken(): string | null {
  const key = secret();
  if (!key) return null;
  const payload = `${randomUUID()}.${Date.now()}`;
  return `${payload}.${sign(payload, key)}`;
}

/**
 * The nonce a valid token carries, or null if the token is forged, expired,
 * too fresh to have covered a real trial, or malformed. The nonce is what
 * the caller stores under the table's unique constraint to spend it.
 */
export function redeemVerdictToken(token: unknown): string | null {
  const key = secret();
  if (!key || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [nonce, issuedAt, signature] = parts;
  if (!nonce || !issuedAt || !signature) return null;

  const expected = sign(`${nonce}.${issuedAt}`, key);
  // Constant-time, and length-guarded first: timingSafeEqual throws outright
  // on a length mismatch, which would turn a malformed token into a 500.
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < MIN_AGE_MS || age > MAX_AGE_MS) return null;

  return nonce;
}
