# 009 — Tokenize the house easing curve (14 hand-typed copies)

- **Status**: DONE (commit 7abbef0)
- **Commit**: 1e9581f
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: ~10 files, mechanical

## Problem

`cubic-bezier(0.16, 1, 0.3, 1)` / `[0.16, 1, 0.3, 1]` is the flow's signature ease-out, hand-typed 14× across components (framer arrays) and class strings (Tailwind arbitrary values). Any future tweak means a 14-file hunt.

Find every instance:

```bash
grep -rn "0.16, 1, 0.3, 1\|0.16,1,0.3,1" src --include="*.tsx" --include="*.css"
```

## Target

**One TS constant** for framer usages and **one CSS custom property** for class-string usages.

1. Create `src/lib/motion.ts`:

```ts
/**
 * House easing — strong ease-out used across the test flow.
 * CSS twin: `--ease-out-strong` in globals.css.
 */
export const EASE_OUT_STRONG = [0.16, 1, 0.3, 1] as const;
```

2. In `src/app/globals.css`, add near the top-level custom properties (find the existing `:root` or `@theme` block and match its placement):

```css
--ease-out-strong: cubic-bezier(0.16, 1, 0.3, 1);
```

3. Replace all framer usages: `ease: [0.16, 1, 0.3, 1]` → `ease: EASE_OUT_STRONG` (+ import). Framer's TS type accepts a readonly tuple; if `tsc` complains, type the constant as `readonly [number, number, number, number]`.

4. Replace class-string usages: `ease-[cubic-bezier(0.16,1,0.3,1)]` → `ease-[var(--ease-out-strong)]` (e.g. `src/components/examination-ledger.tsx:14` `TRANSITION_CLASSES`).

## Repo conventions to follow

- Small single-purpose lib modules in `src/lib/` (exemplar: `src/lib/topic-dates.ts` — doc comment + one export).
- Tailwind v4: arbitrary values support `var()`.

## Steps

1. Create `src/lib/motion.ts` per Target.
2. Add the CSS variable to `globals.css`.
3. Run the grep; replace every hit — framer arrays get the import, class strings get the var. Do NOT change any surrounding value (durations, delays stay).
4. Re-run the grep: only `motion.ts` and `globals.css` may still contain the raw numbers.

## Boundaries

- ONLY the easing values change form — zero behavioral change.
- Do NOT consolidate other curves (`[0.16,1,0.3,1]` only; leave button's `(0.3,0.7,0.4,1)` family alone).
- Do NOT rename or move any other code.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green. Grep from Step 4 returns exactly 2 files.
- **Feel check**: none needed — identical values; spot-check one animation (question card swap) still plays.
- **Done when**: grep clean, gates green.
