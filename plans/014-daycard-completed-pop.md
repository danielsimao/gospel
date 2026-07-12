# 014 — Pop the COMPLETED chip when a reading day is finished

- **Status**: DONE (commit 2f53296)
- **Commit**: 71deab3
- **Severity**: LOW (delight)
- **Category**: Missed opportunity
- **Estimated scope**: 1 file (`src/components/reading-plan/day-card.tsx`), ~8 lines

## Problem

Marking a day as read is the reading plan's only reward moment — and the COMPLETED chip just appears while the card collapses. The test flow's answer chips pop (scale 0.95→1, 180ms); this is the same moment class.

```tsx
/* src/components/reading-plan/day-card.tsx:80-84 — current */
{isCompleted && (
  <span className="font-mono text-[9px] uppercase tracking-[2px] text-[#D4A843]/70">
    {completedLabel}
  </span>
)}
```

## Target

```tsx
{isCompleted && (
  <motion.span
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.18, ease: EASE_OUT_STRONG }}
    className="font-mono text-[9px] uppercase tracking-[2px] text-[#D4A843]/70"
  >
    {completedLabel}
  </motion.span>
)}
```

`motion` and `EASE_OUT_STRONG` are already imported in this file (lines 4, 7). Chips for previously-completed days replay the 180ms pop on page load — acceptable (subtle, matches the test-flow chips' behavior).

## Steps

1. Swap the span per Target.

## Boundaries

- Do NOT touch the expand/collapse logic or the chevron.

## Verification

- **Mechanical**: `pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check**: `/en/reading-plan`, expand Day 1, "Mark as read": the COMPLETED chip pops in as the card collapses.
- **Done when**: chip animates on completion.
