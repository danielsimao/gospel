# 006 — Pin the question card to a stable top position

- **Status**: DONE (commit c5ad914)
- **Commit**: 1e9581f
- **Severity**: MEDIUM
- **Category**: Content shift / performance
- **Estimated scope**: 1 file (`src/components/question-card.tsx`), ~6 lines

## Problem

The card sits centered in the grid's `1fr` row, so its top position depends on its own height — which varies with question text length and grows when answered. Measured drift across a full run: card top 288 → 250 → 250 → 241 → 241 → 210 → 210 → 205px. Every question swap subtly relocates the card; on mobile the eye tracks the jump. The `layout` prop also forces a layout measurement on every swap.

```tsx
/* src/components/question-card.tsx:117-128 — current */
{/* Row 2: Card area + verdict shortcut — self-centered in the 1fr space */}
<div className="flex w-full max-w-xs flex-col items-center self-center justify-self-center sm:max-w-sm">
    <AnimatePresence mode="popLayout">
      <motion.div
        key={questionIndex}
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
```

## Target

Top-align the card container with a fixed offset instead of centering, and drop the now-unneeded `layout` prop. The card's top edge becomes constant for the entire test; height changes grow downward into the free space (the chips row is pinned to the grid bottom and already reserves its height).

```tsx
/* target */
{/* Row 2: Card area + verdict shortcut — pinned to a stable top offset */}
<div className="flex w-full max-w-xs flex-col items-center self-start justify-self-center pt-[7vh] sm:max-w-sm sm:pt-[9vh]">
    <AnimatePresence mode="popLayout">
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
```

Exact changes: `self-center` → `self-start`; add `pt-[7vh] sm:pt-[9vh]`; delete the `layout` prop. Nothing else.

## Repo conventions to follow

- Tailwind arbitrary values are the norm here (`min-h-[76px]`, `pt-[7vh]` fits).
- Keep the comment above the div accurate — update it as in Target.

## Steps

1. `src/components/question-card.tsx` line ~118: swap classes per Target.
2. Line ~122: remove `layout` from the card `motion.div`.
3. Update the Row 2 comment text.

## Boundaries

- Do NOT change the AnimatePresence mode, the slide values, or the transition.
- Do NOT touch Rows 1/3.
- If the classes at line ~118 differ (drift since 1e9581f), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check** (390×844, `/en/test`, answer all 8 without the shortcut): record `document.querySelector("main .rounded-2xl").getBoundingClientRect().top` before each answer — the value must be IDENTICAL (±1px) for all 8 questions.
  - Card must not collide with the chips row on the smallest question (visual check at 390×667 too — iPhone SE).
- **Done when**: card top constant Q1→Q8; no visual overlap at 390×667.
