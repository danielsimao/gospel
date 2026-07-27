# "Also Here" Band Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the journey tracker from the homepage and replace it with one ungated "Also here" band, identical on every journey stage.

**Architecture:** A new presentational `AlsoHere` component takes a composed array of rows and renders them with the existing `divide-y` list idiom from the next-steps tracks. `home-shell` composes the rows from `useJourney` + messages + `latestPost`. `journey-tracker.tsx` and `latest-post-card.tsx` are deleted; nothing else imports either.

**Implements:** ideas 1 and 4 from `2026-07-27-homepage-idea-backlog.md`.

## The defect this fixes

`journey-tracker.tsx:263-266` — *"Only active/complete cards with a real href render as links. Defensive against stale props: upcoming/all-done never become interactive."*

So the homepage rendered **Honest answers** at `opacity-60` and unclickable, while `top-bar.tsx` linked `/learn` on every page. The page showed a door as shut while the header held it open.

Three further reasons the tracker goes rather than being ungated in place:

1. **The header already does its job.** `top-bar.tsx:31-38` computes a stage and surfaces the reading-plan link exactly when `readingDone < TOTAL_READING_DAYS`.
2. **The sequence was invented.** test → reading → learn → share implies an order the app neither enforces nor wants; anyone may read a Learn topic first, and some should.
3. **It is the last reason `committed` is structurally unlike the other four stages** — the complaint that began this work.

## Global Constraints

- **Nothing is gated.** Every row is a link, always. No `upcoming` state, no ranking, no numbering, no rails. Re-introducing any of those re-creates the defect.
- **Progress is a subtitle, not a system.** "Day 3 of 7" on a permanently-pressable link is information. What made the tracker a dashboard was the gating, the sequence and the completion ranking — none may return. This distinction is the one the author got wrong twice; treat it as binding.
- **The band renders identically on all five stages**, below the spine. Same page, same furniture, only the top changes.
- **Visitor stays simple.** The band sits *below* the gold CTA and never competes with it.
- **Locale parity** on any new key, both files, same commit.
- **Retain, do not delete, superseded copy** — matches the `5a79b17` precedent.
- **Minimum diff.** No reformatting of untouched lines.

## File Structure

| File | Change |
| --- | --- |
| `src/components/home/also-here.tsx` | **Create** — presentational band |
| `src/components/home-shell.tsx` | Compose rows; render band on all 5 stages; drop tracker + `share` prop |
| `src/app/[locale]/(content)/page.tsx` | Stop passing `share` |
| `src/messages/{en,pt}.json` | One new key |
| `src/components/journey-tracker.tsx` | **Delete** (~200 lines) |
| `src/components/home/latest-post-card.tsx` | **Delete** — folds into the band |

---

### Task 1: The band component and its copy

**Files:**
- Create: `src/components/home/also-here.tsx`
- Modify: `src/messages/en.json`, `src/messages/pt.json`

**Interfaces:**
- Produces:
  ```ts
  export interface AlsoHereRow {
    href: string;
    label: string;
    description: string;
    icon: ReactNode;
  }
  export function AlsoHere({ label, rows }: { label: string; rows: AlsoHereRow[] }): JSX.Element
  ```
  Task 2 composes the rows.

- [ ] **Step 1: Add the `home.alsoHere` block**

Four keys per locale — the label plus a description per row. Homepage-specific,
not reused from the destination pages (see Grill outcomes).

```
label               EN "Also here"                PT "Também aqui"
readingDescription  EN "Seven days in the Gospel of John."
                    PT "Sete dias no Evangelho de João."
learnDescription    EN "Short answers to the questions people actually ask."
                    PT "Respostas curtas às perguntas que as pessoas fazem mesmo."
blogDescription     EN "Reflections on death, culture, and the hope of the gospel."
                    PT "Reflexões sobre a morte, a cultura e a esperança do evangelho."
```

Chosen over "Explore" or "Keep going" because it must also read correctly on the
`dismissed` stage, where anything imperative becomes a nudge at someone who said no.

- [ ] **Step 2: Write the component**

Reuse the exact list idiom from `track-committed.tsx:188-207` — `divide-y divide-white/[0.06] border-y border-white/[0.06]`, icon, flexed label, trailing arrow — so the homepage and next-steps share one visual language. Rows are two-line (label + description), so `min-h-[60px]` rather than the 52px used for single-line rows.

Header uses the existing `BandHeader` from `@/components/next-steps/band-header` with `tone="dim"`.

- [ ] **Step 3: Gates**

`pnpm lint && npx tsc --noEmit` — 7 warnings is the current baseline; do not exceed it.

- [ ] **Step 4: Commit**

---

### Task 2: Wire it in, delete the tracker

**Files:**
- Modify: `src/components/home-shell.tsx`, `src/app/[locale]/(content)/page.tsx`
- Delete: `src/components/journey-tracker.tsx`, `src/components/home/latest-post-card.tsx`

**Interfaces:**
- Consumes: `AlsoHere` from Task 1.

**Row composition** (in `home-shell`, which already holds `journey`, `home`, `latestPost`):

| row | href | label | description |
| --- | --- | --- | --- |
| reading | `/{locale}/reading-plan` | `home.journey.reading.label` | progress when started, else `home.alsoHere.readingDescription` |
| learn | `/{locale}/learn` | `home.journey.learn.label` | progress when started, else `home.alsoHere.learnDescription` |
| blog | `/{locale}/blog` | `home.blogCard.eyebrow` | latest post title when fresh, else `home.alsoHere.blogDescription` |

All three render on every stage. See Grill outcomes for why `dismissed` is not
an exception.

Progress strings reuse `home.journey.reading.descActiveProgress` (`"Day {current} of {total}"`) and `home.journey.learn.descActiveProgress` — so the `home.journey` block is not fully retired: `retakeLabel` stays live too (`home-shell.tsx:299`).

Icons from lucide, matching the next-steps vocabulary: `BookOpen`, `Compass`, `Newspaper`.

- [ ] **Step 1: Carry over the blog staleness rule**

`latest-post-card.tsx` self-hid when the newest post was over 60 days old — *"a visible stale blog on the front door reads as abandonment"*. The row must not vanish (a nav affordance disappearing is worse than a stale subtitle), so the rule moves to the **description**: fresh → post title, stale → the generic blog subtitle.

Keep the client-side `Date.now()` check and its `react-hooks/purity` disable, with the original reasoning intact — a build-time check freezes at deploy.

- [ ] **Step 2: Render the band on all five stages**

Below each stage's primary action and quiet link, outside the per-stage branches — one placement, not five.

- [ ] **Step 3: Delete the tracker and the card, clean the props**

Remove both files and their imports. `share` becomes unused in `home-shell` (its only consumer was `shareMessages={share}` at line 283) — drop it from `HomeShellProps` and from the page's `<HomeShell>` call.

Leave `home.journey.test.*`, `home.journey.share.*`, and the `descComplete`/`descUpcoming` strings in both locale files, unused. Retain-don't-delete, per precedent.

- [ ] **Step 4: Gates + build**

- [ ] **Step 5: Verify all five stages**

Swap the journey record in place (`localStorage` + `new Event('gospel:storage')`) and confirm, for **each** of visitor / undecided / committed / thinking / dismissed:

1. The band renders, with all three rows.
2. **Every row is a link** — no row has `opacity-60`, no row is a non-interactive `div`.
3. Exactly one `<h1>` still (the spine work must not regress).
4. `committed` no longer renders the tracker.
5. Reading and learn rows show progress when the journey record has any, and the plain subtitle when it does not.

- [ ] **Step 6: Verify both locales, then commit**

---

### Task 3: Sweep

- [ ] Homepage renders on `/en` and `/pt`, all five stages.
- [ ] No dead imports; `pnpm lint` at or below 7 warnings.
- [ ] Blog row shows the post title while fresh; force a stale date and confirm it falls back rather than disappearing.
- [ ] `src/content/blog/posts.ts` still unstaged.
- [ ] Husky pre-push gate green.

---

## Grill outcomes (2026-07-27) — resolved

**What the band actually adds**, once the header was read properly. `top-bar.tsx`
is stage-conditional, not static:

| row | in the header? | the band adds |
| --- | --- | --- |
| Blog | committed/thinking only | **reach for 3 of 5 stages** — visitor, undecided and dismissed have no header path at all |
| Reading | committed/thinking, and only while incomplete | reach for the other stages, plus the count |
| Learn | always, every stage | description and count only — no reach gain |

Blog is the strongest row and Learn the weakest, which is the inverse of the
initial assumption.

**All three rows render on all five stages, including `dismissed`.** The
`top-bar.tsx:29-31` rule — *"Dismissed users said no and get no nudge here"* —
was written about persistent chrome that follows a reader across every page.
A row below the fold on one page is availability, not a nudge. The owner's test:
no loss if it is ignored, real gain if a reader who declined still opens John.

This does **not** contradict removing share from the dismissed path in `f5fd3b8`.
Share asks the reader to do something *for the app* — extractive, and wrong to
put in front of someone who declined. A reading row offers them something *for
them*. Different acts; removing one never implied removing the other.

`top-bar` keeps its existing rule unchanged: header is chrome that follows you,
the band is one section you scroll to. Different pressure, different answer.

**The Learn row stays**, despite being the only pure header duplicate. The nav
entry is a 13px word with no context; the row says what Learn is and how far the
reader has got. Duplicated destination, not duplicated information.

**Copy plan corrected.** The original intent to reuse `readingPlan.subtitle`,
`learn.hubSubtitle` and `blog.indexSubtitle` fails on two of three:
`learn.hubSubtitle` still says "Explore the foundations" while the label is now
**Honest answers** (`e529071` retired "Foundations"), and `readingPlan.subtitle`
restates the label. Both need homepage-specific descriptions — which also solves
a plumbing problem, since `home-shell` receives only `home` and could not reach
the other blocks without new props.

So Task 1 adds a `home.alsoHere` block: `label` plus three descriptions,
4 keys x 2 locales.

**Progress on rows is kept**, and the Global Constraints statement about it is
binding rather than incidental — it is the single piece of the tracker surviving,
and the closest thing here to the mistake made twice before.
