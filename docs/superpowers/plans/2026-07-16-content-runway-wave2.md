# Content Runway Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The remaining three runway topics — `how-can-i-be-saved`, `why-does-god-allow-suffering`, `what-is-the-gospel` — authored EN+PT with verified scripture, cluster-linked, live for the owner's gate. Completes the 6-topic runway (14 topics total).

**Architecture:** identical to wave 1 — pure content additions to `learn.topics` (both locales) + `TOPIC_DATES` + `RELATED_TOPICS` entries; existing machinery renders everything. One author task per topic, opus review per topic, final integration.

## Global Constraints (binding on every task — identical to wave 1)

- **Living Waters method:** Law before grace; conscience over intellect; NO decisionism — this wave contains `how-can-i-be-saved`, the single most decisionism-tempted page in evangelicalism ("pray this prayer") — the answer is biblical repentance + faith, never a recited formula; conditional/fruit-based assurance only; urgency ("no one is promised tomorrow"); hope+caution paired; never fulfillment/peace-as-draw; pivot = legal substitution.
- **Scripture exactness hard gate:** EN word-exact NKJV, PT word-exact ARC — every verse FETCHED from biblegateway.com via WebFetch before insertion; fetch-fail → retry once → substitute a fetchable verse; refs "(NKJV)"/"(ARC)"; EP-orthography adaptation of ARC allowed; leading-conjunction trims + line-case OK.
- **House register:** read `is-there-life-after-death` + `why-are-you-afraid-to-die` in both locales first. Bodies ~90–150 words; one scripture most sections; quizzes: 3 options, correct index, one-sentence reveal; 2 quizzes per topic.
- **Structure:** { slug, title, subtitle, metaDescription (≤160), sections: [6], faq: [3] } identical shape both locales; insert as LAST topics element, one locale at a time, `python3 json.load` after every insertion; never reserialize.
- PT: European Portuguese, tu-form, no calques.
- Gates per task: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green.
- Commit trailers:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: Topic — How Can I Be Saved?

Slug `how-can-i-be-saved`; EN "How Can I Be Saved?", PT "Como Posso Ser Salvo?".
Arc: 1) The right question — the Philippian jailer asked it word for word (Acts 16:30-31). 2) Saved FROM what: the verdict, not vague emptiness — the Law's charge stands (Romans 3:19-20). 3) What cannot save: religion, effort, sincerity, being "mostly good" (Ephesians 2:8-9 or Titus 3:5). 4) What God did: the substitution — He paid the fine (Romans 5:8 or 1 Peter 3:18 — avoid duplicating wave-1's exact pull-quote if possible; 1 Pet 3:18 already used in how-can-my-sins-be-forgiven and meaning-of-life, prefer Romans 5:8). 5) Repentance: what turning actually is — not sorrow alone, not self-reform (Acts 3:19 is already quoted twice on the site; prefer Luke 13:3 or 2 Corinthians 7:10 — 2 Cor 7:10 already in what-is-repentance; Luke 13:3 preferred). 6) Faith: trusting the Person, not reciting words — EXPLICITLY name and reject the prayer-formula shortcut ("no incantation saves; the thief on the cross had no formula — he had repentance and trust"); conditional assurance; urgency close (2 Corinthians 6:2 — already on site in what-happens-when-i-die; consistent re-quote acceptable here, it's THE verse for this close).
Quizzes: sections 3 and 6. Dates 2026-07-16. Related: `["what-is-repentance", "how-can-my-sins-be-forgiven"]`.
Commit: `content: learn topic — How Can I Be Saved? (EN+PT)` + trailers.

### Task 2: Topic — Why Does God Allow Suffering?

Slug `why-does-god-allow-suffering`; EN "Why Does God Allow Suffering?", PT "Porque É Que Deus Permite o Sofrimento?".
Arc: 1) Ask it honestly — name real pain without churchy dismissal; the Bible's own people asked it raw (Habakkuk 1:2 or Psalm 13:1). 2) Where suffering came from: a world under sin's curse — creation groans (Romans 8:22; Genesis 3 summarized in prose, not quoted). 3) The turn the question hides: we prosecute God for allowing evil while producing our share of it — conscience turn via Jesus' own answer to a suffering-headline (Luke 13:4-5, tower of Siloam — "unless you repent"; the classic Law text for this exact question). 4) God's answer is not an argument — it is a cross: He entered it (Isaiah 53:3 man of sorrows, or 53:4). 5) Suffering has an expiry date — but on one side of the verdict only (Revelation 21:4; honest about the other side, hope+caution). 6) What suffering is doing right now: God's patience is mercy aimed at repentance — urgency without cruelty (2 Peter 3:9; Romans 2:4 alternative).
Guard: no theodicy lecture, no "God has a wonderful plan behind your pain" — the topic addresses the conscience of the ASKER, tenderly (this page will be read by grieving people; direct but never flippant).
Quizzes: sections 3 and 6. Dates. Related: `["does-god-exist", "is-there-life-after-death"]`.
Commit: `content: learn topic — Why Does God Allow Suffering? (EN+PT)` + trailers.

### Task 3: Topic — What Is the Gospel?

Slug `what-is-the-gospel`; EN "What Is the Gospel?", PT "O Que É o Evangelho?".
Arc: 1) News, not advice — the word means announcement of something done (1 Corinthians 15:1-4, the Bible's own definition). 2) No gospel without the bad news first: the verdict the news answers (Romans 3:23 — already on site; consistent re-quote fine, it IS the summary verse). 3) The center: the exchange — He who knew no sin (2 Corinthians 5:21 — already in why-the-cross; prefer avoiding exact duplicate: use Isaiah 53:5 — also used... pick Romans 5:8 if Task 1 didn't take it, else 1 Corinthians 15:3 standalone or Galatians 3:13 "having become a curse for us" — author picks the strongest fetchable non-duplicate). 4) Not works, not self-improvement — grace excludes boasting (Ephesians 2:8-9 if Task 1 used Titus 3:5, else Titus 3:5 — coordinate: read what Task 1 committed before choosing). 5) Risen — the receipt that payment cleared (Romans 4:25 or 1 Corinthians 15:20). 6) The response the news itself commands: repent and believe — Jesus' own summary (Mark 1:15); conditional close; urgency.
Quizzes: sections 1 and 6. Dates. Related: `["why-the-cross", "how-can-i-be-saved"]`.
Commit: `content: learn topic — What Is the Gospel? (EN+PT)` + trailers.

### Task 4: Cluster integration + E2E

- Reverse links (keep every entry at exactly 2): swap `how-can-my-sins-be-forgiven` → `["what-is-repentance", "how-can-i-be-saved"]`; swap `why-the-cross` → `["what-is-the-gospel", "who-is-jesus"]`; leave the rest.
- Full gates; build verify: 14 topics × 2 locales in sitemap; FAQPage+Article schema on one new EN page; hub lists 14.
- Playwright spot-check one new topic each locale + reverse links on why-the-cross.
- Push. Prod smoke: 3 new EN URLs 200 + FAQPage.

## Execution order
1 → 2 → 3 → 4 serial (shared files). Reviews may overlap the next author (read-only).

## Owner gate
Entire wave. Language read on prod, both locales.
