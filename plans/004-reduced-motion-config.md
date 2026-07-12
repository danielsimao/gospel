# 004 — Respect prefers-reduced-motion across all framer animations

- **Status**: TODO
- **Commit**: 8eb6e36
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file (`src/components/providers.tsx`), ~4 lines

## Problem

Nothing in the app honors `prefers-reduced-motion` except one component (`examination-ledger.tsx` uses Tailwind `motion-safe:`). Every framer-motion animation — card slides, phase entrances, GUILTY scale-in, grace beat reveals — plays at full motion for users who asked the OS for reduced motion. Framer has a one-wrapper fix: `MotionConfig reducedMotion="user"` automatically disables transform/layout animations while **keeping opacity fades** — exactly the "fewer and gentler, not zero" target.

```tsx
/* src/components/providers.tsx:48-59 — current */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageviewTracker />
      </Suspense>
      <Analytics />
      <SpeedInsights />
      {children}
    </>
  );
}
```

## Target

```tsx
/* target */
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={null}>
        <PostHogPageviewTracker />
      </Suspense>
      <Analytics />
      <SpeedInsights />
      {children}
    </MotionConfig>
  );
}
```

## Repo conventions to follow

- `Providers` wraps the whole app in `src/app/[locale]/layout.tsx` — one wrapper here covers every `motion.*` element in the tree.
- Import from `"framer-motion"` (the package name used across the repo, e.g. `src/components/question-card.tsx:4`).

## Steps

1. `src/components/providers.tsx`: add `import { MotionConfig } from "framer-motion";` and replace the fragment `<>...</>` with `<MotionConfig reducedMotion="user">...</MotionConfig>` per Target.

## Boundaries

- Do NOT change `PostHogPageviewTracker` or any analytics logic.
- Do NOT touch the CSS keyframe animations (`mist-breathe`, eternity animations) in this plan — they're decorative-only and out of scope here.
- Do NOT add new dependencies.
- If providers.tsx differs from the excerpt (drift since 8eb6e36), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check**: DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", then run `/en/test`:
  - Question card swap: no horizontal slide; the card still crossfades (opacity kept).
  - Landing entrance: no y-movement, fades still present.
  - GUILTY verdict: appears without the scale-up, still fades in.
  - Turn emulation off: full motion returns.
- **Done when**: with reduced motion emulated, no element translates/scales during the whole test flow, while every state change still has an opacity transition.
