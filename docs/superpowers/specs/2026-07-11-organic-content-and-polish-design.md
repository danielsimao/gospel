# Organic Content Expansion & Polish Batch — Design

**Date:** 2026-07-11
**Status:** Approved
**Goal:** Build the organic-search acquisition channel (new query-targeting learn topics + Article/Breadcrumb structured data) and clear the reviewed post-launch polish backlog.

## Context

The site is live at https://www.ifyoudiedtoday.com (see `docs/superpowers/specs/2026-07-10-journey-state-and-chrome-design.md` for the journey overhaul). Search Console + Bing are verified with the sitemap submitted. Learn content is the only acquisition channel that isn't personal sharing; it currently has five topics. All learn content lives in `messages/{en,pt}.json` under `learn.topics` (per-topic: slug, title, subtitle, metaDescription, sections[] of heading/body/scripture/scriptureRef/quiz), rendered by `learn/[slug]/page.tsx` → `topic-page.tsx`. The sitemap derives from the topic list, so new topics are auto-included.

## Non-goals

- No MDX or second content system — volume (3 new + 1 expanded topic) doesn't justify new machinery.
- No FAQPage schema — Google restricted FAQ rich results to authoritative gov/health sites (2023); wasted markup.
- No blog, no dates-driven content types beyond honest `datePublished`/`dateModified` fields.
- No architecture changes for LCP — cheap wins only, timeboxed.

## Part A — Content

**Three new topics** (EN + PT, same slug in both locales, existing section+quiz format, 4-5 sections each, every topic's final section steers toward `/test`):

| Slug | Target query | Angle (Living Waters voice) |
|---|---|---|
| `am-i-a-good-person` | "am I a good person" | Mirror test: our standard vs God's standard → the commandments → take the test |
| `how-can-my-sins-be-forgiven` | "how can my sins be forgiven" | Not by earning — courtroom/fine analogy → the cross → repentance + faith; sits adjacent to `why-the-cross` in the topic order so prev/next nav links them (body text supports no inline links — no new machinery) |
| `does-god-exist` | "does god exist" | Creation, conscience, Christ — classic LW argument, no academic apologetics sprawl |

**One expansion:** `what-happens-when-i-die` grows from 4 to 6-7 sections; title and metaDescription retuned toward the query ("What Happens When You Die?"). Slug unchanged (already indexed).

**Ordering** in `learn.topics` (grill-approved): `am-i-a-good-person` → `who-is-jesus` → `what-is-sin` → `why-the-cross` → `how-can-my-sins-be-forgiven` → `what-is-repentance` → `what-happens-when-i-die` → `does-god-exist`. Learn hub, footer nav, and sitemap update automatically from the array.

**Quiz policy for new sections:** quiz on most sections (matching the existing feel), skipped where one would be artificial — the `quiz` field is already optional in the renderer.

**Accepted regression:** growing the topic list means anyone who had completed all five current topics regresses to "learn incomplete" in the hub and journey tracker. Accepted — the site is days old with ~zero completed users, and the new content genuinely is unread. No grandfathering code.

**Copy authorship:** drafted by the implementer in both locales, in Living Waters voice; the owner reviews EN theology and PT register before merge (hard gate). Binding: no copy may assure salvation from a click or from taking the test; assurance points to Christ's work and repentance+faith (see the journey spec's Living Waters constraint).

## Part B — Structured data

`Article` + `BreadcrumbList` JSON-LD on all eight learn topic pages (new and existing):

- New builders in `src/lib/seo.ts`, following the existing `buildWebPageSchema` pattern:
  - `buildArticleSchema({ locale, slug, title, description, datePublished, dateModified })` → `@type: Article`, `headline`, `description`, `inLanguage`, `mainEntityOfPage` (the topic URL), `publisher` referencing the existing `#organization` node, `image` = the existing OG image URL.
  - `buildBreadcrumbSchema(items)` → positioned `ListItem`s with absolute URLs: Home → Learn → {Topic title}.
- Topic JSON gains honest `datePublished` / `dateModified` ISO fields per topic (new topics: this launch date; existing topics: their original content date from git history). No fabricated freshness.
- Rendered via the existing `<StructuredData>` component in `learn/[slug]/page.tsx`.
- `/learn` hub page gets `BreadcrumbList` (Home → Learn) only.

## Part C — Polish batch

All items are reviewed findings from the launch cycle:

1. **Homepage ready-gating** — the stage-adaptive bottom CTA section renders nothing until `journey.ready`, killing the one-frame visitor-CTA flash for returning users. Reserve `min-h` on the slot so CLS stays 0.
2. **Migration out of the render path** — `readJourney()` becomes a pure read; `migrateLegacyFlag()` is exported and called once from `useJourney`'s effect. Rationale: `topic-nav`/`learn-hub` call snapshot reads inside `useState` lazy initializers, so today a localStorage write + event dispatch can happen during render. Migration tests updated to call the migration explicitly.
3. **i18n validator hardening** — validate every `journeyStages` leaf key against a required-shape walk, not 4 sentinel keys.
4. **`next_steps_viewed` double-fire guard** — once-per-mount `useRef`, same pattern as home view tracking.
5. **`EMPTY_RECORD` hardening** — `Object.freeze` the module constant; `readJourney` returns copies.
6. **`/test` LCP (3.5s mobile)** — timeboxed cheap wins only: font loading (`display: swap`/preload), reduce initial framer-motion delay on the landing heading, check death-strip hydration cost. Accept ≥ ~3.0s; measure PSI before/after. No architecture changes.

## Validation

- **Unit:** validator-hardening tests (missing leaf throws per locale); journey-storage migration tests updated for the explicit-call pattern; existing 43 tests stay green.
- **Gates per task:** `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`. The i18n validator enforces EN/PT topic parity at build time.
- **E2E (dev server, Playwright):** three new topic pages render in both locales with working quizzes; sitemap contains the new slugs in both locales (30 URLs total); served topic HTML contains `Article` and `BreadcrumbList` JSON-LD; homepage shows no visitor-flash with a committed record; committed journey arc spot-checked end-to-end.
- **Copy gate:** owner reviews all new/changed EN + PT strings before merge.
- **Post-deploy:** PSI re-run on `/en/test` (target ≤ 3.0s LCP), validator.schema.org spot-check on one topic page, GSC sitemap refresh.

## Implementation order & releases

Two releases (grill-approved):

**Release 1 — polish:** Part C alone; ships to production as soon as green (includes the LCP wins). Small, safe, independently verifiable.

**Release 2 — content + schema:** Part B (schema builders + dates on existing topics), then Part A (new topics + expansion), then E2E + owner copy review gate (EN theology + PT register), then deploy.

`dateModified` policy: bump only on meaningful content changes, not typo fixes. PT titles use the natural PT query form (e.g. "Sou uma boa pessoa?") — owner review covers register.
