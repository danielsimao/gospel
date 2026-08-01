import type { GamePhase } from "./types";

/**
 * The four stages the reader is told about, and the order they arrive in.
 *
 * This is the flow's spine as the *reader* experiences it, which is not the
 * same list as GamePhase: "landing" is the threshold rather than a stage, and
 * the reader's own answers are the whole of "test" no matter which of six
 * questions they are standing on.
 */
export const FLOW_STAGES = ["test", "verdict", "paid", "decision"] as const;

export type FlowStage = (typeof FLOW_STAGES)[number];

/**
 * Which stage a phase belongs to, or null for the threshold.
 *
 * `playing` maps to `test` rather than getting a stage per question: the band
 * names stages, and the six questions have their own indicator already — the
 * examination ledger, which says which question out of how many and how each
 * was answered. Two progress readouts on one screen was the collision this
 * mapping exists to avoid.
 */
export function stageOfPhase(phase: GamePhase): FlowStage | null {
  switch (phase) {
    case "landing":
      return null;
    case "playing":
      return "test";
    case "verdict":
      return "verdict";
    case "grace":
      return "paid";
    case "invitation":
      return "decision";
  }
}

/**
 * How far along the spine the reader has ever been, as a stage index.
 *
 * Read from the persisted journey flags rather than the live phase, because
 * walking backwards must not retract what has been reached: a reader who
 * returns to the verdict from the decision still has grace and the decision
 * behind them, and the band has to keep both lit. `graceReached` and
 * `invitationReached` are monotonic in the reducer, which is what makes this
 * safe to derive.
 *
 * Returns -1 before the test has begun, so the band renders nothing.
 */
export function furthestStageIndex(state: {
  phase: GamePhase;
  invitationReached: boolean;
  graceReached: boolean;
  completedAt: number | null;
}): number {
  if (state.invitationReached) return FLOW_STAGES.indexOf("decision");
  if (state.graceReached) return FLOW_STAGES.indexOf("paid");
  if (state.completedAt !== null || state.phase === "verdict") {
    return FLOW_STAGES.indexOf("verdict");
  }
  if (state.phase === "playing") return FLOW_STAGES.indexOf("test");
  return -1;
}
