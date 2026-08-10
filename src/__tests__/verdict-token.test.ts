import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mintVerdictToken, redeemVerdictToken } from "@/lib/verdict-token";

/**
 * The ledger's proof-of-trial.
 *
 * The band's whole claim is that every row is a real verdict, and before
 * this token the write route trusted a client-supplied visitor id — so
 * anything that could POST could write rows, and five ids from one city
 * clears the k-anonymity threshold and starts naming that city under
 * verdicts nobody reached. These pin the three things that make the token
 * worth demanding: it cannot be forged, it cannot be redeemed by a script
 * faster than a person could take the test, and it cannot be replayed.
 */
describe("the verdict token", () => {
  beforeEach(() => {
    vi.stubEnv("VERDICT_TOKEN_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  /** Mints a token as if the trial had been stood `ms` ago. */
  const tokenAgedBy = (ms: number) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() - ms));
    const token = mintVerdictToken();
    vi.useRealTimers();
    return token;
  };

  it("round-trips a token that covered a plausible trial", () => {
    const token = tokenAgedBy(60_000);
    expect(token).toBeTruthy();
    expect(redeemVerdictToken(token)).toBeTruthy();
  });

  it("refuses a token redeemed faster than a trial can be taken", () => {
    // Six questions with a transition between each; a token spent seconds
    // after it was minted did not come from a reader, it came from a script.
    expect(redeemVerdictToken(tokenAgedBy(0))).toBeNull();
    expect(redeemVerdictToken(tokenAgedBy(5_000))).toBeNull();
  });

  it("refuses a token that has been sitting in a script's pocket", () => {
    expect(redeemVerdictToken(tokenAgedBy(48 * 60 * 60 * 1000))).toBeNull();
  });

  it("refuses a forged or tampered token", () => {
    const token = tokenAgedBy(60_000) as string;
    const [nonce, issuedAt, signature] = token.split(".");
    // A different nonce under the same signature — the shape an attacker
    // reaches for first, minting once and rewriting the id per fake row.
    expect(redeemVerdictToken(`forged-nonce.${issuedAt}.${signature}`)).toBeNull();
    // Backdating the issue time to clear MIN_AGE_MS without waiting.
    expect(redeemVerdictToken(`${nonce}.${Number(issuedAt) - 60_000}.${signature}`)).toBeNull();
    // A signature that is simply wrong, and one that is the wrong length —
    // the latter would throw out of timingSafeEqual without the length guard.
    expect(redeemVerdictToken(`${nonce}.${issuedAt}.not-the-signature`)).toBeNull();
    expect(redeemVerdictToken(`${nonce}.${issuedAt}.x`)).toBeNull();
  });

  it("refuses a token signed with somebody else's secret", () => {
    const token = tokenAgedBy(60_000);
    vi.stubEnv("VERDICT_TOKEN_SECRET", "a-different-secret");
    expect(redeemVerdictToken(token)).toBeNull();
  });

  it("refuses anything that is not a token at all", () => {
    for (const junk of [null, undefined, 42, {}, "", "a.b", "a.b.c.d"]) {
      expect(redeemVerdictToken(junk)).toBeNull();
    }
  });

  it("gives every trial its own nonce, so one token is one row", () => {
    // The nonce is what the table's unique constraint spends. Two trials
    // sharing one would mean the second reader's verdict silently collided
    // with the first's and never appeared.
    const nonces = new Set(
      Array.from({ length: 25 }, () => (tokenAgedBy(60_000) as string).split(".")[0]),
    );
    expect(nonces.size).toBe(25);
  });

  it("mints nothing, rather than something unsigned, with no secret", () => {
    // Fail closed: a token minted without a key would be a token anyone
    // could mint. The write route refuses the row instead.
    vi.stubEnv("VERDICT_TOKEN_SECRET", "");
    vi.stubEnv("DATABASE_URL", "");
    expect(mintVerdictToken()).toBeNull();
    expect(redeemVerdictToken("anything.at.all")).toBeNull();
  });

  it("falls back to a key derived from DATABASE_URL", () => {
    /*
     * DATABASE_URL is already required for this route to write at all and
     * never leaves the server, so the token check cannot silently degrade to
     * "unsigned" just because VERDICT_TOKEN_SECRET was missed during setup.
     */
    vi.stubEnv("VERDICT_TOKEN_SECRET", "");
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@host/db");
    const token = tokenAgedBy(60_000);
    expect(token).toBeTruthy();
    expect(redeemVerdictToken(token)).toBeTruthy();
  });
});
