import { neon } from "@neondatabase/serverless";

/**
 * One query function, shared by the write route and the ledger's read.
 *
 * Neon's HTTP driver, not a pooled TCP client: every call here is a single
 * query from a serverless function, and a pool that outlives the request has
 * nothing to hold open for. `sql` is null when `DATABASE_URL` is not
 * configured (local dev without env pulled, or the var renamed) — callers
 * treat that the same as any other database failure, never as a crash.
 */
export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
