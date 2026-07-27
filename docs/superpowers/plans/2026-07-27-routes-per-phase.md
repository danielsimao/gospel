# Routes Per Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each test phase a real URL so back, forward, refresh, and browser gestures work natively, and delete the ~130 lines of `pushState` machinery that currently simulates them.

**Architecture:** `GameProvider` hoists to a new `test/layout.tsx` so reducer state survives sibling-segment navigation. The route then becomes the single source of truth for which phase is showing; the reducer keeps the *data* (answers, score, timestamps, flags) and stops owning *position*. Transitions become `router.push`. Deep links are guarded client-side against the furthest phase the reader legitimately reached.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, framer-motion, Vitest, Biome, pnpm.

**Implements:** `2026-07-27-navigation-contract.md` decisions D1–D4. D5/D6 (homepage, blog) are a separate later plan.

## Global Constraints

- **Verdict is the floor (D2).** Forward-only through landing→questions→verdict. Free movement among verdict ⇄ grace ⇄ decision. Back from `/test/verdict` leaves the test. Never confirm-shame the exit — no "are you sure" dialog on leaving.
- **Questions are one-way.** They stay on a single route (`/test`) and never get their own URLs. `game-reducer` states this rule; do not "improve" it.
- **No behaviour change in Task 1.** It is a pure enabling move and must be verifiable as a no-op.
- **Never two sources of truth for position.** After Task 2 the route decides the phase. `state.phase` may exist only as a layout-written mirror until Task 3 removes it.
- **Locale parity** on any new key, both `en.json` and `pt.json`, same commit.
- **Reduced motion is global** (`MotionConfig reducedMotion="user"`, `providers.tsx:56`). No per-component branches.
- **Minimum diff.** Do not reformat untouched lines or reorder imports.

---

## Baseline measurements (from `f5fd3b8`, keep as regression targets)

| Property | Current |
| --- | --- |
| Back trail from decision | `invitation → grace → verdict → exits the app` |
| `history.length` | 20 landing / 20 first question / 20 verdict / 22 decision |
| Refresh on grace | Session persists (`phase: grace`, 6 answers); resume dialog appears; Continue restores — but **all eight beats reset to one** |
| Verdict screen CLS | 0 over 16s with the live counter running |
| Post-answer reveal | denial: badge 207ms, follow-up 375ms, Next 1079ms |

---

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `src/app/[locale]/(immersive)/test/layout.tsx` | Owns `GameProvider`, shared chrome, route↔phase sync, guards | **Create** |
| `src/app/[locale]/(immersive)/test/page.tsx` | Landing + questions | Modify — drop `GameProvider` |
| `src/app/[locale]/(immersive)/test/verdict/page.tsx` | Verdict | **Create** |
| `src/app/[locale]/(immersive)/test/grace/page.tsx` | Grace | **Create** |
| `src/app/[locale]/(immersive)/test/decision/page.tsx` | Invitation | **Create** |
| `src/components/game-shell.tsx` | Currently: chrome + phase switch + history sim | Gutted — chrome moves to layout, history sim deleted |
| `src/lib/game-reducer.ts` | State machine | Phase transitions become data-only; `phase` removed in Task 3 |
| `src/lib/test-session-storage.ts` | Persistence | Add `graceBeatsRevealed`; drop `phase` in Task 3 |
| `src/components/grace-screen.tsx` | Grace beats | Seed `revealedCount` from persistence |

---

### Task 1: Hoist `GameProvider` into a test layout

**Files:**
- Create: `src/app/[locale]/(immersive)/test/layout.tsx`
- Modify: `src/app/[locale]/(immersive)/test/page.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: reducer state that survives navigation between `/test` and any future `/test/*` segment. Every later task depends on this.

**Why first and why alone:** this is the single change that makes routing possible, and it is a provable no-op. If anything regresses here, it regresses in isolation.

- [ ] **Step 1: Create the layout**

```tsx
import { GameProvider } from "@/components/game-provider";

/**
 * Holds the game reducer above the phase segments. Next.js preserves layouts
 * across sibling-segment navigation, so state survives /test → /test/verdict.
 * With GameProvider in page.tsx it would remount on every navigation and wipe
 * the reducer — this layout is what makes routes-per-phase possible at all.
 */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
```

- [ ] **Step 2: Remove `GameProvider` from the page**

In `test/page.tsx`, delete the `GameProvider` import and unwrap `GameShell`:

```tsx
  return (
    <>
      <StructuredData data={webPageSchema} />
      <GameShell messages={messages} locale={locale as Locale} />
    </>
  );
```

- [ ] **Step 3: Gates**

Run: `pnpm lint && npx tsc --noEmit && pnpm vitest run`
Expected: 0 Biome errors (9 pre-existing warnings), tsc clean, 121 tests pass.

- [ ] **Step 4: Prove it is a no-op**

`pnpm build && pnpm start`, then walk `/en/test` end to end: six questions → verdict → grace → decision → answer. Confirm identical behaviour to before, including the resume dialog on refresh and the deaths bar retiring at the verdict. Nothing should look or feel different.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(immersive)/test/layout.tsx" "src/app/[locale]/(immersive)/test/page.tsx"
git commit -m "refactor(test): hoist GameProvider into a test layout

Enabling move for routes-per-phase, with no behaviour change. Next.js
preserves layouts across sibling-segment navigation, so the reducer will
survive /test -> /test/verdict. Left in page.tsx it would remount on every
navigation and wipe all state."
```

---

### Task 2: Split phases into routes and delete the history simulation

**Files:**
- Create: `test/verdict/page.tsx`, `test/grace/page.tsx`, `test/decision/page.tsx`
- Modify: `test/layout.tsx`, `src/components/game-shell.tsx`, `src/lib/game-reducer.ts`, callers that dispatch phase transitions

**Interfaces:**
- Consumes: the layout from Task 1.
- Produces: `/test/verdict`, `/test/grace`, `/test/decision` as real URLs. Phase transitions are `router.push`. `state.phase` becomes a layout-written mirror — read freely, never written outside the layout.

**This task is deliberately large and must not be split further.** A half-migrated phase model — some transitions via `router.push`, some via `dispatch` — is a two-source-of-truth state that is worse than either endpoint. The split that *is* safe (removing `state.phase` entirely) is Task 3.

**Design:**

- The route decides which screen renders. Each phase page renders its existing component unchanged.
- The layout derives the phase from `useSelectedLayoutSegment()` (`null` → landing/questions, `"verdict"`, `"grace"`, `"decision"`) and writes it into the reducer via a single `SYNC_PHASE` action, so existing guards and `data-game-phase` keep working.
- Reducer actions keep their **data** effects and lose their **navigation** effects. `ADVANCE_AFTER_FOLLOWUP` still stamps `completedAt` when the last question is answered; the component then calls `router.push('/test/verdict')`.
- `BACK_TO_VERDICT` / `BACK_TO_GRACE` are deleted — browser back now does that.
- Delete from `game-shell.tsx`: `PHASE_ORDER`, `HISTORY_NONCE`, `prevPhaseRef`, `depthRef`, `unwindingRef`, `viaLinkRef`, `poppingRef`, both history effects, and the post-response unwind effect (lines ~157–287).
- `trackTestBack` currently takes a `via: "link" | "browser"` argument that only existed to distinguish simulated back from real back. With real routes there is only one kind. Keep the event, drop the argument, and note the analytics schema change in the commit.
- Shared chrome (`main` wrapper, vignette, Exit link, `ResumeDialog`, `data-game-phase` effect) moves from `game-shell` into the layout so it does not remount per segment.

- [ ] **Step 1: Write the failing test**

Add `src/__tests__/game-reducer.test.ts` cases asserting the reducer no longer owns navigation:

```ts
it("ADVANCE_AFTER_FOLLOWUP stamps completedAt on the last question without setting a phase", () => {
  const state = { ...answeredThroughLastQuestion };
  const next = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
  expect(next.completedAt).toEqual(expect.any(Number));
});

it("no longer exposes BACK_TO_VERDICT or BACK_TO_GRACE", () => {
  const before = { ...atGrace };
  // @ts-expect-error - action intentionally removed; browser back replaces it
  expect(gameReducer(before, { type: "BACK_TO_VERDICT" })).toBe(before);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run src/__tests__/game-reducer.test.ts`
Expected: FAIL — `BACK_TO_VERDICT` still handled.

- [ ] **Step 3: Create the three phase pages**

Each mirrors `test/page.tsx`'s metadata pattern and renders its screen. They must **not** re-declare `generateStaticParams` conflicts — verify against the existing page. Set `robots: { index: false }` on all three: they are mid-flow states, not landing pages, and indexing them would put readers on a guarded route from search.

- [ ] **Step 4: Move chrome and sync into the layout, gut `game-shell`**

The layout becomes a client component holding the chrome, the `data-game-phase` effect, the `ResumeDialog`, and:

```tsx
const segment = useSelectedLayoutSegment(); // null | "verdict" | "grace" | "decision"
```

- [ ] **Step 5: Convert every transition to `router.push`**

Call sites: the last-question advance in `question-card.tsx`, `handleBridgeClick` in `verdict-screen.tsx`, `handleContinue` in `grace-screen.tsx`, and the re-read links in `grace-screen.tsx` / `invitation-screen.tsx` (which become `router.back()`).

- [ ] **Step 6: Gates + full walk**

Run: `pnpm lint && npx tsc --noEmit && pnpm vitest run && pnpm build`

Then verify against the baseline table, both locales:
1. URLs change: `/test` → `/test/verdict` → `/test/grace` → `/test/decision`.
2. Back from decision → grace → verdict → **leaves the test** (the floor, per D2).
3. Forward button works at every step — this never worked before.
4. Refresh on each phase lands on that phase (guards arrive in Task 3; for now confirm no crash).
5. The deaths bar still retires at the verdict (`data-game-phase` still published).
6. Post-answer reveal timings unchanged from the baseline table.
7. `game-shell.tsx` contains no `pushState`, no `HISTORY_NONCE`, no depth tracking.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(test): make each phase a real route

Back, forward, refresh and browser gestures now work natively instead of
being simulated by ~130 lines of pushState juggling with five refs, a nonce,
depth tracking and unwind logic. All of that is deleted.

The route is the single source of truth for position; the reducer keeps the
data. Questions stay on one route because the method treats them as one-way.
Back from the verdict leaves the test, which is the contract's 'verdict is
the floor' - the same behaviour as before, but now announced by the URL
rather than produced by an invisible history trick.

trackTestBack loses its via argument: it existed only to tell simulated back
from real back, and there is now only one kind."
```

---

### Task 3: Remove `state.phase` and add deep-link guards

**Files:** `src/lib/game-reducer.ts`, `src/lib/types.ts`, `src/lib/test-session-storage.ts`, `test/layout.tsx`

**Interfaces:**
- Consumes: Task 2's routes.
- Produces: `furthestPhase(state)` helper; guarded routes.

**Design — the furthest phase is derived, not stored.** It already can be: `answers.length === TOTAL_QUESTIONS` → verdict reached; `graceReached` → grace; `invitationReached` → decision. So dropping persisted `phase` loses nothing.

Guard rules:
- No session at all → redirect any `/test/*` to `/test`.
- Session exists but the requested phase is beyond the furthest reached → redirect to the furthest reached. **Never forward past where the reader actually got to.**
- Render nothing until the session read resolves — reuse the existing rAF-deferred pattern so hydration stays stable and no wrong phase flashes.

- [ ] **Step 1: Write failing tests** for `furthestPhase` covering: no answers, partial answers, all answers, graceReached, invitationReached.
- [ ] **Step 2: Run, watch fail.**
- [ ] **Step 3: Implement `furthestPhase` + remove `phase` from `GameState`, `SavedSession`, and the reducer.** Bump `CURRENT_VERSION` in `test-session-storage.ts` to 4 — the shape changes and stale v3 sessions must be discarded, exactly as the v3 comment documents for the 8→6 question change.
- [ ] **Step 4: Add the guard to the layout.**
- [ ] **Step 5: Gates, then verify** cold deep-links to all three routes with: no session, a partial session, a complete session.
- [ ] **Step 6: Commit.**

---

### Task 4: Persist the revealed grace beats

**Files:** `src/lib/test-session-storage.ts`, `src/components/grace-screen.tsx`, `src/__tests__/test-session-storage.test.ts`

**The confirmed bug:** refreshing on grace restores the phase but resets all eight beats to one. Measured directly. `grace-screen.tsx:37` seeds `revealedCount` from `returning`, which the shell passes as `state.invitationReached` (false on a resume).

**Why it cannot reuse `graceReached`:** that is true the instant grace is entered, so seeding from it would reveal all eight beats to a first-time reader and destroy the reveal entirely.

- [ ] **Step 1: Write the failing test** — `writeSession` round-trips `graceBeatsRevealed`; a v3 session without it reads as `0`.
- [ ] **Step 2: Run, watch fail.**
- [ ] **Step 3: Add `graceBeatsRevealed: number` to `SavedSession` and `GameState`**, dispatched as beats are revealed.
- [ ] **Step 4: Seed `revealedCount`** from `max(1, persisted)`, keeping `returning` for the all-revealed case.
- [ ] **Step 5: Verify** — reveal four beats, refresh, resume: four beats still shown, tap continues from five.
- [ ] **Step 6: Commit.**

---

### Task 5: Verification sweep

- [ ] Both locales, full walk, all four routes.
- [ ] Back and forward at every phase boundary.
- [ ] Refresh at every phase.
- [ ] Cold deep-link to each guarded route.
- [ ] Resume dialog from each phase.
- [ ] Deaths bar retires at the verdict and stays gone through grace and decision.
- [ ] Verdict CLS still 0 over 16s with the counter running.
- [ ] Post-answer timings match the baseline table.
- [ ] `src/content/blog/posts.ts` still unstaged.
- [ ] Husky pre-push gate green.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| Task 2 is large and atomic | Task 1 de-risks the foundation separately; Task 2 has an explicit 7-point verification list against measured baselines |
| Analytics schema change (`trackTestBack`) | Called out in the commit; no dashboards depend on `via` as far as recon found — **confirm before merging** |
| Session version bump discards in-flight sessions | Same policy as v3; affects only readers mid-test at deploy time |
| Phase pages indexed by search | `robots: { index: false }` on all three |
| `useSelectedLayoutSegment` returns `null` for the index segment | Handled explicitly; do not treat `null` as an error |

## Open items for the grill

1. Should `/test/decision` stay reachable after a response is recorded, or redirect to `/next-steps`? Currently the app unwinds history so back exits; with routes, this needs an explicit answer.
2. Does anything consume `trackTestBack`'s `via` property in PostHog?
3. Should the Exit link get a clearer label now that back-from-verdict is the documented way out?
