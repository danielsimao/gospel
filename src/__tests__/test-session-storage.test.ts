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

  describe("clearSession", () => {
    it("removes the session from storage", () => {
      writeSession(playingState);
      expect(readSession()).not.toBeNull();

      clearSession();
      expect(readSession()).toBeNull();
    });
  });
});
