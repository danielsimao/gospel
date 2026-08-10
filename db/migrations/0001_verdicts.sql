-- The score band's own record of who stood trial and finished — see
-- src/lib/test-stats.ts for the read side and src/app/api/verdict/route.ts
-- for the write side. Replaces querying PostHog directly for this one
-- table: PostHog's own HogQL endpoint intermittently 400s on the k-anonymity
-- query under load, which left the homepage silently (and correctly, per its
-- own fail-safe) falling back to the plain scoreline more often than the
-- real data warranted. This table exists so the ledger's own read no longer
-- depends on an external analytics API answering in time.
create table if not exists verdicts (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  -- English name, GeoIP-style — only ever a fallback for country_code below.
  country text not null,
  -- ISO 3166-1 alpha-2, or '' when the request could not be geolocated to a
  -- country GeoIP recognises. Never null: see test-stats.ts's own comment on
  -- why a coalesced blank, not null, is what the k-anonymity grouping needs.
  country_code text not null default '',
  -- '' until the k-anonymity threshold is met at READ time. Stored as the
  -- real city name; the ledger decides at query time whether to say it.
  city text not null default '',
  -- The reader's existing PostHog distinct_id (see src/lib/posthog.ts's
  -- getDistinctId) — reused rather than inventing a second identity, and
  -- never returned to any client. Exists only so a reader who retakes the
  -- test cannot single-handedly clear the k-anonymity threshold for their
  -- own city, and so a reload cannot render one verdict as several.
  visitor_id text not null
);

create index if not exists verdicts_created_at_idx on verdicts (created_at desc);
create index if not exists verdicts_country_city_idx on verdicts (country, city);
