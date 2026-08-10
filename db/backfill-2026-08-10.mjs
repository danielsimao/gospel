// One-time migration: the 41 real verdict_reached rows already recorded in
// PostHog (2026-07-13 through 2026-08-09), moved into our own `verdicts`
// table so the ledger doesn't start from zero on cutover. Real rows, real
// timestamps, real visitor ids from PostHog's own history — not fabricated.
// Run once: DATABASE_URL=... node db/backfill-2026-08-10.mjs <path-to-rows.json>
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const rows = JSON.parse(readFileSync(process.argv[2], "utf8"));

let inserted = 0;
for (const [timestamp, country, countryCode, city, distinctId] of rows) {
  await sql`
    insert into verdicts (created_at, country, country_code, city, visitor_id)
    values (${timestamp}, ${country}, ${countryCode}, ${city}, ${distinctId})
  `;
  inserted++;
}
console.log(`backfilled ${inserted} rows`);
