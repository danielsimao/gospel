# Home Page Redesign — Shock + Funnel

## Problem

The home page currently contains a law quiz (8 yes/no questions → guilty verdict → grace reveal) that largely duplicates the `/test` experience. Users who complete the home quiz have already experienced conviction and grace, reducing their motivation to take the full test. The home page tries to do too much — quiz, world map, grace reveal, CTAs to every feature — diluting its impact.

## Goal

Make the home page a single-purpose shock + funnel: hit visitors with the weight of mortality, pose a provocative question, and drive them to `/test`. Move the grace beats reveal into the test flow where it belongs (post-verdict), creating a richer experience there.

## Constraints

- Keep the death counter — it's the proven shock mechanism
- No new dependencies or features, this is a restructure
- Footer and top bar remain unchanged (they provide access to learn, chat, reading-plan)
- i18n: both English and Portuguese must be updated
- Clean up all dead code (removed components, unused analytics, unused i18n keys) in the same PR

---

## Design

### 1. Home Page (`/[locale]/page.tsx`)

**Single viewport layout — everything above the fold:**

```
┌─────────────────────────────┐
│    EVERY SECOND COUNTS      │
│                             │
│         142,847             │
│      deaths today           │
│                             │
│   1.8/s  108/m  6.5k/h     │
│                             │
│        [world map]          │
│                             │
│   If you died today,        │
│   how would you stand       │
│   before God?               │
│                             │
│     [ Face the court → ]    │
│                             │
│     Not ready? Learn more   │
└─────────────────────────────┘
```

**Elements (top to bottom):**

1. **Death counter hero** — Keep the existing death ticker with `fromMidnight` mode. The counter number, label, and suffix text.
2. **Rate cards** — Keep the 4-stat grid (1.8/sec, 108/min, 6,500/hr, 155,000/day). These give the big number meaning.
3. **World map** — Keep as atmospheric visual element below rate cards.
4. **Provocative question** — Bold typographic statement: "If you died today, how would you stand before God?" (localized). Large, high contrast white text.
5. **Primary CTA button** — "Face the court" or similar (localized). Links to `/{locale}/test`. Gold accent styling (`#D4A843`).
6. **Secondary escape hatch** — Small subtle text link below CTA: "Not ready? Learn more" → `/{locale}/learn`. Does not compete with primary action.

**Sticky death counter** — Keep the sticky bar at the top (the counter climbing while you read adds ambient pressure).

**What gets removed:**
- `LawQuiz` component and its section
- `GraceReveal` component and its section
- CTA grid section (links to test/learn/chat/reading-plan)
- Share buttons (moved to post-test only)
- Scroll affordance indicator (page is single viewport, not needed)
- The `EternityShell` orchestrator (replaced by a simpler page component)

**What stays but needs adjustment:**
- `DeathCounter` component — standalone, no EternityShell dependency changes needed (already self-contained)
- `WorldMap` component — stays on home page, just rendered directly instead of through EternityShell
- `StickyDeathCounter` — stays on home page

### 2. Test Grace Phase — Enhanced with Beats

**Current state:** `GraceScreen` shows a heading, body paragraphs, scripture, and a continue button. Simple but flat.

**New state:** Two-movement structure — impact first, then depth:

**Movement 1 — Beats (emotional punch):**
- **Heading** — "But God…" revealed on phase entry (warm gold, same style)
- **Beat 1** — Auto-reveals after a short delay on phase entry (no user action needed)
- **Beats 2-4** — Revealed one at a time via tap/click ("Tap to continue" pill)
- Beat content (from existing `eternity.grace.beats`):
  1. "You're guilty. The fine is eternal."
  2. "Someone paid it in full."
  3. "Jesus Christ — God in flesh — lived the life you couldn't, died the death you deserved, and rose."
  4. "Turn from sin. Trust in Him. Live."

**Movement 2 — Body (explanatory depth):**
- After all 4 beats are revealed, the body paragraphs from current `GraceScreen` content fade in
- These expand on what the beats mean — the theological explanation
- Followed by scripture blockquote
- Followed by continue button → invitation phase

**Visual style:**
- Reuse the warm gold aesthetic from `GraceReveal` (radial glow, `#D4A843` accents)
- Beat items use the roman numeral labels (I, II, III, IV) and border separators from `GraceReveal`
- Previous beats dim to 0.32 opacity as new ones appear (existing behavior)
- Body paragraphs use the left-aligned text style from current `GraceScreen`

**Analytics:**
- Reuse `trackGraceRevealed` (on phase entry) and `trackGraceBeatRevealed` (per beat) — just called from the new location
- Keep existing `trackGraceViewed` (scroll depth + time tracking) from current GraceScreen

### 3. Content & i18n Changes

**Messages to add in `en.json` and `pt.json`:**
- `home.provocativeQuestion` — "If you died today, how would you stand before God?"
- `home.ctaButton` — "Face the court" (or similar)
- `home.secondaryLink` — "Not ready? Learn more"

**Messages to move:**
- `eternity.grace.beats` → `test.grace.beats` (4-element array)
- `eternity.grace.tapContinue` → `test.grace.tapContinue`
- `eternity.grace.heading` → can be merged with `test.grace.heading` or kept as the beats heading

**Messages that become unused (to remove):**
- `eternity.quiz.*` (all quiz questions, labels, verdicts, chips)
- `eternity.grace.*` (after moving beats/tapContinue to test)
- `eternity.cta.*` (heading, subtitle, testCta, learnCta, readingPlanCta)
- `eternity.share.*` (share buttons removed from home)
- `eternity.hero.scroll` (scroll indicator removed)

**Messages that stay:**
- `eternity.hero.*` (label, suffix, rate card labels) — still used by home page hero
- `eternity.counter.*` (sticky counter label/badge) — still used
- `eternity.meta.*` (page title/description) — still used

### 4. Components to Remove

- `src/components/eternity/law-quiz.tsx` — no longer used
- `src/components/eternity/grace-reveal.tsx` — merged into test grace screen
- `src/components/eternity/eternity-shell.tsx` — replaced by simpler home page

### 5. Components to Modify

- **`src/app/[locale]/page.tsx`** — Rewrite to render death counter + rate cards + world map + provocative question + CTA directly (no EternityShell). Keep `generateMetadata` and `generateStaticParams`.
- **`src/components/grace-screen.tsx`** — Enhance with two-movement structure: beats (auto-reveal first, tap for rest) → body paragraphs → scripture → continue button.
- **`src/components/eternity/death-counter.tsx`** — No changes needed (already self-contained).
- **`src/components/eternity/world-map.tsx`** — No changes needed (already self-contained). Stays in eternity/ directory.
- **`src/components/eternity/map-constants.ts`** — No changes needed (used by world-map).

### 6. Dead Code Cleanup

**Analytics functions to remove:**
- `trackQuizAnswered`, `trackGuiltyShown`, `trackBridgeClicked` from `src/lib/eternity-analytics.ts`
- `trackEternityCtaClicked` from `src/lib/eternity-analytics.ts` (CTA section removed)

**Analytics functions to keep:**
- `trackEternityViewed`, `trackScrollDepth` — can be adapted for the new home page or removed if no longer meaningful (single viewport = no scroll depth)
- `trackGraceRevealed`, `trackGraceBeatRevealed` — moved to be called from test grace screen

**Storage to remove:**
- `writeQuizAnswer` / `readQuizAnswers` from `src/lib/quiz-storage.ts` — home quiz no longer exists. Check if `/test` also uses these; if not, remove the entire file.

**i18n keys:** Remove all unused keys listed in section 3.

### 7. Analytics for New Home Page

- **Track home page CTA click** — new PostHog event when "Face the court" is clicked
- **Track secondary link click** — new PostHog event when "Not ready? Learn more" is clicked
- **Track page view** — keep `trackEternityViewed` or rename to `trackHomeViewed`

---

## What This Does NOT Change

- `/test` landing, questions, verdict, invitation phases — untouched
- `/learn`, `/chat`, `/reading-plan`, `/next-steps` — untouched
- Footer, top bar navigation — untouched
- Share functionality on `/test` — untouched

## Verification

1. Visit `/{locale}/` — should see death counter + rate cards + map + provocative question + CTA + secondary link, all in one viewport
2. Sticky death counter bar visible at top
3. Click primary CTA — navigates to `/{locale}/test`
4. Click secondary link — navigates to `/{locale}/learn`
5. Complete test through verdict — grace phase should show:
   - Heading auto-reveals
   - Beat 1 auto-reveals after short delay
   - Tap to reveal beats 2, 3, 4
   - After all beats: body paragraphs fade in, then scripture, then continue button
6. Continue to invitation — works as before
7. Check both locales (en, pt)
8. Verify footer/nav still provides access to all other pages
9. Run `pnpm build` — no errors, no unused import warnings
10. Verify no dead code remains (removed components not imported anywhere, unused i18n keys cleaned up)
