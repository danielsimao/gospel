import type { Locale } from "./i18n";

/**
 * The canyon, in feet. Eighteen miles — the figure the illustration uses, and
 * the reason the far side is never drawn: the best attempt on this page clears
 * 0.21% of it, so any honest drawing shows nothing moving at all.
 */
export const CANYON_FEET = 18 * 5280;

/**
 * An unwinnable button that never stops is a troll; one that yields and
 * explains itself is a parable. Four presses, then the reveal.
 */
export const MAX_ATTEMPTS = 4;

export interface Attempt {
  /** 1-based, matching the copy array index + 1. */
  n: number;
  /**
   * How far THIS jump went. Attempts do not accumulate — each press is a fresh
   * jump from the same edge with more help than the last. Accumulating would
   * make this a progress bar, which the app's own copy forbids ("not a ladder
   * you climb"), and would teach that works bank.
   */
  feet: number;
  /** Feet still short of the far side. Never zero, never negative. */
  remainingFeet: number;
  /** True on the final attempt — the reveal follows it. */
  terminal: boolean;
}

/**
 * Bare jump, a run-up, a pole vault (a world record), rocket boots. The props
 * escalate because the argument is that effort is real and is not the issue —
 * a button that merely refuses to be pressed says "you are being toyed with".
 */
const JUMP_FEET = [4, 20, 50, 200] as const;

/** Clamped and floored, so a bad index can never produce `undefined`. */
export function attemptAt(n: number): Attempt {
  const index = Math.min(MAX_ATTEMPTS - 1, Math.max(0, Math.floor(n) - 1));
  const feet = JUMP_FEET[index]!;
  return {
    n: index + 1,
    feet,
    remainingFeet: CANYON_FEET - feet,
    terminal: index === MAX_ATTEMPTS - 1,
  };
}

export function allAttempts(): Attempt[] {
  return JUMP_FEET.map((_, i) => attemptAt(i + 1));
}

const FEET_PER_METRE = 3.28084;

/**
 * The readout's number, in the unit the locale's copy actually speaks. The
 * mechanic stores feet because the illustration is stated in miles, but "95.040
 * pés" is not a distance a Portuguese reader parses — the PT copy says
 * kilometres, so the PT readout has to say metres.
 *
 * Rounded to a whole unit: this is a distance nobody is going to cover, and a
 * decimal place would imply a precision the argument does not need.
 */
export function displayDistance(feet: number, locale: Locale): number {
  return locale === "pt" ? Math.round(feet / FEET_PER_METRE) : feet;
}

/** BCP 47 tag for `toLocaleString`, so separators follow the page, not the runtime. */
export function numberLocale(locale: Locale): string {
  return locale === "pt" ? "pt-PT" : "en-US";
}
