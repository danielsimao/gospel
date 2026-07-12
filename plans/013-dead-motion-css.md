# 013 — Delete dead eternity motion CSS

- **Status**: DONE (commit f212dcb)
- **Commit**: 71deab3
- **Severity**: LOW
- **Category**: Cohesion & tokens (cleanup)
- **Estimated scope**: 1 file (`src/app/globals.css`), −25 lines

## Problem

Five blocks in `globals.css` have zero users (relics of the removed eternity page); one animates `box-shadow` (the paint-loop antipattern):

```css
/* src/app/globals.css:137-155 + snap rule — all dead */
/* Eternity page animations */
@keyframes eternity-pulse-dot { ... }
@keyframes eternity-scroll-wheel { ... }
@keyframes eternity-bob { ... }
@keyframes eternity-gentle-pulse { ... }   /* animates box-shadow */
...
#eternity-container.snap-off {
  scroll-snap-type: none !important;
}
```

Verification of deadness (run before deleting):
```bash
grep -rn "eternity-pulse-dot\|eternity-scroll-wheel\|eternity-bob\|eternity-gentle-pulse\|eternity-container\|snap-off" src --include="*.tsx" --include="*.ts"
```
Expected: no hits. If ANY hit appears, keep that block and report.

Do NOT delete: `pulse-ring`, `pulse-dot-fade` (used by `world-map.tsx:82,89`), `fadeInUp`, `mist-breathe`, `mist-breathe-hover`.

## Steps

1. Run the grep. 2. Delete the `/* Eternity page animations */` comment, the four `eternity-*` keyframes, and the `#eternity-container.snap-off` rule.

## Verification

- **Mechanical**: `pnpm build` — green; grep for `eternity-` in `src/app/globals.css` returns nothing.
- **Done when**: file has no `eternity-*` keyframes and builds clean.
