# 011 — Tighten the learn-hub entrance choreography

- **Status**: DONE (commit 8f1f4d9)
- **Commit**: 71deab3
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 1 file (`src/components/learn/learn-hub.tsx`), 4 values

## Problem

Topic cards stagger in at `300 + i×100ms` with 0.5s duration — with 8 topics the grid finishes settling ~1.9s after load, on a hub users revisit repeatedly. Repeat-visit entrance budgets are much tighter (stagger 30-80ms).

```tsx
/* src/components/learn/learn-hub.tsx — current values */
144:  <div className="animate-[fadeInUp_0.8s_ease-out_both]">
156:  <div className="mt-6 animate-[fadeInUp_0.5s_ease-out_both]" style={{ animationDelay: "200ms" }}>
184:  ... animate-[fadeInUp_0.5s_ease-out_both]" style={{ animationDelay: "300ms" }}>
208-209: ... animate-[fadeInUp_0.5s_ease-out_both]" style={{ animationDelay: `${300 + i * 100}ms` }}
```

## Target

Same pattern, compressed timeline (everything settled < 1s):

- Line 144 header: `fadeInUp_0.8s` → `fadeInUp_0.5s`
- Line 156 progress block: delay `200ms` → `80ms`
- Line 184 completion CTA: delay `300ms` → `120ms`
- Line 208-209 topic cards: duration stays `0.5s`, delay `` `${300 + i * 100}ms` `` → `` `${120 + i * 40}ms` ``

## Repo conventions to follow

- Keep the CSS `fadeInUp` keyframe approach (chosen deliberately: "survives bfcache/router cache" per `globals.css:122` comment) — do NOT convert to framer.

## Steps

1. Apply the four value changes above. Nothing else.

## Boundaries

- Do NOT change the keyframe itself, the card markup, or hover styles.
- If line numbers drifted, match on the `animate-[fadeInUp...]` strings.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && pnpm build` — green.
- **Feel check**: load `/en/learn`: all 8 cards settled within ~1s; still reads as a stagger (not simultaneous).
- **Done when**: last card's animation ends ≤ 1s after paint (120 + 7×40 + 500 = 900ms).
