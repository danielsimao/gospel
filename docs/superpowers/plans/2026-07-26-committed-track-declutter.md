# Committed Track Declutter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the post-decision "committed" track so a freshly-converted reader sees one loud primary action + a quiet "as you grow" list + one real graphic, instead of six identical gold cards across three bands.

**Architecture:** Single-component redesign of `track-committed.tsx`. No new message strings, no deleted keys, no route or data changes — the whole change is render structure, icon additions, one inline lazy image, and a grouped (not per-item) animation. Every existing link and its analytics call is preserved; some card *bodies* simply stop rendering. The `thinking` track is untouched.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, framer-motion (`m` from `@/components/motion`-style barrel already imported as `framer-motion`), Tailwind v4, lucide-react `^0.577.0`, Vitest, Biome, pnpm.

## Global Constraints

- **No new/renamed/deleted message keys.** `src/__tests__/i18n-validate.test.ts` enforces EN/PT key parity — reuse existing `trackA` keys only. Copy in `en.json`/`pt.json` is NOT edited in this plan.
- **Owner PT-pass gate:** any *new or reworded* user-facing string is deferred to the owner (per launch backlog). This plan introduces none. One optional reframe is flagged at the end, NOT implemented.
- **Preserve all analytics:** every `trackNextStepsActionClicked(action, "committed")` call must survive with its exact `action` arg (`read`, `reading_plan`, `community`, `learn`, `cards`) plus the `ShareButtons` (`utmCampaign="testimony"`) and `SaveStoryImageButton` (`slug="testimony"`) wiring.
- **Read Next 16 docs before coding** (`node_modules/next/dist/docs/`) — this repo runs a Next.js with breaking changes vs. training data. Relevant here only if touching `next/image`; this plan deliberately keeps the existing `<img>` pattern (`noImgElement` is off in `biome.json`).
- **Gates before commit:** `pnpm lint && pnpm test && npx tsc --noEmit` must pass (also runs on pre-push).
- **Zero-shift rule / CLS:** the page currently measures CLS ~0 (client shell reserved in `client.tsx:46`). The redesign must not regress it — the inline story image is `loading="lazy"` with a reserved aspect box.
- **Emil motion note:** animate the two bands as groups, not six cards in sequence. The old `stagger(i)` with `0.2s` increments made the page *feel* longer; grouped reveal is the only motion change and it is subtractive.

---

## File Structure

- **Modify (full render rewrite):** `src/components/next-steps/track-committed.tsx` — the only code file. `TrackCommittedProps` / `TrackCommittedMessages` interfaces stay identical (same keys consumed), so `client.tsx` needs no change.
- **Unchanged, depended upon:** `src/components/next-steps/band-header.tsx` (`BandHeader`, props `label`, `tone: "gold" | "dim"`), `src/components/ui/button.tsx` (`Button` variants `gold|ghost`, sizes `sm`; `ButtonArrow`), `src/components/share-buttons.tsx` (`ShareButtons`), `src/components/blog/save-story-image-button.tsx` (`SaveStoryImageButton`), `@/lib/discipleship-analytics` (`trackNextStepsActionClicked`), `@/lib/motion` (`EASE_OUT_STRONG`), `@/lib/journey-storage` (`readJourney`).
- **Graphic source (no change):** `src/app/[locale]/(content)/testimony/story/route.tsx` serves a 1080×1920 PNG at `/{locale}/testimony/story`; the new inline preview points at it.

---

## Task 1: Rebuild the committed-track render

**Files:**
- Modify: `src/components/next-steps/track-committed.tsx` (replace the JSX returned from the component; keep imports + the `isFresh` effect)
- Verify (existing, do not edit): `src/__tests__/i18n-validate.test.ts`

**Interfaces:**
- Consumes: `TrackCommittedProps { messages: TrackCommittedMessages; shareMessages: {...}; locale: Locale }` — **unchanged**. `BandHeader({ label, tone })`, `Button({ variant, size })`, `ButtonArrow()`, `ShareButtons({ messages, locale, sharePath, utmCampaign, copyText })`, `SaveStoryImageButton({ locale, slug, label, hint, copyLabel, copiedLabel, storyPath, stickerPath })`.
- Produces: nothing new. Same component export `TrackCommitted`.

### Target structure (what the reader sees)

```
[h1 opener]  isFresh ? welcome : welcomeReturn      (gold, unchanged)
[whatHappened paragraphs + scripture blockquote]    (unchanged — the emotional payload)

── Today ──────────────────────────────  (BandHeader gold)
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ 📖 Read (PRIMARY gold card)  ┃  readBody + [Read John 1] [Start the 7-day plan]
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ♥ Pray — prayPrompt blockquote                    (inline, no card)
  ⇢ 👥 communityLinkLabel  →  (quiet warm-secondary link, church search)

── As you grow ───────────────────────  (BandHeader dim, reuse bands.grow)
  quiet rows (icon + label + →, no bodies):
    🧭 learnLinkLabel        → /{locale}/learn
    🖨 streetLinkLabel       → /{locale}/cards
  Share block:
    shareHeading
    <ShareButtons …/>                                (unchanged wiring)
    [inline lazy story graphic preview]              (NEW: the one real visual)
    <SaveStoryImageButton …/>                        (unchanged wiring)
```

Notes on what changes vs. today:
- The six equal gold cards collapse to **one** loud gold card (Read). Pray becomes an inline block. Community becomes a quiet secondary link. Learn + Street become quiet rows. Share keeps its block (it owns the graphic).
- `bands.today` and `bands.grow` are rendered; `bands.week` is no longer rendered (key stays in JSON — do not delete it).
- Card *bodies* `prayBody`, `communityBody`, `learnBody`, `streetBody` stop rendering (keys stay in JSON). `readBody` stays (it names John + the plan). `whatHappened`, `prayPrompt`, `shareHeading`, `shareMessage`, story* strings stay.
- Animation: opener h1 + paragraphs keep a gentle rise; the two bands each animate as **one** group (`whileInView` or a single delayed reveal), replacing `stagger(i)`.

- [ ] **Step 1: Read the current file and the two unchanged collaborators**

Run: open and read
- `src/components/next-steps/track-committed.tsx` (current full file)
- `src/components/next-steps/band-header.tsx` (confirm `BandHeader` prop names `label`, `tone`)
- `src/components/ui/button.tsx` (confirm `Button`, `ButtonArrow` exports and `variant`/`size` values)

Expected: confirm `BandHeader` accepts `tone="gold" | "dim"`, `Button` accepts `variant="gold" | "ghost"` and `size="sm"`, `ButtonArrow` is a zero-prop component. If any differ, adjust the code in Step 3 to match.

- [ ] **Step 2: Confirm the story-graphic route responds**

Run:
```bash
pnpm build && pnpm start &
sleep 4
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/en/testimony/story
```
Expected: `200 image/png`. (If non-200, the inline preview `<img>` still degrades to broken-image; `SaveStoryImageButton` already handles fetch failure. Do not block on this — but note it.) Stop the server afterward.

- [ ] **Step 3: Replace the component's returned JSX**

Edit `src/components/next-steps/track-committed.tsx`. **Keep** the top-of-file imports, the `FRESH_WINDOW_MS` const, both interfaces, and the `isFresh` `useState`/`useEffect` block exactly as they are. **Replace** the `const stagger = ...` line and the entire `return ( … )` with the following. Add the lucide import to the existing import block.

Add this import near the other imports (top of file):
```tsx
import { BookOpen, HeartHandshake, Users, Compass, Printer } from "lucide-react";
```

Replace `const stagger = (i: number) => ({ duration: 0.8, delay: 0.3 + i * 0.2 });` with:
```tsx
// One gentle rise per paragraph, capped so the emotional opener still
// reads in sequence but never runs longer than ~1s total.
const para = (i: number) => ({ duration: 0.7, delay: 0.15 + Math.min(i, 3) * 0.12, ease: EASE_OUT_STRONG });
// Each band reveals as a single group (not six staggered cards) — the
// page feels shorter and the hierarchy reads instantly.
const band = { duration: 0.7, ease: EASE_OUT_STRONG };
```

Replace the whole `return ( … );` with:
```tsx
  return (
    <>
      <m.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE_OUT_STRONG }}
        className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {isFresh ? messages.welcome : messages.welcomeReturn}
      </m.h1>

      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => {
          const isScripture = /^["“]/.test(p);
          return isScripture ? (
            <m.blockquote
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={para(i)}
              className="border-l border-[#D4A843]/30 pl-4 text-left"
            >
              <p className="text-[15px] italic leading-[1.85] text-white/70 sm:text-base">{p}</p>
            </m.blockquote>
          ) : (
            <m.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={para(i)}
              className="text-[15px] leading-[1.85] text-white/60 sm:text-base"
            >
              {p}
            </m.p>
          );
        })}
      </div>

      {/* ── TODAY: one primary action, one quiet secondary ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: 0.15 + Math.min(paragraphs.length, 3) * 0.12 + 0.1 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.today} tone="gold" />

        {/* PRIMARY — Read. The one loud card on the page. */}
        <div className="rounded-2xl border border-[#D4A843]/40 bg-[#D4A843]/[0.05] p-6 shadow-[0_0_40px_-12px_rgba(212,168,67,0.25)]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-[#D4A843]" aria-hidden="true" />
            <h3 className="text-base font-semibold tracking-wide text-[#D4A843]">{messages.readHeading}</h3>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">{messages.readBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={messages.readLink} target="_blank" rel="noopener noreferrer" onClick={() => trackNextStepsActionClicked("read", "committed")}>
              <Button variant="gold" size="sm">
                {messages.readLinkLabel}
                <ButtonArrow />
              </Button>
            </a>
            <Link href={`/${locale}/reading-plan`} onClick={() => trackNextStepsActionClicked("reading_plan", "committed")}>
              <Button variant="ghost" size="sm">
                {messages.readPlanLabel}
                <ButtonArrow />
              </Button>
            </Link>
          </div>
        </div>

        {/* Pray — inline, quiet. */}
        <div className="mt-6 pl-1">
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="size-4 text-[#D4A843]/70" aria-hidden="true" />
            <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]/90">{messages.prayHeading}</h3>
          </div>
          <blockquote className="mt-2 border-l border-[#D4A843]/30 pl-4 text-sm italic leading-relaxed text-white/60">
            {messages.prayPrompt}
          </blockquote>
        </div>

        {/* Warm secondary — a person/community, not a loud card. */}
        <a
          href={messages.communityLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackNextStepsActionClicked("community", "committed")}
          className="mt-5 flex min-h-[44px] items-center gap-3 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#D4A843]/25 hover:text-[#D4A843]/80"
        >
          <Users className="size-4 shrink-0 text-white/50" aria-hidden="true" />
          <span className="flex-1">{messages.communityLinkLabel}</span>
          <span aria-hidden="true" className="text-white/40">&rarr;</span>
        </a>
      </m.div>

      {/* ── AS YOU GROW: quiet list + the one real graphic ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: 0.15 + Math.min(paragraphs.length, 3) * 0.12 + 0.25 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.grow} tone="dim" />

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          <Link
            href={`/${locale}/learn`}
            onClick={() => trackNextStepsActionClicked("learn", "committed")}
            className="flex min-h-[52px] items-center gap-3 px-1 py-3 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <Compass className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.learnLinkLabel}</span>
            <span aria-hidden="true" className="text-white/30">&rarr;</span>
          </Link>
          <Link
            href={`/${locale}/cards`}
            onClick={() => trackNextStepsActionClicked("cards", "committed")}
            className="flex min-h-[52px] items-center gap-3 px-1 py-3 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <Printer className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.streetLinkLabel}</span>
            <span aria-hidden="true" className="text-white/30">&rarr;</span>
          </Link>
        </div>

        {/* Share block — owns the one graphic on the page. */}
        <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">
          <ShareButtons
            messages={{ ...shareMessages, prompt: messages.shareHeading, whatsappMessage: messages.shareMessage, telegramMessage: messages.shareMessage }}
            locale={locale}
            sharePath={`/${locale}/test`}
            utmCampaign="testimony"
            copyText={messages.shareMessage}
          />
          <div className="mt-8 text-center">
            {/* The testimony story graphic, previewed inline (9:16, lazy so it
                never competes for LCP). Reserved aspect box keeps CLS at 0. */}
            <div className="mx-auto mb-4 w-full max-w-[190px] overflow-hidden rounded-xl border border-white/10">
              <img
                src={`/${locale}/testimony/story`}
                alt=""
                loading="lazy"
                width={1080}
                height={1920}
                className="block h-auto w-full"
              />
            </div>
            <SaveStoryImageButton
              locale={locale}
              slug="testimony"
              label={messages.storyButton}
              hint={messages.storyHint}
              copyLabel={messages.storyCopyButton}
              copiedLabel={messages.storyCopied}
              storyPath={`/${locale}/testimony/story`}
              stickerPath={`/${locale}/test`}
            />
          </div>
        </div>
      </m.div>
    </>
  );
```

- [ ] **Step 4: Typecheck + lint the changed file**

Run:
```bash
npx tsc --noEmit && pnpm lint
```
Expected: PASS, 0 errors. (Watch for: unused import if any lucide icon isn't used — the five imported are all used: `BookOpen`, `HeartHandshake`, `Users`, `Compass`, `Printer`. Biome a11y: decorative icons carry `aria-hidden="true"`; the `<img>` has `alt=""` which Biome's `useAltText` accepts as intentional-decorative.)

- [ ] **Step 5: Run the suite (key-parity guard must stay green)**

Run:
```bash
pnpm test
```
Expected: all pass, including `src/__tests__/i18n-validate.test.ts` (no keys were added or removed, so parity is intact).

- [ ] **Step 6: Visual check — both journey states, both locales**

Run `pnpm build && pnpm start`, then seed the journey in-browser and screenshot. In DevTools console on `http://localhost:3000/en` set a committed journey, e.g.:
```js
localStorage.setItem("journey", JSON.stringify({ stage: "committed", respondedAt: Date.now() }));
```
(Confirm the exact storage key/shape from `src/lib/journey-storage.ts` — use `readJourney`'s expected shape.) Navigate to `/en/next-steps` and `/pt/next-steps`.

Verify by eye:
- Exactly one loud gold card (Read). Pray inline. Community is a quiet row. "As you grow" is a light divided list of two rows. Story graphic previews above the save button.
- No layout jump as the lazy image loads (reserved box holds height).
- `thinking` track unchanged: set `stage: "thinking"` and confirm it renders as before.

- [ ] **Step 7: CLS sanity (must stay ~0)**

With the prod server running, load `/en/next-steps` (committed) and read the layout-shift score (Playwright Layout Instability API, or PerformanceObserver in console):
```js
let cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true }); setTimeout(() => console.log("CLS", cls), 3000);
```
Expected: CLS < 0.05. If the lazy image shifts layout, confirm the `max-w-[190px]` aspect box (`width={1080} height={1920}`) is reserving height — the intrinsic ratio should hold it.

- [ ] **Step 8: Commit**

```bash
git add src/components/next-steps/track-committed.tsx
git commit -m "$(cat <<'EOF'
feat: declutter committed next-steps track — one primary CTA + quiet list + story graphic

Six equal gold cards across three bands collapsed to: one loud Read card,
inline Pray, a quiet community secondary, and an "as you grow" list (learn,
cards, share). Promotes the testimony story graphic to an inline preview.
Bands reveal as groups instead of six staggered cards (perceived-shorter).
No message keys added/removed; thinking track untouched.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx
EOF
)"
```

---

## Owner PT-pass follow-ups (NOT implemented here — flag only)

These are copy/UX judgment calls gated on the owner per the launch backlog. Do **not** change strings in this plan:

1. **Warm-secondary reframe (optional):** `communityLinkLabel` today is "Search for a church" / PT equivalent. A just-converted person's strongest need is a *human*, not a directory. Consider reframing to "Find someone to walk with you" (+ PT). Needs owner PT pass; would be a keep-key value edit in both `en.json`/`pt.json`.
2. **Unused-body cleanup (optional):** `prayBody`, `communityBody`, `learnBody`, `streetBody` are no longer rendered. Leaving them is harmless (parity holds). If the owner wants them gone, remove from both locales in one pass so `i18n-validate` stays green — but that's cleanup, not required.

---

## Self-Review

**1. Spec coverage** (grill decisions → tasks):
- Q2 "1 primary + rest quiet" → Task 1: single gold Read card; community/learn/cards/share demoted. ✓
- Q3 progressive weight → TODAY full-strength, "As you grow" light list. ✓
- Q4 graphics → lucide icons on every action + promoted inline story graphic. ✓ (hero art rejected, per decision)
- Q5 copy trim → card bodies stop rendering; opener + scripture protected. ✓ (no string edits — dodges owner gate)
- Q6 thinking track untouched → not modified. ✓
- Emil stagger fix → grouped band reveal replaces `stagger(i)`. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases". Full JSX given. Story-route failure path noted (Step 2) and already handled by `SaveStoryImageButton`. ✓

**3. Type consistency:** `TrackCommittedProps`/`TrackCommittedMessages` unchanged → `client.tsx` untouched. All consumed keys (`readHeading`, `readBody`, `readLink`, `readLinkLabel`, `readPlanLabel`, `prayHeading`, `prayPrompt`, `communityLink`, `communityLinkLabel`, `learnLinkLabel`, `streetLinkLabel`, `shareHeading`, `shareMessage`, `storyButton`, `storyHint`, `storyCopyButton`, `storyCopied`, `bands.today`, `bands.grow`) exist in `trackA` (verified in en.json). `bands.week` intentionally unused, not deleted. lucide icons `BookOpen, HeartHandshake, Users, Compass, Printer` all exist in `lucide-react@0.577`. Analytics actions (`read`, `reading_plan`, `community`, `learn`, `cards`) unchanged. ✓
