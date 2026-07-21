# Test Page Undo + Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mis-tap protection without breaking one-way testimony: an undo link on the answered card (before Next confirms), the mislabeled BACK exit relabeled Exit, and the answer-chip record moved from the orphaned bottom of the screen to directly under the card.

**Architecture:** New `UNDO_ANSWER` reducer action pops the last answer and recomputes the score by folding the remaining answers' drains from `INITIAL_SCORE` (exact through the zero-clamp). The answered card gains a quiet text link that dispatches it; `AnimatePresence mode="wait"` already handles the buttons returning. The question-card grid loses row 3; chips render inside row 2 under the card, above the verdict shortcut.

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript, framer-motion via LazyMotion (`m` only), Vitest, pnpm.

## Global Constraints

- **One-way testimony stands:** undo exists ONLY while `currentAnswer` is set and Next hasn't been tapped. `ADVANCE_AFTER_FOLLOWUP` remains irreversible. No navigation to previous questions.
- TDD for the reducer (`src/__tests__/game-reducer.test.ts` exists — extend it, match its patterns).
- Bilingual parity; surgical JSON edits + `python3 json.load` validation; PT flagged for owner gate.
- Zero-shift rule: chips under the card grow DOWNWARD only; nothing above the card moves.
- Gates: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green before commit.
- Kill port-3000 listeners with `kill $(lsof -ti :3000)` (Next renames its process; pkill-by-name misses it).
- Commit trailers:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 1: UNDO_ANSWER reducer action (TDD)

**Files:**
- Modify: `src/lib/types.ts` (GameAction union — find it: `grep -n "GameAction" src/lib/types.ts`)
- Modify: `src/lib/game-reducer.ts`
- Test: `src/__tests__/game-reducer.test.ts`

**Interfaces:**
- Produces: action `{ type: "UNDO_ANSWER" }` — valid only when `phase === "playing" && currentAnswer !== null && answers.length > 0`; pops the last answer, recomputes score, clears `currentAnswer`/`showFollowUp`, resets `questionStartedAt` to `Date.now()`. `currentQuestion` unchanged.

- [ ] **Step 1: Write the failing tests** — append to `src/__tests__/game-reducer.test.ts` (read the file first; reuse its helpers for building answered states; match its describe/it style):

```ts
describe("UNDO_ANSWER", () => {
  it("pops the last answer, restores score exactly, and clears currentAnswer", () => {
    let state = gameReducer(initialGameState, { type: "START_GAME" });
    const scoreBefore = state.score;
    state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "honest" });
    expect(state.answers).toHaveLength(1);
    state = gameReducer(state, { type: "UNDO_ANSWER" });
    expect(state.answers).toHaveLength(0);
    expect(state.score).toBe(scoreBefore);
    expect(state.currentAnswer).toBeNull();
    expect(state.showFollowUp).toBe(false);
    expect(state.currentQuestion).toBe(0);
    expect(state.questionStartedAt).not.toBeNull();
  });

  it("restores score exactly across multiple answers (fold replay)", () => {
    let state = gameReducer(initialGameState, { type: "START_GAME" });
    state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "honest" });
    state = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
    const scoreAfterQ1 = state.score;
    state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "justify" });
    state = gameReducer(state, { type: "UNDO_ANSWER" });
    expect(state.score).toBe(scoreAfterQ1);
    expect(state.answers).toHaveLength(1);
  });

  it("is a no-op when nothing is answered or phase is not playing", () => {
    let state = gameReducer(initialGameState, { type: "START_GAME" });
    expect(gameReducer(state, { type: "UNDO_ANSWER" })).toBe(state);
    state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "honest" });
    state = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
    // advanced — currentAnswer is null again, undo must not eat the recorded answer
    const afterAdvance = gameReducer(state, { type: "UNDO_ANSWER" });
    expect(afterAdvance).toBe(state);
  });
});
```

- [ ] **Step 2: Run** — `pnpm test -- game-reducer` → FAIL (unknown action / type error).

- [ ] **Step 3: Implement**

`src/lib/types.ts` — add `| { type: "UNDO_ANSWER" }` to the `GameAction` union.

`src/lib/game-reducer.ts` — after the `ANSWER_QUESTION` case:

```ts
    case "UNDO_ANSWER": {
      // Mis-tap protection only: valid while the answer awaits confirmation
      // (Next not yet tapped). Once ADVANCE_AFTER_FOLLOWUP runs, testimony
      // is recorded and there is no way back — by design.
      if (state.phase !== "playing") return state;
      if (!state.currentAnswer || state.answers.length === 0) return state;

      const remaining = state.answers.slice(0, -1);
      // Replay the drains from scratch — exact inverse even when the
      // per-answer clamp at 0 made subtraction non-invertible.
      const score = remaining.reduce(
        (s, a) => Math.max(0, s + a.scoreChange),
        INITIAL_SCORE,
      );

      return {
        ...state,
        score,
        answers: remaining,
        currentAnswer: null,
        showFollowUp: false,
        questionStartedAt: Date.now(),
      };
    }
```

(`INITIAL_SCORE` is already imported in the file.)

- [ ] **Step 4: Run** — `pnpm test -- game-reducer` → PASS (all, including pre-existing).
- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/game-reducer.ts src/__tests__/game-reducer.test.ts
git commit -m "feat: UNDO_ANSWER reducer action — mis-tap protection

Valid only between answering and confirming with Next; pops the last
answer and replays the remaining drains from INITIAL_SCORE so the score
restore is exact even through the zero-clamp. Advancing stays
irreversible — testimony is one-way by design.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 2: Undo link + Exit relabel + chips under the card

**Files:**
- Modify: `src/components/question-card.tsx`
- Modify: `src/lib/analytics.ts` (one event — match file style)
- Modify: `src/messages/en.json`, `src/messages/pt.json` (`test.changeAnswerLabel` new; `test.backLabel` value change)
- Modify: `src/lib/types.ts` IF `TestMessages` is typed there (it is — `grep -n "backLabel" src/lib/types.ts`; add `changeAnswerLabel: string;` beside it)

**Interfaces:**
- Consumes: Task 1's `UNDO_ANSWER`.
- Produces: `trackAnswerChanged(questionId: number, from: "honest" | "justify")` in `src/lib/analytics.ts`.

- [ ] **Step 1: Analytics** — in `src/lib/analytics.ts`, matching the existing `track*` style:

```ts
export function trackAnswerChanged(questionId: number, from: "honest" | "justify") {
  safeCapture("answer_changed", { questionId, from });
}
```

- [ ] **Step 2: Message keys (surgical, both locales)**

EN in `test` (place beside `"backLabel"` — grep it):
- `"backLabel"`: change value `"Back"` → `"Exit"` (READ the current value first — whatever it is, replace with `"Exit"`).
- Add after it: `"changeAnswerLabel": "Change my answer",`

PT:
- `"backLabel"` value → `"Sair"`.
- Add: `"changeAnswerLabel": "Mudar a minha resposta",`

`src/lib/types.ts` — `TestMessages` gains `changeAnswerLabel: string;` next to `backLabel`.

- [ ] **Step 3: Undo link in `src/components/question-card.tsx`**

Inside the answered branch (`key="response"` motion div), directly AFTER the action-button `m.div` (the one with `data-slot="action-buttons"`, closes ~line 234), add:

```tsx
                      <m.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: answered === "justify" ? 0.8 : 0.7 }}
                        onClick={() => {
                          if (answered) trackAnswerChanged(question.id, answered);
                          dispatch({ type: "UNDO_ANSWER" });
                        }}
                        className="mt-3 w-full text-center font-mono text-[10px] uppercase tracking-[2px] text-white/35 transition-colors hover:text-white/55"
                      >
                        {testMessages.changeAnswerLabel}
                      </m.button>
```

Import `trackAnswerChanged` (extend the existing `@/lib/analytics` import if present, else add). Note: `question.id` — verify the prop's field name in this file (the answer object uses `questionId: config.id`; the component has `question` and `config` in scope — use whichever carries the id, read first).

- [ ] **Step 4: Chips move under the card**

Current structure (read the file): grid `grid-rows-[auto_1fr_auto]` — row 1 ExaminationLedger, row 2 card+shortcut, row 3 answer chips (`{/* Row 3: Answered chips — pinned to bottom */}` block, ~lines 267-300).

- Change the grid to `grid-rows-[auto_1fr]`.
- MOVE the entire chips block (the `state.answers.length > 0 && (…)` motion div with the numbered chips — keep its internals byte-identical) from row 3 into row 2: directly AFTER the card's closing `</AnimatePresence>` (after ~line 240) and BEFORE the verdict-shortcut `<div className="mt-4 flex h-9 …">`.
- Delete the now-empty row-3 wrapper `<div className="flex min-h-[76px] …">…</div>`.
- The chips wrapper keeps `mt-5` — visual order becomes: card → chips → shortcut.

- [ ] **Step 5: Gates** — all green.

- [ ] **Step 6: Runtime verify (Playwright, kill port 3000 → `pnpm build && pnpm start`, 390×844, fresh profile)**
  1. Begin test → Exit chip top-left reads "Exit" (EN) — and clicking it still goes home (check href only, don't navigate).
  2. Answer Q1 honestly → card shows "A LIAR" + Next + "CHANGE MY ANSWER" link below; chips (`01 a liar`) render UNDER the card, not at screen bottom.
  3. Tap "Change my answer" → answer chips return (Yes, I have / Not really), ledger chip GONE, progress unchanged (still 01/08); answer the OTHER way (justify) → justified badge + FollowUp shows, undo link present there too.
  4. Undo again → re-answer honest → Next → Q2. Chip `01 a liar` present under card.
  5. Reload mid-test (session resume) → resume dialog or state intact, no crash, chips still under card.
  6. PT spot: `/pt/test` begin → Exit chip "Sair"; answer → link "MUDAR A MINHA RESPOSTA".
  7. No console errors/hydration warnings. Kill server.

- [ ] **Step 7: Commit**

```bash
git add src/components/question-card.tsx src/lib/analytics.ts src/lib/types.ts src/messages/en.json src/messages/pt.json
git commit -m "feat: change-answer link, honest Exit label, ledger under the card

Mis-taps are real on mobile but the test had no correction path — and
the top-left escape hatch was labeled BACK while actually exiting to
the homepage. The answered card now carries a quiet 'Change my answer'
link (valid until Next confirms; advancing stays irreversible), the
exit is labeled Exit/Sair, and the answer-chip record moves from the
orphaned bottom of the viewport to directly under the card — question,
answer, and growing record in one eye path.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 3: Ship + verify

- [ ] Push; wait Ready; prod smoke: `/en/test` 200; behavior trusted from Task 2 runtime.

## Execution order

1 → 2 → 3 serial.

## Owner copy gate

EN "Change my answer" / "Exit"; PT "Mudar a minha resposta" / "Sair".
