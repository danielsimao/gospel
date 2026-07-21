# Content Runway Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three new learn topics targeting the highest-intent existential queries — `is-there-life-after-death`, `what-is-the-meaning-of-life`, `why-are-you-afraid-to-die` — authored in both locales with verified scripture, wired into dates/related-links/schema, live behind the owner's later copy gate.

**Architecture:** Each topic is a pure content addition to `learn.topics` in both message files (existing page/schema/FAQ machinery renders everything), plus a `TOPIC_DATES` entry and a `RELATED_TOPICS` entry (unit test enforces both stay complete). One authoring task per topic; a final integration task verifies the cluster end-to-end.

**Tech Stack:** Message-file JSON (surgical edits), Vitest, existing learn infrastructure — no new components.

## Global Constraints (binding on every task)

- **Living Waters method:** Law before grace; address conscience, not intellect; NO decisionism (no prayer formulas, conditional/fruit-based assurance only: "those who repent and trust…"); urgency is method ("no one is promised tomorrow" — never "take your time"); hope and caution paired (never despair without rescue, never rescue without the verdict); never use peace/joy/life-improvement as the draw — the pivot is legal substitution ("He paid the fine"), love is the reason, not the mechanism.
- **Scripture exactness is a hard gate:** EN quotes word-exact NKJV, PT quotes word-exact ARC — every quote FETCHED from biblegateway.com (NKJV / ARC versions) via WebFetch before it goes in a file; never from memory. Refs formatted `Book C:V (NKJV)` / `Livro C:V (ARC)`. EP-orthography adaptation of ARC (unigénito, Actos-style) is allowed to match the file's existing convention — wording/word-order must match ARC.
- **House register:** study the existing `what-happens-when-i-die` and `does-god-exist` topics in `src/messages/en.json` before writing — sentence rhythm, section length (~90–140 words/body), one scripture per section (most sections), quiz style (1–2 per topic, comprehension of the quoted verse, 3 options, `correct` index, one-sentence `reveal`).
- **Structure per topic (both locales, identical shape):** `{ slug, title, subtitle, metaDescription, sections: [6 × { heading, body, scripture?, scriptureRef?, quiz? }], faq: [3 × { question, answer }] }`. Titles are the search query. metaDescription ≤ 160 chars, question-led. FAQ questions = adjacent People-Also-Ask phrasings, answers 40–90 words distilled from the topic's own sections.
- **PT:** European Portuguese, tu-form, no Brazilian constructions or calques; mirror EN intent, not word-for-word. Every PT string is owner-gate material — reports list nothing verbatim (too large); the diff IS the gate artifact.
- **JSON edits surgical:** insert each topic as the LAST element of `learn.topics` (after the current final topic's closing brace), one locale at a time, `python3 -c "import json; json.load(open(...))"` after every insertion. Never reserialize.
- Appending to `learn.topics` automatically wires: hub card, prev/next nav, sitemap, Article/Breadcrumb/FAQ schema, learn-progress tracking. Only `TOPIC_DATES` and `RELATED_TOPICS` need manual entries (tests fail otherwise — that's the safety net).
- Gates per task: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green before commit.
- Commit trailers:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: Topic — Is There Life After Death?

**Files:** `src/messages/en.json`, `src/messages/pt.json`, `src/lib/topic-dates.ts`, `src/lib/related-topics.ts`

- Slug `is-there-life-after-death`. EN title "Is There Life After Death?", PT "Há Vida Depois da Morte?".
- Argument arc (6 sections, adapt headings freely): 1) Everyone suspects the answer is yes — the universal intuition (Ecclesiastes 3:11, eternity in their hearts). 2) What the Bible actually claims: death is not the end but a door (Hebrews 9:27 — one death, then judgment). 3) The resurrection of Jesus as the evidence — the one man who came back and was seen (1 Corinthians 15:3-6 or 15:20). 4) Two destinations, no third option (Matthew 25:46; honest about hell — no softening). 5) Which one is yours? The Law's verdict applies (brief conscience turn — liar/thief callback, guilty verdict). 6) The rescue: Christ paid, those who repent and trust pass from death to life (John 5:24; conditional assurance).
- Quizzes on sections 2 and 6 (Hebrews 9:27 comprehension; John 5:24 who-passes comprehension).
- `TOPIC_DATES`: `"is-there-life-after-death": { published: "2026-07-16", modified: "2026-07-16" }` (match the file's exact shape — read it first).
- `RELATED_TOPICS`: `"is-there-life-after-death": ["what-happens-when-i-die", "does-god-exist"]`.
- Verify EVERY quote per the scripture gate (fetch, compare, then insert). Gates. Commit: `content: learn topic — Is There Life After Death? (EN+PT)` + trailers.

### Task 2: Topic — What Is the Meaning of Life?

**Files:** same four.

- Slug `what-is-the-meaning-of-life`. EN "What Is the Meaning of Life?", PT "Qual É o Sentido da Vida?".
- Arc: 1) The question behind every other question — why success/pleasure never settle it (Ecclesiastes 2:10-11, vanity verdict — fetch and trim honestly). 2) Made ON purpose FOR a purpose: to know your Maker (Genesis 1:27 or Colossians 1:16 — made by Him and for Him). 3) Why life feels broken anyway: the separation the Law diagnoses (Isaiah 59:2 — sins separate). 4) The dead ends everyone tries (money, achievement, love as ultimate) — conscience turn, not sneering (Mark 8:36 — gain the world, forfeit the soul). 5) The meaning restored: reconciliation through the cross — He paid what separated you (2 Corinthians 5:18-19 or 1 Peter 3:18). 6) What a reconciled life is FOR: knowing Him, walking with Him — eternal life IS knowing God (John 17:3; conditional framing, no life-enhancement pitch — the draw is truth, not fulfillment).
- Guard: this topic is the most tempted toward "God gives your life purpose and joy!" prosperity-adjacent framing — the method forbids using fulfillment as the draw. The meaning is objective (made for Him), the problem is legal (guilt separates), the rescue is substitution.
- Quizzes on sections 3 and 6. Dates entry. Related: `["does-god-exist", "is-there-life-after-death"]`. Scripture gate. Gates. Commit: `content: learn topic — What Is the Meaning of Life? (EN+PT)` + trailers.

### Task 3: Topic — Why Are You Afraid to Die?

**Files:** same four.

- Slug `why-are-you-afraid-to-die`. EN "Why Are You Afraid to Die?", PT "Porque Tens Medo de Morrer?".
- Arc: 1) The fear nobody admits — universal, managed, never cured (Hebrews 2:15 — lifetime slavery to the fear of death). 2) The fear is telling the truth: your conscience knows judgment follows (Hebrews 9:27; the fear as data, echoing the site's conscience theme). 3) Why distraction and optimism don't work — you can't self-talk your way past a real verdict (brief; Amos 4:12-style "prepare to meet your God" — verify exact NKJV/ARC wording or choose Luke 12:20, the rich fool: "this night your soul will be required of you"). 4) The only person who ever defused death — the resurrection (1 Corinthians 15:55-57, death where is your sting, victory through Christ). 5) The verdict must be dealt with first: Law → guilty → He paid the fine (Romans 6:23). 6) Fear replaced, not suppressed: those who repent and trust don't get optimism, they get a settled verdict (John 11:25-26; Hebrews 2:14-15 callback — freed from the slavery; conditional close + "no one is promised tomorrow" urgency).
- Quizzes on sections 1 and 4. Dates entry. Related: `["what-happens-when-i-die", "is-there-life-after-death"]`. Scripture gate. Gates. Commit: `content: learn topic — Why Are You Afraid to Die? (EN+PT)` + trailers.

### Task 4: Cluster integration + E2E

- Consider adding reverse links: update `RELATED_TOPICS` so `what-happens-when-i-die` links to `is-there-life-after-death` (replace one of its two entries or extend to 3 — the test requires ≥2, allows more only if render handles it: check `topic-page.tsx` grid handles 2-3 cards; keep every entry at exactly 2 to preserve layout: swap `what-happens-when-i-die`'s second entry to `is-there-life-after-death`).
- Full gates. Then `pnpm build` and verify: sitemap contains 6 new URLs (3 topics × 2 locales); `.next/server/app/en/learn/is-there-life-after-death.html` contains `FAQPage` and `Article` schema; hub page lists 11 topics.
- Playwright spot-check (kill port 3000, `pnpm start`): open `/en/learn/why-are-you-afraid-to-die` — sections render, quiz answers, related cards link correctly; `/pt/learn/qual...` NO — PT slug is the same English slug (slugs shared across locales): `/pt/learn/why-are-you-afraid-to-die` renders PT content. No console errors.
- Commit any fixes. Push. Prod smoke after deploy: 3 new EN URLs 200 + FAQPage present.

## Execution order
1 → 2 → 3 → 4 serial (all touch the same files).

## Owner gate
The entire wave is gate material — owner reviews the three topics on prod (EN + PT) before sharing. Nothing else ships in this wave, so the diff is clean to review.
