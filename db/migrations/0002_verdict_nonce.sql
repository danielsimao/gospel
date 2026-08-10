-- One token, one row. Without this the token in src/lib/verdict-token.ts
-- would be replayable: a script could mint once, wait out MIN_AGE_MS, and
-- then POST the same token forever. The unique constraint is what actually
-- spends it — the route inserts `on conflict do nothing`, so a replay writes
-- nothing and still answers 204, telling the caller neither that it worked
-- nor that it didn't.
--
-- Nullable because the 41 backfilled rows (db/backfill-2026-08-10.mjs) are
-- real verdicts that predate tokens entirely, and Postgres lets any number of
-- rows share a NULL under a unique constraint. Every row written from here on
-- carries one.
alter table verdicts add column if not exists nonce text;

create unique index if not exists verdicts_nonce_key on verdicts (nonce);
