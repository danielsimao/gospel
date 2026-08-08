# 015 — Cover-first learn hub (icons retired)

- **Status**: PROPOSED — direction approved by the owner, layout not chosen
- **Severity**: MEDIUM (no defect; the hub works — this is impact and legibility)
- **Category**: Design / information architecture
- **Estimated scope**: `src/components/learn/learn-hub.tsx`, `src/lib/learn-bands.ts` (read-only), possibly 2 regenerated covers + `docs/graphics/PROMPTS.md`
- **Origin**: owner request, 2026-08-08 — all 14 topic covers now on `main`; drop the per-topic line icons and let the covers carry the hub.
- **Mockups**: [three variants + hybrid](https://claude.ai/code/artifact/1e02c44b-fe5d-4086-b5b7-658cf12f128c) (real covers, real copy, three topics simulated as read)

## Problem

`learn-hub.tsx` lists 14 topics as `TopicEmblem` + title + subtitle rows in three bands. The emblems were already judged insufficient once: `topic-cover.tsx` records that a 32px line icon "doesn't decode — 'who is Jesus' as an abstract crook shape reads as noise, where a photograph of the same idea does", which is why topic *pages* replaced emblems with covers. The hub never followed. Now that all 14 covers exist, the hub is the last surface still showing the icon that lost that argument.

The owner's brief: impactful, appealing, easy to read, and interactive — while holding 14 topics without feeling like a wall of content.

## Verified facts (do not re-derive)

Measured on 2026-08-08 against `main`; each cost real time to establish.

| Fact | Value |
| --- | --- |
| Cover count | 14/14 topics — `TOPIC_COVERS` and `public/graphics/covers/` agree (pinned by `graphics.test.ts`) |
| Cover aspect | **13 are 960×720 landscape (1.33)**; `why-are-you-afraid-to-die` alone is 720×960 portrait |
| 3:4 portrait crop | **12 of 14 survive well.** PROMPTS.md's "generous even darkness on every side, so the frame crops safely" did its job |
| Weak at card size | `what-is-sin` (pure stone texture, no subject) and `why-does-god-allow-suffering` (dark water, very low contrast) — both read as blank dark rectangles below ~250px |
| Tonal range across the set | **None.** All 14 are near-monochrome near-black; *subject shape* is the only differentiator |
| Quiz coverage | **14/14 topics carry quizzes** — 2–4 per topic, across 4–7 sections. "Quiz" on a card is a true claim |
| Reading time per topic | **Unknown.** Sections range 4–7. Any single "N min" figure is invented |
| Horizontal-scroll precedent | **None.** No `overflow-x-auto`, `snap-x` or `snap-mandatory` anywhere in `src/` |
| `TopicEmblem` after this change | Still used by `topic-nav.tsx` (prev/next). **Do not delete the emblems** |

## Target

Covers carry every topic; icons leave the hub. Layout **not yet chosen** — see Open questions.

Two candidates survive the critique, and the choice needs to be made by looking at 14 real cards at real size, not by reasoning:

- **A · Poster wall at 2-up on desktop** — band grids of cover cards, gold cover-lines, the homepage card idiom extended. 2-up rather than 3-up so the two weak covers still read. One vocabulary with `home/questions-band.tsx`.
- **C · Question wall** — type-led rows, each flooding with its cover on hover. Fastest to scan; turns the set's uniform darkness from a liability into a ground. Weakest on touch, where covers show only as thumbnails.

## Constraints (these are findings, not preferences)

Each of these was proposed, then rejected on evidence. Do not reintroduce without new argument.

1. **No 14-segment progress meter.** `learn-bands.ts` states the hub is entry-anywhere with no prerequisites. A segment bar fills by *count*, so a reader who read topics 2, 7 and 11 would see segments 1–3 lit — a false statement about their own history — and a pulsing "next" segment invents a sequence the architecture refuses. The reading plan's bar is honest because days *are* ordered. Keep the existing plain `{completed} of {total}`.
2. **No invented reading times.** "Quiz" is verified true for all 14; "5 min" was fabricated and must not ship. Either compute from word count or omit the number.
3. **No doctrinal colour as band labels.** Red and gold are event colours — the Law's verdict, grace's arrival. As band *category tags* on a library index they become a filing system, which inverts `AGENTS.md`'s "the doctrine is not decoration on a product — it is the product". A gold "The rescue" header is also gold spent in front of a visitor who has not taken the test. Band eyebrows stay neutral.
4. **Subtitles always visible, never hover-only.** `What Happens When You Die?` and `Is There Life After Death?` are near-duplicate questions; the subtitle is their only disambiguator. Hover-reveal works on the homepage's 3 cards and fails at 14.
5. **Horizontal snap-shelves are not free.** Zero precedent in this codebase, they hide content from readers who never swipe, and the proposal put them on the *mobile* path — the majority path. If used at all, they need the same scrutiny any new interaction gets here.
6. **LCP has no plan yet.** The homepage ships 3 covers lazily; this ships 14, most at or near the fold. Whatever layout wins needs an explicit eager/lazy split and a measured budget — `graphics.test.ts` already guards a served-graphics total.

## Steps

1. **Render both candidates full-size before writing component code.** 14 real cards, both layouts, mobile and desktop, and *look* at them. The open question is set-level (does a wall of 14 near-black covers read as a quilt?) and cannot be settled from a 3-card sample. This step is the point of the plan.
2. Choose A-at-2-up or C with the owner.
3. Rebuild `learn-hub.tsx`'s topic list against the choice: drop `TopicEmblem` from this file only, keep the band grouping from `LEARN_BANDS`, keep the completion cascade (all read → test → reading plan → share) and the reset dialog untouched.
4. Read state per card: the existing `isTopicCompleted` — a chip plus a calmer cover, no new storage.
5. Surface the quiz as a cost line ("QUIZ", no minutes) in the mono caption register.
6. Regenerate covers for `what-is-sin` and `why-does-god-allow-suffering` with an actual subject; add their prompts to `docs/graphics/PROMPTS.md` as new numbered sections, marking the originals superseded (the §16/§18 precedent).
7. Update `learn-hub` tests for the new markup; add a pin that the hub renders no `TopicEmblem`.

## Boundaries

- **Do not delete `emblems.tsx`** — `topic-nav.tsx` still consumes it.
- **Do not touch `LEARN_BANDS`** — the arc and its unit test are settled.
- **Do not add the score face.** The hub is a reading surface; `home-passed.test.ts` scopes Big Shoulders to surfaces that declare.
- **Do not restructure topic content.** Copy and flow belong to the owner (`AGENTS.md`).
- If the chosen layout needs a cover aspect the art does not have, **stop and ask** — 13 of 14 are landscape, and regenerating 13 covers is an owner decision, not an implementation detail.

## Open questions (owner)

- **A-at-2-up or C?** Blocked on step 1's full-size render.
- Regenerate the two weak covers now, or ship and revisit?

## Verification

- **Mechanical**: `pnpm test && pnpm lint && pnpm build` — green.
- **Visual**: screenshot `/en/learn` and `/pt/learn` at 390×844 and 1440×900, with 0 topics read and with 3 read. Both locales — PT titles are longer and the card type has to hold them.
- **Set-level**: view all 14 cards at once at real size and confirm topics are distinguishable at a glance. This is the acceptance criterion the whole plan turns on.
- **Done when**: a stranger can scan 14 topics and tell them apart, a returning reader can see what they have read, and no card claims anything untrue.

## Unrelated discovery

Now that all 14 covers exist, the medallion fallback branch in `src/components/home/questions-band.tsx` (`hasTopicCover` false) is unreachable — every homepage-featured slug has a cover. `home-questions-band.test.ts` still pins that branch. Worth a separate cleanup: either remove the branch and its pin, or keep both and document that it is insurance for a future coverless topic.
