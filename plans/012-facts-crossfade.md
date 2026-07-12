# 012 — Crossfade the rotating facts ticker (no blank gap)

- **Status**: DONE (commit TBD)
- **Commit**: 71deab3
- **Severity**: LOW-MEDIUM
- **Category**: Cohesion
- **Estimated scope**: 1 file (`src/components/eternity/rotating-facts.tsx`), 1 word

## Problem

The home-hero fact ticker uses `AnimatePresence mode="wait"`: the outgoing fact fades out (0.4s), THEN the next fades in (0.4s) — the line is empty ~0.4s on every cycle, forever, on the most-visited screen.

```tsx
/* src/components/eternity/rotating-facts.tsx:26-37 — current */
<AnimatePresence mode="wait">
  <motion.p
    key={index}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.4, ease: EASE_OUT_STRONG }}
    className="absolute inset-0 flex items-center justify-center text-center text-xs tracking-wide text-white/60 sm:text-sm"
  >
```

## Target

Remove `mode="wait"` (default mode overlaps exit and entry). Both paragraphs are `absolute inset-0` inside a `relative overflow-hidden` container, so they stack during the crossfade — outgoing slides up/away while incoming slides in. No other change.

```tsx
<AnimatePresence>
```

## Steps

1. `src/components/eternity/rotating-facts.tsx:26`: `<AnimatePresence mode="wait">` → `<AnimatePresence>`.

## Boundaries

- Nothing else changes — timings, transforms, container all stay.
- If the paragraphs are no longer absolutely positioned (drift), STOP — overlap requires it.

## Verification

- **Mechanical**: `pnpm test && pnpm build` — green.
- **Feel check**: `/en`, watch two ticker cycles: old line slides up while new slides in — at no frame is the row empty. No layout jump (container height fixed h-10/h-12).
- **Done when**: continuous crossfade, no gap.
