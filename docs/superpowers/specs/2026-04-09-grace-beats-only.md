# Grace Section — Beats-Only Redesign

## Problem

The current grace phase has two movements: 4 tap-to-reveal beats followed by a wall of 5 body paragraphs (~150 words). The beats are engaging — the user controls the pace. But the body text is a passive reading dump that risks losing the user right at the critical moment of the gospel presentation.

## Goal

Replace the two-movement structure with a single beats-only flow. Expand from 4 to 5 beats that tell the full Living Waters courtroom story. No body text. The user stays engaged through tap-to-reveal interaction from start to finish. 4 taps total.

## Design

### Beat Content

5 beats following the courtroom analogy:

| # | Beat | Color |
|---|------|-------|
| I | You're guilty. The fine is eternal. | white |
| II | Imagine standing before a just Judge. You can't pay. Justice demands death. | white |
| III | But someone steps into the courtroom and pays your fine in full. | gold |
| IV | Jesus Christ — God in flesh — lived the life you couldn't, died the death you deserved, and rose. | gold |
| V | Repent — turn from your sin. Trust in Christ alone. God will forgive you and grant you eternal life. | gold |

Color pattern: beats 1-2 white (tension/problem), beats 3-5 gold (hope/resolution). Beat III is the pivot — the moment hope enters.

### Flow

1. Heading "But God..." fades in on phase entry
2. Beat I auto-reveals after ~1.5s
3. Beats II-V revealed one at a time via tap ("Tap to continue")
4. After all 5 beats: scripture blockquote (John 3:16) + continue button
5. No body paragraphs

### Changes

**`src/messages/en.json`:**
- Expand `grace.beats` from 4 to 5 strings (new courtroom content)
- Remove `grace.body` (field removed entirely)
- Remove `grace.heading` (field removed — `beatsHeading` is the only heading)

**`src/messages/pt.json`:**
- Same: expand beats to 5 with Portuguese translations
- Remove `grace.body` and `grace.heading`

**`src/lib/types.ts`:**
- Remove `body` and `heading` from `Messages.grace`
- Change `beats` type from `[string, string, string, string]` to `string[]`

**`src/lib/i18n.ts`:**
- Line 22: Change `!m.grace?.heading` to `!m.grace?.beatsHeading`

**`src/components/grace-screen.tsx`:**
- Remove Movement 2 entirely (body paragraphs, staggered fade-in)
- Remove `messages.body` reference
- After all beats revealed: show scripture + continue button directly
- Update gold threshold: `isGold = i >= 2` (beats 3-5 are gold)
- Remove `showBody` state — no longer needed
- Roman numerals extend to V

### What stays unchanged

- `beatsHeading`, `label`, `scripture`, `scriptureRef`, `continueLabel`, `tapContinue` — all stay
- Auto-reveal first beat behavior (~1.5s delay)
- Dim previous beats to 0.32 opacity
- Analytics (trackGraceRevealed, trackGraceBeatRevealed)
- Continue button dispatches SHOW_INVITATION
- Warm radial glow background

## Verification

1. Enter grace phase — heading fades in, beat I auto-reveals
2. Tap through beats II-V — each reveals with roman numeral, correct color (I-II white, III-V gold)
3. Previous beats dim to 0.32 opacity
4. After beat V — scripture + continue button appear (no body text)
5. Both locales work (en, pt)
6. `pnpm build` passes
