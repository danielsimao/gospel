# 003 — Make the active ledger segment's pulse composite-only

- **Status**: DONE (pending commit)
- **Commit**: 8eb6e36
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file (`src/components/examination-ledger.tsx`), ~20 lines

## Problem

The active progress segment animates `boxShadow` in an infinite keyframe loop. `box-shadow` is a paint property — this repaints every frame, continuously, the entire time a question is on screen, on every one of the 8 questions. On mid-range mobile this is sustained main-thread paint work competing with the card entrance/answer animations (jank) and burning battery for a 2px glow.

```tsx
/* src/components/examination-ledger.tsx:52-70 — current */
if (isActive) {
  return (
    <motion.div
      key={i}
      className="h-[2px] flex-1 rounded-full bg-red-500"
      animate={{
        boxShadow: [
          "0 0 8px rgba(239,68,68,0.45)",
          "0 0 12px rgba(239,68,68,0.7)",
          "0 0 8px rgba(239,68,68,0.45)",
        ],
      }}
      transition={{
        duration: 2.2,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    />
  );
}
```

## Target

Same visual pulse, but the `box-shadow` is **static** on an absolutely-positioned overlay whose **opacity** animates — opacity composites on the GPU, zero paint per frame:

```tsx
/* target */
if (isActive) {
  return (
    <div key={i} className="relative h-[2px] flex-1 rounded-full bg-red-500">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 0 12px rgba(239,68,68,0.7)" }}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}
```

Value mapping: the old animation swung the shadow between `8px @ 0.45` and `12px @ 0.7`; a static `12px @ 0.7` shadow at `opacity: 0.55` ≈ the dim keyframe, at `opacity: 1` = the bright keyframe. Same 2.2s easeInOut loop.

## Repo conventions to follow

- This file already uses framer `motion.div` with inline `animate`/`transition` (the code being replaced) — keep the same style.
- The file's static segments use plain `div`s with `TRANSITION_CLASSES` (line 13) — do not disturb them.

## Steps

1. `src/components/examination-ledger.tsx` lines 52-70: replace the `isActive` branch with the Target code verbatim.
2. Nothing else changes — the `resolved`/`unanswered` branches and the progressbar wrapper stay as-is.

## Boundaries

- Do NOT change the honest/justify/unanswered segment branches or `TRANSITION_CLASSES`.
- Do NOT change the pulse rhythm (2.2s, easeInOut, infinite) — only the animated property.
- Do NOT add new dependencies.
- If the isActive branch doesn't match the excerpt (drift since 8eb6e36), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check** (`/en/test`, start the test):
  - The active segment still visibly pulses at the same rhythm and roughly the same brightness range.
  - DevTools → Rendering → "Paint flashing": with the test idle on a question, the ledger row must show **no repaint flashes** from the pulse (before the fix it flashes continuously).
  - DevTools → Performance, record 5s idle on a question: no recurring Paint entries attributable to the ledger.
- **Done when**: pulse looks the same, paint flashing shows nothing repainting while idle on a question.
