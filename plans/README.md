# Animation plans — test flow sharpness (audit 2026-07-12, commit 8eb6e36)

From the `improve-animations` audit of `/[locale]/test` (landing → questions → verdict → grace → invitation). Pain driver: content shift after CTAs; mobile sharpness priority.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Eliminate two-stage layout shift on justify answers](001-justify-followup-shift.md) | HIGH | DONE |
| 002 | [Crossfade between test phases](002-phase-crossfade.md) | HIGH | DONE |
| 003 | [Composite-only ledger pulse](003-ledger-paint-free-pulse.md) | HIGH | DONE |
| 004 | [prefers-reduced-motion via MotionConfig](004-reduced-motion-config.md) | MEDIUM | DONE |
| 005 | [Chips row: reserve two lines + pop-in](005-chips-reserve-and-pop.md) | MEDIUM+LOW | DONE |
| 006 | [Stable card top position](006-stable-card-position.md) | MEDIUM | DONE |
| 007 | [Grace pill exit fade](007-grace-pill-exit.md) | LOW | DONE |
| 008 | [Verdict-shortcut slot reserve](008-verdict-shortcut-slot.md) | LOW | DONE |
| 009 | [Easing tokenization](009-easing-tokens.md) | LOW | DONE |
| 010 | [Consent banner slide in/out](010-consent-banner-motion.md) | MED-HIGH | DONE |
| 011 | [Learn-hub stagger tightening](011-learn-hub-stagger.md) | MEDIUM | DONE |
| 012 | [Facts ticker crossfade](012-facts-crossfade.md) | LOW-MED | DONE |
| 013 | [Dead eternity motion CSS removal](013-dead-motion-css.md) | LOW | DONE |
| 014 | [Day-card COMPLETED chip pop](014-daycard-completed-pop.md) | LOW | DONE |

## Recommended execution order

1. **004** first — one-liner, and its reduced-motion behavior is part of 002's verification.
2. **001** → **005** — both edit `question-card.tsx`; do sequentially (001 touches the card body, 005 touches Row 3; no line overlap but same file).
3. **003** — independent.
4. **002** last — wraps everything; verifying its crossfade is easiest when the screens beneath are already stable.

## Dependencies

- 002's reduced-motion verification step assumes 004 is done.
- 001 and 005 share `question-card.tsx` (disjoint regions) — execute one at a time, not in parallel worktrees.

## Not planned (audit findings left open)

- Round 2 (app-wide, 2026-07-12): all selected findings executed. Declined by taste: track-thinking reflection drip (deliberate contemplative pacing). Landing→question stagger done in the gap-fill batch.

## Executing

Run any plan with `improve-animations execute plans/NNN-*.md`, or hand a plan file to any implementation agent — each is self-contained (exact values, code excerpts, verification).
