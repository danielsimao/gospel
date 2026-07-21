# Waves 2+3 — LCP Fix, Journey Gaps, SEO Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Fix the real prod LCP driver — the death counter's post-hydration count-up; (2) close the post-commitment journey leaks (footer dead-click, one-shot discipleship content, missing bridges); (3) ship the SEO quick wins (locale-correct brand suffix, FAQPage + HowTo schema, topic cross-links, sitemap hreflang).

**Architecture:** LCP: an inline `<script>` rendered immediately after the counter span paints the live number before first paint, so LCP = FCP instead of hydration+1.5s. Journey: a small client component gates the footer next-steps link by stage; the committed home state gains a persistent next-steps card; reading-plan completion links to next-steps; top-bar reading link restricted to committed/thinking. SEO: title suffixes switch to `topBar.brand` (locale-correct); new schema builders in `src/lib/seo.ts`; a curated `RELATED_TOPICS` map drives cross-links; per-topic `faq` arrays render visibly and emit FAQPage JSON-LD.

**Tech Stack:** Next.js 16.2.1 App Router (Turbopack), React 19, TypeScript, framer-motion 12 (`m` + LazyMotion — NEVER import `motion`), Tailwind v4, Vitest, pnpm.

## Global Constraints

- This is a modified Next.js — consult `node_modules/next/dist/docs/` if any API is in doubt (AGENTS.md).
- **Living Waters method: NO decisionism.** No sinner's-prayer framing, no "you are saved because you clicked" copy. Assurance language stays conditional/fruit-based. New copy must match the existing register (see `src/messages/en.json` `nextSteps.trackA` for tone).
- **framer-motion:** components use `import { m } from "framer-motion"` — a `LazyMotion features={domAnimation} strict` provider wraps the app; importing/using full `motion` crashes at runtime.
- **Design language:** red = judgment/Law, gold (`#D4A843`) = grace. House card pattern: `rounded-xl border p-5`, gold-accent variant `border-[#D4A843]/25 bg-[#D4A843]/[0.03]`, ghost variant `border-white/[0.06] bg-white/[0.015]`. Eyebrow pattern: `font-mono text-[10px] uppercase tracking-[2px]`.
- **Zero-content-shift rule:** journey-stage-dependent UI renders nothing on SSR/first paint and appears after hydration — reserve space or place below the fold; never shift content above it.
- **Bilingual parity:** every new message key lands in BOTH `src/messages/en.json` and `src/messages/pt.json` in the same shape. European Portuguese (tu-form, no Brazilian constructions). All PT copy is flagged for the owner's copy gate — write it well, but list it in the report.
- **JSON message edits:** surgical string edits only (match exact surrounding lines) — never rewrite/reserialize a whole file.
- Gates for every task: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — all green before commit.
- Commit messages end with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: Paint the death counter before first paint (LCP fix)

**Files:**
- Modify: `src/components/eternity/death-counter.tsx` (full rewrite below)

**Interfaces:**
- Consumes: nothing.
- Produces: same public API — `DeathCounter({ className?, style?, fromMidnight? })`. Used by `src/components/home-shell.tsx:145` (with `fromMidnight`) and `src/components/shared/sticky-death-counter.tsx:36` (without).

**Why:** Prod mobile LCP is 4.7s. The LCP element is this counter's span. It SSRs `0`, then after hydration eases 0→~70,000 over 1.5s; every digit-growth repaint is a larger LCP candidate, so LCP is pinned to hydration + animation end. Painting the real number in the initial HTML parse makes the first paint the largest paint → LCP ≈ FCP (~1.6s). No CSP blocks inline scripts (next.config.ts sets no CSP header).

- [ ] **Step 1: Rewrite `src/components/eternity/death-counter.tsx`**

```tsx
"use client";

import { useEffect, useRef, memo } from "react";

const DEATHS_PER_SECOND = 1.8;
const DEATHS_PER_MS = DEATHS_PER_SECOND / 1000;
/** Duration of the count-up animation in ms (page-load counters only). */
const COUNT_UP_MS = 1500;

interface DeathCounterProps {
  className?: string;
  style?: React.CSSProperties;
  /** If true, count from midnight UTC (deaths today). Otherwise from page load. */
  fromMidnight?: boolean;
}

function getMsSinceMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(0, 0, 0, 0);
  return now.getTime() - midnight.getTime();
}

/** Ease-out cubic: fast start, gentle landing. */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Inline script that paints the live deaths-today number during HTML parse,
 * BEFORE first paint. Without it the span SSRs "0" and the post-hydration
 * count-up makes every digit-growth repaint a new (larger) LCP candidate —
 * pinning LCP to hydration + animation end instead of first paint.
 * Kept dependency-free and duplicated from the module constants above
 * because it executes before any bundle loads.
 */
const PREPAINT_SCRIPT = `(function(){var s=document.currentScript,e=s&&s.previousElementSibling;if(!e)return;var n=new Date(),m=new Date(n);m.setUTCHours(0,0,0,0);e.textContent=Math.floor((n-m)*${DEATHS_PER_MS}).toLocaleString();})()`;

export const DeathCounter = memo(function DeathCounter({
  className,
  style,
  fromMidnight = false,
}: DeathCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const targetBase = fromMidnight ? getMsSinceMidnightUTC() : 0;
    const animStart = Date.now();

    let raf: number;
    function tick() {
      const elapsed = Date.now() - animStart;
      const realCount = Math.floor((targetBase + elapsed) * DEATHS_PER_MS);

      let displayed = realCount;
      if (!fromMidnight && elapsed < COUNT_UP_MS && realCount > 0) {
        // Page-load counters keep the count-up drama; fromMidnight counters
        // must NOT re-animate from 0 — the pre-paint script already painted
        // the live value, and growing repaints would push LCP out again.
        displayed = Math.floor(easeOutCubic(elapsed / COUNT_UP_MS) * realCount);
      }

      const text = displayed.toLocaleString();
      // Write only on change — this loop runs at frame rate but the value
      // changes ~2×/second.
      if (ref.current && ref.current.textContent !== text) {
        ref.current.textContent = text;
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fromMidnight]);

  const span = (
    <span
      ref={ref}
      suppressHydrationWarning
      className={className}
      style={{ ...style, display: "inline-block", minWidth: "7ch", textAlign: "center" }}
    >
      0
    </span>
  );

  if (!fromMidnight) return span;

  return (
    <>
      {span}
      <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
    </>
  );
});
```

Notes: `suppressHydrationWarning` is required — the inline script mutates the span's text before React hydrates, and React 19 would otherwise warn on the text mismatch. The script uses `previousElementSibling`, so the `<script>` MUST stay the immediate next sibling of the span.

- [ ] **Step 2: Run the gates**

Run: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`
Expected: all green.

- [ ] **Step 3: Verify the pre-paint in the SSR HTML + dev**

Run: `grep -o 'previousElementSibling' .next/server/app/en.html | head -1`
Expected: one match (the inline script is in the prerendered HTML).
Dev check (`pnpm dev`, `http://localhost:3000/en`): the big red counter shows a ~5-digit number immediately (no visible 0→N run-up), then ticks live. The sticky counter on `/en/test` still counts up from 0 (unchanged path).

- [ ] **Step 4: Commit**

```bash
git add src/components/eternity/death-counter.tsx
git commit -m "perf: paint death counter before first paint — LCP fix

The counter SSR'd 0 and eased to ~70k over 1.5s after hydration; every
digit-growth repaint was a larger LCP candidate, so prod LCP measured
the animation (4.7s), not the page. An inline script now paints the
live number during HTML parse, before first paint — LCP becomes FCP.
fromMidnight counters skip the count-up (re-animating from 0 would
reintroduce the growing repaints); page-load counters keep it.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 2: Gate the footer next-steps link + persistent next-steps card for committed users

**Files:**
- Create: `src/components/shared/footer-next-steps-link.tsx`
- Modify: `src/components/shared/footer.tsx:107-113`
- Modify: `src/components/home-shell.tsx` (committed branch, after `<JourneyTracker …/>`)
- Modify: `src/lib/types.ts` (`JourneyStagesMessages.committed`)
- Modify: `src/lib/i18n.ts` (`JOURNEY_STAGE_LEAVES`)
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`home.journeyStages.committed`)

**Interfaces:**
- Consumes: `useJourney()` from `@/lib/use-journey` (returns `{ stage, ready, … }`), house card patterns.
- Produces: `FooterNextStepsLink({ locale, label })` client component; new message leaves `home.journeyStages.committed.nextStepsCard.label` and `.description` (both locales, validated by `JOURNEY_STAGE_LEAVES`).

**Why:** The footer shows "Next steps" to every visitor, but `next-steps/client.tsx` `router.replace`s anyone who isn't committed/thinking back home — a silent dead click. And the committed track's relational guidance (pray/community/church) is reachable exactly once via the invitation CTA; a committed user who returns later only ever sees the habit loop.

- [ ] **Step 1: Create `src/components/shared/footer-next-steps-link.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useJourney } from "@/lib/use-journey";
import type { Locale } from "@/lib/i18n";

interface FooterNextStepsLinkProps {
  locale: Locale;
  label: string;
}

/**
 * The next-steps page only has something honest to say to committed/thinking
 * users (it redirects everyone else home). Render the footer link only for
 * them — a link that silently bounces is a dead click.
 */
export function FooterNextStepsLink({ locale, label }: FooterNextStepsLinkProps) {
  const { stage, ready } = useJourney();

  if (!ready || (stage !== "committed" && stage !== "thinking")) return null;

  return (
    <Link
      href={`/${locale}/next-steps`}
      prefetch={false}
      className="text-sm text-white/70 transition-colors hover:text-white/80"
    >
      {label}
    </Link>
  );
}
```

- [ ] **Step 2: Use it in `src/components/shared/footer.tsx`**

Add import: `import { FooterNextStepsLink } from "./footer-next-steps-link";`

Replace the static link (lines 107–113):

```tsx
              <Link
                href={`/${locale}/next-steps`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.nextStepsLink}
              </Link>
```

with:

```tsx
              <FooterNextStepsLink locale={locale} label={messages.nextStepsLink} />
```

(The footer stays a server component; only the link is client. It appears after hydration for committed/thinking users — footer is below the fold, so no perceptible shift.)

- [ ] **Step 3: Add the message leaves (surgical string edits)**

`src/messages/en.json` — inside `home.journeyStages.committed`, currently:

```json
      "committed": {
        "heading": "If you have repented and put your trust in Jesus Christ, you have passed from death to life.",
        "subheading": "Walk in it"
      },
```

becomes:

```json
      "committed": {
        "heading": "If you have repented and put your trust in Jesus Christ, you have passed from death to life.",
        "subheading": "Walk in it",
        "nextStepsCard": {
          "label": "Your next steps",
          "description": "Prayer, church, and the people who will walk with you — where a new life takes root."
        }
      },
```

**IMPORTANT:** first `grep -n '"committed"' src/messages/en.json` and read the actual block — if the heading text differs from the excerpt above, keep the existing heading/subheading verbatim and only ADD the `nextStepsCard` object.

`src/messages/pt.json` — same shape inside `home.journeyStages.committed`:

```json
        "nextStepsCard": {
          "label": "Os teus próximos passos",
          "description": "Oração, igreja e as pessoas que vão caminhar contigo — onde uma vida nova cria raízes."
        }
```

(Same grep-first rule. Flag both strings for the owner copy gate in your report.)

- [ ] **Step 4: Extend the type + validation**

`src/lib/types.ts` — in `JourneyStagesMessages`:

```ts
  committed: {
    heading: string;
    subheading: string;
    nextStepsCard: { label: string; description: string };
  };
```

`src/lib/i18n.ts` — in `JOURNEY_STAGE_LEAVES`, alongside the existing committed entries (read the array first; entries are string-path arrays like `["home","journeyStages","committed","heading"]` — match the existing format exactly), add:

```ts
  ["home", "journeyStages", "committed", "nextStepsCard", "label"],
  ["home", "journeyStages", "committed", "nextStepsCard", "description"],
```

- [ ] **Step 5: Run the i18n test to see it pass against both locales**

Run: `pnpm test -- i18n-validate`
Expected: PASS (the new leaves exist in both locales).

- [ ] **Step 6: Render the persistent card in the committed home state**

`src/components/home-shell.tsx` — in the `journey.stage === "committed"` branch, immediately AFTER the closing of `<JourneyTracker … />` (line ~228, before the branch's closing `</div>`), add:

```tsx
              {/* Persistent bridge to the relational track — pray/community/church
                  guidance must survive beyond the one-shot invitation CTA */}
              <Link
                href={`/${locale}/next-steps`}
                className="group mt-3 block w-full max-w-md rounded-xl border border-[#D4A843]/25 bg-[#D4A843]/[0.03] p-5 transition-all hover:border-[#D4A843]/45"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/90">
                      {home.journeyStages.committed.nextStepsCard.label}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/60">
                      {home.journeyStages.committed.nextStepsCard.description}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 text-[#D4A843]/70 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </Link>
```

(This mirrors the thinking-stage johnCard pattern at `home-shell.tsx:268-290`. `Link` is already imported in home-shell.)

- [ ] **Step 7: Run the gates**

Run: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`
Expected: all green.

- [ ] **Step 8: Dev check**

`pnpm dev`: in the browser console run
`localStorage.setItem("gospel-journey", JSON.stringify({version:1,testCompletedAt:Date.now(),invitationResponse:"committed",invitationRespondedAt:Date.now(),readingDays:{},learnTopics:{}}))`
then load `http://localhost:3000/en`: the committed state shows the scripture blockquote, tracker, and the new gold next-steps card; the footer "Grow" column shows "Next Steps". Clear the key (`localStorage.removeItem("gospel-journey")`), reload: footer has no next-steps link; no layout jump when it appears/disappears (below fold).
NOTE: if the exact journey-record shape differs, read `src/lib/journey-storage.ts` and construct a valid v1 record instead — do not guess field names.

- [ ] **Step 9: Commit**

```bash
git add src/components/shared/footer-next-steps-link.tsx src/components/shared/footer.tsx src/components/home-shell.tsx src/lib/types.ts src/lib/i18n.ts src/messages/en.json src/messages/pt.json
git commit -m "fix: next-steps reachable at the right times, not always/never

The footer advertised next-steps to every visitor while the page
bounced everyone but committed/thinking users back home — a dead click.
The link is now stage-gated. And the committed track's relational
guidance (pray/church/community) was reachable exactly once, via the
invitation CTA; the committed home state now carries a persistent
next-steps card alongside the habit tracker.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 3: Reading-plan → next-steps bridge + method-correct top-bar

**Files:**
- Modify: `src/components/reading-plan/reading-plan.tsx` (completion block, ~line 189)
- Modify: `src/components/shared/top-bar.tsx:26-31`
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`readingPlan` two new keys)
- Modify: the `readingPlan` messages interface — find it with `grep -rn "deeperLabel" src --include="*.ts*"` (it's the props/type consumed by `reading-plan.tsx`; add the two keys there)
- Check: `src/app/[locale]/(content)/reading-plan/page.tsx` (or wherever `readingPlan` messages are passed) — if messages are passed field-by-field, wire the new keys through

**Interfaces:**
- Consumes: `useJourney()` (already used in `reading-plan.tsx`? verify — if not, the component receives no stage; import and call `useJourney()` for `stage`).
- Produces: message keys `readingPlan.nextStepsLabel`, `readingPlan.nextStepsLink` (both locales).

**Why:** A committed user finishing the 7-day plan gets links out (Bible) and to /learn — but no path to the relational next-steps content from where they actually spend time. And the top bar currently offers the reading plan to "undecided" users who saw only a GUILTY verdict and never reached grace — nudging a discipleship habit before grace has been shown is off-method.

- [ ] **Step 1: Add the message keys (surgical edits, grep-first)**

`src/messages/en.json`, inside `readingPlan` directly after the `"deeperLink"` entry (grep for `"deeperLink"` to locate; keep existing lines verbatim):

```json
    "nextStepsLabel": "Walking with Christ is more than reading.",
    "nextStepsLink": "See your next steps",
```

`src/messages/pt.json`, same position:

```json
    "nextStepsLabel": "Andar com Cristo é mais do que ler.",
    "nextStepsLink": "Vê os teus próximos passos",
```

(Flag PT for owner gate.)

- [ ] **Step 2: Extend the readingPlan messages type**

Locate the interface containing `deeperLabel: string; deeperLink: string;` (grep from Files list) and add:

```ts
  nextStepsLabel: string;
  nextStepsLink: string;
```

If the page passes messages as a whole object (`messages.readingPlan` spread), nothing more; if field-by-field, wire the two new fields through the same way `deeperLabel`/`deeperLink` flow.

- [ ] **Step 3: Render the bridge in the completion block**

In `src/components/reading-plan/reading-plan.tsx`, the component must know the journey stage. Check its imports: if `useJourney` isn't imported, add `import { useJourney } from "@/lib/use-journey";` and inside the component `const { stage } = useJourney();` (this is a client component — verify the `"use client"` directive exists; it does).

Inside the `{allComplete && (…)}` block, directly AFTER the existing "deeper" `<div className="mt-6">…</div>` (the one linking to `/learn`, ends line ~198), add:

```tsx
          {(stage === "committed" || stage === "thinking") && (
            <div className="mt-6">
              <p className="text-sm text-white/60">{messages.nextStepsLabel}</p>
              <Link
                href={`/${locale}/next-steps`}
                className="mt-2 inline-flex items-center text-sm text-[#D4A843]/70 transition-colors hover:text-[#D4A843]"
              >
                {messages.nextStepsLink} →
              </Link>
            </div>
          )}
```

(Mirrors the existing deeper-link pattern exactly. `Link` is already imported.)

- [ ] **Step 4: Restrict the top-bar reading link**

`src/components/shared/top-bar.tsx` — the stage derivation (lines 26–31):

```tsx
  const stage: "pre-test" | "pre-reading" | "done" =
    journey.stage === "visitor"
      ? "pre-test"
      : journey.readingDone >= TOTAL_READING_DAYS
        ? "done"
        : "pre-reading";
```

becomes:

```tsx
  // Reading plan is discipleship — offer it only after a response to grace
  // (committed/thinking). Undecided users saw only the verdict; dismissed
  // users said no. Neither should be nudged into a reading habit here.
  const stage: "pre-test" | "pre-reading" | "done" =
    journey.stage === "visitor"
      ? "pre-test"
      : (journey.stage === "committed" || journey.stage === "thinking") &&
          journey.readingDone < TOTAL_READING_DAYS
        ? "pre-reading"
        : "done";
```

(`"done"` renders no extra link — undecided/dismissed users get just the Learn link, same as fully-done users. No other change to the component.)

- [ ] **Step 5: Run the gates**

Run: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`
Expected: all green (including the messages-parity test).

- [ ] **Step 6: Dev check**

With the committed localStorage record from Task 2 Step 8: `http://localhost:3000/en/reading-plan` — mark all 7 days read (or set them in the record) → completion block shows Bible link, learn link, AND "See your next steps". With an undecided record (`invitationResponse` absent): top bar shows only Learn (no reading-plan link); reading-plan completion block shows no next-steps line.

- [ ] **Step 7: Commit**

```bash
git add src/components/reading-plan/reading-plan.tsx src/components/shared/top-bar.tsx src/messages/en.json src/messages/pt.json
# plus the type file located in Step 2 and any page wiring file
git commit -m "fix: reading-plan bridges to next-steps; top-bar respects the method

Finishing the 7-day plan offered links out (Bible) and to learn, but no
path to the relational next-steps content. Committed/thinking users now
get that bridge on completion. The top bar offered the reading plan to
undecided users who had seen only a guilty verdict — discipleship
nudges now wait for a response to grace.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 4: Delete the dead `invitation.resources` key

**Files:**
- Modify: `src/messages/en.json` (`invitation.resources` array)
- Modify: `src/messages/pt.json` (same)
- Modify: `src/lib/types.ts:189` (`resources: Array<{ name: string; url: string }>;`)

**Interfaces:** none — the key is confirmed dead: only reference is the type definition (verify with `grep -rn "resources" src --include="*.tsx" --include="*.ts" | grep -v messages | grep -v types.ts | grep -v "third-party resources"` → must return nothing invitation-related before deleting; if a hit appears, STOP and report).

- [ ] **Step 1: Verify deadness** (grep above; also `grep -rn "invitation.resources\|\.resources" src/components/invitation-screen.tsx` → no hits)
- [ ] **Step 2: Delete the `"resources": [ … ],` block from `invitation` in both locale files** (surgical: read each block first, remove the array and its trailing comma handling so JSON stays valid)
- [ ] **Step 3: Delete the `resources: Array<{ name: string; url: string }>;` line from the invitation type in `src/lib/types.ts`**
- [ ] **Step 4: Gates** — `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green
- [ ] **Step 5: Commit**

```bash
git add src/messages/en.json src/messages/pt.json src/lib/types.ts
git commit -m "chore: delete dead invitation.resources — never rendered

The 3-link array existed in both locales and the type, but no component
ever rendered it (the invitation screen shows learnMoreLabel instead).
The relational bridges now live in next-steps, reachable persistently.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 5: Locale-correct brand suffix in learn titles

**Files:**
- Modify: `src/app/[locale]/(content)/learn/page.tsx:24,45`
- Modify: `src/app/[locale]/(content)/learn/[slug]/page.tsx:67`

**Why:** SERP titles currently render "Am I a Good Person? | Are You a Good Person?" — the suffix is derived from `meta.title.split(" | ")[0]`, which is the homepage tagline, not the brand. The brand is `topBar.brand` ("If You Died Today" / "Se Morresses Hoje") — locale-correct, matches the domain.

- [ ] **Step 1: Replace the derivation at all three sites**

Each site currently reads:

```ts
  const brand = messages.default.meta.title.split(" | ")[0];
```

Replace with:

```ts
  const brand = messages.default.topBar.brand;
```

(In `learn/page.tsx` the pattern appears twice — lines 24 and 45; both change. The `messages` import already exists at each site. Note `[slug]/page.tsx` also has a separate `topBar?.brand ?? "Gospel"` read at line ~98 for the breadcrumb — leave that one as-is.)

- [ ] **Step 2: Gates** — all green.
- [ ] **Step 3: Verify**: `pnpm build && grep -o '<title>[^<]*</title>' .next/server/app/en/learn/am-i-a-good-person.html`
Expected: `Am I a Good Person? | If You Died Today`. Same check for `.next/server/app/pt/learn/am-i-a-good-person.html` → `… | Se Morresses Hoje`.
- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(content)/learn/page.tsx" "src/app/[locale]/(content)/learn/[slug]/page.tsx"
git commit -m "fix: learn title suffix uses the brand, not the homepage tagline

SERPs rendered 'Am I a Good Person? | Are You a Good Person?' — the
suffix came from meta.title's first segment (a tagline). It now uses
topBar.brand, which is locale-correct and matches the domain.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 6: Sitemap hreflang alternates + reading-plan HowTo schema

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/lib/seo.ts` (add `buildHowToSchema`)
- Modify: the reading-plan page server component (find with `grep -rln "readingPlan" src/app --include="*.tsx"`) — emit the schema via the existing `<StructuredData>` component (exemplar: `learn/[slug]/page.tsx`)

**Interfaces:**
- Consumes: `getLanguageAlternates(path)` already exported from `src/lib/seo.ts:61`; `readingPlan.days` message array (7 entries — check each day's shape with `python3 -c "import json; d=json.load(open('src/messages/en.json')); print(list(d['readingPlan']['days'][0].keys()))"` before writing the builder).
- Produces: `buildHowToSchema({ locale, name, description, days })` in seo.ts.

- [ ] **Step 1: Sitemap alternates**

In `src/app/sitemap.ts`, add `getLanguageAlternates` to the existing `@/lib/seo` import, then give every pushed entry an `alternates` block. Static pages:

```ts
      entries.push({
        url: getLocaleUrl(locale, page),
        lastModified: BUILD_TIMESTAMP,
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : page === "/test" ? 0.9 : 0.7,
        alternates: { languages: getLanguageAlternates(page) },
      });
```

Learn pages: same addition with `getLanguageAlternates(`/learn/${slug}`)`.

- [ ] **Step 2: Add `buildHowToSchema` to `src/lib/seo.ts`** (after `buildArticleSchema`, matching file style)

```ts
type BuildHowToSchemaArgs = {
  locale: Locale;
  name: string;
  description: string;
  days: Array<{ title: string; summary: string }>;
};

export function buildHowToSchema({ locale, name, description, days }: BuildHowToSchemaArgs) {
  const url = getLocaleUrl(locale, "/reading-plan");

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name,
    description,
    url,
    inLanguage: locale,
    totalTime: "P7D",
    step: days.map((day, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: day.title,
      text: day.summary,
    })),
  };
}
```

**Adapt the `days` field names to reality:** inspect the actual day-message shape first (Step interfaces note). If a day has e.g. `{ heading, description, passage }`, map the two most title/summary-like fields and adjust the arg type accordingly. Do not invent fields.

- [ ] **Step 3: Emit it on the reading-plan page** — in the page server component, build the schema from the locale's `readingPlan` messages (name = `readingPlan.heading`, description = `readingPlan.subtitle`) and render `<StructuredData data={howToSchema} />` alongside the existing schema(s), following the exemplar.

- [ ] **Step 4: Gates + verify**

`pnpm build`, then:
`grep -o '"@type":"HowTo"' .next/server/app/en/reading-plan.html` → one match;
`node -e "const m=require('./.next/server/app/sitemap.xml.meta 2>/dev/null')" || curl -s localhost:3000/sitemap.xml` — simplest: `pnpm dev` and `curl -s http://localhost:3000/sitemap.xml | grep -c 'xhtml:link'`
Expected: > 0 (alternates present; Next renders `alternates.languages` as `xhtml:link` entries).

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/lib/seo.ts
# plus the reading-plan page file
git commit -m "seo: sitemap hreflang alternates + HowTo schema for the reading plan

Sitemap entries now carry their EN/PT/x-default alternates, reinforcing
the hreflang pairing already in page heads. The 7-day reading plan
emits HowTo structured data (7 steps) for step-list rich results.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 7: Related-topics cross-links on learn articles

**Files:**
- Create: `src/lib/related-topics.ts`
- Modify: `src/app/[locale]/(content)/learn/[slug]/page.tsx` (resolve related topics, pass to TopicPage)
- Modify: `src/components/learn/topic-page.tsx` (render the block before `<TopicNav>`)
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`learn.relatedLabel`)
- Modify: the learn messages type if `LearnData`-style interfaces exist in both page + component (add `relatedLabel`)

**Interfaces:**
- Produces: `RELATED_TOPICS: Record<string, string[]>` — curated map, and TopicPage prop `relatedTopics: Array<{ slug: string; title: string }>` + `relatedLabel: string`.

**Why:** Topic articles link only hub + linear prev/next. Contextual cross-links turn 8 pages into a topical cluster (internal link equity + dwell).

- [ ] **Step 1: Create `src/lib/related-topics.ts`**

```ts
/**
 * Curated related-topic map for learn articles (SEO topical cluster +
 * reader guidance). Slugs must exist in messages learn.topics — the
 * unit test enforces it. Order = display order.
 */
export const RELATED_TOPICS: Record<string, string[]> = {
  "am-i-a-good-person": ["what-is-sin", "what-happens-when-i-die"],
  "who-is-jesus": ["why-the-cross", "does-god-exist"],
  "what-is-sin": ["am-i-a-good-person", "how-can-my-sins-be-forgiven"],
  "why-the-cross": ["who-is-jesus", "how-can-my-sins-be-forgiven"],
  "how-can-my-sins-be-forgiven": ["what-is-repentance", "why-the-cross"],
  "what-is-repentance": ["how-can-my-sins-be-forgiven", "what-is-sin"],
  "what-happens-when-i-die": ["am-i-a-good-person", "does-god-exist"],
  "does-god-exist": ["who-is-jesus", "what-happens-when-i-die"],
};
```

- [ ] **Step 2: Write the failing test** — `src/__tests__/related-topics.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { RELATED_TOPICS } from "@/lib/related-topics";
import en from "../messages/en.json";

const slugs = new Set(en.learn.topics.map((t: { slug: string }) => t.slug));

describe("RELATED_TOPICS", () => {
  it("covers every topic", () => {
    expect(Object.keys(RELATED_TOPICS).sort()).toEqual([...slugs].sort());
  });

  it("references only real slugs, never itself", () => {
    for (const [slug, related] of Object.entries(RELATED_TOPICS)) {
      expect(related.length).toBeGreaterThanOrEqual(2);
      for (const r of related) {
        expect(slugs.has(r)).toBe(true);
        expect(r).not.toBe(slug);
      }
    }
  });
});
```

Match import style of existing tests (see `src/__tests__/topic-dates.test.ts` for how messages are imported — copy that pattern if it differs). Run `pnpm test -- related-topics` — must FAIL before Step 1's file exists / PASS after (order Steps 1-2 as TDD: write test first, watch fail, then create the map).

- [ ] **Step 3: Message key** — in `learn` (both locales, surgical, next to `"prevLabel"`/`"nextLabel"`):

EN: `"relatedLabel": "Keep digging",`
PT: `"relatedLabel": "Continua a escavar",`
(Flag PT for owner gate.)

- [ ] **Step 4: Resolve + pass in `learn/[slug]/page.tsx`**

After `nextTopic` is built:

```ts
  const relatedTopics = (RELATED_TOPICS[slug] ?? [])
    .map((relatedSlug) => data.topics.find((t) => t.slug === relatedSlug))
    .filter((t): t is TopicData => Boolean(t))
    .map((t) => ({ slug: t.slug, title: t.title, subtitle: t.subtitle }));
```

Import `RELATED_TOPICS` from `@/lib/related-topics`. Pass `relatedTopics={relatedTopics}` and `relatedLabel={data.relatedLabel}` to `<TopicPage>`. Add `relatedLabel: string;` to the page's `LearnData` interface.

- [ ] **Step 5: Render in `src/components/learn/topic-page.tsx`**

Add props to `TopicPageProps`:

```ts
  relatedTopics: Array<{ slug: string; title: string; subtitle: string }>;
  relatedLabel: string;
```

Render between the sections `</div>` and `<TopicNav …>`:

```tsx
        {relatedTopics.length > 0 && (
          <div className="mt-14">
            <h2 className="font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {relatedLabel}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedTopics.map((related) => (
                <Link
                  key={related.slug}
                  href={`/${locale}/learn/${related.slug}`}
                  className="group block rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03]"
                >
                  <p className="text-sm font-semibold text-white/85 group-hover:text-white/95">
                    {related.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                    {related.subtitle}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
```

(Destructure the two new props in the component signature. `Link` already imported.)

- [ ] **Step 6: Gates + dev check** — all green; `http://localhost:3000/en/learn/what-is-sin` shows a "Keep digging" block with 2 cards linking to real topics; PT page shows PT label/titles.
- [ ] **Step 7: Commit**

```bash
git add src/lib/related-topics.ts src/__tests__/related-topics.test.ts src/components/learn/topic-page.tsx "src/app/[locale]/(content)/learn/[slug]/page.tsx" src/messages/en.json src/messages/pt.json
git commit -m "seo: contextual related-topic links on learn articles

Articles linked only hub + linear prev/next; a curated related map now
cross-links the 8 topics into a cluster (2 cards per article, both
locales). Unit test enforces map completeness and slug validity.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 8: FAQ sections + FAQPage schema on learn topics

**Files:**
- Modify: `src/messages/en.json`, `src/messages/pt.json` (add `faq` array to each of the 8 `learn.topics`)
- Modify: `src/lib/seo.ts` (add `buildFaqSchema`)
- Modify: `src/app/[locale]/(content)/learn/[slug]/page.tsx` (emit schema, pass faq to TopicPage)
- Modify: `src/components/learn/topic-page.tsx` (render FAQ block AFTER related topics, before TopicNav)

**Interfaces:**
- Produces: per-topic `faq: Array<{ question: string; answer: string }>` (3 entries each, both locales); `buildFaqSchema({ locale, slug, faq })`.

**Why:** Every topic is a question — FAQPage rich results + People-Also-Ask presence is the highest-leverage schema add. Google requires FAQ content VISIBLE on the page, so the block renders, not just the JSON-LD.

**Copy rules (binding):**
- 3 Q&A per topic. Questions = real search phrasings adjacent to the topic (not restatements of the title). Answers 40–90 words, distilled FROM the topic's existing sections — no new theology, no decisionism, conditional/fruit-based assurance vocabulary only.
- PT: European Portuguese, tu-form, mirror the EN questions' intent (not word-for-word). All 48 strings (8×3×2) flagged for the owner copy gate in the report.
- Example of register (write in this voice, from `am-i-a-good-person` EN):

```json
        "faq": [
          {
            "question": "How good do you have to be to go to heaven?",
            "answer": "God's standard is moral perfection — Jesus said, 'Be perfect, therefore, as your heavenly Father is perfect.' Measured against the Ten Commandments, no one clears that bar: one lie makes a liar, one theft a thief. That is why the gospel is not advice to try harder but the news that Christ kept the standard and paid for those who broke it."
          },
          {
            "question": "Does being sincere or religious make someone good enough?",
            "answer": "Sincerity cannot cancel guilt — a sincere debtor still owes the debt. Scripture says all our righteous acts are like filthy rags before a holy God. Religion polishes the outside; the courtroom problem remains. What God requires is repentance and trust in the One who paid the fine, not a fuller record of religious effort."
          },
          {
            "question": "If nobody is good, what hope is there?",
            "answer": "The verdict is meant to drive you to the rescue, not to despair. God demonstrated His love in this: while we were still sinners, Christ died for us. Those who repent and put their trust in Him pass from death to life — not because they became good, but because His goodness is counted as theirs."
          }
        ]
```

- [ ] **Step 1: Add `buildFaqSchema` to `src/lib/seo.ts`** (after `buildArticleSchema`)

```ts
type BuildFaqSchemaArgs = {
  locale: Locale;
  slug: string;
  faq: Array<{ question: string; answer: string }>;
};

export function buildFaqSchema({ locale, slug, faq }: BuildFaqSchemaArgs) {
  const url = getLocaleUrl(locale, `/learn/${slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    inLanguage: locale,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
```

- [ ] **Step 2: Author the 8 EN faq arrays** — read each topic's `sections` in `src/messages/en.json` first; distill per the copy rules. Insert `"faq": […]` as the last field of each topic object (after `"sections"` array closes), surgical edits, one topic at a time, `python3 -c "import json; json.load(open('src/messages/en.json'))"` after each insertion.
- [ ] **Step 3: Author the 8 PT faq arrays** — same procedure against `pt.json`'s sections.
- [ ] **Step 4: Wire the page** — in `learn/[slug]/page.tsx`: add `faq?: Array<{ question: string; answer: string }>` to the page's `TopicData` interface; build `const faqSchema = topic.faq?.length ? buildFaqSchema({ locale, slug, faq: topic.faq }) : null;` and render `{faqSchema && <StructuredData data={faqSchema} />}`; pass `faq={topic.faq ?? []}` to `<TopicPage>`.
- [ ] **Step 5: Render the visible FAQ block in `topic-page.tsx`** — new props `faq: Array<{ question: string; answer: string }>` (+ destructure). Between the related-topics block and `<TopicNav>`:

```tsx
        {faq.length > 0 && (
          <div className="mt-14">
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.015] transition-colors open:border-[#D4A843]/20"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 text-sm font-semibold text-white/85 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-white/40 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[13px] leading-relaxed text-white/60">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}
```

(Native `<details>` — no JS, no motion dependency, works with reduced-motion by default.)

- [ ] **Step 6: Gates + verify**

All gates green. Then `pnpm build` and:
`grep -c 'FAQPage' .next/server/app/en/learn/am-i-a-good-person.html` → ≥1; same for a PT page.
Dev: open a topic, click a question — it expands; content matches the JSON-LD.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo.ts src/components/learn/topic-page.tsx "src/app/[locale]/(content)/learn/[slug]/page.tsx" src/messages/en.json src/messages/pt.json
git commit -m "seo: visible FAQ + FAQPage schema on all learn topics

Three search-shaped Q&As per topic (both locales), distilled from the
existing sections — rendered as native details/summary and emitted as
FAQPage JSON-LD for rich results. No new theology; conditional
assurance vocabulary throughout.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 9: Ship + verify on production

**Files:** none (operational)

- [ ] **Step 1: Push** — `git push origin main`
- [ ] **Step 2: Wait for Vercel Ready** — `vercel ls gospel | head -8`
- [ ] **Step 3: Prod smoke**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.ifyoudiedtoday.com/en          # 200
curl -s https://www.ifyoudiedtoday.com/en/learn/am-i-a-good-person | grep -c FAQPage # ≥1
curl -s https://www.ifyoudiedtoday.com/en/learn/am-i-a-good-person | grep -o '<title>[^<]*</title>'  # …| If You Died Today
curl -s https://www.ifyoudiedtoday.com/sitemap.xml | grep -c 'xhtml:link'            # >0
curl -s https://www.ifyoudiedtoday.com/en/reading-plan | grep -c '"@type":"HowTo"'   # ≥1
```

- [ ] **Step 4: Prod Lighthouse (mobile), 3 runs, median** — same command as Wave 1. Success metric: LCP < 3s (was 4.7s; Task 1 targets ≈FCP+ε), perf ≥ 90.
- [ ] **Step 5: Journey smoke in prod browser** — fresh profile: footer has NO next-steps link. (Committed-state checks were covered in dev.)

---

## Execution order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9, strictly serial (2/3/4 share message files; 7/8 share topic-page + learn page; 6/8 share seo.ts).

## Owner copy gate (accumulate in reports)

All new PT strings (Tasks 2, 3, 7) and all 48 FAQ strings (Task 8) — list verbatim in task reports for the owner's PT/copy pass.
