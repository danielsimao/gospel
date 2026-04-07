# Content Library — Topical Gospel Pages

## Problem

The site's gospel presentation is thin: 3-8 quiz questions, 4 grace beats, a prayer. Someone genuinely curious has nowhere deeper to go on-site. They either convert immediately or bounce. There are no pages for organic search to discover.

## Solution

Build 5 topical pages covering core gospel concepts. Each page is a standalone, SEO-optimized article with sections that reveal on scroll. Pages cross-link in a natural gospel sequence and funnel to the /test quiz.

## Constraints

- Content drafted by Claude, reviewed by user, PT translation provided by user
- Same dark theme, gold accents, existing animation patterns
- No auth, no database — pure static pages
- All content in i18n JSON

---

## Pages

| # | Route | Title (EN) | Topic |
|---|-------|-----------|-------|
| 1 | `/{locale}/learn/who-is-jesus` | Who is Jesus? | Deity, humanity, historical person, why it matters |
| 2 | `/{locale}/learn/what-is-sin` | What is Sin? | God's standard, the human condition, universality |
| 3 | `/{locale}/learn/why-the-cross` | Why the Cross? | Substitutionary atonement, the courtroom metaphor, justice + mercy |
| 4 | `/{locale}/learn/what-is-repentance` | What is Repentance? | Not just feeling sorry, turning + trusting, what it looks like |
| 5 | `/{locale}/learn/what-happens-when-i-die` | What Happens When I Die? | Eternity, judgment, heaven, hell, hope |

### Reading Sequence

`Who is Jesus?` → `What is Sin?` → `Why the Cross?` → `What is Repentance?` → `What Happens When I Die?`

Each page has a "Next topic" link at the bottom pointing to the next in sequence. The last page links back to the quiz.

---

## Page Structure

Each page follows an identical template with content driven by i18n JSON.

### Sections per page

Each page has 3-5 sections. Each section contains:
- **Heading** (h2)
- **Body** — 2-4 paragraphs of explanatory content
- **Scripture** — a key verse in gold blockquote

Sections animate in on scroll (IntersectionObserver, fade+rise, same pattern as grace-reveal).

### Page layout (top to bottom)

1. **Hero** — page title (h1, gold, large) + one-line subtitle + topic label ("Learn")
2. **Content sections** — 3-5 sections with scroll-reveal animation
3. **CTA** — "Ready to examine yourself?" → link to `/{locale}/test`
4. **Navigation** — "Next: [topic name] →" link + "← Previous: [topic name]" link (where applicable)

### Visual treatment

- Same dark bg (#060404) with radial vignette
- Gold (#D4A843) for headings, scripture borders, CTA
- White/60% for body text
- Scripture in italic blockquote with gold left border (matching existing pattern)
- Section headings with red accent line (matching quiz commandment style)
- Scroll-reveal: fade+rise 16px, 0.8s, staggered delays per section

---

## Shared Template Component

All 5 pages use the same `TopicPage` component. Content is passed via props from i18n.

```
TopicPage
├── TopicHero (title, subtitle, label)
├── TopicSection[] (heading, body paragraphs, scripture)
├── TopicCta (quiz link)
└── TopicNav (prev/next topic links)
```

---

## Content Outline (EN)

### Page 1: Who is Jesus?

**Sections:**
1. **More than a good teacher** — Jesus claimed to be God (John 10:30). Not a moral philosopher — either Lord, liar, or lunatic.
2. **The Word made flesh** — John 1:1-14. Eternally God, voluntarily became human. The Creator entered His creation.
3. **What He did** — Lived the only sinless life. Performed miracles. Died willingly. Rose from the dead.
4. **Why it matters to you** — If Jesus is who He said He is, then everything He said about sin, judgment, and salvation is true.

**Key scriptures:** John 10:30, John 1:14, Philippians 2:6-8, John 14:6

### Page 2: What is Sin?

**Sections:**
1. **God's standard** — The Ten Commandments aren't suggestions. They reveal God's perfect standard — and our failure to meet it.
2. **It's not just murder and theft** — Jesus raised the bar: anger = murder (Matt 5:21-22), lust = adultery (Matt 5:27-28). Sin is internal, not just external.
3. **Everyone has sinned** — Romans 3:23. Not some people, not bad people — all people. The quiz showed you this.
4. **The consequence** — Romans 6:23. The wages of sin is death — eternal separation from God. Not annihilation, not nothing — judgment.

**Key scriptures:** Exodus 20:1-17, Matthew 5:21-28, Romans 3:23, Romans 6:23

### Page 3: Why the Cross?

**Sections:**
1. **The problem** — God is just. He cannot ignore sin any more than a good judge can let a guilty criminal walk free. But God is also loving. How can both be satisfied?
2. **The courtroom** — Imagine you're guilty of a crime with an enormous fine. You can't pay. But someone steps in and pays it for you. The judge can legally dismiss your case.
3. **What happened on the cross** — Jesus took the punishment that we deserve. He absorbed the wrath of God so that we wouldn't have to. 2 Corinthians 5:21 — He became sin for us.
4. **It is finished** — John 19:30. The debt is paid. Not "it is started" — finished. There is nothing you can add to what Christ has done.

**Key scriptures:** Isaiah 53:5-6, 2 Corinthians 5:21, John 19:30, Romans 5:8

### Page 4: What is Repentance?

**Sections:**
1. **Not just feeling sorry** — Judas felt sorry (Matt 27:3). That's remorse, not repentance. Repentance is a change of direction, not just a change of feeling.
2. **Turn and trust** — Repentance has two parts: turning FROM sin and turning TO God. It's not cleaning yourself up first — it's coming to God as you are and letting Him change you.
3. **What it looks like** — It's not perfection. It's a new direction. A repentant person falls, but they fall forward. They get back up. They hate what they used to love.
4. **It's a gift** — Acts 11:18. Even the ability to repent is a gift from God. You can't manufacture it. Ask Him for it.

**Key scriptures:** Acts 3:19, 2 Corinthians 7:10, Luke 15:18-20, Acts 11:18

### Page 5: What Happens When I Die?

**Sections:**
1. **The appointment** — Hebrews 9:27. It is appointed for man to die once, and after that comes judgment. Not reincarnation, not nothing — judgment.
2. **Two destinations** — The Bible describes two eternal destinations: presence with God (heaven) or separation from God (hell). There is no middle ground.
3. **The death counter is real** — 1.8 people die every second. The counter on this site isn't a gimmick — it's a reminder that eternity is one heartbeat away. One of those numbers will be yours.
4. **But there is hope** — John 3:16. God does not want anyone to perish. He made a way. The cross is the bridge between judgment and mercy. The question is whether you'll cross it.

**Key scriptures:** Hebrews 9:27, Matthew 25:46, 2 Peter 3:9, John 3:16

---

## i18n Structure

New top-level key `learn` in `en.json` / `pt.json`:

```
learn: {
  label: "Learn",
  ctaHeading: "Ready to examine yourself?",
  ctaButton: "Take the test",
  nextLabel: "Next",
  prevLabel: "Previous",
  topics: [
    {
      slug: "who-is-jesus",
      title: "Who is Jesus?",
      subtitle: "More than a good teacher.",
      metaDescription: "Who was Jesus of Nazareth? Explore the evidence for His deity, humanity, and what it means for you.",
      sections: [
        {
          heading: "...",
          body: "paragraph1\n\nparagraph2",
          scripture: "...",
          scriptureRef: "..."
        }
        // × 3-5 per page
      ]
    }
    // × 5 topics
  ]
}
```

---

## SEO

Each page gets:
- **Title tag:** `{topic title} | {site name}`
- **Meta description:** Unique per topic, answer-style (targets featured snippets)
- **Open Graph:** title, description, locale-specific OG image (reuse existing)
- **Semantic HTML:** proper h1/h2 hierarchy, `<article>` element
- **Slugs:** English for all locales (`/pt/learn/who-is-jesus` serves PT content). Simpler routing, shareable cross-language.
- ~~FAQ structured data~~ — skipped. Section headings are statements, not questions. Page titles already target search queries.

---

## Cross-linking from Existing Flows

Low-priority additions (can be done in a follow-up):
- Quiz grace section: after "Take the test" CTA, small "Or learn more" link
- Reading plan completion: "Want to go deeper?" links to the first topic
- Eternity CTA section: add topic links as additional resources

**Included in this spec:** Reading plan completion message gets a "Want to go deeper?" link to `/learn/who-is-jesus`. One-line addition to `readingPlan` i18n keys (`deeperLabel`, `deeperLink`).

---

## Analytics

New events:
- `topic_page_viewed` — { slug, locale }
- `topic_section_reached` — { slug, section_index, locale } (IntersectionObserver)
- `topic_cta_clicked` — { slug, locale }
- `topic_nav_clicked` — { slug, direction: "next" | "prev", locale }

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/[locale]/learn/[slug]/page.tsx` | Dynamic route for all topic pages |
| `src/components/learn/topic-page.tsx` | Main topic page client component |
| `src/components/learn/topic-section.tsx` | Individual section with scroll-reveal |
| `src/components/learn/topic-nav.tsx` | Prev/next topic navigation |
| `src/lib/learn-analytics.ts` | Analytics events |
| `src/messages/en.json` | Add `learn` key with all 5 topics |
| `src/messages/pt.json` | Same (PT) |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/reading-plan/reading-plan.tsx` | Add "Want to go deeper?" link after completion |
| `src/messages/en.json` | Add `deeperLabel` + `deeperLink` to `readingPlan` |
| `src/messages/pt.json` | Same (PT) |

---

## Verification

1. Visit `/en/learn/who-is-jesus` — see hero, 4 scroll-reveal sections, CTA, "Next: What is Sin?" link
2. Click through all 5 pages in sequence — verify cross-linking
3. Last page ("What Happens When I Die?") — "Next" links to /test quiz
4. Check meta tags in page source (title, description, OG)
5. Verify PT locale: `/pt/learn/who-is-jesus` renders Portuguese content (English slugs, PT content)
6. Verify scroll-reveal animations fire on section scroll
7. Check analytics events in PostHog dev tools
