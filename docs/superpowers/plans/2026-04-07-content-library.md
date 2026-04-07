# Content Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 5 SEO-optimized topical gospel pages under `/{locale}/learn/[slug]` with scroll-reveal sections, cross-linked in a gospel sequence, funneling to the /test quiz.

**Architecture:** Single dynamic route `[locale]/learn/[slug]` with a shared `TopicPage` template component. All content in i18n JSON. Sections animate in on scroll via IntersectionObserver. Topics are ordered in an array — prev/next navigation derived from array index.

**Tech Stack:** Next.js App Router (dynamic route with generateStaticParams), React, Framer Motion, PostHog analytics, existing i18n pattern

**Spec:** `docs/superpowers/specs/2026-04-07-content-library.md`

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/learn-analytics.ts` | Create | Analytics events for topic pages |
| `src/components/learn/topic-section.tsx` | Create | Single section with scroll-reveal |
| `src/components/learn/topic-nav.tsx` | Create | Prev/next topic navigation |
| `src/components/learn/topic-page.tsx` | Create | Main topic page template (composes section + nav) |
| `src/app/[locale]/learn/[slug]/page.tsx` | Create | Dynamic route, static generation, SEO metadata |
| `src/messages/en.json` | Modify | Add `learn` key with 5 topics (EN content) |
| `src/messages/pt.json` | Modify | Add `learn` key with 5 topics (PT content) |
| `src/components/reading-plan/reading-plan.tsx` | Modify | Add "deeper" link after completion |

---

### Task 1: Analytics Lib

**Files:**
- Create: `src/lib/learn-analytics.ts`

- [ ] **Step 1: Create learn-analytics.ts**

```ts
// src/lib/learn-analytics.ts
import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.warn("[learn-analytics] Capture failed:", error);
  }
}

export function trackTopicPageViewed(slug: string, locale: string) {
  safeCapture("topic_page_viewed", { slug, locale });
}

export function trackTopicSectionReached(slug: string, sectionIndex: number, locale: string) {
  safeCapture("topic_section_reached", { slug, section_index: sectionIndex, locale });
}

export function trackTopicCtaClicked(slug: string, locale: string) {
  safeCapture("topic_cta_clicked", { slug, locale });
}

export function trackTopicNavClicked(slug: string, direction: "next" | "prev", locale: string) {
  safeCapture("topic_nav_clicked", { slug, direction, locale });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/learn-analytics.ts
git commit -m "feat: add learn page analytics events"
```

---

### Task 2: Topic Components

**Files:**
- Create: `src/components/learn/topic-section.tsx`
- Create: `src/components/learn/topic-nav.tsx`
- Create: `src/components/learn/topic-page.tsx`

- [ ] **Step 1: Create topic-section.tsx**

```tsx
// src/components/learn/topic-section.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { trackTopicSectionReached } from "@/lib/learn-analytics";

interface TopicSectionProps {
  heading: string;
  body: string;
  scripture: string;
  scriptureRef: string;
  index: number;
  slug: string;
  locale: string;
}

export function TopicSection({ heading, body, scripture, scriptureRef, index, slug, locale }: TopicSectionProps) {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          trackTopicSectionReached(slug, index, locale);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [slug, index, locale]);

  const paragraphs = body.split("\n\n");

  return (
    <div ref={ref} className="mt-12 first:mt-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Section heading with accent line */}
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-6 bg-red-500/40" />
          <h2 className="text-xl font-bold text-white/90 sm:text-2xl">{heading}</h2>
        </div>

        {/* Body paragraphs */}
        <div className="space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.85] text-white/60 sm:text-base">
              {p}
            </p>
          ))}
        </div>

        {/* Scripture blockquote */}
        <blockquote className="mt-6 border-l border-[#D4A843]/30 pl-5">
          <p className="text-[15px] italic leading-[1.85] text-white/55 sm:text-base">
            &ldquo;{scripture}&rdquo;
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/40">
            {scriptureRef}
          </p>
        </blockquote>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Create topic-nav.tsx**

```tsx
// src/components/learn/topic-nav.tsx
"use client";

import { trackTopicNavClicked } from "@/lib/learn-analytics";

interface TopicNavProps {
  slug: string;
  locale: string;
  prevLabel: string;
  nextLabel: string;
  prevTopic: { slug: string; title: string } | null;
  nextTopic: { slug: string; title: string } | null;
  ctaHeading: string;
  ctaButton: string;
}

export function TopicNav({ slug, locale, prevLabel, nextLabel, prevTopic, nextTopic, ctaHeading, ctaButton }: TopicNavProps) {
  return (
    <div className="mt-16">
      {/* CTA */}
      <div className="text-center">
        <p className="text-sm text-white/40">{ctaHeading}</p>
        <a
          href={`/${locale}/test`}
          onClick={() => {
            const { trackTopicCtaClicked } = require("@/lib/learn-analytics");
            trackTopicCtaClicked(slug, locale);
          }}
          className="mt-3 inline-flex items-center rounded-lg border border-[#D4A843]/35 bg-[#D4A843]/[0.04] px-6 py-3 text-sm font-semibold text-[#D4A843] transition-all hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.08] min-h-[48px]"
        >
          {ctaButton} <span className="ml-2" aria-hidden="true">→</span>
        </a>
      </div>

      {/* Prev / Next navigation */}
      <div className="mt-10 flex items-center justify-between border-t border-white/[0.06] pt-6">
        {prevTopic ? (
          <a
            href={`/${locale}/learn/${prevTopic.slug}`}
            onClick={() => trackTopicNavClicked(slug, "prev", locale)}
            className="text-sm text-white/40 transition-colors hover:text-white/60"
          >
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-white/25 block">{prevLabel}</span>
            ← {prevTopic.title}
          </a>
        ) : (
          <div />
        )}
        {nextTopic ? (
          <a
            href={`/${locale}/learn/${nextTopic.slug}`}
            onClick={() => trackTopicNavClicked(slug, "next", locale)}
            className="text-right text-sm text-white/40 transition-colors hover:text-white/60"
          >
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-white/25 block">{nextLabel}</span>
            {nextTopic.title} →
          </a>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create topic-page.tsx**

```tsx
// src/components/learn/topic-page.tsx
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { TopicSection } from "./topic-section";
import { TopicNav } from "./topic-nav";
import { trackTopicPageViewed } from "@/lib/learn-analytics";

interface SectionMessages {
  heading: string;
  body: string;
  scripture: string;
  scriptureRef: string;
}

interface TopicMessages {
  slug: string;
  title: string;
  subtitle: string;
  sections: SectionMessages[];
}

interface TopicPageProps {
  topic: TopicMessages;
  locale: string;
  label: string;
  ctaHeading: string;
  ctaButton: string;
  prevLabel: string;
  nextLabel: string;
  prevTopic: { slug: string; title: string } | null;
  nextTopic: { slug: string; title: string } | null;
}

export function TopicPage({ topic, locale, label, ctaHeading, ctaButton, prevLabel, nextLabel, prevTopic, nextTopic }: TopicPageProps) {
  useEffect(() => {
    trackTopicPageViewed(topic.slug, locale);
  }, [topic.slug, locale]);

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

      <article className="relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[4px] text-[#D4A843]/50">{label}</p>
          <h1
            className="mt-3 text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl md:text-5xl"
            style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
          >
            {topic.title}
          </h1>
          <p className="mt-3 text-sm text-white/40">{topic.subtitle}</p>
        </motion.div>

        {/* Sections */}
        <div className="mt-12">
          {topic.sections.map((section, i) => (
            <TopicSection
              key={i}
              heading={section.heading}
              body={section.body}
              scripture={section.scripture}
              scriptureRef={section.scriptureRef}
              index={i}
              slug={topic.slug}
              locale={locale}
            />
          ))}
        </div>

        {/* CTA + Nav */}
        <TopicNav
          slug={topic.slug}
          locale={locale}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
          prevTopic={prevTopic}
          nextTopic={nextTopic}
          ctaHeading={ctaHeading}
          ctaButton={ctaButton}
        />
      </article>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/learn/
git commit -m "feat: add topic page template components (section, nav, page)"
```

---

### Task 3: Dynamic Route Page

**Files:**
- Create: `src/app/[locale]/learn/[slug]/page.tsx`

- [ ] **Step 1: Create the page with metadata + static params**

```tsx
// src/app/[locale]/learn/[slug]/page.tsx
import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { TopicPage } from "@/components/learn/topic-page";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

interface TopicData {
  slug: string;
  title: string;
  subtitle: string;
  metaDescription: string;
  sections: Array<{ heading: string; body: string; scripture: string; scriptureRef: string }>;
}

interface LearnData {
  label: string;
  ctaHeading: string;
  ctaButton: string;
  nextLabel: string;
  prevLabel: string;
  topics: TopicData[];
}

async function getLearnData(locale: Locale): Promise<LearnData> {
  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default.learn;
  if (!data) throw new Error(`[learn] Missing "learn" key in ${locale}.json`);
  return data as LearnData;
}

export async function generateStaticParams() {
  const messages = await import(`@/messages/en.json`);
  const topics = messages.default.learn?.topics ?? [];
  const params: Array<{ locale: string; slug: string }> = [];
  for (const loc of SUPPORTED_LOCALES) {
    for (const topic of topics) {
      params.push({ locale: loc, slug: topic.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};

  const data = await getLearnData(locale as Locale);
  const topic = data.topics.find((t) => t.slug === slug);
  if (!topic) return {};

  return {
    title: topic.title,
    description: topic.metaDescription,
    openGraph: {
      title: topic.title,
      description: topic.metaDescription,
    },
  };
}

export default async function LearnTopicPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const data = await getLearnData(locale as Locale);
  const topicIndex = data.topics.findIndex((t) => t.slug === slug);
  if (topicIndex === -1) notFound();

  const topic = data.topics[topicIndex];
  const prevTopic = topicIndex > 0 ? { slug: data.topics[topicIndex - 1].slug, title: data.topics[topicIndex - 1].title } : null;
  const nextTopic = topicIndex < data.topics.length - 1 ? { slug: data.topics[topicIndex + 1].slug, title: data.topics[topicIndex + 1].title } : null;

  return (
    <TopicPage
      topic={topic}
      locale={locale}
      label={data.label}
      ctaHeading={data.ctaHeading}
      ctaButton={data.ctaButton}
      prevLabel={data.prevLabel}
      nextLabel={data.nextLabel}
      prevTopic={prevTopic}
      nextTopic={nextTopic}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/learn/
git commit -m "feat: add dynamic learn/[slug] route with metadata and static params"
```

---

### Task 4: EN i18n Content

**Files:**
- Modify: `src/messages/en.json`

- [ ] **Step 1: Add `learn` key to en.json**

Add after the `readingPlan` key (before `meta`). The content is the full 5 topics with all sections. Due to the size, this is the full JSON block to add.

The `learn` key contains `label`, `ctaHeading`, `ctaButton`, `nextLabel`, `prevLabel`, and a `topics` array with 5 objects, each having `slug`, `title`, `subtitle`, `metaDescription`, and `sections` array.

Content for each topic follows the spec's content outline. Each section has `heading`, `body` (paragraphs separated by `\n\n`), `scripture`, and `scriptureRef`.

- [ ] **Step 2: Also add `deeperLabel` and `deeperLink` to the `readingPlan` key**

Inside the existing `readingPlan` object, after `continueReadingLabel`, add:

```json
"deeperLabel": "Want to go deeper?",
"deeperLink": "Explore the foundations of what you've been reading."
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8')); console.log('valid')"`

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json
git commit -m "feat: add EN learn content (5 gospel topics)"
```

---

### Task 5: PT i18n Content

**Files:**
- Modify: `src/messages/pt.json`

- [ ] **Step 1: Add `learn` key to pt.json**

Same structure as EN but with Portuguese content. All topic titles, subtitles, meta descriptions, section headings, body text, scriptures, and scripture references in Portuguese.

- [ ] **Step 2: Add `deeperLabel` and `deeperLink` to `readingPlan`**

```json
"deeperLabel": "Queres ir mais fundo?",
"deeperLink": "Explora os fundamentos do que tens lido."
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/messages/pt.json','utf8')); console.log('valid')"`

- [ ] **Step 4: Commit**

```bash
git add src/messages/pt.json
git commit -m "feat: add PT learn content (5 gospel topics)"
```

---

### Task 6: Reading Plan Deeper Link

**Files:**
- Modify: `src/components/reading-plan/reading-plan.tsx`

- [ ] **Step 1: Add deeper link properties to ReadingPlanMessages interface**

Add to the interface (after `continueReadingLabel`):

```ts
deeperLabel: string;
deeperLink: string;
```

- [ ] **Step 2: Add deeper link in the completion section**

After the "Continue reading John" link in the `allComplete` block, add:

```tsx
<div className="mt-6">
  <p className="text-sm text-white/35">{messages.deeperLabel}</p>
  <a
    href={`/${locale}/learn/who-is-jesus`}
    className="mt-2 inline-flex items-center text-sm text-[#D4A843]/70 transition-colors hover:text-[#D4A843]"
  >
    {messages.deeperLink} →
  </a>
</div>
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/reading-plan/reading-plan.tsx
git commit -m "feat: add 'go deeper' link to reading plan completion"
```

---

### Task 7: Build Verification

- [ ] **Step 1: Type-check**

Run: `pnpm tsc --noEmit 2>&1 | head -30`

Expected: Clean.

- [ ] **Step 2: Build**

Run: `pnpm build 2>&1 | tail -30`

Expected: All learn pages generate: `/en/learn/who-is-jesus`, `/en/learn/what-is-sin`, etc. for both locales.

- [ ] **Step 3: Manual verification**

1. `/en/learn/who-is-jesus` — hero + 4 sections with scroll-reveal + CTA + "Next: What is Sin?"
2. Click through all 5 topics — verify prev/next linking
3. Last topic → "Next" absent, CTA links to /test
4. View page source — check `<title>`, `<meta name="description">`
5. `/pt/learn/who-is-jesus` — Portuguese content, same English slug
6. Complete reading plan → see "Want to go deeper?" link

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during e2e verification"
```
