# 001 — Eliminate the two-stage layout shift on justify answers

- **Status**: DONE (commit 56dbfa6)
- **Commit**: 8eb6e36
- **Severity**: HIGH
- **Category**: Purpose & frequency / content shift
- **Estimated scope**: 2 files (`src/components/question-card.tsx`, `src/components/follow-up.tsx`), ~15 lines

## Problem

When a user answers "justify" on a test question, the card shifts layout **twice after the click**, both while they are reading:

1. The response block swaps in immediately, but the `FollowUp` paragraph mounts **600ms later** (a `setTimeout` dispatches `SHOW_FOLLOWUP`), growing the card mid-read.
2. The Next button fades in at a further **1.2s delay** and then calls `scrollIntoView`, nudging the viewport.

This happens on every justify answer — up to 8 times per test — and is the single most frequent content shift in the flow. Mobile is worst (the card is near full-width, so growth moves everything).

Current code:

```tsx
/* src/components/question-card.tsx:60-79 — current (timer that late-mounts FollowUp) */
useEffect(() => {
  timersRef.current.forEach(clearTimeout);
  timersRef.current = [];

  if (answered !== "justify" || showFollowUp) {
    return;
  }

  timersRef.current.push(
    setTimeout(() => {
      dispatch({ type: "SHOW_FOLLOWUP" });
      trackFollowupShown(question.id);
    }, 600),
  );
  ...
}, [answered, dispatch, question.id, questionIndex, showFollowUp]);
```

```tsx
/* src/components/question-card.tsx:195-201 — current (conditional mount = layout shift) */
<div className="flex items-center gap-2 border-t border-red-900/30 pt-3">
  <span className="h-1 w-1 rounded-full bg-red-500" />
  <p className="font-mono text-[10px] font-semibold uppercase tracking-[2px] text-red-400/80">
    {testMessages.justifiedBadge}
  </p>
</div>
{showFollowUp && <FollowUp text={question.followUp} />}
```

```tsx
/* src/components/question-card.tsx:206-212 — current (1.2s Next delay on justify) */
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: 0.4,
    delay: answered === "justify" ? 1.2 : 0.5,
  }}
```

```tsx
/* src/components/follow-up.tsx:10-15 — current (y movement on a late mount) */
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
  className="mt-4 border-l border-red-800/40 pl-3 max-w-sm"
>
```

## Target

The card reaches its **final height at the moment of the answer click** (a height change at the moment of user action is expected; growth 600ms later mid-read is not). The follow-up text then *fades* into already-reserved space:

- `FollowUp` renders as soon as `answered === "justify"` (not gated on `showFollowUp`), so its space is reserved with the response block.
- `FollowUp` reveals with **opacity only** — no `y` movement — `duration: 0.45`, `delay: 0.35`, `ease: [0.16, 1, 0.3, 1]`.
- The Next button delay drops from `1.2` to `0.6` on the justify path (honest path stays `0.5`).
- The `SHOW_FOLLOWUP` timer stays (it drives reducer state used by session persistence, and `trackFollowupShown` analytics) — only the **render gate** changes.

```tsx
/* target — question-card.tsx render site */
{answered === "justify" && <FollowUp text={question.followUp} />}
```

```tsx
/* target — follow-up.tsx */
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.45, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
  className="mt-4 border-l border-red-800/40 pl-3 max-w-sm"
>
```

```tsx
/* target — Next button transition */
transition={{
  duration: 0.4,
  delay: answered === "justify" ? 0.6 : 0.5,
}}
```

## Repo conventions to follow

- Framer `motion.div` with inline `transition` objects; the flow's standard curve is `[0.16, 1, 0.3, 1]` (see `src/components/question-card.tsx:126` for the exemplar).
- Space-reservation for late-revealed content is an established pattern here: `src/components/verdict-screen.tsx:91-99` keeps content in the DOM and animates only opacity (`initial={false}`, `aria-hidden`).

## Steps

1. `src/components/question-card.tsx` line ~201: change `{showFollowUp && <FollowUp text={question.followUp} />}` to `{answered === "justify" && <FollowUp text={question.followUp} />}`. (`showFollowUp` and its `useEffect` timer at lines 60-79 stay untouched — analytics + persisted state.)
2. `src/components/question-card.tsx` line ~211: change the Next-button delay expression from `answered === "justify" ? 1.2 : 0.5` to `answered === "justify" ? 0.6 : 0.5`.
3. `src/components/follow-up.tsx`: remove `y: 8` from `initial` (leave `opacity: 0` only) and change the transition to `{ duration: 0.45, delay: 0.35, ease: [0.16, 1, 0.3, 1] }`.
4. Since the follow-up is aria-relevant only once visible, add `aria-hidden` is NOT needed — the text is legitimate content from mount; no change.

## Boundaries

- Do NOT touch the reducer (`src/lib/game-reducer.ts`), the `SHOW_FOLLOWUP` action, or `test-session-storage`.
- Do NOT change the honest-path timings (its follow-up already mounts with the block).
- Do NOT remove the `scrollIntoView` on the action-button `onAnimationComplete` — with the earlier delay it now fires at a stable height.
- Do NOT add new dependencies.
- If the code at the cited lines doesn't match (drift since 8eb6e36), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — all green (61 tests, none cover this component).
- **Feel check** (mobile viewport, 390×844, dev server `/en/test`):
  - Answer a question with the justify option ("Not really" etc.). The card must reach its final height **immediately on click**; nothing below the card moves after that moment.
  - The follow-up paragraph fades in ~0.35s later into space that was already there — watch the Next button: it must NOT move down when the follow-up appears.
  - Next button is visible and clickable by ~1s after the answer.
  - In DevTools Animations panel at 10% speed: confirm the follow-up reveal is pure opacity (no vertical movement).
- **Done when**: on the justify path, the only layout change after the click IS the click-moment response swap; zero movement during the following 2 seconds.
