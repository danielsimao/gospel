# 008 — Reserve the verdict-shortcut slot from question 1

- **Status**: TODO
- **Commit**: 1e9581f
- **Severity**: LOW
- **Category**: Content shift
- **Estimated scope**: 1 file (`src/components/question-card.tsx`), ~6 lines

## Problem

The "See verdict" shortcut mounts below the card once `answers.length >= 3`. Its appearance adds ~46px (button + `mt-4`) under the card at Q4 — with plan 006's top-aligned layout this no longer moves the card, but the element still pops in from nothing and (before 006) nudged the centered column.

```tsx
/* src/components/question-card.tsx:234-255 — current */
{canShowVerdictShortcut && (
  <motion.button
    type="button"
    onClick={() => dispatch({ type: "SHOW_VERDICT" })}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="group mt-4 inline-flex items-center gap-2.5 rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[2.5px] text-red-400/65 transition-colors hover:text-red-400 focus-visible:text-red-400 focus-visible:outline-none"
  >
```

## Target

A fixed-height slot exists from Q1; the button fades into it when eligible:

```tsx
/* target */
<div className="mt-4 flex h-9 items-center justify-center">
  {canShowVerdictShortcut && (
    <motion.button
      type="button"
      onClick={() => dispatch({ type: "SHOW_VERDICT" })}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="group inline-flex items-center gap-2.5 rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[2.5px] text-red-400/65 transition-colors hover:text-red-400 focus-visible:text-red-400 focus-visible:outline-none"
    >
      ...unchanged children...
    </motion.button>
  )}
</div>
```

Exact changes: wrap in the slot div (`mt-4 flex h-9 items-center justify-center`); remove `mt-4` from the button's className (the slot owns the margin). `h-9` = 36px ≈ button height (py-1.5 + 11px text ≈ 32px) + breathing room; executor verifies measured height and bumps to `h-10` if the button is taller than 36px.

## Repo conventions to follow

- Fixed-slot reservation is the established shift-fix pattern in this file (chips row `min-h-[76px]`, Row 3).

## Steps

1. `src/components/question-card.tsx` lines ~234-255: apply the Target wrapper; strip the button's `mt-4`.
2. Measure the rendered button height (Verification) and adjust slot height if needed.

## Boundaries

- Do NOT change the shortcut's eligibility logic (`canShowVerdictShortcut`), analytics, or hover styles.
- Do NOT reserve the slot on the last question (`canShowVerdictShortcut` is already false there — the slot div still renders; that's fine and keeps height constant).
- If the block differs (drift since 1e9581f), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check**: `/en/test`, answer Q1→Q5: nothing below the card moves when the shortcut appears at Q4 — it fades into pre-existing space. Confirm the button isn't visually clipped by the slot (bump `h-9`→`h-10` if so).
- **Done when**: shortcut appearance causes zero layout delta below the card.
