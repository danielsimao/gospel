# /next-steps — revamp, and Scripture in the page

**Date:** 2026-08-10
**Status:** draft, revised after adversarial review (see §13). Awaiting owner rulings (§4) and one licence answer (§5)
**Prototype:** https://claude.ai/code/artifact/ea5e0330-c7cb-4bd7-a4f9-0ba93812402d
**Rationale doc:** https://claude.ai/code/artifact/68554e49-c29a-4a08-9b32-66b09f66f38b

---

## 1. Summary

`/next-steps` is the page a reader lands on after answering the decision. It carries
two tracks — committed and thinking — and today it is a menu: seven destinations on
the committed track, five on the thinking one, every reading link pointing off-site.

This spec does two separable things.

**A. It cuts the page to what a first day needs** and makes the transition into it
carry meaning rather than just elapse. No external dependency; shippable immediately.

**B. It brings the reading into the page.** The largest structural weakness is that
the primary call to action leaves the site. The locale files hold 18 bible.com URLs
across the reading plan, the thinking track and the continue-reading door; the
`target="_blank"` that opens them in a new tab is applied by the components —
`track-committed.tsx:185`, `track-thinking.tsx:106`, `day-card.tsx:124`,
`reading-plan.tsx:192`. The reader's one job is handed to another product, in another
tab, with the Back button broken. This is gated on licensing, and the gate resolves
differently for English and Portuguese (§5).

A is not contingent on B. If B never ships, A still stands.

---

## 2. What is NOT changing

Stated first, because the method is load-bearing here and things have been removed
before by people who did not know they were load-bearing (`AGENTS.md`).

- **The decision screen's three answers.** Same copy, same visibility, same order.
  Declining stays a findable button.
- **The dismissed path.** Still no `/next-steps` track. Keeps both conditional doors.
- **The 950ms choice guard** (`CHOICE_GUARD_MS`) and the 2000ms committed hold
  (`COMMITTED_HOLD_MS`). Values unchanged; behaviour extended, not retimed.
- **"Today is the beginning."** No decisionism anywhere near this work.
- **Both mortality lines.** `invitation.urgencyLine` stays below the choice;
  `trackB.comeBack` stays at the end of the page.
- **The stage-in-attribute privacy design.** `/next-steps/committed` must never become
  a URL. `STAGE_PREPAINT_SCRIPT`, the `data-journey-stage` attribute and the
  both-tracks-rendered-CSS-reveals-one structure (`client.tsx:89-109`,
  `globals.css:435`) stay exactly as they are. §7.1 is written to protect this.
- **The 7-day plan's length and shape.** YouVersion's guidance to plan publishers is
  that completion peaks between 3 and 21 days and that daily content over 400 words
  loses readers. The plan sits inside both bounds.

---

## 3. Decisions taken

### 3.1 Committed track: seven destinations to five

| Destination | Now | After |
|---|---|---|
| Read (day ticket) | primary card | primary card, unchanged |
| Full plan (`readPlanLabel`) | ghost button beside Read | **stays, unchanged in Phase 1**; see note |
| Pray | inline quote | inline quote |
| Find a church | pressable row above fold | first row under "As you grow" |
| Learn | row under "As you grow" | row under "As you grow" |
| Share (buttons + story + copy link) | ~⅓ of page, always expanded | one row, expands in place |
| Print cards | row | **removed** |
| Story image preview | inline `<img>` | moves inside the Share disclosure |

**Correction from the first draft:** that draft claimed "Today" becomes *exactly two
moves*. It does not. The Read card carries a second destination — the
`readPlanLabel` ghost button linking to `/reading-plan` (`track-committed.tsx:191`).
It stays in Phase 1. "Today" is therefore Read, Full plan, and Pray. Whether the Full
plan button should retire once the passage is readable in the page is a **Phase 2**
question, deliberately not answered here.

**Why church is demoted and not cut:** read, pray, fellowship is the method's own
follow-up triad. Demoting is hierarchy; removing would be doctrine.

### 3.2 Thinking track

- **`Chat at needGod.net` is removed.** The rationale is narrower than an earlier draft
  claimed, and the correction matters because it weakens one of the three reasons:

  (i) **There is no chat on needGod.net.** No chat-widget script, no chat control on the
  page. But an earlier draft said the site offers "only a contact form", and that is
  **false** — it invites questions by Instagram message and Facebook message as well.
  Those are real routes to a real person. What is accurate is narrower: the label says
  *Chat at needGod.net*, and no chat exists at needGod.net; a reader who taps it gets a
  page offering a form and two social handles.

  (ii) `talkUrl` is identical in both locales and needGod.net has no Portuguese, so a
  `tu`-form Portuguese reader is handed an English site at the one moment they were
  promised a conversation. This reason is unaffected and is the strongest of the three.

  (iii) needGod.net opens by re-running the Good Person Test — the argument this reader
  just answered "I want to think about it" to.

  Because (i) is weaker than stated, **O4 is a genuine ruling and not a formality.** A
  defensible alternative is to keep the row for English only and relabel it honestly
  ("Message someone at needGod.net"), and drop it for Portuguese. The recommendation is
  still removal, on the strength of (ii) and (iii); the footer keeps its needGod link
  either way.
- **Learn takes that slot**, moving up from below the fold to secondary under John 3.
- **The 7-day plan row is removed** from this track. John 3 is the reading ask; a
  second, larger reading ask splits it. The plan stays in the footer.
- **"Going deeper" band header is removed** — nothing left under it.

That leaves two link destinations: John 3, and Learn.

#### 3.2.1 The reflection chain — this is NEW, not a reuse

The first draft claimed this mechanic already existed at `day-card.tsx:34-50` and
could be reused. **That was wrong, and two independent reviews caught it.** Those
lines sync a card's expansion to an externally-supplied `isCurrent` prop and scroll it
into view. There is no answer state, no arming of a next item, no shrink, no dim.
Nothing in this repo does what is described below. It must be specified in full.

Behaviour:

- Reflections render as an ordered list of `<button>` elements, one per string in
  `trackB.reflections`.
- Exactly one is *armed* at a time; it is the first not yet acknowledged.
- Items after the armed one are *pending*: rendered, dimmed to `opacity: .2`,
  `pointer-events: none`, `tabindex="-1"`, and `aria-disabled="true"`. They remain in
  the DOM and in the accessibility tree — a screen-reader user can read ahead. Nothing
  is hidden; this is emphasis, not a gate.
- Acknowledging the armed item (click, Enter or Space) marks it *done*: it shrinks to
  the smaller size, dims to `opacity: .35`, drops its affordance hint, and stops being
  focusable as a control. The next item arms.
- The hint text ("tap when you've sat with it") renders only on the armed item and
  needs a locale key per locale — `trackB.reflectionHint`.
- **Not persisted.** Acknowledgement is `useState` in the component and resets on
  reload or revisit. Rationale: this is a reading pace device, not progress. Persisting
  it would mean a returning reader arrives at a page of three greyed-out lines with
  nothing armed, which is worse than starting again. It also keeps the component free
  of any storage read during render — see §7.1.
- **Scrolling past is free.** No content below the reflections is gated on
  acknowledging them. A reader who ignores the chain entirely sees the same page.
- Reduced motion: no size transition; the state change applies instantly.

### 3.3 The transition

1. **The door answers the commitment.** `door-decision.avif/webp` (and the wide pair)
   sit behind the decision at `opacity-[0.35]`. On `invitationResponse === "committed"`,
   the light gap widens over the same 2000ms as the existing hold, as one CSS
   transition sharing the seam's existing idiom (`invitation-screen.tsx:137-143`).
   Nothing announces it, exactly as the seam's gold resolution does not. Reduced
   motion: final state applied immediately, no widening.
2. **The CTA names its destination.** Split `nextSteps.cta` into
   `nextSteps.ctaCommitted` and `nextSteps.ctaThinking`. **Owner ruling — §4, O1.**

   **Consequence the first draft missed:** `nextSteps.cta` is not only the button
   label. It is also the page's metadata title, used twice in
   `next-steps/page.tsx:33` and `:56`. Splitting it without a replacement leaves the
   page titleless. The split therefore adds a third key, `nextSteps.metaTitle`, which
   takes over both metadata call sites. All three keys land in both locales in the same
   change; no fallback chain, no optional keys.
3. **Arrival carries the glow.** The committed `<h1>` is already gold with a
   `textShadow`; add the dawn wash behind it (§3.4).

### 3.4 Atmosphere

One new graphic in the `docs/graphics/PROMPTS.md` house style: a dawn / first-morning
wash behind the committed opener. Register is adoption — the method is explicit that
the courtroom stops at the decision. Implemented as the dimmed-background pattern
from #48, not a new paradigm. The thinking track gets no new graphic; neither red nor
gold is spent on an undecided reader.

### 3.5 Locale cleanup

Two distinct groups. The first draft ran them together, which made the removal order
ambiguous.

**Group A — already unread today.** Verified absent from every component:
`trackA.prayBody`, `trackA.communityHeading`, `trackA.communityBody`,
`trackA.communityLink`, `trackA.learnHeading`, `trackA.learnBody`,
`trackA.streetHeading`, `trackA.streetBody`, `trackA.bands.week`,
`trackB.learnHeading`, `trackB.learnBody`.

**Group B — currently read; becomes unread only after the §3.1/§3.2 cuts land.**
Remove in the same change as the component edit that orphans it, never before:
`trackA.streetLinkLabel`, `trackB.readingPlanLabel`, `trackB.bands.deeper`,
`trackB.talkLabel`, `trackB.talkLink`, `trackB.talkUrl`.

**Added, not removed:** `trackB.reflectionHint` (§3.2.1), `nextSteps.ctaCommitted`,
`nextSteps.ctaThinking`, `nextSteps.metaTitle` (§3.3), and the footer key in §3.6.

Every removal must be asserted, not assumed — a bare `str.replace` that matches
nothing succeeds silently, and this repo has lost guards that way (`AGENTS.md`).

### 3.6 `/cards` reachability

**Correction from the first draft**, which called `/cards` "a live, sitemapped route".
It is not sitemapped: `cards/page.tsx` sets `robots: { index: false, follow: true }`
and `src/app/sitemap.ts` omits it. So this is not an SEO problem.

It is still a reachability problem. `/next-steps` is the only internal link to
`/cards`; the footer carries home, test, about, blog, learn, reading-plan and
find-a-church. Removing the row makes a deliberately-built page reachable only by
typing the URL.

Add one footer row in the resources column, directly after `find-a-church`
(`footer.tsx:200`), with a new key `footer.cardsLink` in both locales and the footer
messages type updated (`footer.tsx:7`). Do **not** reuse `trackA.streetLinkLabel` —
that string is written for a committed reader mid-discipleship ("Print cards"), and
the footer is read cold.

---

## 4. Owner rulings required

**Ruled 2026-08-11.** All four build decisions are settled; O5 is an action, not a build
choice.

| # | Ruling | Decision |
|---|---|---|
| O1 | Split `nextSteps.cta` per track | **Split, EN as proposed.** `ctaCommitted` = "Your first day", `ctaThinking` = "Things worth weighing", plus `nextSteps.metaTitle` taking over `page.tsx:33` and `:56`. **PT strings are outstanding — see below** |
| O2 | Cut paragraph 1 of `trackA.whatHappened` | **Cut.** The opener becomes what God did, then 2 Corinthians 5:17 |
| O3 | Church row placement | **Demote to "As you grow"**, first in that list. Today becomes the chapter and the prayer |
| O4 | The needGod row | **Remove.** Track B drops to John 3 and Learn. The footer keeps its needGod link |
| O5 | Write to Sociedade Bíblica de Portugal | Outstanding, and owed for the ARC already shipped regardless of this work (§5.3) |

**Outstanding on O1 and O2: the Portuguese.** Three new keys need PT strings
(`ctaCommitted`, `ctaThinking`, `metaTitle`), and O2's cut needs the PT paragraph
removed to match. Portuguese idiom belongs to the owner — `docs/METHOD.md` fixes `tu`
throughout, and the repo's own copy-review skill explicitly does not rewrite PT. The
plan will carry drafted PT marked for the owner's pass rather than shipping a missing
key, since `validateMessages` runs on both locales and a gap fails the build.

---

## 5. The licensing gate

### 5.1 The API path is not worth taking

An earlier draft said flatly that the API path was "dead" because the YouVersion
Platform catalogue carried neither translation. **That overstated the evidence, and a
second review pass caught it.** What is actually established: YouVersion's published
partner list omits both Thomas Nelson and Sociedade Bíblica de Portugal, and a read of
the public Bible directory surfaced 21 English versions without NKJV and 5 Portuguese
versions without ARC. What is *not* established: catalogue absence proven by an
authenticated query. The directory is dynamic, and YouVersion invites developers to ask
publishers to add missing versions. Likely absent is not the same as proven absent.

Similarly, API.Bible's mandatory FUMS usage tracking is documented and is a genuine
objection for a privacy-light site, but the claim that ARC is unavailable there is
**unverified** — its catalogue also requires a key.

None of this changes the decision, which is why the section is kept short. We do not
need an API at all. The passage set is fixed and known at build time:

| Day | Passage | Verses |
|---|---|---|
| 1 | John 1:1-18 | 18 |
| 2 | John 3:1-21 | 21 |
| 3 | John 4:1-26 | 26 |
| 4 | John 10:1-18 | 18 |
| 5 | John 14:1-14 | 14 |
| 6 | John 15:1-17 | 17 |
| 7 | John 20:1-31 | 31 |
| | **total** | **145** |

Both locales agree on all seven passages and on the continue-reading door (John 8).
The thinking track's John 3 passage is day 2's, so it adds nothing.

Static text in the repo beats an API on every axis here: no key, no rate limit, no
non-commercial covenant, no third-party runtime dependency, no request latency, works
offline, reviewable in a diff.

### 5.2 English probably clears the NKJV gratis allowance — but not by much, and not yet provably

HarperCollins Christian Publishing's gratis-use guidelines require all of: no more than
500 verses; Scripture not more than 25% of the total text; Scripture not more than 50%
of an entire book; not a commentary or reference work; properly cited.

**Three wordings of the book-extent condition are in circulation**, and the differences
between them are not ours to resolve. Thomas Nelson's own permissions page reads that
Scripture must not "account for an entire book of the Bible"; the formulation mirrored
on StudyLight, Blue Letter Bible and most NKJV front matter reads "do not amount to a
complete book of the Bible"; a third reading, found on the HarperCollins permissions
page, adds a 50% threshold. **We satisfy the strictest of the three**, so the spec
relies on that and does not lean on the 16.5%-of-John figure as evidence of anything.
The 500-verse and 25%-of-total-text conditions are common to all versions and
independently confirmed.

**The book-extent condition.** 145 verses is neither a complete book of John (21
chapters, 879 verses) nor half of one, so this condition is met under every circulating
wording. The percentage is deliberately *not* offered as licensing evidence — see the
note below.

**The 500-verse condition is the binding one, and we are closer to it than any earlier
draft admitted.** The cap applies to total Scripture quoted in the work, not to what a
feature adds. Counting distinct references across `src/messages/en.json` **and**
`src/content/blog/posts.ts` — the blog was missed on the first count — gives **97
distinct references spanning roughly 258 verses**. Adding the seven passages puts us at
**≈403 of 500: about 80% of the allowance consumed.**

That figure is an estimate in both directions. Some of the 97 are bare citations rather
than quotations, which would lower it; quoted text with no adjacent reference was not
counted, which would raise it. At 80% neither correction is small enough to wave away.

**Required before Phase 2:** a real count of quoted NKJV verses, not an estimate, and
test 8 (§9) guarding the site total. At this margin the honest move is probably to
request written permission regardless — HarperCollins grants it through a published
form with a six-to-eight-week turnaround, and having it removes the whole question.

Required notice, verbatim:

> Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson.
> Used by permission. All rights reserved.

**This notice does not currently appear anywhere in the repo** — no translation credit
exists in either locale, despite the app already quoting NKJV throughout. Adding it is
owed regardless of this feature, and should not wait for Phase 2.

### 5.3 Portuguese does not clear, and there is no free substitute

**ARC ownership is confirmed from the publisher's own text:** "Tradução de João Ferreira
de Almeida, Edição Revista e Corrigida. Copyright © 2001 Sociedade Bíblica de Portugal."
145 verses of a © 2001 translation requires permission. That much is settled.

**The 50-verse allowance is less settled than an earlier draft claimed.** A version of
biblia.pt's terms permits redistribution "até a um máximo de 50 (cinquenta) versículos
da Bíblia, considerado como exemplo de utilização justa", with a requirement to link
back to the platform, and names `l.fletcher@sociedade-biblica.pt` as the copyright
contact. A second pass against the *current* terms page could not locate that clause and
found only the general contact `info@sociedadebiblica.pt`. The clause may have been
revised, or the wording may survive only in mirrors of an earlier version.

This does not change the conclusion — permission is required because the text is under
copyright, not because of any allowance we do or do not fall outside. It does change the
action: **write to `info@sociedadebiblica.pt`**, the address SBP currently publishes,
rather than to a named lawyer whose listing may be stale.

If a permission is granted it may carry the link-back condition, so the reader component
should be able to render a source link alongside the attribution notice.

**No usable free fallback was found, though absence cannot be proven.** Searches of
eBible's copyright directory, Wikisource and Domínio Público turned up nothing that
qualifies: the public-domain Almeida editions (1819, 1848, 1911) are
pre-orthographic-reform and read as archaic; Bíblia Livre, Bíblia Portuguesa Mundial and
Almeida Corrigida Fiel are Brazilian; O Livro is Biblica-copyrighted and a dynamic
paraphrase, a register mismatch with ARC. Bíblia Para Todos is genuinely modern European
Portuguese but is SBP's own and carries no free licence.

None of those sources is an exhaustive registry, so this is "none found after a
reasonable search", not "none exists". It is enough to plan around and not enough to
assert.

**Action:** write to SBP (the biblia.pt terms name `l.fletcher@sociedade-biblica.pt`
as the copyright contact).

**Pre-existing exposure, flagged not created here:** the app already quotes ARC across
the test, grace, verdict, learn and blog. Whether that already exceeds the 50-verse
allowance has not been counted. It should be, and the same letter should cover it.

### 5.4 Consequence: the feature ships asymmetrically

**Recommended — EN first, PT on permission.** English gets in-page reading; the
Portuguese Read button keeps its bible.com link until SBP answers. The PT reader is no
worse off than today. This requires the reader component to support a per-locale
link-out mode, which it needs anyway as the permanent fallback.

Alternatives considered: waiting for SBP to ship both together (cleanest parity,
unbounded delay, answer may be no); or moving wholesale to public-domain translations
(removes all licence risk, costs the committed vocabulary the app is written in —
`docs/METHOD.md`). Neither is recommended.

---

## 6. Phasing

**Phase 1 — the revamp.** §3.1, §3.2, §3.3, §3.4, §3.5, §3.6, plus the §5.2
attribution notice. No external dependency; ships on owner rulings alone.

**Phase 2 — in-page reading, English.** §7. New component; PT continues to link out.

**Phase 3 — Portuguese in-page reading.** Only on written permission from SBP.
Flipping PT from link-out to inline is then a data change, not a code change.

Phase 1 must not be blocked on Phase 2. The one place they touched — the Today
destination count — is resolved in §3.1 by leaving the Full plan button alone in
Phase 1.

---

## 7. The reading component (Phase 2)

**New:** `src/components/shared/passage-reader.tsx`.

```ts
interface PassageText {
  /** Machine-readable range, e.g. { book: "JHN", chapter: 1, from: 1, to: 18 }.
      Kept structured so tests can assert the verses present match the range. */
  range: { book: string; chapter: number; from: number; to: number };
  /** Display reference in the reader's locale, e.g. "John 1:1-18". */
  reference: string;
  /** Ordered verses. `n` is the canonical verse number, never an index. */
  verses: { n: number; text: string }[];
}

type PassageSource =
  | { mode: "inline"; passage: PassageText; notice: string }
  | { mode: "linkOut"; href: string; label: string };
```

- Text lives in `src/content/passages/{locale}/{book}.{chapter}.json`, **not** in the
  message files. Message files are copy the owner edits; Scripture is licensed
  third-party text with an attribution obligation, and mixing them invites an
  accidental edit to a quoted verse. Keeps `i18n.ts:validateMessages` untouched.
- **Data ownership:** passages are read on the server in
  `next-steps/page.tsx` — the same place `readingDays` and `readingLabels` are already
  assembled — and passed down as props. The client component never imports passage
  JSON, so an unused locale's text never enters the bundle.
- **The thinking track needs a new prop.** `client.tsx:105` currently passes
  `TrackThinking` only `messages` and `locale`. It gains `passageSource` for John 3.
- **Missing passage file:** the server build fails. There is no runtime fallback and no
  empty state — a missing passage is a build error, not a degraded page.
- `mode: "linkOut"` renders exactly today's button. This is the PT path and the
  permanent fallback.
- Attribution notice renders once per page wherever inline text appears, at the foot of
  the reader, in the muted hint style.
- Verse numbers as `<sup aria-hidden="true">` so a screen reader gets continuous prose.
- Passage body uses the existing serif stack already declared in `globals.css`; adding
  a webfont is a new token and out of scope for this spec.

### 7.1 SSR, hydration and CLS — the binding constraint

`/next-steps` renders **both** tracks server-side and reveals one with CSS chosen
before first paint (`client.tsx:89-109`). That design exists because an earlier version
returned `null` and shifted 0.956 CLS. A collapsible full-chapter reader is exactly the
kind of thing that breaks it. These are requirements, not suggestions:

1. **The reader renders closed on the server, and closed on first client render, in
   every case.** No storage read, no journey read, no media query, nothing that can
   differ between server and client may influence its initial markup. Open state is
   `useState(false)`, changed only by a user gesture.
2. **Passage text is not in the server payload.** The closed reader renders its control
   only. Verses mount on open, after hydration. This is what makes requirement 1
   trivially true, and it also stops the hidden track from carrying a chapter of text
   it will never show — both tracks are always in the DOM.
3. **Opening is allowed to change page height.** It is a user gesture, so it is not
   CLS. Nothing may change height *without* a gesture.
4. **The day shown must not change after hydration.** `useJourney()` reports
   `readingDone: 0` on the server and first client render, resolving to the real value
   in a layout effect (`use-journey.ts:24`, `:62`). `currentDay()` therefore returns day
   1 initially and may swap to day 4 a frame later. Today that only changes text inside
   a fixed ticket. With a passage attached it could change the reader's whole contents.
   The reader takes its passage from the **same already-resolved `currentDay()` value
   the Read card uses** (`track-committed.tsx:97`) and must reserve no geometry of its
   own while closed — the closed control is a fixed-height row.
5. A test must assert requirements 1 and 2 by rendering the track to static markup and
   checking that no verse text is present and the reader's open attribute is false.

### 7.2 Marking the day read

The committed track gains an `I've read it — mark day N` control **inside** the open
reader, calling the existing `markDayRead(day)` (`reading-storage.ts:25`, localStorage
key `gospel-reading-progress`). No new state, no new storage key.

**Failure path — omitted from the first draft.** `markDayRead` returns `false` when the
write fails (private mode, quota), and `reading-plan.tsx:92` already halts on that. The
reader must do the same: on `false`, leave the day unmarked, do not fire the analytics
event, and surface a short inline message rather than a success state. A silent success
here would desynchronise the ticket, the homepage band and `/reading-plan`, all of which
read the same key.

On success, `useJourney().readingDone` updates, `currentDay()` advances, and the card
names tomorrow's passage — resolved through `currentDay()`, never hardcoded. On day 7
there is no next day: `currentDay()` returns undefined and the card falls back to the
plan's own continue-reading door (John 8), which is the behaviour
`track-committed.tsx:98` already implements.

---

## 8. Analytics

`trackNextStepsActionClicked` (`discipleship-analytics.ts:7`) takes `action` and
`track` only.

- `"cards"` and `"talk"` become unreachable. **Leave them in the union** — historical
  events exist and narrowing the type discards the ability to read them back. Comment
  why.
- Add two events rather than overloading the existing one, because they carry a day
  number the current signature has no room for:
  `trackPassageOpened(day: number, track)` → `passage_opened`, and
  `trackPassageMarkedRead(day: number)` → `passage_marked_read`.
- This makes the funnel that matters measurable for the first time: arrived → opened →
  marked read. Nobody publishes what fraction of post-decision readers actually read
  Scripture.
- Capture is a no-op outside production (`posthog.ts:52-54`).

---

## 9. Test impact

Runner: `vitest run` (`package.json:11`). Read the **whole** output — `| tail -3` has
hidden a failure in this repo before (`AGENTS.md`).

| File | What happens |
|---|---|
| `decision-routes.test.ts:65-69, 76-78, 89-98` | Routing predicate and hold timings unchanged. Re-run to confirm; do not edit |
| `home-reading-band.test.ts:31-35, 49-59` | Pins `DayTicketBody` import and `currentDay()` resolution on the committed track. Both survive Phase 1 |
| `home-spine.test.ts:82-96` | Pins `BandHeader` over `BandSpine`. Survives — bands stay |
| `page-shell.test.ts:23` | Pins `/next-steps` to narrow width. Survives |
| `graphics.test.ts` | The decision-door assertions begin at line 104, not 96 as the first draft claimed; line 96 is asset-budget history. Extend the door block for the new dawn asset |
| `i18n-validate.test.ts:13-18` | Runs `validateMessages` on both locales. Key removals must not break required-key checks |
| `stage-prepaint.test.ts:44`, `stage-css.test.ts:59` | Check attribute and CSS visibility only — **not layout**. They will pass even if §7.1 is violated. This is why test 6 below exists |

**New tests:**

1. **Locale key parity** — symmetric diff between `en.json` and `pt.json`. None exists
   today; `validateMessages` only checks named keys. This change removes seventeen keys
   and adds five across two files.
2. **Every Group A and Group B key is gone**, and no component references it.
3. **`/cards` is linked from the footer** — the reachability guard, so a future cut
   cannot silently strand it again.
4. **The needGod URL appears in the footer and not on the thinking track.**
5. **Reflection chain:** exactly one armed item; acknowledging arms the next; pending
   items stay in the DOM with `aria-disabled`; no content below is gated.
6. **§7.1 SSR contract:** render each track to static markup and assert no verse text
   is present and the reader is closed. This is the test that would actually catch a
   CLS regression, because the existing pre-paint tests cannot.
7. **Phase 2 passage data:** verses present are contiguous and match `range`; the
   attribution notice string renders wherever `mode: "inline"` does.
8. **Phase 2 verse budget — the whole work, not just the passage files.** The gratis cap
   is 500 verses of NKJV across the entire site, and §5.2 estimates roughly 234 already
   quoted before this feature adds 145. The test must therefore sum the passage files
   *and* the verses quoted in `en.json`, and fail above an agreed ceiling well short of
   500. This turns a licensing constraint into a mechanical check, and it is the test
   that stops a future blog post from quietly breaching the allowance.

---

## 10. Method compliance

Checked against `docs/METHOD.md` §"How to use this":

1. **Which step?** Step 6, after the decision. Discipleship, plain and warm.
2. **Removes something the next step depends on?** No. Church, learn and share survive;
   only print-cards leaves the page, and it gains a footer home.
3. **Moves grace earlier or the Law later?** No. Nothing before the decision changes.
4. **Makes declining harder, or a tap look like it saves?** No. The decision screen is
   untouched; dismissed keeps both doors; "Today is the beginning" is unchanged.
5. **Renames or re-themes a committed term?** No. "Test", "But God…", "Someone paid your
   fine", "Seven days in John", "Honest answers", "Pass it on", "The Law" all untouched.

The courtroom does not extend past the decision anywhere in this work. Dawn, not parole.

---

## 11. Risks

- **The 25%-of-total-text test is a judgment, not a measurement.** The margin is wide,
  but "the work" is undefined for a website and HarperCollins publishes no website
  guidance. Mitigation: ask in the same letter as §5.3; test 8 keeps the count honest.
- **SBP may decline, or not answer.** Phase 3 then never ships and PT keeps link-out
  permanently. Phases 1 and 2 are unaffected by design.
- **Asymmetric locales are a real cost.** A PT reader gets a worse page than an EN one
  while Phase 3 is pending. Accepted, because the alternative is that neither improves.
- **In-page reading is a hypothesis, not a measured win.** No organisation publishes
  what fraction of post-decision readers go on to read Scripture. The argument is
  mechanical — a broken Back button and a new tab are known task-completion hazards —
  not empirical. §8's events are how we find out.
- **Analytics cannot adjudicate any of this yet.** Roughly 14 distinct people in 90 days
  and zero recorded reading-day completions. Ship on reasoning; measure later.

---

## 12. Rejected alternatives

- **YouVersion Platform API** — catalogue carries neither NKJV nor ARC (§5.1).
- **API.Bible** — same ARC problem, plus mandatory FUMS tracking beacons.
- **Public-domain translations everywhere** — costs the committed vocabulary to solve a
  problem English does not have.
- **Persisting the reflection chain** — a returning reader would arrive at three
  greyed-out lines with nothing armed (§3.2.1).
- **Email capture at the decision point** — what every organisation at this scale
  depends on, and the honest answer to "what brings the reader back". Also flatly at
  odds with this codebase's refusal to put the reader's stage in a URL because the site
  "is read in places where that is not a safe thing to leave lying around". A
  permission-gated web push reminder carrying tomorrow's chapter is the
  privacy-preserving shape of the same idea. **Out of scope; worth its own spec.**
- **Auto-advancing into `/next-steps` when the hold ends** — removes the reader's
  control of pace on the one screen that must not push.

---

## 13. Review log

This spec was reviewed adversarially twice — once by an in-repo reviewer agent, once by
Codex — before being circulated. Both found the same central error independently. What
changed:

| Finding | Fix |
|---|---|
| Reflection chain claimed to reuse `day-card.tsx:34-50`. It does not; that code syncs expansion to a prop and scrolls. Nothing in the repo does this | §3.2.1 rewritten as a full new-behaviour spec, with the false claim recorded |
| `/cards` called "live, sitemapped". It is `robots: index:false` and absent from `sitemap.ts` | §3.6 corrected; the argument is reachability, not SEO |
| `nextSteps.cta` also serves page metadata at `page.tsx:33` and `:56`; splitting it would leave the page titleless | §3.3 adds `nextSteps.metaTitle` |
| "Today becomes exactly two moves" — ignored the `readPlanLabel` button in the Read card | §3.1 corrected; Full plan stays in Phase 1 |
| `markDayRead` returns `false` on failure; no error path specified | §7.2 adds the failure contract |
| Group A and Group B locale keys conflated, making removal order ambiguous | §3.5 split |
| No SSR/hydration contract for the collapsible reader, on a page whose zero-CLS design depends on both tracks being fully server-rendered | §7.1 added as a binding constraint, with test 6 |
| "19 outbound `target=_blank` links in the locale files" — it is 18 URLs, and the attribute is set in components | §1 corrected |
| `graphics.test.ts:96` misattributed | §9 corrected to line 104 |
| Analytics wanted a day number the existing signature cannot carry | §8 adds two new events instead of overloading |
| Passage data ownership, thinking-track props, missing-file behaviour all unspecified | §7 |

### Second pass — the external claims

The first two reviews were both scoped to the codebase, which left every licensing and
catalogue claim resting on the same research pass that produced it. A third review
attacked those specifically. It is the pass that found the most damaging errors, and the
lesson is that the researcher should never be the only reviewer of its own research.

| Finding | Fix |
|---|---|
| The 500-verse cap applies to the whole work; existing quotation must count. Independently reached here and confirmed there — and it found NKJV quotation in `src/content/blog/posts.ts` that the first count missed entirely | §5.2 recounted: 97 references, ~258 verses, ≈403 of 500 |
| "The API path is dead" claimed catalogue absence as proven. The partner list omits both publishers, but that is not an authenticated catalogue query, and the directory is dynamic | §5.1 retitled and downgraded to "likely absent, not proven" |
| The 50%-of-a-book test may not exist — Thomas Nelson's own page says "an entire book". Three wordings are in circulation | §5.2 now relies on the strictest wording and drops the 16.5% figure as evidence |
| SBP's 50-verse clause could not be found on the current terms page, and the named lawyer contact is not what SBP currently publishes | §5.3 rewritten; the letter goes to `info@sociedadebiblica.pt`, and the argument rests on copyright rather than on the allowance |
| "No free European-Portuguese translation exists" is an unprovable absolute | §5.3 downgraded to "none found after a reasonable search" |
| "needGod.net offers only a contact form" is false — it invites Instagram and Facebook messages | §3.2 corrected; O4 reframed as a real ruling with a keep-and-relabel alternative |
| API.Bible's ARC absence was asserted without a source | §5.1 marked unverified; the FUMS objection stands |
