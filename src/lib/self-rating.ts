import type { SelfRating } from "./types";

/**
 * Every valid answer to "Are you a good person?".
 *
 * Its own module because the value is needed in three places that must not
 * disagree — the route that prerenders one page per answer, the session
 * storage that validates a restored one, and the reducer — and the storage
 * handoff it used to live beside is gone. See
 * `app/[locale]/(immersive)/test/[rating]/page.tsx`.
 */
export const SELF_RATINGS: readonly SelfRating[] = ["yes", "mostly", "no"];

export function isSelfRating(value: unknown): value is SelfRating {
  return (SELF_RATINGS as readonly unknown[]).includes(value);
}
