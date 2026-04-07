# Discipleship Path — Post-Decision Follow-Up

## Problem

After someone responds to the gospel invitation ("I prayed" or "I want to think about it"), the site shows 2-3 external resource links and share buttons. The moment of highest intent is met with an exit ramp. There's no on-site follow-up, no next steps, no reason to return.

## Solution

Build a "What Now?" page and a 7-day reading plan that give new believers (and those still thinking) a guided path forward — all on-site, anonymous, no account needed.

## Constraints

- No auth / no user accounts
- Progress tracked in localStorage
- No email collection (may add later)
- Church finder: 9Marks search for EN, custom Google Maps list for PT

---

## Feature 1: "What Now?" Page

**Route:** `/{locale}/next-steps`

**Entry points:**
- InvitationScreen (test flow) — after user responds, a prominent "What Now?" CTA appears above existing resource links.
- Chat invitation — same as test flow. InvitationScreen is shared, so both flows get the CTA automatically.
- ~~Eternity grace section~~ — **not added here.** Eternity flow keeps its single "Take the test" CTA. Next-steps only appears after an explicit invitation response.

**Two tracks based on invitation response:**

### Track A: "I prayed"
1. **Welcome message** — short, warm: "Something just changed. Here's what happened and what to do next."
2. **What just happened** — 2-3 short paragraphs: you acknowledged sin, trusted Christ, God forgave you. Scripture references (2 Cor 5:17, Rom 10:9-10).
3. **Your first steps** (3 action cards):
   - **Read** — "Start with the Gospel of John" → link to Bible.com John 1 (NKJV). "Or follow our 7-day reading plan" → link to `/{locale}/reading-plan`.
   - **Pray** — "Talk to God like a Father. Here's a simple way to start." Short prayer prompt.
   - **Find community** — EN: link to 9Marks church search. PT: link to user's custom Google Maps list.
4. **Share your decision** (optional) — same ShareButtons component, different message text: "I just made a decision that changes everything."

### Track B: "I want to think about it"
1. **Acknowledgment** — "That's honest. Here are some things worth thinking about."
2. **Reflection prompts** — 3 honest, non-pressuring questions that respect the person's intelligence. E.g., "If what you heard is true, what would that change for you?" No manipulation, no guilt-tripping — let the truth do the work.
3. **One key reading** — "Read John 3 when you're ready." Link to Bible.com.
4. **Come back anytime** — "This site will be here. Bookmark it, or start the reading plan when you're ready." Link to reading plan.

### Visual treatment
- Same dark theme as the rest of the site.
- Gold accent for Track A (celebration), neutral/white accent for Track B (gentler).
- Staggered reveal animations (matching grace beats pattern — fade+rise on scroll).
- Each action card is a rounded card with icon, heading, and description.

---

## Feature 2: 7-Day Reading Plan

**Route:** `/{locale}/reading-plan`

**Entry points:**
- "What Now?" page (primary)
- Direct link (can be bookmarked)
- Future: CTA section on eternity page

### Structure

Each day has:
- **Day number** (Day 1 of 7)
- **Title** (e.g., "The Beginning")
- **Bible passage reference** with link to Bible.com
- **Key verse** (quoted inline)
- **Reflection** — 2-3 sentences connecting the passage to the gospel message the user just heard
- **Prayer prompt** — 1-2 sentences suggesting what to pray about today

### Content (7 days)

| Day | Title | Passage | Theme |
|-----|-------|---------|-------|
| 1 | The Beginning | John 1:1-18 | Who Jesus is — the Word made flesh |
| 2 | Born Again | John 3:1-21 | What it means to be born again |
| 3 | Living Water | John 4:1-26 | Jesus meets you where you are |
| 4 | The Good Shepherd | John 10:1-18 | Jesus lays down His life for you |
| 5 | The Way | John 14:1-14 | The only way to the Father |
| 6 | The Vine | John 15:1-17 | Abiding in Christ daily |
| 7 | Risen | John 20:1-31 | The resurrection and what it means |

I'll draft the full reflection + prayer content for each day in the i18n JSON. You review and provide PT translation.

### Interaction model

- Single scrollable page showing all 7 days.
- Each day is a card. Completed days are dimmed (like grace beats pattern).
- "Mark as read" button on each day — stores completion in localStorage key `gospel-reading-progress` as `{ "1": true, "2": true, ... }`.
- Progress indicator at the top: "Day 3 of 7" with a progress bar.
- Current day is highlighted/active. Past days are dimmed. Future days are visible but not locked (user can read ahead).
- No daily gating — all content is visible. The "mark as read" is a self-pacing tool, not a lock.

### Visual treatment

- Same dark theme, gold accents.
- Each day card: rounded border, left gold accent stripe for current day, dimmed for completed.
- Bible passage reference styled as a gold link.
- Key verse in italic blockquote with gold left border (matching grace scripture pattern).
- Progress bar at top: gold filled segments (matching quiz progress bar pattern but gold instead of red).

---

## Feature 3: Updated Invitation Flow

**Files modified:**
- `src/components/invitation-screen.tsx` — add "What Now?" CTA
- `src/messages/en.json` / `pt.json` — add next-steps messages

### Changes

After the user selects a response in InvitationScreen:
- **Current:** Shows resource links + share buttons.
- **New:** Shows a prominent "What Now?" button above the resource links. Button links to `/{locale}/next-steps?track=prayed` or `?track=thinking` based on response.
- Resource links and share buttons remain below as secondary options.
- "Not for me" response: no "What Now?" CTA, but add a soft return line: "Changed your mind? The reading plan is always open." with a link to `/{locale}/reading-plan`. Gentle, not pushy.

---

## i18n Keys

New top-level keys in `en.json` / `pt.json`:

```
nextSteps: {
  trackA: { welcome, whatHappened, readHeading, readBody, prayHeading, prayBody, prayPrompt, communityHeading, communityBody, communityLink, communityLinkLabel, shareHeading, shareMessage }
  trackB: { acknowledgment, reflections: [string, string, string], readingHeading, readingBody, comeBack }
  cta: string  // "What now?" button label
  dismissedReturn: string  // "Changed your mind? The reading plan is always open."
}

readingPlan: {
  heading: string
  subtitle: string
  progressLabel: string  // "Day {current} of {total}"
  markReadLabel: string
  completedLabel: string
  days: [
    { title, passage, passageUrl, keyVerse, keyVerseRef, reflection, prayer }
    // × 7
  ]
}
```

---

## Church Finder Links

- **EN:** `https://www.9marks.org/church-search/` — 9Marks church search
- **PT:** `https://maps.app.goo.gl/NMMMdeJa5H5BR5Vp9` — curated Google Maps list

---

## Analytics

New events:
- `next_steps_viewed` — { track: "prayed" | "thinking", locale }
- `next_steps_action_clicked` — { action: "read" | "pray" | "community" | "share" | "reading_plan", track }
- `reading_plan_viewed` — { locale }
- `reading_plan_day_completed` — { day: number, locale }
- `reading_plan_completed` — { total_days: 7, locale }

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/[locale]/next-steps/page.tsx` | "What Now?" page (server component, renders track A or B) |
| `src/components/next-steps/track-prayed.tsx` | Track A content |
| `src/components/next-steps/track-thinking.tsx` | Track B content |
| `src/app/[locale]/reading-plan/page.tsx` | 7-day reading plan page |
| `src/components/reading-plan/reading-plan.tsx` | Main reading plan component |
| `src/components/reading-plan/day-card.tsx` | Individual day card |
| `src/lib/reading-storage.ts` | localStorage read/write for plan progress |
| `src/lib/discipleship-analytics.ts` | Analytics events for next-steps + reading plan |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/invitation-screen.tsx` | Add "What Now?" CTA after response |
| `src/messages/en.json` | Add nextSteps + readingPlan keys |
| `src/messages/pt.json` | Same (PT translation) |

---

## Verification

1. Complete the /test quiz → respond "I prayed" → see "What Now?" button → click → see Track A content with 3 action cards.
2. Respond "I want to think about it" → "What Now?" → Track B with reflections + reading link.
3. Visit /reading-plan → see 7 days with progress bar → mark Day 1 as read → refresh page → Day 1 still marked.
4. Complete all 7 days → see completion state.
5. Verify PT locale renders Portuguese content on all new pages.
6. Verify analytics events fire for each interaction.
