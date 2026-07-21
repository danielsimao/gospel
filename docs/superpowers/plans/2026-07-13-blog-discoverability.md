# Blog Discoverability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home→blog paths for the two audiences that need them — a single latest-post card at the bottom of the homepage (auto-hidden when stale) and a stage-gated Blog link in the TopBar for committed/thinking users — without adding any surface that competes with the visitor funnel.

**Architecture:** The home page (server) resolves the newest published post and passes it to HomeShell; a small client `LatestPostCard` renders it after the journey-stage branches and self-hides when the post is >60 days old (client-side date check — build-time would freeze). TopBar gains an optional Blog link rendered only for committed/thinking stages.

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript, framer-motion via LazyMotion strict (`m` only), Tailwind v4, pnpm.

## Global Constraints

- Modified Next.js — consult `node_modules/next/dist/docs/` if in doubt (AGENTS.md).
- **Funnel rule:** the visitor TopBar must NOT gain a Blog link; the card sits BELOW all stage CTAs (last child before the section closes).
- Design language: house ghost card `rounded-xl border border-white/[0.06] bg-white/[0.015] p-5`, gold hover `hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03]`; eyebrow `font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70`.
- Zero-content-shift: the card is server-data-driven (same on SSR + client — no shift); the TopBar link is stage-gated (appears post-hydration like the existing stage links — established pattern).
- Bilingual parity for new keys; PT European Portuguese; surgical JSON edits with `python3 json.load` validation; flag PT for owner gate.
- Analytics via the house wrappers.
- Gates: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green before commit.
- Commit trailers:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: Latest-post card + stage-gated TopBar Blog link

**Files:**
- Create: `src/components/home/latest-post-card.tsx`
- Modify: `src/components/home-shell.tsx` (prop + render at section bottom)
- Modify: `src/app/[locale]/(content)/page.tsx` (resolve latest post, pass down)
- Modify: `src/components/shared/top-bar.tsx` (stage-gated Blog link)
- Modify: `src/app/[locale]/(content)/layout.tsx` (pass blog label to TopBar)
- Modify: `src/lib/eternity-analytics.ts` (two events — read the file first, match its pattern)
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`home.blogCard.eyebrow`)
- Modify: `src/lib/types.ts` (`HomeMessages` gains `blogCard: { eyebrow: string }`)

**Interfaces:**
- Consumes: `getPublishedPosts`, `getPostContent`, `getPostLocales` from `@/content/blog/posts`; `useJourney` in top-bar (already there).
- Produces: `HomeShellProps.latestPost?: { slug: string; title: string; hook: string; datePublished: string; localeAvailable: boolean } | null`; `<LatestPostCard locale post eyebrow />`; `TopBarProps.blogLabel: string`.

- [ ] **Step 1: Analytics events** — in `src/lib/eternity-analytics.ts`, matching the existing `trackTopBar*`/`trackHome*` function style exactly (read the file), add:

```ts
export function trackHomeBlogCardClicked(slug: string) {
  safeCapture("home_blog_card_clicked", { slug });
}

export function trackTopBarBlogClicked() {
  safeCapture("top_bar_blog_clicked", {});
}
```

(If the file's existing zero-arg trackers omit the empty properties object, match that instead.)

- [ ] **Step 2: Message keys (surgical, both locales)** — inside `home`, next to `secondaryLink` (grep first):
  - EN: `"blogCard": { "eyebrow": "From the blog" },`
  - PT: `"blogCard": { "eyebrow": "Do blog" },`
  And in `src/lib/types.ts`, `HomeMessages` gains `blogCard: { eyebrow: string };`.

- [ ] **Step 3: Create `src/components/home/latest-post-card.tsx`**

```tsx
"use client";

import Link from "next/link";
import { trackHomeBlogCardClicked } from "@/lib/eternity-analytics";

const MAX_AGE_DAYS = 60;

interface LatestPostCardProps {
  locale: string;
  eyebrow: string;
  post: {
    slug: string;
    title: string;
    hook: string;
    datePublished: string;
    /** False when the post has no content in this locale — link goes to /en. */
    localeAvailable: boolean;
  };
}

/**
 * Single latest-post teaser at the bottom of the homepage. Self-hides when
 * the newest post is older than 60 days — a visible stale blog on the front
 * door reads as abandonment; the footer link keeps the blog reachable.
 * Client-side age check on purpose: a build-time check freezes at deploy.
 */
export function LatestPostCard({ locale, eyebrow, post }: LatestPostCardProps) {
  const ageDays = (Date.now() - new Date(`${post.datePublished}T00:00:00Z`).getTime()) / 86_400_000;
  if (ageDays > MAX_AGE_DAYS) return null;

  const href = post.localeAvailable ? `/${locale}/blog/${post.slug}` : `/en/blog/${post.slug}`;

  return (
    <div className="mt-14 w-full max-w-md">
      <p className="font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">{eyebrow}</p>
      <Link
        href={href}
        onClick={() => trackHomeBlogCardClicked(post.slug)}
        className="group mt-3 block rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white/85 group-hover:text-white/95">{post.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/55">{post.hook}</p>
          </div>
          <span aria-hidden="true" className="mt-0.5 text-white/40 transition-transform group-hover:translate-x-1">
            →
          </span>
        </div>
      </Link>
    </div>
  );
}
```

Hydration note: the age check uses `Date.now()` in render — SSR and client values differ by milliseconds, but the RESULT (`> 60 days`) only differs in a sub-second race at the exact expiry boundary; React would reconcile silently. Acceptable; do NOT convert to an effect (would flash).

- [ ] **Step 4: Resolve + pass in `src/app/[locale]/(content)/page.tsx`**

Read the file first. After the existing message loading, add:

```ts
  const posts = getPublishedPosts();
  const latest = posts[0] ?? null;
  const latestContent = latest
    ? (getPostContent(latest, locale as Locale) ?? getPostContent(latest, "en"))
    : null;
  const latestPost =
    latest && latestContent
      ? {
          slug: latest.slug,
          title: latestContent.title,
          hook: latestContent.hook,
          datePublished: latest.datePublished,
          localeAvailable: getPostLocales(latest).includes(locale as Locale),
        }
      : null;
```

Import `getPublishedPosts, getPostContent, getPostLocales` from `@/content/blog/posts`. Pass `latestPost={latestPost}` to `<HomeShell>`.

- [ ] **Step 5: Render in `src/components/home-shell.tsx`**

Add to `HomeShellProps`: `latestPost?: { slug: string; title: string; hook: string; datePublished: string; localeAvailable: boolean } | null;` and destructure. Import `LatestPostCard` from `@/components/home/latest-post-card`. Immediately BEFORE the closing `</div>` of the section's inner content div (after the `journey.stage === "visitor"` branch closes — the card renders for EVERY stage, below all stage CTAs):

```tsx
          {latestPost && (
            <LatestPostCard locale={locale} eyebrow={home.blogCard.eyebrow} post={latestPost} />
          )}
```

- [ ] **Step 6: TopBar Blog link** — in `src/components/shared/top-bar.tsx`:

Add `blogLabel: string;` to `TopBarProps` and destructure. Import `trackTopBarBlogClicked` (extend the existing eternity-analytics import). After the `stage === "pre-reading"` link and BEFORE the Learn link, add:

```tsx
        {(journey.stage === "committed" || journey.stage === "thinking") && (
          <Link
            href={`/${locale}/blog`}
            onClick={() => trackTopBarBlogClicked()}
            className="text-white/50 transition-colors hover:text-white/70"
          >
            {blogLabel}
          </Link>
        )}
```

In `src/app/[locale]/(content)/layout.tsx`, pass `blogLabel={data.blog?.label ?? "Blog"}` to `<TopBar>` (match how `learnLabel` is passed at line ~27).

- [ ] **Step 7: Gates** — all green.
- [ ] **Step 8: Dev check** — `pnpm dev`:
  - `curl -s http://localhost:3000/en | grep -c "From the blog"` → 1 (card in SSR HTML — server-data-driven).
  - `curl -s http://localhost:3000/pt | grep -c "Do blog"` → 1; the PT card links to `/en/blog/dont-die-movement` (EN-only post).
  - Visitor top bar: no Blog link in `curl` output of home (stage links are client-side — verify no crash; interactive stage check is the reviewer's).
  Kill server.
- [ ] **Step 9: Commit**

```bash
git add src/components/home/latest-post-card.tsx src/components/home-shell.tsx "src/app/[locale]/(content)/page.tsx" src/components/shared/top-bar.tsx "src/app/[locale]/(content)/layout.tsx" src/lib/eternity-analytics.ts src/lib/types.ts src/messages/en.json src/messages/pt.json
git commit -m "feat: blog discoverable from home — latest-post card + stage-gated top-bar link

One quiet card at the bottom of the homepage (below every stage's CTA —
never competing with the funnel) that self-hides when the newest post is
older than 60 days, so a stale blog never shows on the front door. Blog
joins the top bar only for committed/thinking users; the visitor bar
stays a clean funnel. No drawer — five pages don't need app chrome.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 2: Ship + verify

- [ ] Push; wait Ready; `curl -s https://www.ifyoudiedtoday.com/en | grep -c "From the blog"` → 1; home 200 both locales; card links resolve 200.
