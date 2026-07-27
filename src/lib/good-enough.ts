/**
 * The bar. Tap it to fill it; fill it and you're in.
 *
 * Every constant here is load-bearing, and most of them are set against
 * research rather than taste:
 *
 *  - The ceiling sits FAR below the line. Near-miss outcomes are one of the
 *    most replicated findings in gambling research: they raise the motivation
 *    to continue, recruit win-related reward circuitry, and specifically breed
 *    an illusion of control. A bar that stopped just short of the line would be
 *    a near-miss machine, and would manufacture "try harder" — the one belief
 *    this page exists to remove.
 *  - Every tap adds exactly the same amount. No decay, no penalty, no
 *    diminishing returns. Diminishing returns produce an asymptote, and an
 *    asymptote is a near-miss generator by construction: forever creeping
 *    closer, forever implying that a little more effort buys a little more
 *    ground.
 *  - There is no timer. A clock makes the failure unstable ("I ran out of
 *    time") and specific ("my tapping speed") — precisely the attributions that
 *    send someone back for another go.
 *
 * The bar therefore stops dead, honestly, in plain view, and nothing about the
 * reader's effort was ever the variable.
 */

/** Taps to reach the ceiling. Enough effort to be real, short enough to stay a beat. */
export const TAPS_TO_CEILING = 8;

/** Where the bar stops, as a percentage of the track. */
export const CEILING_PCT = 34;

/** Where the line is. The distance between this and the ceiling is the argument. */
export const GOAL_PCT = 92;

/** Dead taps before the turn arrives. The button is never taken away. */
export const DEAD_TAPS_TO_REVEAL = 3;

/**
 * Other people's bars, revealed at the ceiling. Deterministic rather than
 * random: this renders during hydration, and it is also the point — the spread
 * is fixed because the comparison never mattered. Some are above the reader,
 * some below, and every one of them is nowhere near the line.
 */
export const CROWD_PCT = [
  17, 29, 8, 41, 23, 12, 36, 19, 44, 6, 31, 25, 14, 38,
] as const;

export interface BarState {
  /** Total presses, including the ones that did nothing. */
  taps: number;
  /** Presses made after the ceiling was reached. */
  deadTaps: number;
  /** Height of the fill, as a percentage of the track. */
  fillPct: number;
  /** Percentage points still between the fill and the line. Never zero. */
  shortPct: number;
  /** The bar has nowhere left to go. */
  atCeiling: boolean;
  /** The turn is on screen. The button still is too. */
  revealed: boolean;
}

/** Pure function of the tap count — no history, nothing hidden. */
export function barAfter(taps: number): BarState {
  const safeTaps = Math.max(0, Math.floor(taps));
  const effective = Math.min(safeTaps, TAPS_TO_CEILING);
  const fillPct = (effective / TAPS_TO_CEILING) * CEILING_PCT;
  const deadTaps = Math.max(0, safeTaps - TAPS_TO_CEILING);

  return {
    taps: safeTaps,
    deadTaps,
    fillPct,
    shortPct: GOAL_PCT - fillPct,
    atCeiling: safeTaps >= TAPS_TO_CEILING,
    revealed: deadTaps >= DEAD_TAPS_TO_REVEAL,
  };
}

/**
 * Which line to show while the reader keeps pressing a bar that has stopped.
 * Clamped, so the last line simply stays — the copy runs out before the
 * reader's patience does, and that is the correct way round.
 */
export function ceilingLineIndex(deadTaps: number, lineCount: number): number {
  if (lineCount <= 0) return 0;
  return Math.min(Math.max(0, deadTaps), lineCount - 1);
}
