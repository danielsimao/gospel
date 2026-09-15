# Pre-launch legal and policy review — 2026-09-15

Source-level review of the repository ahead of a public announcement. The site
is already deployed but unannounced, so everything here is fixable before it has
an audience.

**Framing that matters for almost every finding below:** this is a site written
in European Portuguese for readers in Portugal, operated from Portugal. That
puts it squarely under the GDPR, the ePrivacy rules, Portugal's Lei 58/2019, and
Decreto-Lei n.º 7/2004 (the e-Commerce Directive transposition). Portugal's
supervisory authority is the CNPD. Several items are only findings *because* of
that; a US-only hobby site would get away with them.

**What is already good.** Analytics really are consent-gated — PostHog is
dynamically imported and only ever initialised after an explicit grant
(`src/lib/posthog.ts`, `src/components/shared/consent-banner.tsx`), which is
prior consent done properly and is better than most of the web manages. The
anonymous counters are carefully built. Scripture licensing has been researched
honestly and the required notices are rendered. No secrets are committed. The
verdict ledger's k-anonymity design is thoughtful. The problems below are
overwhelmingly **disclosure** problems, not data-handling problems: the site
mostly does the right thing and then describes itself inaccurately.

---

## Correction: the blog *is* live

Recorded because the owner's understanding was that it is not, and the gap is
entirely reasonable — the blog has no entrances, so from the site it does not
exist.

`BLOG_ENABLED` (`src/lib/flags.ts`) is off, and its own docstring is exact about
what that means:

> *"What this does NOT do, and the distinction is the whole point: `/blog` and
> every published post still render, still carry their metadata, and stay in the
> sitemap. **Four posts are indexed.**"*

The flag hides three things: the header link, the footer link, and the
homepage's latest-post card. It does not gate the routes. Confirming that:

- `blog/page.tsx` and `blog/[slug]/page.tsx` call `notFound()` only for an
  invalid locale or an unknown slug — never for the flag.
- `src/app/sitemap.ts` emits `/blog` in both locales plus a row per post per
  locale, and those loops are **not** wrapped in `BLOG_ENABLED`. Only the
  `lastModified` stamp is flag-gated.
- `src/app/robots.ts` disallows nothing, deliberately.

So four posts are publicly reachable, in the submitted sitemap, and indexable:
`the-final-whistle`, `the-headline-jesus-was-handed`, `humanitys-last-exam`,
`dont-die-movement`. The other seven carry `draft: true`, are filtered out by
`getPublishedPosts()`, and are genuinely not live — that part works.

This is by design and the design is sound (an unlinked page costs no
maintenance, and forfeiting the index position would buy nothing). It is worth
writing down only because the blog is the site's most exposed content — dated
commentary on a live war, and named living people — and it is the part most
easily assumed to be private. **Nothing here needs fixing.** It needs knowing,
because "we'll tidy the blog before launch" is not a plan that works on content
Google already has.

If any of it should genuinely not be public before the announcement, the lever
is `draft: true` per post, plus a re-crawl request — not the flag.

---

## Blockers — fix before announcing

### 1. "We do not use cookies" is probably false

`privacy.sections[1]` (both locales) states flatly: *"We do not use cookies."*

`src/lib/posthog.ts` calls `posthog.init()` without a `persistence` option.
posthog-js defaults `persistence` to `"localStorage+cookie"`, which sets a
`ph_<project_token>_posthog` cookie. If that default holds, the statement is
false for every visitor who taps Accept.

> Not verified from the package — `node_modules` is empty in this environment,
> so this rests on posthog-js's documented default rather than on the installed
> source. **Verify on the live site:** accept the banner, then DevTools →
> Application → Cookies. One minute of work, and it decides which fix applies.

Two ways out:

- **Preferred:** add `persistence: "localStorage"` to the `posthog.init()` call.
  The claim becomes true, nothing else about the site changes, and the consent
  posture gets simpler to defend. (It does move `distinct_id` to localStorage —
  the verdict ledger reads that id via `getDistinctId()`, so confirm the ledger
  still behaves after the change.)
- Or amend the policy to disclose the cookie, its name, purpose and lifetime.

A false "no cookies" line is the kind of thing that turns a good-faith site into
a complaint, because it is trivially disprovable by anyone who looks.

### 2. "This data never leaves your device" is false

Same section: *"Your test progress, reading plan completion, and quiz answers
are saved in your browser's local storage. This data never leaves your device
and is not sent to any server."*

`src/app/api/verdict/route.ts` writes a row to Postgres containing `country`,
`country_code`, **`city`**, **`visitor_id`** and `nonce`
(`db/migrations/0001_verdicts.sql`). That is a server, it is the operator's own
server, and the row records that a specific pseudonymous visitor reached a
verdict, from which city, at what time.

The **Neon/Postgres database is not mentioned anywhere in the privacy policy** —
not in "What we collect", not in "Third-party services", not in "Data
retention". The policy names PostHog, Sentry and Vercel and stops.

To be fair to the implementation: the write *is* consent-gated in practice, and
not by accident. `trackVerdictRow()` (`src/lib/analytics.ts:207`) bails when
`getDistinctId()` returns null, and that only returns an id once PostHog has
initialised, which only happens on consent. The mechanism is sound. The problem
is that the document describing it says the opposite of what it does.

This is the most serious item in the review, and it is the one to fix first.

### 3. "No personally identifiable information" does not hold under GDPR

*"We do not collect your name, email address, or any personally identifiable
information."*

`visitor_id` is a persistent pseudonymous online identifier. Under GDPR Art 4(1)
and Recital 30, online identifiers are personal data; Recital 26 is explicit
that pseudonymised data remains personal data. Stored next to a city name and a
timestamp, it is comfortably within scope.

The read-side k-anonymity in `src/lib/test-stats.ts` (`LEDGER_CITY_MIN`, the
`having count(distinct visitor_id) >= …` clause) is genuinely good work — but it
governs what gets **displayed**, not what gets **stored**. The raw city and
visitor id sit in the table either way.

The honest reformulation is straightforward and costs nothing: say the site
collects no name, email or contact details, and processes a pseudonymous
identifier plus coarse location for analytics — rather than claiming no personal
data at all.

### 4. No legal entity is identified anywhere

The only identification on the site is `contact@ifyoudiedtoday.com`, the domain
in the footer, and `about.sections[2]`: *"built by Christians."*

Two separate obligations go unmet:

- **GDPR Art 13(1)(a)** — the controller's identity and contact details must be
  provided.
- **Decreto-Lei n.º 7/2004, Art 10** (e-Commerce Directive Art 5) — an
  information-society service provider established in Portugal must make
  permanently and directly accessible its name, geographic address, email, and
  registration/NIF details where applicable.

This applies to an individual operating under their own name as much as to a
company or an *associação*. What form it takes depends on how the project is
actually constituted, which only the owner knows.

### 5. No data-subject rights section

GDPR Art 13(2) requires telling people about their rights: access,
rectification, erasure, restriction, objection, portability, the right to
withdraw consent, and the right to lodge a complaint with a supervisory
authority — **the CNPD**, which should be named. None of this appears in either
locale.

### 6. Consent cannot be withdrawn

GDPR Art 7(3): withdrawing consent must be as easy as giving it. Today, giving
it is one tap; withdrawing it, per the policy's own "Analytics consent" section,
means *"clearing your browser data for this site."* That is not parity.

The machinery already exists — `setConsent()` and the `consentchange` event in
`src/lib/consent.ts` are all that a re-entry point would need. A link in the
footer's legal row that re-opens the banner would close this properly.

---

## High

### 7. Session replay is undisclosed

`src/instrumentation-client.ts` states: *"Session replay is PostHog's job (one
rrweb recorder, not two)"*, and `src/lib/posthog.ts` notes that static imports
"would put rrweb in the critical path." `posthog.init()` passes no
`disable_session_recording`, so whether recording runs is decided by the PostHog
project setting, server-side, outside this repo.

The privacy policy describes PostHog as *"page views, button clicks, funnel
completion."* Session replay is a different order of thing, and it matters more
here than on an ordinary site: the pages being recorded are where a reader
answers whether they have lied, stolen, lusted, or blasphemed. That is a
religious-belief-adjacent record of a named browser session.

**Check the PostHog project setting.** Then either disable recording explicitly
in code (`disable_session_recording: true`), or disclose it plainly and
configure input masking.

### 8. The verdicts table has no retention limit

Nothing deletes from `verdicts`. No TTL in the migrations, no cleanup job, no
mention anywhere. Rows with `visitor_id` and `city` persist indefinitely. GDPR
Art 5(1)(e) (storage limitation) requires personal data be kept no longer than
necessary.

The policy's retention section points at *"PostHog's and Sentry's default
retention policies"* — which has nothing to say about the operator's own
database.

Pick a period, state it, enforce it in SQL. The ledger's purpose is a running
count and a city list; it does not need rows from two years ago to serve that.

### 9. Data leaves the EU, undisclosed

`POSTHOG_HOST` defaults to `https://us.i.posthog.com` (`src/lib/posthog.ts`, and
the same default in `.env.example`). EU visitors' analytics data is transferred
to the United States. GDPR Chapter V requires disclosing the transfer and the
safeguard relied on — PostHog's DPA/SCCs, or the EU-US Data Privacy Framework.

**Cleanest fix:** switch to PostHog's EU cloud (`https://eu.i.posthog.com`).
That removes the transfer question rather than documenting it. Worth doing
*before* announcing, because migrating analytics history afterwards is
unpleasant.

Also worth stating the Neon region and Sentry's region while you are in there.

### 10. The Terms misstate scripture licensing

Terms, "Intellectual property": *"Scripture quotations are from publicly
available Bible translations."*

They are not. Per this repo's own
`docs/permissions/2026-08-11-scripture-permissions.md`, the site quotes the
**NKJV** (Thomas Nelson / HarperCollins, 500-verse allowance) and the **ACF**
(Sociedade Bíblica Trinitariana do Brasil, 1,100-verse allowance). Both are
copyrighted and quoted under specific published gratis-use allowances.

The footer and `/about` notices are correct and properly worded. The Terms
contradict them — and contradict the project's own research. Fix the Terms to
match what the permissions doc already established.

Two related notes from that doc, neither blocking but both worth carrying:

- The allowances are a **budget, not a licence**: ~38 NKJV verses reproduced
  today, ~183 projected after the seven reading passages, against a 500 cap.
  Comfortable, but it should be tracked as content grows.
- The TBS UK / SBTB contradiction flagged in that doc ("may I post TBS material
  on my website? No") is still open. The doc's reasoning for relying on the
  Brazilian term is sound, and a short confirmation email before Phase 3 renders
  full passages would settle it.

### 11. Sentry runs without consent, and this is not disclosed

`src/instrumentation-client.ts` initialises Sentry unconditionally, with the
comment: *"Error tracking is not consent-gated (legitimate interest, no
cross-site tracking)."*

That is a defensible position — error monitoring is a common legitimate-interest
case. But legitimate interest has to be **declared** (Art 13(1)(c)–(d)), the
interest named, and a balancing test recorded. The policy lists Sentry without
saying it runs whatever the reader answers on the banner.

Nothing sets `sendDefaultPii`, so it stays false and IP is not attached —
confirm that remains true after any Sentry upgrade.

---

## Medium

### 12. Two anonymous counters fire before any consent, undisclosed

`/api/trial-count` and `/go/[code]` both capture server-side regardless of the
banner. Both are built carefully — one fixed `distinct_id` for all events,
`$process_person_profile: false`, `$geoip_disable: true`, `$ip: "0.0.0.0"` — and
the reasoning in the route comments is sound. No terminal-equipment storage is
read or written, so ePrivacy Art 5(3) is not engaged, and there is genuinely no
data subject in the event.

Defensible. Just undisclosed. One sentence in the policy covers both.

### 13. Terms have no governing law and no liability limitation

There is a "No warranty" clause but no limitation of liability and no
governing-law/jurisdiction clause. Exposure on a free, non-commercial,
no-accounts site is low — but a one-line Portuguese governing-law clause costs
nothing and removes an argument.

### 14. The consent banner is not "informed", and the buttons are unequal

- No link to the privacy policy. Consent must be informed (Art 4(11)); a banner
  reading *"We use anonymous analytics to improve this experience"* with no
  route to detail does not meet that.
- "Accept" is a filled button (`bg-white/10`); "Decline" is bare text. EDPB
  guidance on dark patterns wants comparable prominence. The gap is small, and
  closing it is a styling change.

### 15. Both documents are stale-dated

"Last updated: April 2026" / "abril de 2026", on a site that shipped changes
through September. Any amendment resets both, in both locales.

### 16. No position on children

The site is public, indexed, and built to be shared to WhatsApp and Telegram. It
addresses a reader's mortality and moral guilt, and nothing about it screens for
age. Portugal sets the age of digital consent at **13** (Lei 58/2019, Art 16).

Lowest-cost fix: state in the policy that the site is not directed at children
under 13 and that analytics consent is not sought from them.

---

## Checked and clean

Recorded so nobody re-audits these.

- **Secrets:** none committed. `.env*` is gitignored with an `.env.example`
  exception. The only `postgres://` strings in the tree are `vi.stubEnv` test
  fixtures.
- **Security headers:** `nosniff`, `X-Frame-Options: DENY`,
  `strict-origin-when-cross-origin`, and a `Permissions-Policy` denying camera,
  microphone and geolocation (`next.config.ts`). No CSP — worth adding as
  hardening, but not a legal finding.
- **Mortality data:** CIA World Factbook via the public-domain `factbook.json`
  mirror, with provenance, derivation and fetch date recorded inside
  `docs/data/deaths-by-country.json` itself. Exemplary.
- **Map topology:** `public/data/world-110m.json` is Natural Earth-derived —
  public domain, no attribution required. Citing it anyway costs nothing.
- **Blog sourcing** (and note it is live — see the correction above): posts
  cite news by headline and link, with original prose around them. Facts are not
  copyrightable and headline-plus-link citation is standard practice. No article
  bodies are reproduced. Commentary on public figures (Messi, the Iran war) is
  neutral-to-sympathetic and non-defamatory.
- **`dont-die-movement` discusses a named living person's health**, which is
  special-category data under GDPR Art 9. Defensible on two independent grounds:
  Bryan Johnson manifestly made it public himself (Art 9(2)(e)) — the post
  quotes his own announcement — and the piece is sourced commentary on a matter
  of public interest, which Art 85 and Lei 58/2019 Art 24 protect. The treatment
  is also explicitly respectful rather than mocking. Low risk; recorded so the
  reasoning exists if it is ever questioned.
- **Imagery:** every raster asset is AI-generated with prompts recorded in
  `docs/graphics/PROMPTS.md`. Two footnotes: confirm the generator's terms allow
  commercial/public use, and note that AI output may not attract copyright —
  which slightly overstates the Terms' claim that *"the site's design, code, and
  original content are the property of the project's creators."*
- **Living Waters / needGod.net:** linked with attribution. Nominative use of
  another ministry's name to point at their resource is fine. Worth one check
  that no test question is verbatim from "Are You a Good Person?" — the method
  is an unprotectable idea, specific wording is not.
- **Crisis duty of care:** handled. `findahelpline.com` sits in the site-wide
  footer legal row and the Terms carry a "no professional advice" clause. This
  matters on a site whose homepage runs *"Every 43 seconds, someone dies by
  suicide"*, and it is covered.
- **Deployment hygiene:** preview deployments are blocked from writing to the
  production ledger and from emitting production analytics; `/next-steps` is
  `noindex`.

---

## Suggested order of work

1. Decide the two facts only the owner knows: **who the controller is** (name +
   address for the Art 13 / DL 7/2004 notice) and **how long verdict rows live**.
2. Check the live cookie situation and the PostHog session-replay project
   setting. Both are five-minute checks that decide the shape of the rewrite.
3. Move PostHog to EU hosting, if it is going to move at all — before there is
   history worth migrating.
4. Rewrite `privacy` in `en.json` and `pt.json` against findings 1–9, 11, 12, 15,
   16. Fix `terms` against 10 and 13. Re-date both.
5. Add the consent-withdrawal link and the policy link on the banner (6, 14).
6. Enforce the retention period in SQL (8).

Findings 4, 5, 6, 8 and 10 are the ones with statutory text behind them. Items 1
and 2 are the ones where the site currently tells readers something untrue,
which is the worst category to be in and the cheapest to fix.

**Not legal advice** — this is a source-level engineering review. Items 4, 5 and
13 in particular are worth ten minutes with a Portuguese lawyer, which for a
site of this size is a short and inexpensive conversation.
