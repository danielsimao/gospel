import { emitStorageChange } from "./client-storage";
import { SELF_RATINGS } from "./self-rating";
import type { GameState, ResumeSessionPayload, SelfRating } from "./types";

const STORAGE_KEY = "gospel-test-session";

// Bump when GameState shape changes or the question set is reordered/resized.
// Mismatched versions are silently discarded on read.
// v3: question set trimmed 8 → 6 (2026-07-14) — stale sessions could hold
// currentQuestion indices past the new end.
const CURRENT_VERSION = 3;

/**
 * How long a saved session stays resumable.
 *
 * The point of persisting at all is the same sitting: an accidental refresh, a
 * phone locking, a tab restored after a crash. Within the window the flow is
 * restored silently, because a modal asking "pick up where you left off?" costs
 * a reader more than simply redoing a six-question test would.
 *
 * Past the window it is discarded rather than offered. The Law's force is
 * cumulative and in the moment — landing someone back on question four days
 * later, cold, is not resuming a conversation, and a stale half-answered test
 * restored without explanation is more disorienting than starting again.
 */
const RESUME_WINDOW_MS = 30 * 60 * 1000;

/** What the reducer needs, plus the version only this file cares about. */
export interface SavedSession extends ResumeSessionPayload {
  version: number;
}

export function readSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedSession>;
    if (parsed.version !== CURRENT_VERSION) return null;
    if (!parsed.phase || parsed.phase === "landing") return null;
    // Too old to be the same sitting. Cleared rather than merely ignored, so it
    // cannot resurface and does not linger in storage.
    if (
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > RESUME_WINDOW_MS
    ) {
      clearSession();
      return null;
    }
    /*
     * The version gate protects against shape changes between releases, not
     * against a record corrupt within its version — and the policy in this file
     * is deliberately to ship additive changes without bumping, so the gate
     * lets more through than it looks. `answers` in particular reaches
     * furthestPhase and splitConfession, both of which throw on a non-array,
     * and the reader would meet the error boundary with no way to clear the
     * poisoned key from the UI. Discarding costs one branch.
     */
    if (!Array.isArray(parsed.answers)) {
      clearSession();
      return null;
    }
    for (const key of ["currentQuestion", "score", "startedAt"] as const) {
      if (typeof parsed[key] !== "number" || !Number.isFinite(parsed[key])) {
        clearSession();
        return null;
      }
    }

    return {
      ...parsed,
      invitationReached: parsed.invitationReached === true,
      // Added after v3 shipped; absent on in-flight sessions, so default it
      // rather than bumping the version and discarding them.
      graceBeatsRevealed:
        typeof parsed.graceBeatsRevealed === "number" ? parsed.graceBeatsRevealed : 0,
      // Same policy. A session saved before the question existed simply has no
      // testimony to quote, which the verdict already handles.
      selfRating: SELF_RATINGS.includes(parsed.selfRating as SelfRating)
        ? (parsed.selfRating as SelfRating)
        : null,
    } as SavedSession;
  } catch (error) {
    console.warn("[test-session-storage] Failed to read session:", error);
    return null;
  }
}

export function writeSession(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: SavedSession = {
      version: CURRENT_VERSION,
      phase: state.phase,
      currentQuestion: state.currentQuestion,
      score: state.score,
      answers: state.answers,
      currentAnswer: state.currentAnswer,
      showFollowUp: state.showFollowUp,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      questionStartedAt: state.questionStartedAt,
      savedAt: Date.now(),
      graceReached: state.graceReached,
      graceBeatsRevealed: state.graceBeatsRevealed,
      invitationReached: state.invitationReached,
      invitationResponse: state.invitationResponse,
      selfRating: state.selfRating,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    emitStorageChange();
  } catch (error) {
    console.warn("[test-session-storage] Failed to write session:", error);
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    emitStorageChange();
  } catch (error) {
    console.warn("[test-session-storage] Failed to clear session:", error);
  }
}
