import { describe, it, expect } from "vitest";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import { TOTAL_QUESTIONS, INITIAL_SCORE, QUESTION_CONFIGS } from "@/lib/questions";
import type { GameState } from "@/lib/types";

function startGame(): GameState {
  return gameReducer(initialGameState, { type: "START_GAME" });
}

function answerAll(startState: GameState, answer: "honest" | "justify"): GameState {
  let state = startState;
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    state = gameReducer(state, { type: "ANSWER_QUESTION", answer });
    state = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
  }
  return state;
}

describe("gameReducer", () => {
  describe("START_GAME", () => {
    it("transitions from landing to playing", () => {
      const state = startGame();
      expect(state.phase).toBe("playing");
      expect(state.currentQuestion).toBe(0);
      expect(state.score).toBe(INITIAL_SCORE);
      expect(state.answers).toEqual([]);
      expect(state.startedAt).toBeGreaterThan(0);
    });
  });

  describe("ANSWER_QUESTION", () => {
    it("records an honest answer and drains score", () => {
      const playing = startGame();
      const state = gameReducer(playing, { type: "ANSWER_QUESTION", answer: "honest" });

      expect(state.currentAnswer).toBe("honest");
      expect(state.answers).toHaveLength(1);
      expect(state.answers[0].answer).toBe("honest");
      expect(state.score).toBe(INITIAL_SCORE - QUESTION_CONFIGS[0].honestDrain);
    });

    it("records a justify answer with less drain", () => {
      const playing = startGame();
      const state = gameReducer(playing, { type: "ANSWER_QUESTION", answer: "justify" });

      expect(state.currentAnswer).toBe("justify");
      expect(state.score).toBe(INITIAL_SCORE - QUESTION_CONFIGS[0].justifyDrain);
    });

    it("ignores answer when not in playing phase", () => {
      const state = gameReducer(initialGameState, { type: "ANSWER_QUESTION", answer: "honest" });
      expect(state).toBe(initialGameState);
    });

    it("ignores duplicate answer for same question", () => {
      const playing = startGame();
      const answered = gameReducer(playing, { type: "ANSWER_QUESTION", answer: "honest" });
      const duplicate = gameReducer(answered, { type: "ANSWER_QUESTION", answer: "justify" });
      expect(duplicate).toBe(answered);
    });

    it("never drops score below zero", () => {
      let state = startGame();
      // Answer all honestly — total drain exceeds 100
      state = answerAll(state, "honest");
      expect(state.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("SHOW_FOLLOWUP", () => {
    it("shows followup after justify answer", () => {
      const playing = startGame();
      const answered = gameReducer(playing, { type: "ANSWER_QUESTION", answer: "justify" });
      const state = gameReducer(answered, { type: "SHOW_FOLLOWUP" });
      expect(state.showFollowUp).toBe(true);
    });

    it("ignores followup after honest answer", () => {
      const playing = startGame();
      const answered = gameReducer(playing, { type: "ANSWER_QUESTION", answer: "honest" });
      const state = gameReducer(answered, { type: "SHOW_FOLLOWUP" });
      expect(state.showFollowUp).toBe(false);
    });
  });

  describe("ADVANCE_AFTER_FOLLOWUP", () => {
    it("advances to next question", () => {
      const playing = startGame();
      const answered = gameReducer(playing, { type: "ANSWER_QUESTION", answer: "honest" });
      const state = gameReducer(answered, { type: "ADVANCE_AFTER_FOLLOWUP" });

      expect(state.currentQuestion).toBe(1);
      expect(state.currentAnswer).toBeNull();
      expect(state.showFollowUp).toBe(false);
    });

    it("transitions to verdict after last question", () => {
      let state = startGame();
      for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "honest" });
        state = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
      }
      expect(state.phase).toBe("verdict");
      expect(state.completedAt).toBeGreaterThan(0);
    });
  });

  describe("phase transitions", () => {
    it("follows the full flow: landing → playing → verdict → grace → invitation", () => {
      let state: GameState = initialGameState;
      expect(state.phase).toBe("landing");

      state = gameReducer(state, { type: "START_GAME" });
      expect(state.phase).toBe("playing");

      state = answerAll(state, "honest");
      expect(state.phase).toBe("verdict");

      state = gameReducer(state, { type: "SHOW_GRACE" });
      expect(state.phase).toBe("grace");
      expect(state.graceReached).toBe(true);

      state = gameReducer(state, { type: "SHOW_INVITATION" });
      expect(state.phase).toBe("invitation");
    });

    it("SHOW_GRACE is only valid from verdict", () => {
      const playing = startGame();
      expect(gameReducer(playing, { type: "SHOW_GRACE" })).toBe(playing);
    });

    it("SHOW_INVITATION is only valid from grace", () => {
      const playing = startGame();
      expect(gameReducer(playing, { type: "SHOW_INVITATION" })).toBe(playing);
    });
  });

  describe("SET_INVITATION_RESPONSE", () => {
    it("sets response in invitation phase", () => {
      let state = startGame();
      state = answerAll(state, "honest");
      state = gameReducer(state, { type: "SHOW_GRACE" });
      state = gameReducer(state, { type: "SHOW_INVITATION" });
      state = gameReducer(state, { type: "SET_INVITATION_RESPONSE", response: "committed" });

      expect(state.invitationResponse).toBe("committed");
    });

    it("ignores response outside invitation phase", () => {
      const playing = startGame();
      const state = gameReducer(playing, { type: "SET_INVITATION_RESPONSE", response: "committed" });
      expect(state).toBe(playing);
    });
  });

  describe("scoring", () => {
    it("all honest answers drain more than all justify answers", () => {
      const honestState = answerAll(startGame(), "honest");
      const justifyState = answerAll(startGame(), "justify");
      expect(honestState.score).toBeLessThan(justifyState.score);
    });

    it("all honest answers produce score of 0", () => {
      const totalHonestDrain = QUESTION_CONFIGS.reduce((sum, c) => sum + c.honestDrain, 0);
      const state = answerAll(startGame(), "honest");
      expect(state.score).toBe(Math.max(0, INITIAL_SCORE - totalHonestDrain));
    });
  });

  describe("UNDO_ANSWER", () => {
    it("pops the last answer, restores score exactly, and clears currentAnswer", () => {
      let state = gameReducer(initialGameState, { type: "START_GAME" });
      const scoreBefore = state.score;
      state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "honest" });
      expect(state.answers).toHaveLength(1);
      state = gameReducer(state, { type: "UNDO_ANSWER" });
      expect(state.answers).toHaveLength(0);
      expect(state.score).toBe(scoreBefore);
      expect(state.currentAnswer).toBeNull();
      expect(state.showFollowUp).toBe(false);
      expect(state.currentQuestion).toBe(0);
      expect(state.questionStartedAt).not.toBeNull();
    });

    it("restores score exactly across multiple answers (fold replay)", () => {
      let state = gameReducer(initialGameState, { type: "START_GAME" });
      state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "honest" });
      state = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
      const scoreAfterQ1 = state.score;
      state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "justify" });
      state = gameReducer(state, { type: "UNDO_ANSWER" });
      expect(state.score).toBe(scoreAfterQ1);
      expect(state.answers).toHaveLength(1);
    });

    it("is a no-op when nothing is answered or phase is not playing", () => {
      let state = gameReducer(initialGameState, { type: "START_GAME" });
      expect(gameReducer(state, { type: "UNDO_ANSWER" })).toBe(state);
      state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "honest" });
      state = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
      // advanced — currentAnswer is null again, undo must not eat the recorded answer
      const afterAdvance = gameReducer(state, { type: "UNDO_ANSWER" });
      expect(afterAdvance).toBe(state);
    });
  });

  describe("back navigation", () => {
    function reachInvitation(): GameState {
      let state = gameReducer(initialGameState, { type: "START_GAME" });
      state = { ...state, phase: "verdict", completedAt: Date.now() };
      state = gameReducer(state, { type: "SHOW_GRACE" });
      state = gameReducer(state, { type: "SHOW_INVITATION" });
      return state;
    }

    it("SHOW_INVITATION marks invitationReached", () => {
      const state = reachInvitation();
      expect(state.invitationReached).toBe(true);
    });

    it("BACK_TO_VERDICT returns from grace, preserving progress flags", () => {
      let state = gameReducer(initialGameState, { type: "START_GAME" });
      state = { ...state, phase: "verdict", completedAt: 123 };
      state = gameReducer(state, { type: "SHOW_GRACE" });
      state = gameReducer(state, { type: "BACK_TO_VERDICT" });
      expect(state.phase).toBe("verdict");
      expect(state.graceReached).toBe(true);
      expect(state.completedAt).toBe(123);
    });

    it("BACK_TO_VERDICT is a no-op outside grace", () => {
      const state = reachInvitation();
      expect(gameReducer(state, { type: "BACK_TO_VERDICT" })).toBe(state);
    });

    it("BACK_TO_GRACE returns from an unanswered invitation", () => {
      let state = reachInvitation();
      state = gameReducer(state, { type: "BACK_TO_GRACE" });
      expect(state.phase).toBe("grace");
      expect(state.invitationReached).toBe(true);
    });

    it("BACK_TO_GRACE is a no-op once a response is recorded", () => {
      let state = reachInvitation();
      state = gameReducer(state, {
        type: "SET_INVITATION_RESPONSE",
        response: "committed",
      });
      expect(gameReducer(state, { type: "BACK_TO_GRACE" })).toBe(state);
    });

    it("forward again after going back works (grace → invitation)", () => {
      let state = reachInvitation();
      state = gameReducer(state, { type: "BACK_TO_GRACE" });
      state = gameReducer(state, { type: "SHOW_INVITATION" });
      expect(state.phase).toBe("invitation");
    });

    it("RESUME_SESSION carries invitationReached", () => {
      const session = {
        phase: "invitation" as const,
        currentQuestion: 7,
        score: 0,
        answers: [],
        currentAnswer: null,
        showFollowUp: false,
        startedAt: 1000,
        completedAt: 2000,
        questionStartedAt: null,
        savedAt: 3000,
        graceReached: true,
        invitationReached: true,
        invitationResponse: null,
      };
      const state = gameReducer(initialGameState, {
        type: "RESUME_SESSION",
        session,
      });
      expect(state.invitationReached).toBe(true);
    });
  });
});
