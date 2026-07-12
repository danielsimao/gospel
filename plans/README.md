# Animation plans — test flow sharpness (audit 2026-07-12, commit 8eb6e36)

From the `improve-animations` audit of `/[locale]/test` (landing → questions → verdict → grace → invitation). Pain driver: content shift after CTAs; mobile sharpness priority.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Eliminate two-stage layout shift on justify answers](001-justify-followup-shift.md) | HIGH | TODO |
| 002 | [Crossfade between test phases](002-phase-crossfade.md) | HIGH | TODO |
| 003 | [Composite-only ledger pulse](003-ledger-paint-free-pulse.md) | HIGH | TODO |
| 004 | [prefers-reduced-motion via MotionConfig](004-reduced-motion-config.md) | MEDIUM | TODO |
| 005 | [Chips row: reserve two lines + pop-in](005-chips-reserve-and-pop.md) | MEDIUM+LOW | TODO |

## Recommended execution order

1. **004** first — one-liner, and its reduced-motion behavior is part of 002's verification.
2. **001** → **005** — both edit `question-card.tsx`; do sequentially (001 touches the card body, 005 touches Row 3; no line overlap but same file).
3. **003** — independent.
4. **002** last — wraps everything; verifying its crossfade is easiest when the screens beneath are already stable.

## Dependencies

- 002's reduced-motion verification step assumes 004 is done.
- 001 and 005 share `question-card.tsx` (disjoint regions) — execute one at a time, not in parallel worktrees.

## Not planned (audit findings left open)

- LOW: grace tap-pill exit fade (finding 7), verdict-shortcut slot reservation (finding 8), easing tokenization ×14 (finding 9), landing→question stagger, `crack-overlay.tsx` dead-code deletion.

## Executing

Run any plan with `improve-animations execute plans/NNN-*.md`, or hand a plan file to any implementation agent — each is self-contained (exact values, code excerpts, verification).
