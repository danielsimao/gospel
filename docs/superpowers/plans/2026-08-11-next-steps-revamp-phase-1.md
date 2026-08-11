# /next-steps Revamp — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut `/next-steps` to what a first day needs, and make the transition into it mean something, without touching anything that depends on a Scripture licence.

**Architecture:** Edits to two existing track components, the invitation screen, the footer and both locale files. One genuinely new behaviour — the thinking track's reflection chain — which nothing in the repo currently does. No new routes, no new data sources, no network calls. The dawn atmosphere is a CSS radial gradient in the existing "crossroads atmosphere" idiom rather than a new image asset, so the asset budget and the flow-graphic tests are untouched.

**Tech Stack:** Next.js 16.2.1 (App Router), React, framer-motion (`m` namespace), Tailwind, vitest.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-08-10-next-steps-revamp-design.md`. Phase 1 is §3.1–§3.6. Do not implement §7 (the passage reader) — it is licence-gated.
- **Method:** `docs/METHOD.md` governs copy and flow. The courtroom stops at the decision: no probation, no record-keeping, no "going straight" language anywhere in this work.
- **Never change:** the decision screen's three answers, `CHOICE_GUARD_MS` (950), `COMMITTED_HOLD_MS` (2000), "Today is the beginning.", either mortality line, or the `data-journey-stage` pre-paint design.
- **Both locales, always.** `src/lib/i18n.ts:validateMessages` runs against `en.json` and `pt.json`. A key added to one and not the other fails the build.
- **Portuguese idiom is the owner's.** Where this plan supplies PT strings they are drafts, marked in the commit body for the owner's pass. Do not invent PT copy beyond what is given here.
- **Test idiom:** this repo's tests read component source with `readFileSync` and assert against it with regex — see `src/__tests__/home-reading-band.test.ts`. Follow that pattern. Do not introduce React Testing Library.
- **Run the whole test output.** `vitest run`, never `| tail -3` — that has hidden a failure in this repo before (`AGENTS.md`).
- **Assert every scripted edit matched.** A `str.replace` that matches nothing succeeds silently; this repo has lost guards that way.
- **Ease token:** `EASE_OUT_STRONG` = `[0.16, 1, 0.3, 1]` (`src/lib/motion.ts:5`); CSS equivalent `var(--ease-out-strong)` (`src/app/globals.css:64`).
- **Colours:** gold `#D4A843`, red `#ef4444`. Gold is post-decision only.

---

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `src/__tests__/locale-parity.test.ts` | **new** — symmetric key diff between locales; the guard every later key edit relies on | 1 |
| `src/messages/en.json`, `src/messages/pt.json` | copy; keys removed and added | 2, 3, 4, 5, 6, 7 |
| `src/app/[locale]/(content)/next-steps/page.tsx` | server: metadata + schema title source | 3 |
| `src/components/invitation-screen.tsx` | the decision, the hold, the way on, the door | 3, 8 |
| `src/lib/types.ts` | the `Messages` shape the invitation screen reads | 3 |
| `src/components/next-steps/track-committed.tsx` | committed arrival: opener, Today, As you grow, share disclosure | 4, 8 |
| `src/components/next-steps/track-thinking.tsx` | thinking arrival: reflections, John 3, Learn | 5, 6 |
| `src/components/shared/footer.tsx` | resources column; the `/cards` reachability fix | 7 |
| `src/__tests__/next-steps-revamp.test.ts` | **new** — pins the cuts so they cannot silently return | 4, 5, 6, 7 |

---

## Task 1: The locale parity guard

Written first because every later task edits both locale files, and there is no
symmetric-diff test today — `validateMessages` only checks named keys. Both files
currently hold 376 keys and are already symmetric, so this test passes on arrival. That
is expected: it is a regression guard, not a red-green cycle.

**Files:**
- Create: `src/__tests__/locale-parity.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing importable. Later tasks rely on it failing if they touch one locale and not the other.

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The two locale files must carry the same keys.
 *
 * validateMessages checks a named list and nothing else, so a key added to one
 * locale and forgotten in the other reached production as an undefined render.
 * This is the whole-file version: every path, both directions.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => JSON.parse(readFileSync(join(ROOT, ...p), "utf8"));

const en = read("src", "messages", "en.json");
const pt = read("src", "messages", "pt.json");

/** Every leaf path. Arrays collapse to `[]` so a differing length is not a diff —
    reflections and days legitimately differ in count between locales. */
function keyPaths(node: unknown, prefix = ""): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((v) => keyPaths(v, `${prefix}[]`)).concat(`${prefix}[]`);
  }
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => keyPaths(v, `${prefix}.${k}`));
  }
  return [prefix];
}

describe("locale key parity", () => {
  it("en and pt carry identical key sets", () => {
    const enKeys = new Set(keyPaths(en));
    const ptKeys = new Set(keyPaths(pt));
    const missingInPt = [...enKeys].filter((k) => !ptKeys.has(k)).sort();
    const missingInEn = [...ptKeys].filter((k) => !enKeys.has(k)).sort();

    expect(missingInPt, "keys present in en.json but missing from pt.json").toEqual([]);
    expect(missingInEn, "keys present in pt.json but missing from en.json").toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and confirm it passes**

Run: `npx vitest run src/__tests__/locale-parity.test.ts`
Expected: PASS, 1 test. Both files are symmetric today.

- [ ] **Step 3: Prove the guard actually bites**

Temporarily add `"__parity_probe": "x"` to the top level of `src/messages/en.json` only, re-run the test, and confirm it FAILS reporting `.__parity_probe`. Then remove the probe and re-run to confirm PASS. A guard that has never been seen to fail is not a guard.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/locale-parity.test.ts
git commit -m "test(i18n): the two locale files must carry the same keys

validateMessages checks a named list, so a key added to one locale and
forgotten in the other rendered as undefined rather than failing. This is the
whole-file version, both directions, and it goes in ahead of a change that
edits seventeen keys across both files."
```

---

## Task 2: Remove the eleven already-dead keys

Group A from spec §3.5 — keys no component reads today. Pure deletion, no component
change, so it lands on its own and cannot be confused with the behavioural cuts.

**Files:**
- Modify: `src/messages/en.json`, `src/messages/pt.json`

**Interfaces:**
- Consumes: the parity test from Task 1.
- Produces: nothing.

- [ ] **Step 1: Confirm each key really is unread**

Run, and expect **no output** for every one:

```bash
for k in prayBody communityHeading communityBody communityLink learnHeading learnBody streetHeading streetBody; do
  echo "--- $k"
  grep -rn "\.$k\b" src --include='*.tsx' --include='*.ts' | grep -v __tests__ || true
done
grep -rn "bands\.week" src --include='*.tsx' --include='*.ts' || true
```

`learnHeading` and `learnBody` exist under **both** `trackA` and `trackB`; both copies go.

If any grep prints a hit, STOP — that key is live and the spec is wrong about it. Report it rather than deleting.

- [ ] **Step 2: Delete the keys from both locale files**

Remove from `nextSteps.trackA`: `prayBody`, `communityHeading`, `communityBody`, `communityLink`, `learnHeading`, `learnBody`, `streetHeading`, `streetBody`, and `bands.week`.
Remove from `nextSteps.trackB`: `learnHeading`, `learnBody`.

Eleven keys per locale, twenty-two deletions total.

- [ ] **Step 3: Verify the count, do not assume it**

```bash
python3 - <<'PY'
import json
for loc in ("en","pt"):
    d=json.load(open(f"src/messages/{loc}.json"))
    a=d["nextSteps"]["trackA"]; b=d["nextSteps"]["trackB"]
    gone=[k for k in ("prayBody","communityHeading","communityBody","communityLink",
                      "learnHeading","learnBody","streetHeading","streetBody") if k in a]
    assert not gone, (loc, "trackA still has", gone)
    assert "week" not in a["bands"], (loc, "bands.week survived")
    assert "learnHeading" not in b and "learnBody" not in b, (loc, "trackB keys survived")
    print(loc, "clean")
PY
```

Expected: `en clean` / `pt clean`. An assertion error means the edit missed.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: PASS, including `locale-parity` and `i18n-validate`.

- [ ] **Step 5: Commit**

```bash
git add src/messages/en.json src/messages/pt.json
git commit -m "chore(i18n): eleven keys nothing has read for months

Copy that survived the components that once rendered it -- a pray body the
card stopped showing, community and learn headings the rows replaced, the
street block's prose, and a 'This week' band that never shipped. Verified
unread by grep before deletion rather than by memory."
```

---

## Task 3: Split the CTA, and give the page its own title (O1)

`nextSteps.cta` is doing two jobs: the button label on the invitation screen, and the
page's metadata title in two places. Splitting the label without replacing the title
would leave the page untitled.

**Files:**
- Modify: `src/messages/en.json`, `src/messages/pt.json`
- Modify: `src/app/[locale]/(content)/next-steps/page.tsx:33`, `:56`
- Modify: `src/components/invitation-screen.tsx:380`
- Modify: `src/lib/types.ts` (the `nextSteps` shape on `Messages`)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: locale keys `nextSteps.ctaCommitted`, `nextSteps.ctaThinking`, `nextSteps.metaTitle`. Task 4 and Task 5 do not use them; nothing else depends on this task.

- [ ] **Step 1: Find how `nextSteps` is typed**

Run: `grep -n "nextSteps" src/lib/types.ts`

Note the shape. If `cta` is declared there, it is replaced by the three new fields in Step 3. If `nextSteps` is not typed there, run `grep -rn "nextSteps" src/lib/types.ts src/lib/i18n.ts` and update whichever declares it.

- [ ] **Step 2: Add the three keys to both locale files**

In `en.json` under `nextSteps`, replace `"cta": "What now?"` with:

```json
"ctaCommitted": "Your first day",
"ctaThinking": "Things worth weighing",
"metaTitle": "Next steps",
```

In `pt.json` under `nextSteps`, replace `"cta": ...` with the following **drafts, flagged for the owner's pass** — `tu` throughout per `docs/METHOD.md`:

```json
"ctaCommitted": "O teu primeiro dia",
"ctaThinking": "Vale a pena pensar nisto",
"metaTitle": "Próximos passos",
```

- [ ] **Step 3: Update the type**

Replace the `cta: string;` field on the `nextSteps` shape with:

```ts
ctaCommitted: string;
ctaThinking: string;
metaTitle: string;
```

- [ ] **Step 4: Point the metadata at the new key**

In `src/app/[locale]/(content)/next-steps/page.tsx`, both occurrences:

```ts
    title: data.nextSteps.cta,
```

become:

```ts
    title: data.nextSteps.metaTitle,
```

There are exactly two — one in `generateMetadata` (line 33), one in `buildWebPageSchema` (line 56). Confirm with `grep -n "nextSteps.cta" src/app/\[locale\]/\(content\)/next-steps/page.tsx` returning nothing afterwards.

- [ ] **Step 5: Branch the button label**

In `src/components/invitation-screen.tsx`, inside the `invitationResponse !== "dismissed" && onwardReady` block:

```tsx
                      {messages.nextSteps.cta}
```

becomes:

```tsx
                      {invitationResponse === "committed"
                        ? messages.nextSteps.ctaCommitted
                        : messages.nextSteps.ctaThinking}
```

- [ ] **Step 6: Confirm nothing still reads the old key**

Run: `grep -rn "nextSteps\.cta\b" src --include='*.ts' --include='*.tsx'`
Expected: no output.

- [ ] **Step 7: Run the full suite and the type check**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: both PASS. If `tsc` complains about `nextSteps.cta`, a call site was missed.

- [ ] **Step 8: Commit**

```bash
git add src/messages/en.json src/messages/pt.json src/lib/types.ts \
        "src/app/[locale]/(content)/next-steps/page.tsx" src/components/invitation-screen.tsx
git commit -m "feat(decision): the door names what it opens

One label served two readers. A person who has just said they will repent and
trust in Christ and a person who wants to think about it were both offered
'What now?', which is a question neither of them asked.

The same key was also the page's metadata title in two places, so splitting it
needed a third key rather than a rename -- metaTitle takes that job.

Portuguese is drafted, not settled; it needs the owner's pass."
```

---

## Task 4: The committed track — cut the recap, demote the church, fold the share (O2, O3)

**Files:**
- Modify: `src/components/next-steps/track-committed.tsx`
- Modify: `src/messages/en.json`, `src/messages/pt.json` (O2's paragraph, in both)
- Create: `src/__tests__/next-steps-revamp.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the test file that Tasks 5, 6 and 7 extend.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/next-steps-revamp.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * What came off the two tracks, and must not drift back on.
 *
 * The page was a menu -- seven destinations on the committed track, five on
 * the thinking one -- and every cut here was argued for in
 * docs/superpowers/specs/2026-08-10-next-steps-revamp-design.md. These pin the
 * cuts themselves, because a removed row is exactly the kind of thing a later
 * change restores without noticing.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const committed = strip(read("src", "components", "next-steps", "track-committed.tsx"));
const en = JSON.parse(read("src", "messages", "en.json"));
const pt = JSON.parse(read("src", "messages", "pt.json"));

describe("the committed track", () => {
  it("no longer sends a new believer to print evangelism cards", () => {
    // Street evangelism on day one is the 'as you grow' of as-you-grow. The
    // route survives; the footer carries it (see the footer test below).
    expect(committed, "the print-cards row came back").not.toMatch(/\/cards/);
    expect(committed).not.toMatch(/streetLinkLabel/);
    expect(committed, "the cards analytics action came back").not.toMatch(/"cards"/);
  });

  it("opens on what God did, not on what the reader just did", () => {
    // The cut paragraph recapped the reader's own decision -- the same
    // restatement removed from grace's first beat on 2026-07-31.
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      const paras = msgs.nextSteps.trackA.whatHappened.split("\n\n");
      expect(paras, `${name} whatHappened should be two beats, not three`).toHaveLength(2);
      expect(
        paras[0],
        `${name} still opens by recapping the reader's decision`,
      ).not.toMatch(/you'?ve made the decision|fizeste a decisão|decidiste/i);
    }
  });

  it("keeps church, but below the day's work", () => {
    // Read, pray, fellowship is the method's own follow-up triad, so the row
    // survives. It just stops competing with the one thing to do today.
    expect(committed, "the church row was removed, not demoted").toMatch(/find-a-church/);
    const growBand = committed.indexOf("messages.bands.grow");
    const church = committed.indexOf("find-a-church");
    expect(growBand, "the grow band header is gone").toBeGreaterThan(-1);
    expect(church, "the church row is still above the grow band").toBeGreaterThan(growBand);
  });

  it("folds the share block behind a disclosure", () => {
    // It was roughly a third of the page, always open, while the reader was
    // being asked to read one chapter.
    expect(committed, "share is not behind a disclosure").toMatch(/aria-expanded=\{shareOpen\}/);
    expect(committed).toMatch(/aria-controls="next-steps-share"/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/__tests__/next-steps-revamp.test.ts`
Expected: FAIL — four failures. The cards row, the three-paragraph copy, the church position and the missing disclosure.

- [ ] **Step 3: Cut the recap paragraph in both locales**

In `en.json`, `nextSteps.trackA.whatHappened` currently begins:

> You acknowledged that you've broken God's Law. And you've made the decision to repent — to turn from your sin — and to place your trust in Jesus Christ alone.\n\n

Delete that first paragraph and the `\n\n` that follows it, so the value now begins "If you've genuinely repented…". Do the same to the corresponding first paragraph in `pt.json`. Do not touch the remaining two beats in either locale.

- [ ] **Step 4: Remove the print-cards row**

In `track-committed.tsx`, delete the entire `<Link href={`/${locale}/cards`} …>` block inside the "As you grow" list — the one rendering `messages.streetLinkLabel` with the `Printer` icon. Remove `Printer` from the `lucide-react` import. Remove `streetLinkLabel` from the `TrackCommittedMessages` interface.

- [ ] **Step 5: Move the church row into the grow band**

Cut the `<Link href={`/${locale}/find-a-church`} …>` block from the "Today" band and paste it as the **first** child of the `flex flex-col gap-2` list inside the "As you grow" band, above the Learn row. Keep its markup byte-identical apart from position — same classes, same icon, same analytics call.

- [ ] **Step 6: Put the share block behind a disclosure**

Add to the component's imports and state:

```tsx
import { useEffect, useState } from "react";
import { BookOpen, HeartHandshake, Users, Compass, Share2 } from "lucide-react";
```

```tsx
  // The share block was about a third of the page, permanently open, while
  // the reader was being asked to do one thing. It is still here; it just
  // waits to be wanted.
  const [shareOpen, setShareOpen] = useState(false);
```

Replace the wrapper `<div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">` and its closing tag with:

```tsx
        <button
          type="button"
          onClick={() => setShareOpen((open) => !open)}
          aria-expanded={shareOpen}
          aria-controls="next-steps-share"
          className="group mt-2 flex min-h-[48px] w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left text-sm font-semibold text-white/70 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-[#D4A843]/35 hover:bg-white/[0.045] hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <Share2 className="size-4 shrink-0 text-white/40" aria-hidden="true" />
          <span className="flex-1">{messages.shareHeading}</span>
          <span aria-hidden="true" className="text-white/30">{shareOpen ? "−" : "+"}</span>
        </button>
        {shareOpen && (
          <div id="next-steps-share" className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">
            {/* …the existing ShareButtons block and story-image preview, unchanged… */}
          </div>
        )}
```

Move the existing `<ShareButtons …>` element and the story-preview `<div className="mt-8 text-center sm:flex …">` inside that new `<div id="next-steps-share">` exactly as they are. `messages.shareHeading` is reused as the row label — no new locale key.

- [ ] **Step 7: Run the test and the suite**

Run: `npx vitest run src/__tests__/next-steps-revamp.test.ts`
Expected: PASS, 4 tests.

Run: `npx vitest run`
Expected: PASS overall. `home-reading-band.test.ts` and `home-spine.test.ts` both touch this file and must still pass — they pin `DayTicketBody`, `currentDay()` and `BandHeader`, none of which this task changes.

- [ ] **Step 8: Commit**

```bash
git add src/components/next-steps/track-committed.tsx src/messages/en.json \
        src/messages/pt.json src/__tests__/next-steps-revamp.test.ts
git commit -m "feat(next-steps): the committed track asks for one thing first

Three changes to the same page. The opener stops recapping the decision the
reader has just made and starts with what God did, which is the beat the
scripture underneath it is answering. The church row moves down into 'as you
grow' -- read, pray and fellowship all survive, but only the chapter and the
prayer are asked for today. And the share block, which was about a third of
the page and permanently open, becomes a row that opens when it is wanted.

Print cards comes off entirely. Street evangelism is not day-one work, and the
route keeps a home in the footer in the next commit."
```

---

## Task 5: The thinking track — remove the chat that isn't, promote Learn (O4)

**Files:**
- Modify: `src/components/next-steps/track-thinking.tsx`
- Modify: `src/__tests__/next-steps-revamp.test.ts`

**Interfaces:**
- Consumes: the test file from Task 4.
- Produces: nothing.

- [ ] **Step 1: Add the failing tests**

Append to `src/__tests__/next-steps-revamp.test.ts` (add `const thinking = strip(read("src", "components", "next-steps", "track-thinking.tsx"));` beside the existing `committed` constant):

```ts
describe("the thinking track", () => {
  it("does not promise a chat that does not exist", () => {
    // needGod.net has no chat control on the page -- it invites questions by
    // form and by social message -- and it has no Portuguese, so a tu-form
    // reader was being handed an English site at the moment they were
    // promised a conversation. The footer keeps the link.
    expect(thinking, "the needGod row came back").not.toMatch(/needgod/i);
    expect(thinking, "the talk analytics action came back").not.toMatch(/"talk"/);
  });

  it("offers two destinations, not five", () => {
    // John 3 is the reading ask; a seven-day plan alongside it splits the ask.
    expect(thinking, "the reading-plan row came back").not.toMatch(/\/reading-plan/);
    expect(thinking, "a band header with nothing under it came back").not.toMatch(
      /bands\.deeper/,
    );
    expect(thinking, "learn is no longer offered").toMatch(/\/learn/);
  });

  it("keeps the mortality line at the end, after the offer", () => {
    // A stake, not a lever -- it must never sit between a question and its
    // answer (docs/METHOD.md).
    const learn = thinking.indexOf("/learn");
    const comeBack = thinking.indexOf("messages.comeBack");
    expect(comeBack, "the closing line vanished").toBeGreaterThan(-1);
    expect(comeBack, "the mortality line moved above the offer").toBeGreaterThan(learn);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run src/__tests__/next-steps-revamp.test.ts`
Expected: FAIL on the needGod row and the reading-plan row.

- [ ] **Step 3: Remove the needGod block**

Delete the `<p className="text-sm leading-relaxed text-white/60">{messages.talkLabel}</p>` and the `<a href={messages.talkUrl} …>` block beneath it, along with their wrapping `<div className="mt-5">`. Remove `MessageCircle` from the `lucide-react` import. Remove `talkLabel`, `talkLink` and `talkUrl` from `TrackThinkingMessages`.

- [ ] **Step 4: Promote Learn out of the deeper band**

Delete the `<BandHeader label={messages.bands.deeper} tone="dim" />` element and the `/reading-plan` `<Link>` block with its `CalendarDays` icon. Move the `/learn` `<Link>` block up to sit directly beneath the John 3 card, preceded by a short lead-in paragraph:

```tsx
        <p className="mt-5 text-sm leading-relaxed text-white/60">{messages.learnLeadIn}</p>
```

Remove `CalendarDays` from the import. Remove `readingPlanLabel` and `bands.deeper` from `TrackThinkingMessages`; the `bands` field becomes `{ today: string }`.

- [ ] **Step 5: Add the lead-in key to both locales**

`en.json`, under `nextSteps.trackB`:

```json
"learnLeadIn": "Still have questions? These are the ones people ask.",
```

`pt.json`, **draft for the owner's pass**:

```json
"learnLeadIn": "Ainda tens perguntas? Estas são as que as pessoas fazem.",
```

- [ ] **Step 6: Run the test and the suite**

Run: `npx vitest run`
Expected: PASS. `locale-parity` confirms the new key landed in both files.

- [ ] **Step 7: Commit**

```bash
git add src/components/next-steps/track-thinking.tsx src/messages/en.json \
        src/messages/pt.json src/__tests__/next-steps-revamp.test.ts
git commit -m "feat(next-steps): stop promising a chat that isn't there

The row said 'Chat at needGod.net'. There is no chat at needGod.net -- the
page offers a form and two social handles, which are real routes to a real
person but not the one the label named. It also has no Portuguese, so a
tu-form reader was handed an English site at the exact moment they had been
promised a conversation. The footer keeps the link for anyone who wants it.

Learn takes that slot: on-site, bilingual, and written in this app's own
voice. The seven-day plan comes off, because John 3 is already the reading
ask and a second larger one splits it -- which leaves the 'going deeper'
header with nothing to head."
```

---

## Task 6: The reflection chain

The one genuinely new behaviour in Phase 1. **Nothing in this repo does this today** —
an earlier draft of the spec claimed `reading-plan/day-card.tsx:34-50` could be reused,
and that was wrong: those lines sync a card's expansion to an externally-supplied
`isCurrent` prop and scroll it into view. Build it from scratch as written here.

**Files:**
- Modify: `src/components/next-steps/track-thinking.tsx`
- Modify: `src/messages/en.json`, `src/messages/pt.json`
- Modify: `src/__tests__/next-steps-revamp.test.ts`

**Interfaces:**
- Consumes: `TrackThinkingMessages` as edited in Task 5.
- Produces: locale key `nextSteps.trackB.reflectionHint`.

- [ ] **Step 1: Add the failing test**

Append to `src/__tests__/next-steps-revamp.test.ts`:

```ts
describe("the reflection chain", () => {
  it("arms one question at a time and never gates the page", () => {
    // The flow spent fifteen screens teaching one-thing-then-tap. A static
    // list of three breaks that cadence at the moment retention matters.
    expect(thinking, "the chain has no acknowledged cursor").toMatch(
      /const \[acknowledged, setAcknowledged\] = useState\(0\)/,
    );
    expect(thinking, "questions are not buttons, so they cannot be armed").toMatch(
      /<button[\s\S]*?onClick=\{\(\) => setAcknowledged\(i \+ 1\)\}/,
    );
    // Pending items stay readable to a screen reader -- dimmed, not hidden.
    expect(thinking).toMatch(/aria-disabled=\{state !== "armed"\}/);
    expect(thinking, "pending questions were removed from the DOM").not.toMatch(
      /state === "pending" && null/,
    );
  });

  it("carries a hint on the armed question, in both locales", () => {
    expect(thinking).toMatch(/messages\.reflectionHint/);
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      expect(msgs.nextSteps.trackB.reflectionHint, `${name} lost the hint`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run src/__tests__/next-steps-revamp.test.ts`
Expected: FAIL — no `acknowledged` state exists.

- [ ] **Step 3: Add the hint key to both locales**

`en.json`, under `nextSteps.trackB`:

```json
"reflectionHint": "Tap when you've sat with it",
```

`pt.json`, **draft for the owner's pass**:

```json
"reflectionHint": "Toca quando tiveres pensado nisto",
```

Add `reflectionHint: string;` to `TrackThinkingMessages`.

- [ ] **Step 4: Replace the static reflection list**

Add the cursor beside the existing `isFresh` state:

```tsx
  /*
   * One question at a time.
   *
   * Deliberately NOT persisted. This is a reading-pace device, not progress:
   * a returning reader who found three greyed-out lines with nothing armed
   * would be worse off than one starting again. Keeping it in component state
   * also means nothing here reads storage during render, which the page's
   * pre-paint design depends on.
   */
  const [acknowledged, setAcknowledged] = useState(0);
```

Replace the `messages.reflections.map(...)` block with:

```tsx
      <div className="mt-10 space-y-2">
        {messages.reflections.map((question, i) => {
          const state = i < acknowledged ? "done" : i === acknowledged ? "armed" : "pending";
          return (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={para(i)}
            >
              <button
                type="button"
                onClick={() => setAcknowledged(i + 1)}
                aria-disabled={state !== "armed"}
                tabIndex={state === "armed" ? 0 : -1}
                className={`block w-full border-l pl-5 text-left italic leading-relaxed transition-[opacity,font-size] duration-500 ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
                  state === "armed"
                    ? "cursor-pointer border-white/10 text-[15px] text-white/60 sm:text-base"
                    : state === "done"
                      ? "cursor-default border-white/10 text-[13px] text-white/60 opacity-35"
                      : "pointer-events-none border-white/10 text-[15px] text-white/60 opacity-20 sm:text-base"
                }`}
              >
                {question}
                {state === "armed" && (
                  <span className="mt-2 block font-mono text-[9px] uppercase not-italic tracking-[2px] text-[#D4A843]/65">
                    {messages.reflectionHint}
                  </span>
                )}
              </button>
            </m.div>
          );
        })}
      </div>
```

A pending item cannot be clicked (`pointer-events-none`) or tabbed to (`tabIndex={-1}`), so `onClick` firing out of turn is not reachable; it stays unguarded rather than carrying a condition that can never be false.

- [ ] **Step 5: Run the test and the suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Check it by hand**

Run `npm run dev`, visit `/en/next-steps` after answering "I want to think about it" on `/en/test`, and confirm: only the first question shows a hint; tapping it shrinks and dims it and arms the second; the third stays dim until its turn; Tab reaches only the armed question; and everything below the chain is reachable without touching it at all.

- [ ] **Step 7: Commit**

```bash
git add src/components/next-steps/track-thinking.tsx src/messages/en.json \
        src/messages/pt.json src/__tests__/next-steps-revamp.test.ts
git commit -m "feat(next-steps): the reflections come one at a time

The flow spends fifteen screens teaching a cadence -- one thing, tap, the next
thing -- and then handed a reader who is still deciding a static list of three
questions, at the moment their attention is least owed to us.

Not persisted, deliberately. This paces a reading; it does not record
progress, and a reader coming back to three greyed-out lines with nothing
armed would be worse off than one starting again. It also keeps storage out of
the render path, which this page's pre-paint design depends on.

Nothing below the chain is gated on it. A reader who ignores it entirely sees
the same page."
```

---

## Task 7: Give `/cards` a home, and remove the orphaned keys

**Files:**
- Modify: `src/components/shared/footer.tsx`
- Modify: `src/messages/en.json`, `src/messages/pt.json`
- Modify: `src/__tests__/next-steps-revamp.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: locale key `footer.cardsLink`.

- [ ] **Step 1: Add the failing test**

Append to `src/__tests__/next-steps-revamp.test.ts`:

```ts
describe("reachability after the cuts", () => {
  const footer = strip(read("src", "components", "shared", "footer.tsx"));

  it("keeps /cards reachable now that the track no longer links it", () => {
    // /cards is noindex and absent from the sitemap, so this is not an SEO
    // question -- without an internal link the page is reachable only by
    // typing the URL.
    expect(footer, "/cards has no internal link anywhere").toMatch(/\/cards/);
    expect(footer).toMatch(/messages\.cardsLink/);
  });

  it("keeps needGod in the footer after removing it from the track", () => {
    expect(footer, "the needGod link left the footer too").toMatch(/needGodUrl/);
  });

  it("has no locale keys left orphaned by the cuts", () => {
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      const a = msgs.nextSteps.trackA;
      const b = msgs.nextSteps.trackB;
      expect(a.streetLinkLabel, `${name} trackA.streetLinkLabel is orphaned`).toBeUndefined();
      expect(b.talkLabel, `${name} trackB.talkLabel is orphaned`).toBeUndefined();
      expect(b.talkLink, `${name} trackB.talkLink is orphaned`).toBeUndefined();
      expect(b.talkUrl, `${name} trackB.talkUrl is orphaned`).toBeUndefined();
      expect(b.readingPlanLabel, `${name} trackB.readingPlanLabel is orphaned`).toBeUndefined();
      expect(b.bands.deeper, `${name} trackB.bands.deeper is orphaned`).toBeUndefined();
      expect(msgs.footer.cardsLink, `${name} footer.cardsLink is missing`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run src/__tests__/next-steps-revamp.test.ts`
Expected: FAIL on the footer link and on every orphaned key.

- [ ] **Step 3: Add the footer key to both locales**

`en.json`, under `footer`, after `churchLink`:

```json
"cardsLink": "Printable Cards",
```

`pt.json`, **draft for the owner's pass**:

```json
"cardsLink": "Cartões para imprimir",
```

- [ ] **Step 4: Add the footer row and widen the type**

Add `cardsLink: string;` to `FooterMessages` in `src/components/shared/footer.tsx`.

In the `footer-grow` nav, directly after the `find-a-church` `<Link>`:

```tsx
              <Link
                href={`/${locale}/cards`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.cardsLink}
              </Link>
```

- [ ] **Step 5: Remove the six now-orphaned keys**

Delete from both locale files: `nextSteps.trackA.streetLinkLabel`; `nextSteps.trackB.talkLabel`, `talkLink`, `talkUrl`, `readingPlanLabel`, and `bands.deeper`.

- [ ] **Step 6: Verify no component still reads them**

```bash
for k in streetLinkLabel talkLabel talkLink talkUrl readingPlanLabel; do
  echo "--- $k"; grep -rn "\.$k\b" src --include='*.tsx' --include='*.ts' | grep -v __tests__ || true
done
grep -rn "bands\.deeper" src --include='*.tsx' --include='*.ts' | grep -v __tests__ || true
```

Expected: no output for any. A hit means Task 5 left a reference behind.

- [ ] **Step 7: Run the full suite and the type check**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: both PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/shared/footer.tsx src/messages/en.json src/messages/pt.json \
        src/__tests__/next-steps-revamp.test.ts
git commit -m "fix(footer): the cards page was one commit from being unreachable

/next-steps was the only internal link to /cards. It is noindex and absent
from the sitemap, so this was never an SEO problem -- it was simply that
removing the row would have left a page we deliberately built reachable only
by typing its URL. It joins the grow column, off a new believer's first day.

The six keys the track cuts orphaned go with it, verified unread by grep
rather than by memory."
```

---

## Task 8: The door answers the commitment, and the arrival carries the light

**Files:**
- Modify: `src/components/invitation-screen.tsx`
- Modify: `src/components/next-steps/track-committed.tsx`
- Modify: `src/__tests__/next-steps-revamp.test.ts`

**Interfaces:**
- Consumes: the `committed` boolean already computed at `invitation-screen.tsx:119`.
- Produces: nothing.

**Note on approach:** the spec describes the door's light gap "widening". A true gap
mask would need a new asset and new tuning; this implements the same read with a scale
and opacity transition on the existing door pair, over the same 2000ms as the hold. The
dawn wash on arrival is a CSS radial gradient in the idiom already used for the
decision screen's crossroads atmosphere — **not** a new image, so the asset budget and
the flow-graphic tests are untouched.

- [ ] **Step 1: Add the failing test**

Append to `src/__tests__/next-steps-revamp.test.ts`:

```ts
describe("the transition into next steps", () => {
  const invitation = strip(read("src", "components", "invitation-screen.tsx"));

  it("lets the door respond to the commitment, over the length of the hold", () => {
    // The door has sat behind this screen at 35% since it shipped and has
    // never responded to anything. Nothing announces the change -- the seam's
    // gold resolution does not announce itself either.
    expect(invitation, "the door does not react to the answer").toMatch(
      /committed \? "scale-\[1\.04\] opacity-\[0\.5\]" : "opacity-\[0\.35\]"/,
    );
    expect(invitation, "the door's change is not the length of the hold").toMatch(
      /duration-\[2000ms\]/,
    );
  });

  it("respects reduced motion on the door", () => {
    expect(invitation).toMatch(/motion-reduce:transition-none/);
  });

  it("carries the light into the arrival", () => {
    expect(committed, "the committed opener lost its dawn").toMatch(/data-dawn/);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run src/__tests__/next-steps-revamp.test.ts`
Expected: FAIL — three failures.

- [ ] **Step 3: Make the door respond**

In `invitation-screen.tsx`, both door wrappers currently read:

```tsx
      <div aria-hidden="true" data-flow-graphic className="pointer-events-none fixed inset-0 z-0 opacity-[0.35] sm:hidden">
```

and

```tsx
      <div aria-hidden="true" data-flow-graphic className="pointer-events-none fixed inset-0 z-0 hidden opacity-[0.35] sm:block">
```

Replace the `opacity-[0.35]` on each with the transition and the conditional. The mobile one becomes:

```tsx
      <div
        aria-hidden="true"
        data-flow-graphic
        className={`pointer-events-none fixed inset-0 z-0 transition-[opacity,transform] duration-[2000ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none sm:hidden ${
          committed ? "scale-[1.04] opacity-[0.5]" : "opacity-[0.35]"
        }`}
      >
```

and the desktop one identically, keeping `hidden` and `sm:block` in place of `sm:hidden`.

- [ ] **Step 4: Add the dawn to the arrival**

In `track-committed.tsx`, immediately inside the returned fragment and **before** the `<m.h1>`:

```tsx
      {/* The light the reader left, arriving with them. A CSS wash in the same
          idiom as the decision screen's crossroads atmosphere -- no asset, so
          nothing here touches the flow-graphic budget. Adoption register, not
          celebration: the courtroom stopped at the decision. */}
      <div
        aria-hidden="true"
        data-dawn
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,168,67,0.13) 0%, transparent 68%)",
        }}
      />
```

The track renders inside `PageShell`; if the wash does not position correctly, add `relative` to the nearest wrapping element rather than changing `PageShell` — `page-shell.test.ts:23` pins that component's width contract and must not be disturbed.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run`
Expected: PASS, including `graphics.test.ts` — no new asset was added, so its budget and door assertions are unaffected.

- [ ] **Step 6: Check it by hand, both motion settings**

Run `npm run dev`. On `/en/test`, answer through to the decision and choose "I will repent and trust in Christ": the seam should resolve to gold and the door should grow and brighten across the two-second hold, with the button appearing at the end. Then enable "Reduce motion" in the OS and repeat: the door should be at its final state immediately with no animation, and the hold's timing should be unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/components/invitation-screen.tsx src/components/next-steps/track-committed.tsx \
        src/__tests__/next-steps-revamp.test.ts
git commit -m "feat(decision): the door opens when the reader walks through it

The door has sat behind the decision at 35% since it shipped and has never
responded to anything, which made the two-second hold a screen where nothing
happens rather than a beat. It now brightens and grows over exactly that hold,
so the pause is the sentence the copy already carries -- and, like the seam
resolving to gold beside it, nothing announces it.

The arrival picks the same light up as a wash behind the opener. A CSS
gradient in the idiom the decision screen already uses, not a new asset, so
the graphic budget is untouched. Adoption register: the courtroom stopped one
screen ago."
```

---

## Task 9: The attribution notice that should already exist

Not strictly part of the revamp, and included because it is owed now rather than at
Phase 2. The app quotes NKJV throughout in English and ARC throughout in Portuguese,
and **no translation credit appears anywhere in the repo**. Both publishers require one.
The footer already renders scripture (`footer.scripture` / `footer.scriptureRef`), so
the notice belongs beside it.

**Files:**
- Modify: `src/messages/en.json`, `src/messages/pt.json`
- Modify: `src/components/shared/footer.tsx`
- Modify: `src/__tests__/next-steps-revamp.test.ts`

**Interfaces:**
- Consumes: `FooterMessages` as widened in Task 7.
- Produces: locale key `footer.scriptureNotice`.

- [ ] **Step 1: Add the failing test**

Append to the `reachability after the cuts` describe block in `src/__tests__/next-steps-revamp.test.ts`:

```ts
  it("credits the translations it quotes", () => {
    // Thomas Nelson and Sociedade Bíblica de Portugal both require a notice,
    // and the app carried none in either locale despite quoting both
    // throughout. The exact English wording is the publisher's, not ours.
    expect(footer, "the footer renders no translation credit").toMatch(
      /messages\.scriptureNotice/,
    );
    expect(en.footer.scriptureNotice, "the NKJV notice is not the required wording").toBe(
      "Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.",
    );
    expect(pt.footer.scriptureNotice, "the ARC credit is missing").toMatch(
      /Sociedade Bíblica de Portugal/,
    );
  });
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run src/__tests__/next-steps-revamp.test.ts`
Expected: FAIL — the key does not exist.

- [ ] **Step 3: Add the notices**

`en.json`, under `footer`, after `scriptureRef` — **verbatim, do not reword**:

```json
"scriptureNotice": "Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.",
```

`pt.json`, under `footer` — this is the publisher's own credit line for ARC and is not a draft:

```json
"scriptureNotice": "Tradução de João Ferreira de Almeida, Edição Revista e Corrigida. Copyright © 2001 Sociedade Bíblica de Portugal.",
```

- [ ] **Step 4: Render it**

Add `scriptureNotice: string;` to `FooterMessages`. Beneath the element rendering `messages.scriptureRef`, add:

```tsx
          <p className="mt-3 text-[11px] leading-relaxed text-white/35">
            {messages.scriptureNotice}
          </p>
```

- [ ] **Step 5: Run the suite**

Run: `npx vitest run`
Expected: PASS. `copy-integrity`'s untranslated-strings check compares EN and PT values and the two notices differ, so it is satisfied.

- [ ] **Step 6: Commit**

```bash
git add src/messages/en.json src/messages/pt.json src/components/shared/footer.tsx \
        src/__tests__/next-steps-revamp.test.ts
git commit -m "fix(legal): credit the translations this site has been quoting all along

Thomas Nelson requires a notice for the NKJV and Sociedade Biblica de Portugal
for the ARC, and the repo carried neither in either locale while quoting both
across the test, grace, the verdict, learn and the blog. The English wording
is the publisher's own and is reproduced exactly; the Portuguese line is the
credit SBP prints with the text.

This was owed long before the work that surfaced it, and it does not wait for
the reading feature that raised the question."
```

---

## Task 10: Full verification

**Files:** none modified.

- [ ] **Step 1: Whole suite, whole output**

Run: `npx vitest run`
Read every line. Do not pipe through `tail`.
Expected: all suites pass, including `decision-routes`, `invitation-guard`, `home-reading-band`, `home-spine`, `page-shell`, `graphics`, `i18n-validate`, `locale-parity` and `next-steps-revamp`.

- [ ] **Step 2: Types and lint**

Run: `npx tsc --noEmit` then `npm run lint`
Expected: both clean.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: success. This is what catches a locale key referenced but never added.

- [ ] **Step 4: Walk all three answers by hand**

`npm run dev`, then for each of committed / thinking / not-for-me, complete `/en/test` and confirm: the right label on the way-on button, the right track on arrival, dismissed still getting both of its conditional doors and no `/next-steps` track. Repeat once on `/pt/` to confirm nothing renders `undefined`.

- [ ] **Step 5: Report what is outstanding**

Phase 1 is complete. Still open, and deliberately not in this plan:
- **Portuguese copy** for `ctaCommitted`, `ctaThinking`, `metaTitle`, `learnLeadIn`, `reflectionHint`, `footer.cardsLink`, and the trimmed `whatHappened` — all drafted here, all needing the owner's pass.
- **The letter to Sociedade Bíblica de Portugal** (spec §5.3), owed for the ARC already shipped. Task 9 adds the credit line; it does not obtain permission, and 145 verses of ARC still needs it.
- **A real count of quoted NKJV verses** (spec §5.2). The estimate is ≈258 already quoted against a 500-verse gratis cap, so Phase 2's 145 would land near 403. Count it properly before building the reader.
- **Phase 2** — the in-page passage reader — which is gated on the NKJV verse count landing under the gratis allowance.
