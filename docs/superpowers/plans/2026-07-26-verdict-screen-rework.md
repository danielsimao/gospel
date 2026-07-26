# Verdict Screen Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/test` verdict screen so it has ambient ground, a cited Scripture, a live death counter that the sticky bar hands off to, no duplicated evidence, and a 1.2s rhythmic entrance instead of 2.9s of four identical fades.

**Architecture:** Four tasks over seven files. The live counter is **not** newly written — `src/components/eternity/death-counter.tsx` already implements a rAF-driven live counter used by the homepage hero and by the sticky bar that is already on `/test`; it gains one optional `baseMs` prop so the verdict can seed it with the test's elapsed time and let it keep climbing. Because that sticky bar is itself live, Task 3 retires it from the verdict onward rather than letting two live counters share a screen. `verdict-screen.tsx` then loses two of its three `setTimeout` gates in favour of framer-motion `delay`, keeping only the gate that guards the CTA from being clickable while invisible, and drops its evidence chips entirely.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, framer-motion (`m` + `LazyMotion`), Vitest, Biome, pnpm.

## Global Constraints

- **Locale parity is mandatory.** Every new key lands in **both** `src/messages/en.json` and `src/messages/pt.json` in the same commit. Nothing currently fails a test when a PT key is missing — Task 1 closes that hole for these specific keys via `validateMessages`.
- **Bible versions are fixed by precedent.** EN quotes NKJV-register (`grace.scripture` = "For God so loved the world that He gave His only begotten Son…"). PT quotes Almeida (`"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito…"`). Use the wordings given verbatim in Task 1 — do **not** re-translate or substitute another version.
- **PT register is `tu`**, matching the existing `deathLineTemplate` (`"…enquanto respondias"`) and `findChurch` copy.
- **Zero-shift rule.** No layout shift from the counter as digits grow. `minWidth` on the counter span is load-bearing.
- **Reduced motion is already global.** `MotionConfig reducedMotion="user"` at `src/components/providers.tsx:56` covers every `m.*` component. Do **not** add per-component reduced-motion branches for the motion blocks.
- **Exact colour tokens:** red `#ef4444` (`red-500`) / `#f87171` (`red-400`), gold `#D4A843`. Easing: `EASE_OUT_STRONG` from `@/lib/motion` (= `cubic-bezier(0.16, 1, 0.3, 1)`).
- **Minimum diff.** Do not reformat untouched lines, reorder imports, or rename the pre-existing `deathLineTemplate` key (it has no placeholder despite the name — that is pre-existing and out of scope).

---

## Corrections to earlier assumptions

Five things asserted before or during planning turned out wrong. Recorded so a reviewer does not reinstate them:

1. **"Build a live counter."** One already exists (`death-counter.tsx`), used by the homepage hero and the sticky bar. Reuse it.
2. **"The counter needs its own reduced-motion branch because a `setInterval` isn't covered by `MotionConfig`."** It uses `requestAnimationFrame`, not `setInterval`, and ships site-wide today with no reduced-motion branch. rAF is also suspended in background tabs, so the "pause when hidden" handler is unnecessary too. **Add neither.** The count is essential content (WCAG 2.2.2 essential-content exemption) and the homepage sets the precedent — freezing it only on the verdict would be an inconsistency, not a fix.
3. **"`minWidth: 7ch` overflows at display sizes, so the `style` spread order must be flipped."** `ch` is the advance width of `0`, ≈0.6em in a monospace face, so 7ch is ≈200px at `text-5xl` — well inside the 384px column. No flip; Task 2 is one prop.
4. **"Promote the evidence chips to a full record."** It restates the confession sentence, which already names every commandment and how it was answered, and costs ~270px — enough to push the CTA off a phone. The chips are deleted, not promoted.
5. **"Keep `aria-live="polite"` on the container."** It was there because the old screen revealed content on timers. With everything in the DOM at mount it is unnecessary, and a polite live region wrapping a counter whose text changes twice a second would announce a new number forever.

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `src/messages/en.json` | EN copy | Modify `test.verdict` (lines 35–45): rewrite `deathLineTemplate`, add 4 keys |
| `src/messages/pt.json` | PT copy | Modify `test.verdict` (lines 35–45): same shape |
| `src/lib/types.ts` | Message contracts | Add 4 fields to `TestMessages.verdict` (lines 158–168) |
| `src/lib/i18n.ts` | Runtime message validation | Extend the existing test-content guard (line 52) |
| `src/__tests__/i18n-validate.test.ts` | Parity test | Add one `describe` block |
| `src/components/eternity/death-counter.tsx` | Live rAF counter (shared) | Add `baseMs` prop |
| `src/components/shared/sticky-death-counter.tsx` | Fixed deaths-today bar | Add `data-slot` hook (line 18) |
| `src/components/game-shell.tsx` | Game phase owner | Publish `data-game-phase` on `<html>` |
| `src/app/globals.css` | Global tokens + rules | Retire the bar for verdict/grace/invitation |
| `src/components/verdict-screen.tsx` | The screen | Rebuild render tree + choreography |

`verdict.subtitle` (top-level, `en.json:104` / `pt.json:105`) stops being rendered — the Scripture blockquote takes its place. **Keep the key.** This matches the precedent set in commit `5a79b17`, which intentionally retained `nextSteps.trackA.communityLink` and `footer.churchUrl` as unused-but-present. Deleting it is the owner's call, not this plan's.

---

### Task 1: Verdict copy, types, and locale parity

**Files:**
- Modify: `src/messages/en.json:35-45`
- Modify: `src/messages/pt.json:35-45`
- Modify: `src/lib/types.ts:158-168`
- Modify: `src/lib/i18n.ts:52`
- Test: `src/__tests__/i18n-validate.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `TestMessages.verdict.scripture`, `.scriptureRef`, `.deathLineImplication` — all `string`, all required — plus a rewritten `.deathLineTemplate`. Task 4 renders every one of them.

**Copy rationale (do not "improve" these strings):**
- `deathLineTemplate` moves from closed past (`"died while you answered"`) to present perfect, because a live number is still climbing and the old tense becomes false.
- `"You could be next."` is deleted. `invitation.urgencyLine` already says *"This decision has a deadline, and no one is told when"* and explicitly calls back with *"remember the count"*. The verdict establishes the count in the third person (about the dead); the invitation draws the second-person conclusion. Duplicating it here makes the invitation's line land as a repeat 30 seconds later.
- James 2:10 over Romans 3:23: it is the exact legal argument the eight questions build (one point failed → guilty of all), and in both languages it rhymes with the heading — EN *"he is guilty of all"* under **GUILTY**, PT *"é culpado de todos"* under **Culpado.**

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/i18n-validate.test.ts`:

```ts
describe("verdict screen copy", () => {
  const VERDICT_KEYS = [
    "scripture",
    "scriptureRef",
    "deathLineTemplate",
    "deathLineImplication",
  ] as const;

  it.each([["en", en], ["pt", pt]] as const)(
    "%s has every test.verdict key the verdict screen renders",
    (_locale, messages) => {
      const verdict = (messages as unknown as { test: { verdict: Record<string, unknown> } })
        .test.verdict;
      for (const key of VERDICT_KEYS) {
        expect(typeof verdict[key]).toBe("string");
        expect(verdict[key]).not.toBe("");
      }
    },
  );

  it("no longer promises the reader they could be next (invitation owns that beat)", () => {
    expect(en.test.verdict.deathLineTemplate).not.toMatch(/could be next/i);
    expect(pt.test.verdict.deathLineTemplate).not.toMatch(/pr[óo]ximo/i);
  });

  it("validateMessages rejects a locale missing the verdict Scripture", () => {
    const clone = cloneMessages(en);
    delete ((clone.test as AnyRecord).verdict as AnyRecord).scripture;
    expect(() => validateMessages(clone, "en")).toThrow(/test content/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/__tests__/i18n-validate.test.ts`
Expected: FAIL — `expected "undefined" to be "string"` for `scripture`, and the `validateMessages` case does not throw.

- [ ] **Step 3: Rewrite the EN `test.verdict` block**

Replace `src/messages/en.json:35-45` with:

```json
    "verdict": {
      "prelude": "The verdict",
      "scripture": "For whoever shall keep the whole law, and yet stumble in one point, he is guilty of all.",
      "scriptureRef": "James 2:10",
      "deathLineTemplate": "people have died since you started.",
      "deathLineImplication": "The count does not skip anyone.",
      "bridgeButton": "Is there any hope?",
      "confessionAdmitted": "You are {list} — by your own admission.",
      "confessionDenied": "You are {list} — by your evasions.",
      "confessionBoth": "You are {admitted} — by your own admission. And {denied} — by your evasions.",
      "separator": "and",
      "useOxfordComma": true,
      "noneLabel": "Guilty still."
    }
```

- [ ] **Step 4: Rewrite the PT `test.verdict` block**

Replace `src/messages/pt.json:35-45` with:

```json
    "verdict": {
      "prelude": "O veredicto",
      "scripture": "Porque qualquer que guardar toda a lei, e tropeçar em um só ponto, é culpado de todos.",
      "scriptureRef": "Tiago 2:10",
      "deathLineTemplate": "pessoas morreram desde que começaste.",
      "deathLineImplication": "A contagem não poupa ninguém.",
      "bridgeButton": "Há alguma esperança?",
      "confessionAdmitted": "És {list} — pela tua própria confissão.",
      "confessionDenied": "És {list} — pelas tuas evasivas.",
      "confessionBoth": "És {admitted} — pela tua própria confissão. E {denied} — pelas tuas evasivas.",
      "separator": "e",
      "useOxfordComma": false,
      "noneLabel": "Culpado na mesma."
    }
```

`registo` (not `registro`) and `não poupa ninguém` are European PT. This copy is flagged for the owner's PT pass — do not silently alter it.

- [ ] **Step 5: Extend the `TestMessages.verdict` type**

In `src/lib/types.ts`, replace lines 158–168:

```ts
  verdict: {
    prelude: string;
    scripture: string;
    scriptureRef: string;
    deathLineTemplate: string;
    deathLineImplication: string;
    bridgeButton: string;
    confessionAdmitted: string;
    confessionDenied: string;
    confessionBoth: string;
    separator: string;
    useOxfordComma?: boolean;
    noneLabel: string;
  };
```

- [ ] **Step 6: Make the validator enforce the new keys in both locales**

Nothing else fails a build when PT lacks a key — JSON reaches `validateMessages` untyped. Extend the existing guard at `src/lib/i18n.ts:52`:

```ts
  if (
    !m.test?.caseLabel ||
    !m.test?.verdictLabels ||
    !m.test?.verdict?.prelude ||
    !m.test?.verdict?.scripture ||
    !m.test?.verdict?.scriptureRef ||
    !m.test?.verdict?.deathLineImplication
  ) {
    throw new Error(`[i18n] Missing required test content for locale "${locale}"`);
  }
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm vitest run src/__tests__/i18n-validate.test.ts`
Expected: PASS, all cases.

- [ ] **Step 8: Commit**

```bash
git add src/messages/en.json src/messages/pt.json src/lib/types.ts src/lib/i18n.ts src/__tests__/i18n-validate.test.ts
git commit -m "feat(verdict): cite James 2:10, retense the death line, drop 'you could be next'

The invitation screen already owns the second-person deadline conclusion
(\"no one is told when\") and calls back with \"remember the count\". The
verdict now establishes the count in the third person and leaves that beat
to the invitation instead of spending it twice.

A live counter also makes the closed past tense false, so the line moves to
present perfect. validateMessages now rejects either locale missing the new
keys, since nothing else catches a PT gap."
```

---

### Task 2: Let `DeathCounter` start from an elapsed base

**Files:**
- Modify: `src/components/eternity/death-counter.tsx:10-15`, `:47`, `:81`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `<DeathCounter baseMs={number} />` — counts from `baseMs` milliseconds of elapsed time and keeps climbing at 1.8 deaths/second. Ignored when `fromMidnight` is set.

**Do not touch `minWidth`.** An earlier draft of this plan flipped the `style` spread order so a caller could shrink the forced `minWidth: "7ch"`, on the assumption that 7ch overflows at display sizes. That was wrong: `ch` is the advance width of `0`, ≈0.6em in a monospace face, so 7ch at `text-5xl` (48px) is ≈200px and at `sm:text-6xl` (60px) is ≈250px — both comfortably inside the `max-w-sm` (384px) column. The 7ch reservation is also what keeps the centred number from shifting as digits are added, which the zero-shift rule requires. Leave line 81 exactly as it is.

- [ ] **Step 1: Add the `baseMs` prop to the interface**

Replace `src/components/eternity/death-counter.tsx:10-15`:

```ts
interface DeathCounterProps {
  className?: string;
  style?: React.CSSProperties;
  /** If true, count from midnight UTC (deaths today). Otherwise from page load. */
  fromMidnight?: boolean;
  /**
   * Milliseconds already elapsed before mount. The counter counts up to this
   * value, then keeps climbing live. Used by the verdict screen to seed the
   * count with the test's own duration. Ignored when `fromMidnight` is set.
   */
  baseMs?: number;
}
```

- [ ] **Step 2: Destructure it and use it as the base**

In the component signature (line ~39), add `baseMs = 0` alongside `fromMidnight = false`:

```tsx
export const DeathCounter = memo(function DeathCounter({
  className,
  style,
  fromMidnight = false,
  baseMs = 0,
}: DeathCounterProps) {
```

Replace line 47:

```ts
    const targetBase = fromMidnight ? getMsSinceMidnightUTC() : baseMs;
```

Add `baseMs` to the effect's dependency array (line ~74): `}, [fromMidnight, baseMs]);`

Leave the count-up guard on line 56 (`!fromMidnight && elapsed < COUNT_UP_MS && realCount > 0`) exactly as it is. With a non-zero `baseMs` it now eases 0 → base over 1500ms and then continues live, which is the reveal the verdict wants — no new code needed.

- [ ] **Step 3: Verify the homepage counter is unchanged**

Run: `pnpm build && pnpm start`
Open `http://localhost:3000/en`. Confirm the hero counter still pre-paints a live number, still animates, and has not changed width or position. This is an LCP-sensitive element (see the comment at `death-counter.tsx:29-36`) — if the number renders as `0` on first paint, stop and revert.

- [ ] **Step 4: Run the gates**

Run: `pnpm lint && npx tsc --noEmit && pnpm vitest run`
Expected: 0 Biome errors (9 pre-existing warnings are fine), tsc clean, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/eternity/death-counter.tsx
git commit -m "feat(death-counter): add baseMs so callers can seed elapsed time

The verdict screen needs a counter that starts at the test's own duration
and keeps climbing, rather than from zero or from midnight. The existing
count-up already handles a non-zero base, so this is one branch on the
base value and nothing else changes."
```

---

### Task 3: Hand the count off from the sticky bar to the verdict

**Files:**
- Modify: `src/components/shared/sticky-death-counter.tsx:18`
- Modify: `src/components/game-shell.tsx` (one effect, near the existing effects)
- Modify: `src/app/globals.css` (append one rule block)

**Interfaces:**
- Consumes: nothing from Tasks 1–2.
- Produces: `document.documentElement` carries `data-game-phase="<GamePhase>"` while the game shell is mounted, and the sticky bar hides itself for the `verdict`, `grace`, and `invitation` phases. Task 4 depends on this — without it the verdict screen has two live red counters on it.

**Why this task exists:** `/test` lives in the `(immersive)` route group, whose layout renders `StickyDeathCounter` — a fixed, **already live** deaths-today counter ticking every ~555ms. Adding a second live counter to the verdict without this would put ~100,000 and ~324 on screen together, both climbing, three orders of magnitude apart, with nothing explaining why. The bar presses through the eight questions; at the verdict the count comes off the shelf and becomes the centre of the screen.

**Why it hides through grace and invitation too, not just the verdict.** This is the one judgment call in the plan beyond the six approved changes. Hiding only at `verdict` would make the bar slide *back down* over the grace screen, which is worse than never hiding it. Beyond that: a ticking death counter over the gospel-of-grace screen argues against the screen, and `invitation.urgencyLine` already says *"remember the count"* — remembered, not displayed. To revert to verdict-only, delete two selectors from the CSS rule.

**Why a data attribute rather than context:** the layout is a server component and renders the bar *outside* the game provider's tree, so the bar cannot read game state through React. Setting one attribute on `<html>` from the client shell is the narrowest available seam.

- [ ] **Step 1: Give the bar a stable selector**

In `src/components/shared/sticky-death-counter.tsx`, add `data-slot` to the root div (line 18), leaving every class untouched:

```tsx
    <div
      data-slot="sticky-death-counter"
      className="fixed top-0 left-0 right-0 z-50 border-b border-red-950/40 bg-[#060404]/[0.94] backdrop-blur-xl"
    >
```

- [ ] **Step 2: Publish the game phase on the document element**

In `src/components/game-shell.tsx`, add this effect alongside the existing ones (anywhere before the `return`):

```tsx
  // The sticky deaths-today bar lives in the (immersive) layout, outside this
  // provider's tree, so it cannot read phase through React. Publishing the
  // phase on <html> lets globals.css retire the bar once the verdict takes
  // the count over. Cleaned up on unmount so no other route sees the flag.
  useEffect(() => {
    document.documentElement.dataset.gamePhase = state.phase;
    return () => {
      delete document.documentElement.dataset.gamePhase;
    };
  }, [state.phase]);
```

- [ ] **Step 3: Retire the bar for the three post-verdict phases**

Append to `src/app/globals.css`:

```css
/*
 * The deaths-today bar presses through the law section, then hands the count
 * to the verdict screen's own live counter. Two live red counters on one
 * screen read as a bug, and a ticking death count over the grace screen
 * argues against the screen. Slides up rather than vanishing; the bar is
 * fixed, so nothing reflows.
 */
[data-slot="sticky-death-counter"] {
  transition:
    opacity 400ms var(--ease-out-strong),
    transform 400ms var(--ease-out-strong);
}

html[data-game-phase="verdict"] [data-slot="sticky-death-counter"],
html[data-game-phase="grace"] [data-slot="sticky-death-counter"],
html[data-game-phase="invitation"] [data-slot="sticky-death-counter"] {
  opacity: 0;
  transform: translateY(-100%);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  [data-slot="sticky-death-counter"] {
    transition: none;
  }
}
```

`--ease-out-strong` is already defined at `globals.css:57`.

- [ ] **Step 4: Verify the handoff**

Run: `pnpm build && pnpm start`, then walk `http://localhost:3000/en/test` through all eight questions.
1. The bar is present and ticking for the landing and all eight questions.
2. It slides up and out as the verdict arrives, and does **not** come back on grace or the invitation.
3. Content does not reflow when it leaves — the `pt-10` offset on the game shell's content div stays regardless.
4. Navigate away to `/en` and confirm the homepage is unaffected and no `data-game-phase` attribute remains on `<html>` (check in devtools).

- [ ] **Step 5: Run the gates**

Run: `pnpm lint && npx tsc --noEmit && pnpm vitest run`
Expected: 0 Biome errors (9 pre-existing warnings), tsc clean, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/sticky-death-counter.tsx src/components/game-shell.tsx src/app/globals.css
git commit -m "feat(test): retire the deaths bar once the verdict takes the count

/test already had a live deaths-today counter fixed to the top. Giving the
verdict its own live count would have put ~100,000 and ~324 on screen
together, both climbing, with nothing explaining the gap.

The bar now presses through the law section and slides away at the verdict,
which is where the count becomes personal and central. It stays away for
grace and the invitation: a ticking death counter over the gospel-of-grace
screen argues against the screen, and the invitation already says
\"remember the count\" rather than showing it.

The (immersive) layout renders the bar outside the game provider's tree, so
the shell publishes state.phase on <html> and CSS does the rest."
```

---

### Task 4: Rebuild the verdict screen

**Files:**
- Modify: `src/components/verdict-screen.tsx` (full render tree; ~213 lines → ~185)

**Interfaces:**
- Consumes: `TestMessages.verdict.{scripture,scriptureRef,deathLineTemplate,deathLineImplication}` (Task 1); `<DeathCounter baseMs>` (Task 2); the retired sticky bar (Task 3).
- Produces: nothing consumed downstream. Props are unchanged, so `game-shell.tsx:318-324` needs no edit.

**Seven deliberate design decisions a reviewer must not "fix":**

1. **The sequence stays automatic — do not port grace's tap-to-advance.** A verdict is pronounced upon the reader, not requested beat by beat. The defect being fixed is rhythm (four identical 800ms fades ending at 2900ms), not agency. Grace remains the only reader-paced screen, because grace is the part you choose to receive.
2. **No evidence list.** The old chips are deleted outright, not promoted. The confession sentence already names every commandment and how it was answered, so a record restated it while costing ~270px — enough to push the CTA off a 390×844 viewport. Do not re-add them in any form.
3. **No `filter: blur(40px)` on the wash**, unlike `grace-screen.tsx:99`. The gradient already fades to transparent at 58%; a blur on a `fixed inset-0` element forces a full-viewport composited filter layer for no visible gain. Deliberate divergence.
4. **The blockquote border is red, not the house gold.** House pattern is `border-l border-[#D4A843]/30`; this is the law screen, so it takes the red variant.
5. **`messages.subtitle` is no longer rendered.** The Scripture replaces it. The key stays in both locale files (see File Structure).
6. **Only the CTA keeps a `setTimeout` gate.** Two of three timers are replaced by motion `delay`. The CTA keeps its gate because a `disabled`-less button at `opacity: 0` is an invisible click target.
7. **No reduced-motion branch anywhere in this file, and no `aria-live`.** See Global Constraints and the comment in Step 3.

**Expected outcome to verify:** with the record gone the screen is ~770px tall, so on a 390×844 viewport — with the sticky bar now retired by Task 3 — the gold CTA should land above the fold. Step 6 checks this.

- [ ] **Step 1: Replace the imports and the component head**

Replace `src/components/verdict-screen.tsx:1-39` with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { DeathCounter } from "@/components/eternity/death-counter";
import { trackVerdictReached } from "@/lib/analytics";
import { buildConfession } from "@/lib/confession";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { VerdictEmblem } from "@/components/emblems";
import type { GameState, TestMessages } from "@/lib/types";

interface VerdictScreenProps {
  messages: { title: string; subtitle: string };
  testMessages: TestMessages;
  state: GameState;
}

/**
 * When the gold CTA becomes real. Everything else on this screen is present
 * from mount and revealed by motion delay — only the button needs a gate,
 * because a button at opacity 0 is an invisible click target.
 */
const BRIDGE_DELAY_MS = 1200;

export function VerdictScreen({
  messages,
  testMessages,
  state,
}: VerdictScreenProps) {
  const dispatch = useGameDispatch();
  const hasTracked = useRef(false);
  // Grace is only reachable through the full verdict, so graceReached
  // exactly means "verdict fully seen" — re-entry replays nothing.
  const returning = state.graceReached;
  const [showBridge, setShowBridge] = useState(returning);

  const confession = buildConfession(state.answers, testMessages);

  // Active elapsed test time. RESUME_SESSION rebases startedAt so time spent
  // away from the tab is excluded (game-reducer.ts:172-201), which is why this
  // is safe to feed a live counter — a session resumed days later still
  // reports minutes, not days.
  const durationMs = Math.max(0, (state.completedAt ?? state.startedAt) - state.startedAt);
```

Note: `DEATHS_PER_SECOND` and the `deathCount` computation are deleted from this file — the constant lives in `death-counter.tsx`, which now owns the arithmetic.

- [ ] **Step 2: Replace the effect with a single CTA gate**

Replace the old `useEffect` (old lines 41–67) with:

```tsx
  useEffect(() => {
    if (!hasTracked.current && !returning) {
      hasTracked.current = true;
      const totalHonest = state.answers.filter(
        (a) => a.answer === "honest",
      ).length;
      const totalJustify = state.answers.filter(
        (a) => a.answer === "justify",
      ).length;
      trackVerdictReached(totalHonest, totalJustify, durationMs);
    }

    // Re-read: the CTA is live from mount, no timer to run.
    if (returning) return;

    const t = setTimeout(() => setShowBridge(true), BRIDGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.answers, durationMs, returning]);

  function handleBridgeClick() {
    dispatch({ type: "SHOW_GRACE" });
  }

  // Stage delays in ms → seconds, collapsed to 0 on re-read. The whole
  // sequence lands in 1.2s (was 2.9s) and every beat enters with its own
  // gesture: stamp, rise, rise, land-from-above, rise.
  const at = (ms: number) => (returning ? 0 : ms / 1000);
```

- [ ] **Step 3: Replace the entire returned JSX**

Replace everything from `return (` to the end of the component:

```tsx
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
      {/* Judgment pressing down from above. Grace has a warm wash from centre
          and the invitation has a two-point crossroads gradient; the verdict
          was the only screen in the flow on bare black. No blur filter here
          (unlike grace): the gradient already fades out at 58%, and blurring
          a fixed full-viewport layer costs a composited pass for nothing. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.13) 0%, transparent 58%)",
        }}
      />

      {/* No aria-live here, and this is load-bearing. The old screen needed it
          because the confession, count, and CTA arrived on setTimeout — with
          nothing announced, a screen reader never heard them. Now the whole
          verdict is in the DOM from mount, so it reads as ordinary content.
          Keeping aria-live would be actively harmful: the counter's text node
          changes ~2×/second, and a polite live region containing it would
          announce a new number forever. */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* The scales + the house eyebrow. At the old size-6/60% the emblem
            was invisible — paying for a graphic and not getting one. The
            hairline-label-hairline row is the pattern grace and the
            invitation both use; the verdict was the odd one out. */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VerdictEmblem
            className="mx-auto mb-3.5 size-10 text-red-400/70"
            strokeWidth={1.4}
            aria-hidden
          />
          <div className="flex items-center justify-center gap-2">
            <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
            <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
              {testMessages.verdict.prelude}
            </span>
            <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
          </div>
        </m.div>

        {/* GUILTY — stamped verdict block. Entrance lands from above
            (1.15 → 1, composite-only) instead of growing in: a stamp hit,
            not a bloom. Double hairlines frame it as an official record. */}
        <m.div
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: at(200), ease: EASE_OUT_STRONG }}
          className="mt-4 w-full max-w-sm border-y-2 border-red-500/30 py-4 sm:py-5"
        >
          <p
            className="text-5xl font-black uppercase tracking-[0.15em] text-red-500 sm:text-6xl md:text-7xl"
            style={{
              textShadow:
                "0 0 80px rgba(239,68,68,0.35), 0 0 160px rgba(239,68,68,0.12), 0 4px 40px rgba(0,0,0,0.8)",
            }}
          >
            {messages.title.replace(/\.$/, "")}
          </p>
        </m.div>

        {/* The authority. Previously the screen asserted guilt in the app's
            own voice (messages.subtitle) and the law screen cited no law.
            James 2:10 is the exact argument the eight questions build — one
            point failed, guilty of all — and it rhymes with the heading above
            it in both languages. Red border, not the house gold: this is the
            law side of the flow. */}
        <m.blockquote
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: at(520), ease: EASE_OUT_STRONG }}
          className="mt-6 w-full max-w-sm border-l border-red-500/30 pl-4 text-left"
        >
          <p className="text-sm italic leading-[1.8] text-white/60 sm:text-[15px]">
            &ldquo;{testMessages.verdict.scripture}&rdquo;
          </p>
          {/* red-400/75 is the AA floor for small text on #060404 (≈4.6:1) —
              the same value the existing chips and prelude already use.
              red-400/70 measures 4.1:1 and fails 1.4.3. Do not dim it. */}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[2px] text-red-400/75">
            {testMessages.verdict.scriptureRef}
          </p>
        </m.blockquote>

        {/* Dynamic confession prose — the personalised centre of the screen. */}
        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: at(700), ease: EASE_OUT_STRONG }}
          className="mt-6 max-w-sm text-base leading-relaxed text-white/85 sm:text-lg"
        >
          {confession}
        </m.p>

        {/* No evidence list here. The old chips were the test HUD's markup
            verbatim, and promoting them to a full record would have restated
            the confession sentence above — which already names every
            commandment and how it was answered — while adding ~270px that
            pushed the CTA off a 390×844 viewport. The confession IS the
            record, in better prose. */}

        {/* The count, live. A number whose entire meaning is "time is
            passing" cannot be a static fade-in, and because it never stops
            the reader is never parked in front of a finished screen. Framed
            in the same border-y-2 as GUILTY so the word and the number read
            as siblings instead of one dominating. Lands from above. */}
        <m.div
          initial={{ opacity: 0, y: -14, scale: 1.06 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.62, delay: at(880), ease: EASE_OUT_STRONG }}
          className="mt-8 w-full max-w-sm border-y-2 border-red-500/25 py-5"
        >
          {/* The component's own minWidth: 7ch stays — at these sizes it is
              ≈200-250px inside a 384px column, and it is what stops the
              centred number shifting as digits are added. The span also
              paints a literal "0" for one frame before the first rAF tick;
              that frame happens at opacity 0 behind this block's 880ms
              delay, so it is never visible. Do not shorten that delay below
              ~100ms without re-checking. */}
          <DeathCounter
            baseMs={durationMs}
            className="font-mono text-5xl font-extrabold tabular-nums text-red-500 sm:text-6xl"
            style={{ textShadow: "0 0 60px rgba(239,68,68,0.28)" }}
          />
          <p className="mt-2.5 text-xs italic leading-relaxed text-white/60 sm:text-[13px]">
            {testMessages.verdict.deathLineTemplate}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-red-400/85 sm:text-[13px]">
            {testMessages.verdict.deathLineImplication}
          </p>
        </m.div>

        {/* Bridge — the one gold thing on a red screen. */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: at(1200), ease: EASE_OUT_STRONG }}
          className="mt-9"
        >
          <Button
            variant="gold"
            mist={showBridge}
            onClick={handleBridgeClick}
            disabled={!showBridge}
          >
            {testMessages.verdict.bridgeButton}
            <ButtonArrow direction="down" />
          </Button>
        </m.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the gates**

Run: `pnpm lint && npx tsc --noEmit && pnpm vitest run`
Expected: 0 Biome errors (9 pre-existing warnings), tsc clean, all tests pass. If Biome flags an unused import, confirm `DEATHS_PER_SECOND` was deleted and nothing else references it.

- [ ] **Step 5: Walk the screen in EN and PT**

Run: `pnpm build && pnpm start`

For each of `http://localhost:3000/en/test` and `/pt/test`: complete all eight questions, mixing honest and denied answers so the confession renders both its admitted and denied clauses. On the verdict screen confirm:
1. A red glow is visible at the top of the viewport, and it stays put while scrolling.
2. The scales emblem is clearly visible above a hairline–label–hairline eyebrow.
3. The Scripture blockquote sits directly under GUILTY, with a red left border.
4. No chips or evidence pills appear anywhere — the confession sentence is the only place the commandments are listed.
5. The counter counts up on arrival and then **keeps climbing** roughly every half second.
6. `verdict.subtitle` no longer appears anywhere.
7. The sticky deaths bar is gone (Task 3), so this is the only live counter on screen.

- [ ] **Step 6: Confirm the CTA lands above the fold on a phone**

In devtools set the viewport to 390 × 844. Expected: the gold "Is there any hope?" button is visible without scrolling, and the top of the screen (emblem/eyebrow) is not clipped. If it falls below the fold, report the measured height rather than shrinking type to force a fit — the sizes here are deliberate. If the *top* is clipped, stop: `justify-center` is being applied inside an overflow container somewhere and that needs diagnosing, not patching.

- [ ] **Step 7: Confirm the counter does not shift layout**

In devtools console on the verdict screen, run:

```js
let cls = 0;
new PerformanceObserver((l) => {
  for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value;
}).observe({ type: "layout-shift", buffered: true });
setTimeout(() => console.log("CLS", cls), 15000);
```

Wait the full 15 seconds so the counter crosses at least one digit-width boundary. Expected: CLS well under 0.1, and no shift attributable to the counter. If the number jitters horizontally, the component's `minWidth: "7ch"` has been removed — restore it.

Then confirm the counter is not announced repeatedly: with VoiceOver (⌘F5) focused on the verdict screen, wait ten seconds. Expected: silence after the initial read-through. If the number is announced every half second, an `aria-live` region has survived somewhere above the counter.

- [ ] **Step 8: Re-read behaviour**

From the verdict screen, tap through to grace, then use grace's "Re-read verdict" link to come back. Confirm the verdict renders instantly with no staged delays, and the counter still ticks. The count restarts near the test's own duration rather than including time spent on grace — that is correct and matches the reducer's active-elapsed-only rule.

- [ ] **Step 9: Commit**

```bash
git add src/components/verdict-screen.tsx
git commit -m "feat(verdict): ground it, cite it, and make the count live

Six changes, in order of how much each moves the screen:

- The death count is now a live DeathCounter seeded with the test's elapsed
  time instead of a static text-3xl fade-in. A number meaning \"time is
  passing\" has to move, and because it never stops the reader is never
  parked in front of a finished screen. Framed in the same border-y-2 as
  GUILTY so the word and the number read as siblings.
- Added the red radial wash. Grace has a warm wash and the invitation has a
  crossroads gradient; the most dramatic screen in the flow was the only one
  on bare black.
- Added the James 2:10 blockquote under GUILTY, replacing the rendered
  subtitle. The law screen was citing no law and asserting guilt in the
  app's own voice.
- Compressed the entrance from 2900ms to 1200ms and gave each beat its own
  gesture. Four identical 800ms opacity fades in series read as loading, not
  as pronouncement. Two of the three setTimeout gates are gone; the CTA
  keeps its gate so it is never an invisible click target.
- Deleted the evidence chips. They were the test HUD's markup verbatim, and
  the confession sentence above them already names every commandment and how
  it was answered. Dropping them also brings the gold CTA above the fold on
  a 390x844 viewport.
- Emblem from size-6/60% to size-10/70%, plus the hairline eyebrow grace and
  the invitation already use.
- Dropped aria-live. It existed because the old screen revealed content on
  timers; with everything in the DOM at mount it is unnecessary, and a
  polite region wrapping a counter that changes twice a second would
  announce a new number forever.

The sequence stays automatic on purpose. A verdict is pronounced upon you,
not requested beat by beat — grace stays the only reader-paced screen,
because grace is the part you choose to receive."
```

---

## Final gate

- [ ] `pnpm lint` — 0 errors (9 pre-existing warnings: `useImportType`, `useOptionalChain`, `useExhaustiveDependencies`)
- [ ] `npx tsc --noEmit` — clean
- [ ] `pnpm vitest run` — all tests pass (109 + the 4 new cases from Task 1)
- [ ] Walked `/en/test` and `/pt/test` end to end once more: bar retires at the verdict and stays gone, one live counter, CTA above the fold at 390×844
- [ ] Husky pre-push gate green
- [ ] `src/content/blog/posts.ts` is **still unstaged** — it holds an unrelated in-progress blog post (`the-final-whistle`) that is not part of this work

## Owner decisions still open

These are flagged, not resolved, and must not be decided by an implementer:

1. **PT copy pass.** `scripture`, `scriptureRef`, `deathLineTemplate`, `deathLineImplication` are drafts pending the owner's Portuguese review (already tracked in the launch backlog). Verify the Tiago 2:10 wording against the same Almeida edition the app already quotes (`grace.scripture` uses `unigênito`, so Almeida, likely ACF/ARC), and sanity-check `A contagem não poupa ninguém`.
2. **Whether `verdict.subtitle` gets deleted.** Kept as an unused key by this plan, matching the `5a79b17` precedent. The copy itself ("By God's perfect standard, none of us are good enough.") is good and may deserve a home elsewhere.

3. **Whether the retired bar should come back at all.** Task 3 hides it for `verdict`, `grace`, and `invitation`. If you want it back for grace or the invitation, delete the matching selector from the CSS rule — but note that hiding it for the verdict alone makes it slide back down over grace, which reads worse than never hiding it.

4. **A pre-existing PT register clash, noticed while planning and left alone.** `test.answeredBadge` / `test.justifiedBadge` are `"Admitiu"` / `"Negou"` — third person (`ele/você`), while the rest of the PT copy is `tu` (`"respondias"`, `"começaste"`, `"És"`). The `tu` forms would be `"Admitiste"` / `"Negaste"`. Not caused by this change, and now that the record list is dropped these still render one at a time on the question card, so nothing here amplifies it. Fixing it touches `question-card.tsx` — separate decision.
3. **The decision/invitation screen is out of scope.** Its three separately-diagnosed problems — three stacked buttons reading as a form, the flat committed post-state, and share buttons rendering for dismissed readers (`invitation-screen.tsx:186`) — are a follow-up. The share-on-dismissed one is a tonal bug and is worth fixing on its own regardless of the redesign.
