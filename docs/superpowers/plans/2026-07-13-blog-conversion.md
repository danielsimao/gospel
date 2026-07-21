# Blog Conversion Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert cold social blog traffic into test-takers: a personal-turn block ends every post (Living Waters pivot — story → "how about you?"), a sticky question bar catches mid-scroll exits, UTM-instrumented share surfaces make per-post funnels measurable in PostHog.

**Architecture:** `personalTurn` becomes a required typed field on every post's content; a client `PersonalTurn` component renders it with a stage-aware CTA (mirrors TopicNav's decision logic). A client `BlogStickyBar` shows the site's core question to visitor-stage readers after 40% scroll, hiding when the turn block scrolls into view and never competing with the consent banner. A `blog-analytics.ts` wrapper (house pattern) emits viewed/scroll-quartile/cta-clicked events. ShareButtons gains an optional `utmCampaign` prop; a copy-link button beside Save-story copies a pre-UTM'd URL for the IG link sticker.

**Tech Stack:** Next.js 16.2.1 App Router, React 19, TypeScript, framer-motion 12 (`m` + LazyMotion strict — NEVER import `motion`), Tailwind v4, Vitest, pnpm.

## Global Constraints

- Modified Next.js — consult `node_modules/next/dist/docs/` if any API is in doubt (AGENTS.md).
- **Living Waters:** no decisionism. The personal turn asks a question; it never declares an outcome.
- **Design language:** red = judgment, gold `#D4A843` = grace; eyebrow = `font-mono text-[10px] uppercase tracking-[2px]`; house ease `EASE_OUT_STRONG` from `@/lib/motion`.
- **Zero-content-shift:** journey-stage UI renders nothing on SSR/first paint; the sticky bar and stage-aware CTAs appear only post-`ready` (below fold / fixed-position, so no shift).
- **framer-motion:** only `m` + `AnimatePresence` from "framer-motion".
- **Bilingual parity:** every new `blog.*` message key lands in BOTH `src/messages/en.json` and `src/messages/pt.json` (blog.test.ts enforces key-set equality). PT = European Portuguese, tu-form. Flag all new PT strings for the owner copy gate in reports.
- **JSON edits surgical** — grep-first, validate with `python3 -c "import json; json.load(open(...))"` after each file; never reserialize.
- Consent banner is bottom-fixed `z-50`; the sticky bar must not stack on it (gate on consent answered, `z-40`).
- Analytics: all capture goes through `capture` from `@/lib/posthog` (already consent-gated no-op) — follow the wrapper pattern in `src/lib/learn-analytics.ts`.
- Gates per task: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — all green before commit.
- Commit messages end with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: Blog analytics wrapper + view/scroll tracker

**Files:**
- Create: `src/lib/blog-analytics.ts`
- Create: `src/components/blog/blog-view-tracker.tsx`
- Modify: `src/components/blog/blog-post-page.tsx` (mount the tracker)

**Interfaces:**
- Produces: `trackBlogPostViewed(slug: string, locale: string)`, `trackBlogScrollDepth(slug: string, quartile: 25 | 50 | 75 | 100)`, `trackBlogCtaClicked(slug: string, position: "sticky" | "personal_turn", stage: string)`, `trackStoryLinkCopied(slug: string)` — all from `@/lib/blog-analytics`. Later tasks call `trackBlogCtaClicked`/`trackStoryLinkCopied`.
- Produces: `<BlogViewTracker slug locale />` client component (renders null).

- [ ] **Step 1: Create `src/lib/blog-analytics.ts`**

```ts
import { capture as safeCapture } from "@/lib/posthog";

export function trackBlogPostViewed(slug: string, locale: string) {
  safeCapture("blog_post_viewed", { slug, locale });
}

export function trackBlogScrollDepth(slug: string, quartile: 25 | 50 | 75 | 100) {
  safeCapture("blog_scroll_depth", { slug, quartile });
}

export function trackBlogCtaClicked(
  slug: string,
  position: "sticky" | "personal_turn",
  stage: string,
) {
  safeCapture("blog_cta_clicked", { slug, position, stage });
}

export function trackStoryLinkCopied(slug: string) {
  safeCapture("blog_story_link_copied", { slug });
}
```

- [ ] **Step 2: Create `src/components/blog/blog-view-tracker.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { trackBlogPostViewed, trackBlogScrollDepth } from "@/lib/blog-analytics";

const QUARTILES = [25, 50, 75, 100] as const;

/** Fires blog_post_viewed on mount and blog_scroll_depth once per quartile. */
export function BlogViewTracker({ slug, locale }: { slug: string; locale: string }) {
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    trackBlogPostViewed(slug, locale);

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
      for (const q of QUARTILES) {
        if (pct >= q && !fired.current.has(q)) {
          fired.current.add(q);
          trackBlogScrollDepth(slug, q);
        }
      }
      if (fired.current.size === QUARTILES.length) {
        window.removeEventListener("scroll", onScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug, locale]);

  return null;
}
```

- [ ] **Step 3: Mount in `src/components/blog/blog-post-page.tsx`**

Add import `import { BlogViewTracker } from "./blog-view-tracker";` and render `<BlogViewTracker slug={slug} locale={locale} />` as the first child inside `<article>`.

- [ ] **Step 4: Gates** — `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green.
- [ ] **Step 5: Commit**

```bash
git add src/lib/blog-analytics.ts src/components/blog/blog-view-tracker.tsx src/components/blog/blog-post-page.tsx
git commit -m "feat: blog analytics — viewed, scroll quartiles, CTA events

House wrapper over the consent-gated PostHog client, plus a null-render
tracker mounted on every post. Position-tagged CTA events land in later
commits with the components that fire them.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 2: Personal-turn block (typed, required, stage-aware)

**Files:**
- Modify: `src/content/blog/types.ts` (add `personalTurn` to `BlogPostContent`)
- Modify: `src/content/blog/posts.ts` (author the seed post's turn)
- Create: `src/components/blog/personal-turn.tsx`
- Modify: `src/components/blog/blog-post-page.tsx` (replace the generic end-CTA block)
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`blog` namespace: remove `ctaHeading`, add `readingCtaButton`)
- Test: `src/__tests__/blog.test.ts` (turn-presence invariant)

**Interfaces:**
- Consumes: `trackBlogCtaClicked` from Task 1; `useJourney`/`TOTAL_READING_DAYS` from `@/lib/use-journey`.
- Produces: `BlogPostContent.personalTurn: { setup: string; question: string }` (required); `<PersonalTurn slug locale setup question ctaButton readingCtaButton />`; the component's root carries `id="personal-turn"` — Task 3's sticky bar observes this exact id.

- [ ] **Step 1: Write the failing test** — append to `src/__tests__/blog.test.ts` (read the file first; match its existing import style for POSTS/helpers):

```ts
it("every locale's content has a personal turn with setup and question", () => {
  for (const post of getPublishedPosts()) {
    for (const locale of getPostLocales(post)) {
      const content = getPostContent(post, locale)!;
      expect(content.personalTurn.setup.length).toBeGreaterThan(20);
      expect(content.personalTurn.question.length).toBeGreaterThan(10);
      expect(content.personalTurn.question).toMatch(/\?/);
    }
  }
});
```

- [ ] **Step 2: Run it, watch it fail** — `pnpm test -- blog` → FAIL (`personalTurn` undefined).

- [ ] **Step 3: Extend the type** — in `src/content/blog/types.ts`, inside `BlogPostContent` after `sections`:

```ts
  /**
   * The Living Waters pivot that ends every post: the story was about them —
   * this is about you. Required: a post without the turn is commentary.
   */
  personalTurn: {
    /** 1–2 sentences that swing the story onto the reader. */
    setup: string;
    /** The unresolved personal question, rendered large. Must end in "?". */
    question: string;
  };
```

- [ ] **Step 4: Author the seed post's turn** — in `src/content/blog/posts.ts`, inside the `en` content object after the `sections` array (before `sources`):

```ts
        personalTurn: {
          setup:
            "Bryan Johnson will find out one day whether the protocol worked. So will you. The difference is that he is at least preparing for the exam.",
          question: "If it happened tonight — would you be ready?",
        },
```

- [ ] **Step 5: Run the test again** — `pnpm test -- blog` → PASS.

- [ ] **Step 6: Message keys (surgical, both locales)** — in the `blog` namespace:
  - DELETE `"ctaHeading": …` line (EN: `"If you died today — are you ready?"`; PT equivalent) — the personal turn replaces it.
  - KEEP `"ctaButton"` (reused as the turn's test CTA label).
  - ADD after `"ctaButton"`:
    - EN: `"readingCtaButton": "Continue the reading plan",`
    - PT: `"readingCtaButton": "Continua o plano de leitura",`

- [ ] **Step 7: Create `src/components/blog/personal-turn.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { useJourney, TOTAL_READING_DAYS } from "@/lib/use-journey";
import { trackBlogCtaClicked } from "@/lib/blog-analytics";

interface PersonalTurnProps {
  slug: string;
  locale: string;
  setup: string;
  question: string;
  ctaButton: string;
  readingCtaButton: string;
}

/**
 * The Living Waters pivot that ends every post: the story was about them —
 * this is about you. CTA is stage-aware (same decision table as TopicNav):
 * not tested → the test; tested but reading incomplete → reading plan;
 * fully walked → the question stands on its own.
 */
export function PersonalTurn({ slug, locale, setup, question, ctaButton, readingCtaButton }: PersonalTurnProps) {
  const { stage, readingDone, ready } = useJourney();
  const testDone = stage !== "visitor";
  const readingComplete = readingDone >= TOTAL_READING_DAYS;

  const cta = !ready
    ? null
    : !testDone
      ? { label: ctaButton, href: `/${locale}/test` }
      : !readingComplete
        ? { label: readingCtaButton, href: `/${locale}/reading-plan` }
        : null;

  return (
    <section id="personal-turn" className="mt-16 border-t border-white/[0.06] pt-10 text-center">
      <p className="mx-auto max-w-md text-[15px] leading-[1.85] text-white/60 sm:text-base">{setup}</p>
      <p className="mx-auto mt-6 max-w-md text-xl font-bold italic leading-snug text-white/90 sm:text-2xl">
        {question}
      </p>
      {/* CTA slot is height-reserved so the stage-aware button appearing
          post-hydration never shifts the references block below. */}
      <div className="mt-8 flex min-h-[52px] items-start justify-center">
        {cta && (
          <Link href={cta.href} onClick={() => trackBlogCtaClicked(slug, "personal_turn", stage)}>
            <Button variant="gold" mist>
              {cta.label}
              <ButtonArrow />
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Wire into `src/components/blog/blog-post-page.tsx`**

  - `BlogChromeMessages`: remove `ctaHeading: string;`, add `readingCtaButton: string;` (keep `ctaButton`).
  - `BlogPostPageProps`/component: no new props — `content.personalTurn` arrives via `content`.
  - REPLACE the final generic CTA block:

```tsx
        <div className="mt-12 text-center">
          <p className="text-sm text-white/60">{messages.ctaHeading}</p>
          <Link href={`/${locale}/test`} className="mt-3 inline-block">
            <Button variant="gold" mist>
              {messages.ctaButton}
              <ButtonArrow />
            </Button>
          </Link>
        </div>
```

with:

```tsx
        <PersonalTurn
          slug={slug}
          locale={locale}
          setup={content.personalTurn.setup}
          question={content.personalTurn.question}
          ctaButton={messages.ctaButton}
          readingCtaButton={messages.readingCtaButton}
        />
```

  - Move this block so the order is: sections → **PersonalTurn** → References (`sources`) → SaveStoryImageButton. (The turn is the article's climax; references and tooling are footer matter. Currently references sit above the CTA — reorder deliberately.)
  - Add import `import { PersonalTurn } from "./personal-turn";`. If `Button`/`ButtonArrow`/`Link` become unused in this file after the swap, remove those imports (lint enforces).

- [ ] **Step 9: Gates** — all green (blog.test.ts parity + new invariant).
- [ ] **Step 10: Dev check** — `pnpm dev`; `curl -s http://localhost:3000/en/blog/dont-die-movement | grep -c "personal-turn"` ≥ 1; page renders setup + question; references now below the turn. Kill server.
- [ ] **Step 11: Commit**

```bash
git add src/content/blog/types.ts src/content/blog/posts.ts src/components/blog/personal-turn.tsx src/components/blog/blog-post-page.tsx src/messages/en.json src/messages/pt.json src/__tests__/blog.test.ts
git commit -m "feat: personal-turn block ends every blog post

The Living Waters pivot, typed and required: story → 'how about you?'.
Stage-aware CTA mirrors TopicNav (test → reading plan → question stands
alone). Replaces the generic end CTA; references move below the turn.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 3: Sticky question bar

**Files:**
- Create: `src/components/blog/blog-sticky-bar.tsx`
- Modify: `src/components/blog/blog-post-page.tsx` (mount it)
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`blog.stickyQuestion`, `blog.stickyCta`)

**Interfaces:**
- Consumes: `trackBlogCtaClicked` (Task 1); `#personal-turn` anchor (Task 2); `hasAnsweredConsent`/`subscribeToConsentAnswered` from `@/lib/consent` (verify exact export names in that file first — the consent banner imports them; mirror its usage); `useJourney`; `EASE_OUT_STRONG` from `@/lib/motion`.
- Produces: `<BlogStickyBar slug locale question ctaLabel />`.

Visibility contract (ALL must hold to show): journey `ready && stage === "visitor"` · consent already answered (never stacked on the consent banner) · scrolled past 40% · personal-turn block not in viewport.

- [ ] **Step 1: Message keys (surgical, both locales)** — in `blog` after `"readingCtaButton"`:
  - EN: `"stickyQuestion": "Are you a good person?",` and `"stickyCta": "Find out · 2 min",`
  - PT: `"stickyQuestion": "Tu és uma boa pessoa?",` and `"stickyCta": "Descobre · 2 min",`

- [ ] **Step 2: Create `src/components/blog/blog-sticky-bar.tsx`**

```tsx
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { useJourney } from "@/lib/use-journey";
import { hasAnsweredConsent, subscribeToConsentAnswered } from "@/lib/consent";
import { trackBlogCtaClicked } from "@/lib/blog-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";

interface BlogStickyBarProps {
  slug: string;
  locale: string;
  question: string;
  ctaLabel: string;
}

/**
 * Bottom bar carrying the site's core question for cold blog readers.
 * Shows only for visitor-stage users, only after the consent banner is
 * answered (both are bottom-fixed — never stack), only past 40% scroll,
 * and hides while the personal-turn block is on screen (one ask per
 * viewport).
 */
export function BlogStickyBar({ slug, locale, question, ctaLabel }: BlogStickyBarProps) {
  const { stage, ready } = useJourney();
  const consentAnswered = useSyncExternalStore(
    subscribeToConsentAnswered,
    hasAnsweredConsent,
    () => false,
  );
  const [scrolledEnough, setScrolledEnough] = useState(false);
  const [turnVisible, setTurnVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setScrolledEnough(scrollable > 0 && window.scrollY / scrollable >= 0.4);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const turn = document.getElementById("personal-turn");
    if (!turn) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTurnVisible(entry.isIntersecting),
      { rootMargin: "0px 0px 10% 0px" },
    );
    observer.observe(turn);
    return () => observer.disconnect();
  }, []);

  const visible = ready && stage === "visitor" && consentAnswered && scrolledEnough && !turnVisible;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%", opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#060404]/95 backdrop-blur-sm"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm font-semibold text-white/85">{question}</p>
            <Link
              href={`/${locale}/test`}
              onClick={() => trackBlogCtaClicked(slug, "sticky", stage)}
              className="shrink-0 rounded-lg bg-[#D4A843] px-4 py-2 text-[13px] font-semibold text-[#060404] transition-colors hover:bg-[#e0b854]"
            >
              {ctaLabel}
            </Link>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
```

Note: before writing, open `src/lib/consent.ts` and confirm the exact names `hasAnsweredConsent` and `subscribeToConsentAnswered` (the consent banner at `src/components/shared/consent-banner.tsx` uses them via `useSyncExternalStore` — mirror whatever it does exactly). If the gold-button classes above clash with an existing Button variant that fits (`<Button variant="gold" size="sm">`), prefer the house Button — check `src/components/ui/button.tsx` for a small gold variant and use it if it keeps the bar to one line on a 390px viewport.

- [ ] **Step 3: Mount in `blog-post-page.tsx`** — import and render `<BlogStickyBar slug={slug} locale={locale} question={messages.stickyQuestion} ctaLabel={messages.stickyCta} />` as the LAST child inside `<PageShell>` (after `</article>`); add `stickyQuestion: string; stickyCta: string;` to `BlogChromeMessages`.

- [ ] **Step 4: Gates** — all green.
- [ ] **Step 5: Dev check (Playwright or manual)** — fresh profile on `/en/blog/dont-die-movement`: consent banner first, NO bar; accept consent, scroll to ~50%: bar slides in; scroll to the personal-turn block: bar slides out; localStorage with committed journey record: no bar at any scroll. Kill server.
- [ ] **Step 6: Commit**

```bash
git add src/components/blog/blog-sticky-bar.tsx src/components/blog/blog-post-page.tsx src/messages/en.json src/messages/pt.json
git commit -m "feat: sticky question bar on blog posts

The site's core question — 'Are you a good person?' — follows cold
readers past 40% scroll, so the ~60% who never reach the end still meet
the ask. Visitor-stage only; waits for the consent banner; yields to the
personal-turn block; consent-banner slide motion.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 4: UTM — story copy-link + ShareButtons campaign + blog share row

**Files:**
- Modify: `src/components/blog/save-story-image-button.tsx` (add copy-link button)
- Modify: `src/components/share-buttons.tsx` (optional `utmCampaign` prop)
- Modify: `src/components/blog/blog-post-page.tsx` (share row with campaign)
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`blog.copyLinkButton`, `blog.copyLinkCopied`)

**Interfaces:**
- Consumes: `trackStoryLinkCopied` (Task 1); existing `ShareButtons` + `share` messages namespace.
- Produces: `ShareButtons` accepts `utmCampaign?: string` — when set, every channel's URL gains `?utm_source=<channel>&utm_medium=share&utm_campaign=<utmCampaign>`. Existing callers (no prop) are byte-identical in behavior.

- [ ] **Step 1: Message keys (surgical, both locales)** — in `blog` after `"stickyCta"`:
  - EN: `"copyLinkButton": "Copy link for the sticker",` and `"copyLinkCopied": "Link copied — paste it into your story's link sticker.",`
  - PT: `"copyLinkButton": "Copiar link para o autocolante",` and `"copyLinkCopied": "Link copiado — cola-o no autocolante de link da tua história.",`

- [ ] **Step 2: Extend `ShareButtons`** — in `src/components/share-buttons.tsx`:

Add to props interface: `/** When set, share URLs carry utm_source/<channel>, utm_medium=share, utm_campaign. */ utmCampaign?: string;` and destructure it. Replace `getShareUrl()` with:

```tsx
  function getShareUrl(channel: "whatsapp" | "telegram" | "copy" | "native") {
    const path = sharePath ?? `/${locale}`;
    const base = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
    if (!utmCampaign) return base;
    return `${base}?utm_source=${channel}&utm_medium=share&utm_campaign=${encodeURIComponent(utmCampaign)}`;
  }
```

Update the four call sites: `getShareUrl("whatsapp")`, `getShareUrl("telegram")`, `getShareUrl("copy")`, `getShareUrl("native")`. Nothing else changes.

- [ ] **Step 3: Copy-link button** — in `src/components/blog/save-story-image-button.tsx`:

Add imports: `useState`, `Link2` from lucide-react (verify the icon exists: `grep -r "Link2" node_modules/lucide-react/dynamicIconImports.js` or just use `Copy` which definitely exists — check what the file already has available), and `trackStoryLinkCopied` from `@/lib/blog-analytics`.

Add props: `copyLabel: string; copiedLabel: string;`.

Inside the component:

```tsx
  const [copied, setCopied] = useState(false);

  const copyStickerLink = async () => {
    const url = `${window.location.origin}/${locale}/blog/${slug}?utm_source=ig_story&utm_medium=social&utm_campaign=${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      trackStoryLinkCopied(slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable (non-secure context) — nothing to do
    }
  };
```

Render after the existing hint `<p>`:

```tsx
      <button
        type="button"
        onClick={copyStickerLink}
        className="group mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-[11px] uppercase tracking-[2px] text-white/60 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03] hover:text-[#D4A843]/70"
      >
        <Copy className="size-3.5" />
        {copied ? copiedLabel : copyLabel}
      </button>
```

(Use the `Copy` icon from lucide-react; `Download` is already imported from there, extend that import.)

- [ ] **Step 4: Wire in `blog-post-page.tsx`**
  - Pass the two new props to `<SaveStoryImageButton … copyLabel={messages.copyLinkButton} copiedLabel={messages.copyLinkCopied} />`; add both keys to `BlogChromeMessages`.
  - Add a share row: import `ShareButtons` from `@/components/share-buttons`; the page needs `share` messages — add `shareMessages` to `BlogPostPageProps` (`{ prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string }`), and in `src/app/[locale]/(content)/blog/[slug]/page.tsx` pass `shareMessages={messages.default.share}` to `<BlogPostPage>`. Render between PersonalTurn and References:

```tsx
        <ShareButtons
          messages={shareMessages}
          locale={locale}
          sharePath={`/${locale}/blog/${slug}`}
          utmCampaign={slug}
        />
```

- [ ] **Step 5: Gates** — all green.
- [ ] **Step 6: Dev check** — `/en/blog/dont-die-movement`: copy-sticker button copies `…/en/blog/dont-die-movement?utm_source=ig_story&utm_medium=social&utm_campaign=dont-die-movement`; WhatsApp share URL contains `utm_source=whatsapp&…utm_campaign=dont-die-movement`; homepage ShareButtons (no `utmCampaign`) unchanged — no `?utm` in copied URL. Kill server.
- [ ] **Step 7: Commit**

```bash
git add src/components/blog/save-story-image-button.tsx src/components/share-buttons.tsx src/components/blog/blog-post-page.tsx "src/app/[locale]/(content)/blog/[slug]/page.tsx" src/messages/en.json src/messages/pt.json
git commit -m "feat: UTM-instrumented sharing on blog posts

Copy-link button beside Save-story copies a pre-UTM'd URL for the IG
link sticker (utm_source=ig_story); ShareButtons gains an optional
utmCampaign prop tagging each channel. trackGameStarted already harvests
UTM params, so per-post, per-channel funnels appear in PostHog for free.
Existing ShareButtons callers unchanged.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 5: Blog brand-suffix fix (same bug as learn)

**Files:**
- Modify: `src/app/[locale]/(content)/blog/[slug]/page.tsx:45`
- Modify: `src/app/[locale]/(content)/blog/page.tsx` (same pattern — grep it)

- [ ] **Step 1: Fix** — `grep -rn 'split(" | ")' "src/app/[locale]/(content)/blog"` and replace each `const brand = messages.default.meta.title.split(" | ")[0];` with `const brand = messages.default.topBar.brand;` (identical to commit fac9ae3 for learn; the PR branched before that fix). Leave any `topBar?.brand ?? "Gospel"` breadcrumb-style reads alone.
- [ ] **Step 2: Gates + verify** — build; `grep -o '<title>[^<]*</title>' .next/server/app/en/blog/dont-die-movement.html` → ends `| If You Died Today`.
- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(content)/blog/[slug]/page.tsx" "src/app/[locale]/(content)/blog/page.tsx"
git commit -m "fix: blog title suffix uses the brand, not the homepage tagline

Same bug fixed for learn in fac9ae3 — the blog PR branched before it.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 6: Ship + verify on production

**Files:** none (operational)

- [ ] **Step 1: Push** — `git push origin main`; wait for Vercel Ready.
- [ ] **Step 2: Prod smoke**

```bash
curl -s https://www.ifyoudiedtoday.com/en/blog/dont-die-movement | grep -c "personal-turn"   # ≥1
curl -s https://www.ifyoudiedtoday.com/en/blog/dont-die-movement | grep -o '<title>[^<]*</title>'  # …| If You Died Today
```

- [ ] **Step 3: Prod browser (fresh profile)** — consent banner → accept → scroll: bar slides in with "Are you a good person? · Find out · 2 min"; turn block: bar yields; copy-sticker-link copies UTM'd URL; no console errors. PostHog live events: `blog_post_viewed` + `blog_scroll_depth` appear (with consent granted).
- [ ] **Step 4: Register feel-check on a real phone (owner)** — the bar's whole justification is taste-compatible restraint; if it feels cheap, it's one component to delete. Flag in the report.

---

## Execution order

1 → 2 → 3 → 4 → 5 → 6, strictly serial (2/3/4 all touch `blog-post-page.tsx` and messages).

## Owner copy gate (accumulate in reports)

All new PT strings (Tasks 2, 3, 4) + the EN personal-turn seed copy (Task 2) + EN sticky/copy-link strings.
