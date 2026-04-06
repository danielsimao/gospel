# Grace Section Redesign: Beat-Based Reveal

## Problem

After the quiz's "GUILTY" verdict, the user lands on the "But God..." grace section — two paragraphs of body text + a scripture quote. The text wall causes users to skim or disengage at the emotional climax of the page.

## Solution

Replace the static text block with **4 tap-to-reveal beats** that stack vertically. Each tap reveals the next truth while dimming (not hiding) earlier beats. This matches the quiz's explicit-click interaction model and prevents skimming by gating progression.

## Beat Content

| Beat | Label | Text | Notes |
|------|-------|------|-------|
| I | I | You're guilty. The fine is eternal. | Auto-reveals on scroll. Bridges from verdict. |
| II | II | Someone paid it in full. | First tap. |
| III | III | Jesus Christ — God in flesh — lived the life you couldn't, died the death you deserved, and rose. | Longest beat. Gold highlight. The hinge. |
| IV | IV | Turn from sin. Trust in Him. Live. | Final tap. Gold highlight. Reveals scripture + CTA. |

**After beat IV:** Romans 5:8 scripture + "Take the test →" CTA reveal together (staggered: scripture at 0s, CTA at 0.4s).

## Interaction Model

- **Tap-to-unlock, stacked.** Prior beats dim to 32% opacity but remain visible.
- **Tap target:** Explicit "Tap to continue ↓" pill button below the stack (pulsing animation at 2.4s cycle). Same min-height (48px) as quiz's Next button.
- **Entry state:** On scroll into view (IntersectionObserver at 40% threshold), heading "But God..." + beat I auto-reveal with fade+rise animation.
- **Beats II–IV:** Revealed on successive taps. Previous "active" beat dims over 0.4s, new beat fades in + rises 8px over 0.5s.
- **Resolution:** Beat IV tap removes the pill and reveals scripture + CTA.

## Visual Treatment

- **Background:** Same dark (#0a0a0a) with radial gold glow (rgba(212,168,67,0.06)) — matches existing.
- **Heading:** 32px+ bold, #D4A843, centered, text-shadow glow.
- **Beat labels:** Monospace, 8-9px, uppercase, tracking-[2.5px], gold at 45% opacity. Roman numerals (I, II, III, IV).
- **Beat text:** 16-22px, font-weight 600-700, white at 95% opacity. Beats III and IV in gold.
- **Dimmed beats:** Opacity 0.32, labels at 0.22.
- **Beat separators:** 1px border-top at white 4% opacity.
- **Tap pill:** Monospace, 10px, uppercase, tracking-[2.5px], gold at 70%, rounded-lg border, gold at 22%.
- **Scripture:** Left gold border (1px), italic, 12-13px, white at 55%.
- **CTA button:** Gold border, gold text, slight gold bg (4%), box-shadow glow.

## Motion

| Trigger | Element | Animation |
|---------|---------|-----------|
| Scroll into view | Heading | fade+rise 24px, 1.2s easeOut |
| Scroll into view | Beat I | fade+rise 16px, 0.8s, delay 0.8s |
| Tap pill | New beat | fade+rise 8px, 0.5s easeOut |
| Tap pill | Previous beat | opacity → 0.32, 0.4s |
| Tap pill (final) | Pill | fade out 0.3s |
| Tap pill (final) | Scripture | fade+rise 8px, 0.5s |
| Tap pill (final) | CTA | fade+rise 8px, 0.5s, delay 0.4s |

**prefers-reduced-motion:** All animations reduce to fade-only (no y-translation).

## i18n

New message keys inside `eternity.grace`:
- `beats`: array of 4 strings (one per beat)
- `tapContinue`: "Tap to continue" (tap pill label)
- `testCta`: "Take the test" (CTA within grace — may reuse existing `cta.testCta`)

Existing keys retained: `heading`, `scripture`, `scriptureRef`.
Existing keys removed: `body1`, `body2`.

## Files to Modify

- `src/components/eternity/grace-reveal.tsx` — rewrite to beat-based component
- `src/messages/en.json` — restructure `eternity.grace` keys
- `src/messages/pt.json` — same
- `src/components/eternity/eternity-shell.tsx` — update `GraceMessages` type import if interface changes

## Impact on CTA Section

The existing CTA section (`eternity-cta`) keeps its heading ("What will you do?"), subtitle, and resource links — but the "Take the Good Person Test" button is **removed** from it. The primary test CTA now lives inside the grace frame at beat IV resolution. This eliminates the redundancy of two "take the test" buttons on screen.

## Quiz State Forwarding (eternity → /test)

The mini quiz covers 3 of the 8 full /test questions:

| Mini quiz Q | Maps to /test question ID | Topic |
|---|---|---|
| "Have you ever told a lie?" | 1 | 9th commandment |
| "Have you ever stolen anything?" | 2 | 8th commandment |
| "Have you ever used God's name as a curse word?" | 5 | 3rd commandment |

**Storage:** localStorage key `gospel-quiz-answers`, value is a JSON object mapping test question IDs to answers: `{ "1": "yes", "2": "yes", "5": "no" }`.

**Write side (mini quiz):** `handleAnswer` in `law-quiz.tsx` writes to localStorage on each answer. The mapping from mini quiz index (0, 1, 2) to test question ID (1, 2, 5) is a hardcoded constant array.

**Read side (/test page):** On mount, read `gospel-quiz-answers` from localStorage. Pre-answered questions are marked as answered with their stored response. Quiz auto-skips to the first unanswered question. User can still scroll back to see/change pre-answered ones.

**Conflict:** If the user has already partially completed /test and then visits eternity, the mini quiz answers overwrite conflicting keys. This is fine — the mini quiz and /test ask the same underlying question.

### Files to modify (in addition to existing list)

- `src/components/eternity/law-quiz.tsx` — write answers to localStorage
- `/test` page component — read localStorage on mount, pre-fill + auto-skip
- `src/lib/quiz-storage.ts` (new) — shared read/write helpers for `gospel-quiz-answers`

## Analytics

- Track `grace_beat_revealed` with beat index (0-3) on each tap.
- Existing `trackGraceRevealed` fires on scroll into view (unchanged).
- Track `grace_cta_clicked` when the inline CTA is tapped.
