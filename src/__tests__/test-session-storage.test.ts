import { describe, it, expect, beforeEach, vi } from "vitest";
import { readSession, writeSession, clearSession } from "@/lib/test-session-storage";
import { initialGameState } from "@/lib/game-reducer";
import type { GameState } from "@/lib/types";

// Mock localStorage
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
};

// Mock window and localStorage
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", localStorageMock);

// Mock client-storage emitStorageChange
vi.mock("@/lib/client-storage", () => ({
  emitStorageChange: vi.fn(),
}));

const playingState: GameState = {
  ...initialGameState,
  phase: "playing",
  currentQuestion: 3,
  score: 75,
  answers: [
    { questionId: 1, answer: "honest", commandment: "9th", scoreChange: -12, timeOnQuestion: 1000 },
    { questionId: 2, answer: "justify", commandment: "8th", scoreChange: -5, timeOnQuestion: 2000 },
    { questionId: 3, answer: "honest", commandment: "7th", scoreChange: -13, timeOnQuestion: 1500 },
  ],
  startedAt: 1000,
  questionStartedAt: 5000,
};

describe("test-session-storage", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  describe("writeSession + readSession round-trip", () => {
    it("writes and reads back a playing session", () => {
      writeSession(playingState);
      const session = readSession();

      expect(session).not.toBeNull();
      expect(session!.phase).toBe("playing");
      expect(session!.currentQuestion).toBe(3);
      expect(session!.score).toBe(75);
      expect(session!.answers).toHaveLength(3);
    });

    it("preserves all answer data", () => {
      writeSession(playingState);
      const session = readSession();

      expect(session!.answers[0]).toEqual({
        questionId: 1,
        answer: "honest",
        commandment: "9th",
        scoreChange: -12,
        timeOnQuestion: 1000,
      });
    });
  });

  describe("readSession", () => {
    it("returns null when nothing is stored", () => {
      expect(readSession()).toBeNull();
    });

    it("returns null for corrupted JSON", () => {
      storage.set("gospel-test-session", "not valid json{{{");
      expect(readSession()).toBeNull();
    });

    it("returns null for version mismatch", () => {
      storage.set("gospel-test-session", JSON.stringify({
        version: 999,
        phase: "playing",
        currentQuestion: 0,
      }));
      expect(readSession()).toBeNull();
    });

    it("returns null for landing phase (not resumable)", () => {
      writeSession(initialGameState);
      expect(readSession()).toBeNull();
    });
  });

  describe("invitationReached", () => {
    it("round-trips invitationReached", () => {
      writeSession({ ...playingState, phase: "invitation", invitationReached: true });
      expect(readSession()?.invitationReached).toBe(true);
    });

    it("defaults invitationReached to false for sessions saved before the field", () => {
      writeSession({ ...playingState, phase: "grace" });
      const raw = JSON.parse(storage.get("gospel-test-session")!);
      delete raw.invitationReached;
      storage.set("gospel-test-session", JSON.stringify(raw));
      expect(readSession()?.invitationReached).toBe(false);
    });
  });

  describe("clearSession", () => {
    it("removes the session from storage", () => {
      writeSession(playingState);
      expect(readSession()).not.toBeNull();

      clearSession();
      expect(readSession()).toBeNull();
    });
  });
});

describe("corrupt records are discarded, not handed on", () => {
  /** A valid record, then broken in one specific way. */
  function write(over: Record<string, unknown>) {
    const base = {
      version: 3,
      phase: "playing",
      currentQuestion: 1,
      score: 80,
      answers: [],
      currentAnswer: null,
      showFollowUp: false,
      startedAt: Date.now() - 30_000,
      completedAt: null,
      questionStartedAt: null,
      savedAt: Date.now(),
      graceReached: false,
      graceBeatsRevealed: 0,
      invitationReached: false,
      invitationResponse: null,
    };
    localStorage.setItem("gospel-test-session", JSON.stringify({ ...base, ...over }));
  }

  it("reads a sound record", () => {
    write({});
    expect(readSession()).not.toBeNull();
  });

  it("discards a record whose answers are not an array", () => {
    // answers reaches furthestPhase and splitConfession, both of which throw on
    // a non-array — and the reader would meet the error boundary with no way to
    // clear the key from the UI.
    write({ answers: "six" });
    expect(readSession()).toBeNull();
    expect(localStorage.getItem("gospel-test-session")).toBeNull();
  });

  it.each(["currentQuestion", "score", "startedAt"])(
    "discards a record whose %s is not a finite number",
    (field) => {
      write({ [field]: "lots" });
      expect(readSession()).toBeNull();
      write({ [field]: Number.NaN });
      expect(readSession()).toBeNull();
    },
  );

  it("discards a session older than the resume window, and clears it", () => {
    write({ savedAt: Date.now() - 31 * 60 * 1000 });
    expect(readSession()).toBeNull();
    expect(localStorage.getItem("gospel-test-session")).toBeNull();
  });

  it("keeps a session inside the resume window", () => {
    write({ savedAt: Date.now() - 29 * 60 * 1000 });
    expect(readSession()).not.toBeNull();
  });
});
