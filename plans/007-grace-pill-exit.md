# 007 — Fade the grace tap-pill out instead of unmounting it

- **Status**: TODO
- **Commit**: 1e9581f
- **Severity**: LOW
- **Category**: Content shift
- **Estimated scope**: 1 file (`src/components/grace-screen.tsx`), ~8 lines

## Problem

When the final beat is revealed, the "tap to continue" pill unmounts with no exit animation in the same frame the scripture block mounts — a double layout jump at the flow's most reverent moment.

```tsx
/* src/components/grace-screen.tsx:159-174 — current */
{/* Tap to continue pill — no exit animation, just unmounts when the last beat is revealed */}
{revealedCount > 0 && !allBeatsRevealed && (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 2.2 }}
    className="mt-6 flex justify-center"
  >
```

## Target

Wrap the pill in `AnimatePresence` (already imported in this file) and give it a 150ms opacity exit. The scripture block below already enters with `delay: 0.4`, so the sequencing works: pill fades (150ms) → scripture fades in (400ms later).

```tsx
/* target */
{/* Tap to continue pill — fades out when the last beat is revealed */}
<AnimatePresence>
  {revealedCount > 0 && !allBeatsRevealed && (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 2.2 }}
      className="mt-6 flex justify-center"
    >
      ...unchanged children...
    </motion.div>
  )}
</AnimatePresence>
```

IMPORTANT: the `exit` transition must NOT inherit the 2.2s delay. Give the exit its own timing by using a transition object with per-property overrides — set `exit={{ opacity: 0, transition: { duration: 0.15, delay: 0 } }}` instead of a bare `exit={{ opacity: 0 }}`.

## Repo conventions to follow

- `AnimatePresence` is already imported at `src/components/grace-screen.tsx:4` and used at line 177 for the scripture block — same style.

## Steps

1. Wrap the pill conditional in `<AnimatePresence>...</AnimatePresence>`.
2. Add `exit={{ opacity: 0, transition: { duration: 0.15, delay: 0 } }}` to the pill's `motion.div`.
3. Update the comment.

## Boundaries

- Do NOT change the pill's entrance timing (0.4s / 2.2s delay) or the scripture block.
- Do NOT touch the beats logic.
- If the pill block differs (drift since 1e9581f), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check**: `/en/test` → complete → grace screen → tap through all beats. On the final tap: the pill fades out quickly (not vanishes), then scripture fades in. No frame where the pill hard-disappears.
- **Done when**: final-beat transition reads as fade-out → fade-in, no pop.
