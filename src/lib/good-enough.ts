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

/**
 * The band the ceiling is drawn from. People differ, so a fixed stop for
 * everyone was a lie the page did not need to tell — and with a replay it made
 * trying again pointless.
 *
 * The band is the whole safety question. A variable outcome plus a retry button
 * is the shape of a slot machine, and it only escapes that if the variance is
 * visibly irrelevant: no roll may come near the line, so no roll can teach
 * "maybe next time". `GOAL_PCT` is derived below to guarantee that, rather than
 * left as a constant someone could tune into a near-miss machine.
 */
export const CEILING_MIN_PCT = 24;
export const CEILING_MAX_PCT = 42;

/**
 * The distance that has to survive the luckiest possible roll. Below about this
 * much the bar starts reading as "nearly", which is the one reading the page
 * cannot afford.
 */
export const MIN_GAP_PCT = 50;

/** Where the line is. Derived, so the gap cannot be closed by editing one number. */
export const GOAL_PCT = CEILING_MAX_PCT + MIN_GAP_PCT;

/** Dead taps before the turn arrives. The button is never taken away. */
export const DEAD_TAPS_TO_REVEAL = 3;

/**
 * One life's worth of ceiling. Injectable so tests are deterministic; called
 * from the first tap rather than during render, so the server and the first
 * client render cannot disagree.
 */
export function rollCeiling(random: () => number = Math.random): number {
  const span = CEILING_MAX_PCT - CEILING_MIN_PCT;
  return CEILING_MIN_PCT + Math.round(random() * span);
}

export interface BarState {
  /** Total presses, including the ones that did nothing. */
  taps: number;
  /** Presses made after the ceiling was reached. */
  deadTaps: number;
  /** This life's ceiling, clamped to the band. */
  ceilingPct: number;
  /** Height of the fill, as a percentage of the track. */
  fillPct: number;
  /** Percentage points still between the fill and the line. Never zero. */
  shortPct: number;
  /** The bar has nowhere left to go. */
  atCeiling: boolean;
  /** The turn is on screen. The button still is too. */
  revealed: boolean;
}

/**
 * Pure function of the tap count and this life's ceiling — no history, nothing
 * hidden. The ceiling is clamped to the band so a caller cannot widen the
 * argument's margin by passing a value the roll could never produce.
 */
export function barAfter(taps: number, ceilingPct: number): BarState {
  const ceiling = Math.min(CEILING_MAX_PCT, Math.max(CEILING_MIN_PCT, ceilingPct));
  const safeTaps = Math.max(0, Math.floor(taps));
  const effective = Math.min(safeTaps, TAPS_TO_CEILING);
  const fillPct = (effective / TAPS_TO_CEILING) * ceiling;
  const deadTaps = Math.max(0, safeTaps - TAPS_TO_CEILING);

  return {
    taps: safeTaps,
    deadTaps,
    ceilingPct: ceiling,
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
