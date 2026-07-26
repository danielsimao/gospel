# Thinking Track Declutter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the committed-track visual pattern (single loud primary CTA + quiet list + icons + grouped animation) to the `thinking` track so the two post-decision tracks read as siblings behind the shared `/next-steps` route.

**Architecture:** Single-component redesign of `track-thinking.tsx`. No new/renamed/deleted message strings, no route or data changes. The `thinking` track is already lean (3 reflection questions, 1 reading card, a talk-to-a-person link, 1 learn card, a come-back line) — this is a consistency port, not a rescue. Reading becomes the one loud gold card; "talk to a real person" becomes the warm secondary; learn + the 7-day plan collapse into a quiet "going deeper" list; the `comeBack` mortality line stays as the closing beat. **No graphic is added** — a non-committer has no testimony/story asset, and inventing decorative art was rejected. The committed track (`track-committed.tsx`) is NOT touched.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, framer-motion (`m` from `framer-motion`), Tailwind v4, lucide-react `^0.577.0`, Vitest, Biome, pnpm.

## Global Constraints

- **No message-key or copy changes.** `src/__tests__/i18n-validate.test.ts` enforces EN/PT key parity. All `trackB` keys already exist in both locales — reuse only. No owner PT-pass gate this round.
- **Preserve all analytics:** every `trackNextStepsActionClicked(action, "thinking")` call survives with its exact `action` arg: `read`, `talk`, `learn`, `reading_plan`. The page-view event (`trackNextStepsViewed`) lives in `client.tsx` and is untouched.
- **Read Next 16 docs before coding** (`node_modules/next/dist/docs/`) only if touching routing/image — this plan touches neither.
- **Gates before commit:** `pnpm lint && pnpm test && npx tsc --noEmit` must pass (also runs pre-push).
- **Match the committed-track idiom** (shipped in commit `3627837`) with ONE deliberate divergence: the thinking primary card drops the glow. Committed's `shadow-[0_0_40px_-12px_rgba(212,168,67,0.25)]` is a *celebration* cue that belongs to someone who just committed; a skeptic has nothing to celebrate and a glowing gold card reads as a sales pitch to the person most guarding against one. Thinking primary card = `rounded-2xl border border-[#D4A843]/40 bg-[#D4A843]/[0.04] p-6` (no shadow). Hierarchy comes from size/structure/icon, not luminance. Everything else matches: quiet secondary link = `flex min-h-[44px] items-center gap-3 rounded-lg border border-white/[0.08] px-4 py-2.5`; quiet list = `divide-y divide-white/[0.06] border-y border-white/[0.06]` with `flex min-h-[52px] items-center gap-3 px-1 py-3` rows; icons `size-4/5` with `aria-hidden="true"`.
- **Emil motion note:** the current thinking stagger is worse than committed's was — `delay: 0.5 + i*0.3` pushes the first card past ~1.4s with 3 reflections, and each card adds another 0.3s. Replace with the committed track's `para(i)` (capped) for reflections and grouped `band` reveals for each section. Subtractive only.
- **Zero-shift rule:** no new lazy media is added, so CLS stays at its current ~0.

---

## File Structure

- **Modify (full render rewrite):** `src/components/next-steps/track-thinking.tsx` — the only code file. `TrackThinkingProps` / `TrackThinkingMessages` interfaces stay identical (same keys consumed) → `client.tsx` needs no change.
- **Unchanged, depended upon:** `src/components/next-steps/band-header.tsx` (`BandHeader`, props `label`, `tone: "gold" | "dim"`), `src/components/ui/button.tsx` (`Button` variant `gold`, size `sm`; `ButtonArrow`), `@/lib/discipleship-analytics` (`trackNextStepsActionClicked`), `@/lib/motion` (`EASE_OUT_STRONG`), `@/lib/journey-storage` (`readJourney`).
- **Reference (do not edit):** `src/components/next-steps/track-committed.tsx` — the shipped sibling whose idiom this plan copies.

---

## Task 1: Rebuild the thinking-track render

**Files:**
- Modify: `src/components/next-steps/track-thinking.tsx` (add imports; replace the returned JSX; keep the `isFresh` effect)
- Verify (existing, do not edit): `src/__tests__/i18n-validate.test.ts`

**Interfaces:**
- Consumes: `TrackThinkingProps { messages: TrackThinkingMessages; locale: Locale }` — **unchanged**. `BandHeader({ label, tone })`, `Button({ variant, size })`, `ButtonArrow()`.
- Produces: nothing new. Same component export `TrackThinking`.

### Target structure (what the reader sees)

```
[h1]  isFresh ? acknowledgment : acknowledgmentReturn   (white/90, unchanged)
[3 reflection questions]  italic, border-l                (unchanged — the payload)

── Today ──────────────────────────────  (BandHeader gold)
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ 📖 One thing to read (PRIMARY)┃  readingBody + [Read John 3]
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  talkLabel
  ⇢ 💬 Chat at needGod.net          (warm secondary link)

── Going deeper ───────────────────────  (BandHeader dim)
  quiet rows (icon + label + →):
    🧭 Explore the topics    → /{locale}/learn
    📅 7-day reading plan    → /{locale}/reading-plan
  comeBack (mortality line, centered, plain text — closing beat)
```

Changes vs. today:
- Reading card gains the loud committed-style treatment + a `BookOpen` icon; it is the one loud card.
- "Talk to a real person" moves up as the warm secondary (icon `MessageCircle`), same slot/treatment as committed's community link.
- Learn stops being a full card; it becomes a quiet list row (`Compass`).
- The 7-day reading-plan link moves out of the `comeBack` sentence into the "going deeper" list as its own row (`CalendarDays`, action `reading_plan`).
- `comeBack` becomes plain closing text (no link — the plan link now lives in the list above).
- `readingHeading`, `readingBody`, `readingLinkLabel`, `learnLinkLabel`, `readingPlanLabel`, `talkLabel`, `talkLink`, `talkUrl`, `comeBack`, `bands.today`, `bands.deeper`, `reflections` all still render. `learnHeading` and `learnBody` stop rendering (keys stay in JSON).

- [ ] **Step 1: Read the current file and confirm collaborators**

Read `src/components/next-steps/track-thinking.tsx` (full), and confirm from `band-header.tsx` / `button.tsx` that `BandHeader` takes `tone="gold" | "dim"` and `Button` takes `variant="gold"`, `size="sm"` with a sibling `ButtonArrow` export. Adjust Step 3 code if any differ.

- [ ] **Step 2: Add the lucide import**

In `src/components/next-steps/track-thinking.tsx`, add to the import block (near the existing `import Link from "next/link";`):
```tsx
import { BookOpen, MessageCircle, Compass, CalendarDays } from "lucide-react";
import { Button, ButtonArrow } from "@/components/ui/button";
```

- [ ] **Step 3: Replace the returned JSX**

Keep the top-of-file imports (plus the two added in Step 2), `FRESH_WINDOW_MS`, both interfaces, and the `isFresh` `useState`/`useEffect` block exactly as they are. Immediately before the `return`, add the two animation helpers (mirroring the committed track):
```tsx
  // One gentle rise per reflection, capped so the questions read in
  // sequence but never run past ~1s total (was 0.5 + i*0.3 — far too slow).
  const para = (i: number) => ({ duration: 0.7, delay: 0.15 + Math.min(i, 3) * 0.12, ease: EASE_OUT_STRONG });
  // Each section reveals as one group, not per-card.
  const band = { duration: 0.7, ease: EASE_OUT_STRONG };
  const groupDelay = 0.15 + Math.min(messages.reflections.length, 3) * 0.12;
```

Replace the entire `return ( … );` with:
```tsx
  return (
    <>
      <m.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE_OUT_STRONG }}
        className="text-2xl font-bold tracking-tight text-white/90 sm:text-3xl"
      >
        {isFresh ? messages.acknowledgment : messages.acknowledgmentReturn}
      </m.h1>

      <div className="mt-10 space-y-6">
        {messages.reflections.map((question, i) => (
          <m.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={para(i)}
            className="border-l border-white/10 pl-5"
          >
            <p className="text-[15px] leading-relaxed text-white/60 sm:text-base italic">{question}</p>
          </m.div>
        ))}
      </div>

      {/* ── TODAY: one primary read + warm human secondary ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: groupDelay + 0.1 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.today} tone="gold" />

        {/* PRIMARY — one thing to read. No glow: the committed track's glow
            celebrates a decision; a skeptic gets a calm invite, not a pitch. */}
        <div className="rounded-2xl border border-[#D4A843]/40 bg-[#D4A843]/[0.04] p-6">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-[#D4A843]" aria-hidden="true" />
            <h3 className="text-base font-semibold tracking-wide text-[#D4A843]">{messages.readingHeading}</h3>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">{messages.readingBody}</p>
          <div className="mt-4">
            <a
              href={messages.readingLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNextStepsActionClicked("read", "thinking")}
            >
              <Button variant="gold" size="sm">
                {messages.readingLinkLabel}
                <ButtonArrow />
              </Button>
            </a>
          </div>
        </div>

        {/* Warm secondary — a real conversation. Highest-value option for a
            skeptic after reading, so it sits directly under the primary. */}
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-white/60">{messages.talkLabel}</p>
          <a
            href={messages.talkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackNextStepsActionClicked("talk", "thinking")}
            className="mt-2 flex min-h-[44px] items-center gap-3 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#D4A843]/25 hover:text-[#D4A843]/80"
          >
            <MessageCircle className="size-4 shrink-0 text-white/50" aria-hidden="true" />
            <span className="flex-1">{messages.talkLink}</span>
            <span aria-hidden="true" className="text-white/40">&rarr;</span>
          </a>
        </div>
      </m.div>

      {/* ── GOING DEEPER: quiet list ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: groupDelay + 0.25 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.deeper} tone="dim" />

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          <Link
            href={`/${locale}/learn`}
            onClick={() => trackNextStepsActionClicked("learn", "thinking")}
            className="flex min-h-[52px] items-center gap-3 px-1 py-3 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <Compass className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.learnLinkLabel}</span>
            <span aria-hidden="true" className="text-white/30">&rarr;</span>
          </Link>
          <Link
            href={`/${locale}/reading-plan`}
            onClick={() => trackNextStepsActionClicked("reading_plan", "thinking")}
            className="flex min-h-[52px] items-center gap-3 px-1 py-3 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <CalendarDays className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.readingPlanLabel}</span>
            <span aria-hidden="true" className="text-white/30">&rarr;</span>
          </Link>
        </div>
      </m.div>

      {/* Closing beat — the mortality press. Plain text, no CTA. */}
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...band, delay: groupDelay + 0.4 }}
        className="mt-10 text-center text-sm leading-relaxed text-white/60"
      >
        {messages.comeBack}
      </m.p>
    </>
  );
```

- [ ] **Step 4: Typecheck + lint**

Run:
```bash
npx tsc --noEmit && pnpm lint
```
Expected: PASS, 0 errors. All four lucide icons (`BookOpen`, `MessageCircle`, `Compass`, `CalendarDays`) are used; `Button`/`ButtonArrow` are used. Decorative icons + arrows carry `aria-hidden="true"`. Lint warning count should remain the pre-existing 9 (no new warnings).

- [ ] **Step 5: Run the suite (parity guard green)**

Run:
```bash
pnpm test
```
Expected: all pass, incl. `i18n-validate.test.ts` (no keys added/removed).

- [ ] **Step 6: Visual + parity check — both locales, both tracks**

`pnpm build && pnpm start`. In the browser at mobile width (390×844), seed a thinking journey and load next-steps:
```js
localStorage.setItem("gospel-journey", JSON.stringify({ version: 1, testCompletedAt: Date.now(), invitationResponse: "thinking", respondedAt: Date.now() }));
```
Navigate to `/en/next-steps` and `/pt/next-steps`. Verify:
- One loud gold Read card; talk-to-a-person is the quiet secondary directly under it; "going deeper" is a two-row divided list (topics, 7-day plan); the come-back mortality line closes the page as plain centered text.
- Reflections + bands rise as groups, no long sequential stagger.
- Regression guard: seed `invitationResponse: "committed"` and confirm the committed track is unchanged (it uses a different file).

- [ ] **Step 7: CLS sanity**

With the prod server up, on `/en/next-steps` (thinking) run in console:
```js
let cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true }); setTimeout(() => console.log("CLS", cls), 2500);
```
Expected: CLS < 0.05 (no new media; should be ~0).

- [ ] **Step 8: Commit**

```bash
git add src/components/next-steps/track-thinking.tsx
git commit -m "$(cat <<'EOF'
feat: declutter thinking next-steps track to match the committed track

Ports the committed-track pattern: one loud Read card (John 3), "talk to a
real person" as the warm secondary, learn + 7-day plan collapsed into a quiet
"going deeper" list with icons, and the come-back mortality line kept as the
closing beat. Replaces the slow per-item stagger with grouped band reveals.
No message keys or copy changed; committed track untouched.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx
EOF
)"
```

---

## Self-Review

**1. Spec coverage** (decisions → tasks):
- Port single-primary hierarchy → Reading becomes the one gold card, no glow (grill fork: celebration glow stays committed-only). ✓
- Quiet list merge → Learn + reading-plan collapse into "going deeper" rows. ✓
- Icons only, no graphic (accepted fork) → 4 lucide icons, zero images. ✓
- Talk = warm secondary (accepted fork) → placed under the primary with committed's secondary treatment. ✓
- comeBack mortality line preserved as closing beat. ✓
- Animation fix → `para(i)` + grouped `band`, replacing `0.5 + i*0.3`. ✓
- Committed track untouched → different file, not modified. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases". Full JSX supplied. ✓

**3. Type consistency:** `TrackThinkingProps`/`TrackThinkingMessages` unchanged → `client.tsx` untouched. Keys consumed (`acknowledgment`, `acknowledgmentReturn`, `reflections`, `readingHeading`, `readingBody`, `readingLink`, `readingLinkLabel`, `readingPlanLabel`, `learnLinkLabel`, `talkLabel`, `talkLink`, `talkUrl`, `comeBack`, `bands.today`, `bands.deeper`) all exist in `trackB` (verified in en.json). `learnHeading`/`learnBody` intentionally unused, not deleted. Icons `BookOpen, MessageCircle, Compass, CalendarDays` exist in `lucide-react@0.577`. Analytics actions (`read`, `talk`, `learn`, `reading_plan`) unchanged. ✓
