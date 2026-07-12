# 005 — Stop the chips row growing the page mid-test; give new chips a pop-in

- **Status**: DONE (pending commit)
- **Commit**: 8eb6e36
- **Severity**: MEDIUM (shift) + LOW (delight) — merged, same lines
- **Category**: Content shift / missed opportunity
- **Estimated scope**: 1 file (`src/components/question-card.tsx`), ~25 lines

## Problem

Two issues in the answered-chips row (Row 3 of the question grid):

**(a) Mid-test layout jump.** The row reserves one line (`min-h-[40px]`), but chips wrap: the container is `max-w-xs` (320px) / `sm:max-w-sm` (384px) and 8 chips at ~70-90px each need two lines from roughly the 5th answer. When the second line appears, the grid's bottom row grows and the centered card in the `1fr` row jumps upward — an unprompted shift mid-test.

**(b) No reward moment.** Each new chip — the per-answer payoff — appears instantly, with only the whole-row `motion.div` fading once at first answer.

```tsx
/* src/components/question-card.tsx:258-290 — current */
{/* Row 3: Answered chips — pinned to bottom */}
<div className="flex min-h-[40px] flex-col items-center justify-start gap-3">
  {state.answers.length > 0 && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-5 flex w-full max-w-xs flex-wrap justify-center gap-1.5 sm:max-w-sm"
    >
      {state.answers.map((answer, i) => {
        const label = testMessages.verdictLabels[answer.commandment];
        if (!label) return null;
        const isJustified = answer.answer === "justify";
        return (
          <div
            key={i}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${
              isJustified
                ? "border-dashed border-red-900/30 bg-red-950/10 opacity-50"
                : "border-red-900/40 bg-red-950/25"
            }`}
          >
```

## Target

**(a)** Reserve two chip lines from the start: outer row `min-h-[40px]` → `min-h-[76px]`. Derivation: chip height ≈ 22px (10px font, `py-0.5`, border), `gap-1.5` = 6px → two lines ≈ 50px, plus the inner `mt-5` (20px) ≈ 70px; 76px adds safe margin. The executor MUST verify the real two-line height in DevTools (see Verification) and adjust to the measured value + ~4px if it differs.

**(b)** Each chip becomes a `motion.div` with a mount pop: `initial={{ opacity: 0, scale: 0.95 }}`, `animate={{ opacity: 1, scale: 1 }}`, `transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}`. Keys are stable indexes, so existing chips never re-animate — only the newly added one plays. Scale stays ≥0.95 (never `scale(0)` — nothing appears from nothing).

```tsx
/* target */
<div className="flex min-h-[76px] flex-col items-center justify-start gap-3">
  {state.answers.length > 0 && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-5 flex w-full max-w-xs flex-wrap justify-center gap-1.5 sm:max-w-sm"
    >
      {state.answers.map((answer, i) => {
        const label = testMessages.verdictLabels[answer.commandment];
        if (!label) return null;
        const isJustified = answer.answer === "justify";
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${
              isJustified
                ? "border-dashed border-red-900/30 bg-red-950/10 opacity-50"
                : "border-red-900/40 bg-red-950/25"
            }`}
          >
            ...children unchanged...
          </motion.div>
        );
      })}
    </motion.div>
  )}
</div>
```

Note on the justified chip: its class includes a static `opacity-50`. Framer's `animate={{ opacity: 1 }}` sets inline opacity and would override the class. For justified chips animate to `0.5` instead: `animate={{ opacity: isJustified ? 0.5 : 1, scale: 1 }}`.

## Repo conventions to follow

- Standard curve `[0.16, 1, 0.3, 1]` (exemplar `src/components/question-card.tsx:126`).
- Subtle scale entrances ≥0.9 (exemplar: verdict GUILTY `scale: 0.85→1` at `src/components/verdict-screen.tsx:78` is the dramatic exception; UI chips stay 0.95).

## Steps

1. `src/components/question-card.tsx` line ~259: `min-h-[40px]` → `min-h-[76px]` on the Row 3 wrapper.
2. Same file lines ~270-286: convert the chip `div` to `motion.div` with the Target's initial/animate/transition, including the `isJustified ? 0.5 : 1` opacity target; remove the static `opacity-50` class from the justified variant (it's now driven by framer). Children (number + label spans) unchanged.
3. Verify measured two-line height (Verification) and adjust `min-h` if needed.

## Boundaries

- Do NOT touch Rows 1-2 (ledger, card, verdict shortcut).
- Do NOT reorder or re-key the chips (index keys are what prevent re-animation).
- Do NOT add stagger — chips arrive one at a time naturally.
- Do NOT add new dependencies.
- If the row structure differs (drift since 8eb6e36), STOP and report.

## Verification

- **Mechanical**: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — green.
- **Feel check** (mobile viewport 390×844, `/en/test`, answer through Q6+):
  - Watch the question card's vertical position when the chip row wraps to its second line (~Q5): the card must NOT move. If it does, measure the two-line row height in DevTools (select the Row 3 div → box model) and set `min-h` to that value + 4px.
  - Each answered chip pops in (fade + tiny scale); previously-answered chips stay still.
  - Justified chips settle at half opacity, honest chips at full.
  - Answer rapidly (Q→next→Q): pop never restarts on existing chips.
- **Done when**: no vertical movement of the card at any point Q1→Q8 attributable to the chip row, and each new chip plays exactly one 180ms pop.
