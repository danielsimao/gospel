import { describe, it, expect, afterEach, vi } from "vitest";

/**
 * `src/lib/db.ts`'s own conditional, tested in isolation and unmocked —
 * `home-passed.test.ts` mocks this module wholesale for the ledger's
 * behavioral tests, so the real ternary can only be exercised here.
 */
describe("the shared db client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is null without DATABASE_URL, so a caller's `if (!sql)` guard is real", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();
    const { sql } = await import("@/lib/db");
    expect(sql).toBeNull();
  });

  it("is a callable query function once DATABASE_URL is set", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@host/db");
    vi.resetModules();
    const { sql } = await import("@/lib/db");
    expect(sql).toBeTypeOf("function");
  });
});
