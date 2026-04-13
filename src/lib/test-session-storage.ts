import { emitStorageChange } from "./client-storage";
import type { Answer, GamePhase, GameState, InvitationResponse } from "./types";

const STORAGE_KEY = "gospel-test-session";

// Bump when GameState shape changes or the question set is reordered/resized.
// Mismatched versions are silently discarded on read.
const CURRENT_VERSION = 2;

export interface SavedSession {
  version: number;
  phase: GamePhase;
  currentQuestion: number;
  score: number;
  answers: Answer[];
  currentAnswer: GameState["currentAnswer"];
  showFollowUp: boolean;
  startedAt: number;
  completedAt: number | null;
  questionStartedAt: number | null;
  savedAt: number;
  graceReached: boolean;
  invitationResponse: InvitationResponse | null;
}

export function readSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedSession>;
    if (parsed.version !== CURRENT_VERSION) return null;
    if (!parsed.phase || parsed.phase === "landing") return null;
    return parsed as SavedSession;
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
      invitationResponse: state.invitationResponse,
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
