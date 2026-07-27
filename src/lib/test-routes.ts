import { TOTAL_QUESTIONS } from "./questions";
import type { GamePhase, GameState } from "./types";
import type { SavedSession } from "./test-session-storage";
import type { Locale } from "./i18n";

/**
 * How far a reader has legitimately got. Derived, never stored — every input
 * is already persisted, so `phase` on the saved session is redundant for this
 * purpose and cannot drift out of sync with the answers it describes.
 */
export function furthestPhase(state: GameState | SavedSession): GamePhase {
  if (state.invitationReached) return "invitation";
  if (state.graceReached) return "grace";
  if (state.answers.length >= TOTAL_QUESTIONS) return "verdict";
  if (state.answers.length > 0 || state.currentAnswer !== null) return "playing";
  return "landing";
}

/** Forward order. Used to reject deep links past where the reader actually got. */
const RANK: Record<GamePhase, number> = {
  landing: 0,
  playing: 1,
  verdict: 2,
  grace: 3,
  invitation: 4,
};

/**
 * True when `target` is further than the reader may legitimately go.
 *
 * The allowance is furthest + 1, not furthest, because reaching a phase is what
 * records it: the decision screen sets invitationReached on mount, so a guard
 * that only permitted phases already reached would bounce the reader out before
 * that could land and the decision would be permanently unreachable. Completing
 * grace *is* the entitlement to the decision.
 *
 * Jumps of two or more are still refused, so a cold link to /test/decision with
 * nothing but a verdict still lands on the verdict.
 */
export function isBeyond(target: GamePhase, furthest: GamePhase): boolean {
  return RANK[target] > RANK[furthest] + 1;
}

/**
 * The route that shows a phase. Landing and questions share `/test` — questions
 * are one-way and deliberately have no URL of their own.
 */
export function routeForPhase(phase: GamePhase, locale: Locale): string {
  if (phase === "verdict") return `/${locale}/test/verdict`;
  if (phase === "grace") return `/${locale}/test/grace`;
  if (phase === "invitation") return `/${locale}/test/decision`;
  return `/${locale}/test`;
}
