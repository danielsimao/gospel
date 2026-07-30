import type { SelfRating } from "./types";

/**
 * The reader's answer to "Are you a good person?", handed from the homepage to
 * the test.
 *
 * A separate key rather than a URL parameter: `/test` is prerendered
 * (`generateStaticParams`), and reading search params during render pushes the
 * whole route into client rendering. A key also survives a reload of `/test`
 * itself, which a param the reader never sees would not.
 *
 * Separate from `gospel-test-session` because it is written before any session
 * exists — the homepage has no game state to save. Once the test picks it up
 * the value lives in `GameState` and is persisted with the session; this key is
 * only the handoff, and is cleared as soon as it has been read.
 */
/*
 * Exported because the test page's pre-paint script has to read the same key
 * without importing this module — it runs before any bundle loads. See
 * `buildTestEntryPrepaintScript` in lib/test-entry-prepaint-script.ts, which
 * interpolates this so a rename cannot leave a stale second copy behind.
 */
export const STORAGE_KEY = "gospel-self-rating";

/** Every valid answer. Exported so storage readers can validate without duplicating the union. */
export const SELF_RATINGS: readonly SelfRating[] = ["yes", "mostly", "no"];

function isSelfRating(value: unknown): value is SelfRating {
  return typeof value === "string" && SELF_RATINGS.includes(value as SelfRating);
}

export function writeSelfRating(rating: SelfRating): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, rating);
  } catch (error) {
    // A reader in a private window still gets the test; they just reach the
    // verdict with nothing quoted back, which the verdict already handles.
    console.warn("[self-rating-storage] Failed to write:", error);
  }
}

/**
 * Reads the pending answer and clears it in one step.
 *
 * Take-once on purpose: the value's job is a single handoff into game state. If
 * it lingered, a reader who came back to `/test` days later — from the nav, not
 * the homepage — would silently skip the question and have a stale claim quoted
 * back at them in the verdict.
 */
export function takeSelfRating(): SelfRating | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    localStorage.removeItem(STORAGE_KEY);
    return isSelfRating(raw) ? raw : null;
  } catch (error) {
    console.warn("[self-rating-storage] Failed to read:", error);
    return null;
  }
}

export function clearSelfRating(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("[self-rating-storage] Failed to clear:", error);
  }
}
