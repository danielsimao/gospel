# 002 — Crossfade between test phases instead of hard-swapping

- **Status**: TODO
- **Commit**: 8eb6e36
- **Severity**: HIGH
- **Category**: Missed opportunity / cohesion
- **Estimated scope**: 1 file (`src/components/game-shell.tsx`), ~20 lines

## Problem

Phase changes (landing → playing → verdict → grace → invitation) unmount the old screen instantly and mount the next. Each screen has its own *entrance* animation, but there is no *exit* — so on every CTA that advances a phase there's a one-frame flash of the empty dark background before the next screen's fade-in begins. It reads as a stutter, most visibly on mobile where the whole viewport changes.

Current code:

```tsx
/* src/components/game-shell.tsx:140-176 — current (hard swap) */
<div className="relative z-[1] flex flex-1 flex-col pt-10">
  {state.phase === "landing" && (
    <Landing messages={messages.landing} locale={locale} />
  )}

  {state.phase === "playing" && (
    <QuestionCard ... />
  )}

  {state.phase === "verdict" && (
    <VerdictScreen ... />
  )}

  {state.phase === "grace" && <GraceScreen messages={messages.grace} />}

  {state.phase === "invitation" && (
    <InvitationScreen ... />
  )}
</div>
```

## Target

One `AnimatePresence mode="wait"` wrapper keyed by phase: outgoing screen fades out in **200ms**, then the incoming screen mounts and plays its existing entrance. No screen-internal animation changes.

```tsx
/* target */
import { motion, AnimatePresence } from "framer-motion";

<div className="relative z-[1] flex flex-1 flex-col pt-10">
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={state.phase}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-1 flex-col"
    >
      {state.phase === "landing" && ( ... )}
      {state.phase === "playing" && ( ... )}
      {state.phase === "verdict" && ( ... )}
      {state.phase === "grace" && ( ... )}
      {state.phase === "invitation" && ( ... )}
    </motion.div>
  </AnimatePresence>
</div>
```

Notes on exact values:
- `mode="wait"` — exit completes before entry; prevents both screens overlapping (double-exposure crossfades are a finding, not a fix).
- `initial={false}` — no fade on first mount (the landing screen already has its own entrance; double-fading the first paint would delay LCP).
- Wrapper keeps `flex flex-1 flex-col` so every screen's `flex-1` layout is preserved — screens fill the viewport exactly as today.
- 200ms exit is inside the UI budget; the phase-advance CTAs are deliberate moments, so a brief beat is right.

## Repo conventions to follow

- `AnimatePresence mode="popLayout"`/`mode="wait"` already used in `src/components/question-card.tsx:119` and `:149` — same import style (`import { motion, AnimatePresence } from "framer-motion"`).
- Standard curve `[0.16, 1, 0.3, 1]` (exemplar: `src/components/question-card.tsx:126`).

## Steps

1. `src/components/game-shell.tsx`: extend the existing framer import — the file currently does NOT import framer-motion; add `import { motion, AnimatePresence } from "framer-motion";`.
2. Wrap the five phase conditionals (everything inside the `relative z-[1] flex flex-1 flex-col pt-10` div) in `<AnimatePresence mode="wait" initial={false}>` + `<motion.div key={state.phase} ...>` exactly as in Target. The five conditionals themselves are untouched.
3. The `ResumeDialog` (line ~178) stays OUTSIDE the AnimatePresence wrapper.

## Boundaries

- Do NOT modify any screen component (`landing.tsx`, `question-card.tsx`, `verdict-screen.tsx`, `grace-screen.tsx`, `invitation-screen.tsx`).
- Do NOT change the back-link, sticky counter, or vignette in game-shell.
- Do NOT use `mode="sync"` or omit the mode — overlapping screens must never both be visible.
- Do NOT add new dependencies.
- If game-shell's structure differs from the excerpt (drift since 8eb6e36), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check** (mobile viewport 390×844, `/en/test`):
  - Click "Begin the test": landing fades out (~200ms), question card slides in. No frame where the viewport is empty *without* a fade in progress (the fade IS the transition; a hard cut is the bug).
  - Complete Q8 → "See verdict": same smooth exit.
  - Verdict → "Is there any hope?" → grace: the red verdict screen fades before gold grace enters — watch for double-exposure (must never see both).
  - In DevTools Animations at 10%: exit and entry are strictly sequential.
  - Reduced motion (after plan 004 lands): the crossfade remains (opacity-only is reduced-motion-safe under MotionConfig).
- **Done when**: every phase CTA produces exit-fade → entrance, no hard cuts, no overlaps, and first paint of `/test` is unchanged (no fade on initial mount).
