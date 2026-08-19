import { describe, it, expect, vi, afterEach } from "vitest";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import { TOTAL_QUESTIONS, INITIAL_SCORE, QUESTION_CONFIGS } from "@/lib/questions";
import type { GameState, ResumeSessionPayload } from "@/lib/types";

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

    /*
     * Reported from the field, and reproduced in a browser before this was
     * written: answer question one, then spam the Next button. Eight clicks
     * inside the transition took the reader to `currentQuestion: 6`, phase
     * `verdict`, with ONE answer recorded and the screen reading GUILTY.
     *
     * The advance only ever checked the phase, so every extra click stepped
     * over a question nobody had answered. ANSWER_QUESTION already refuses a
     * second answer and SHOW_VERDICT already refuses an unfinished test; this
     * was the one move in the flow with no such guard, which is why a fast
     * thumb could skip the Law and still be handed its verdict.
     *
     * The guard belongs here rather than on the button: disabling a control
     * during a transition leaves keyboard, voice and assistive activation to
     * find the same hole, and the reducer is the only place every path passes
     * through.
     */
    it("refuses to advance past a question that has not been answered", () => {
      const playing = startGame();
      const answered = gameReducer(playing, { type: "ANSWER_QUESTION", answer: "honest" });
      const advanced = gameReducer(answered, { type: "ADVANCE_AFTER_FOLLOWUP" });
      expect(advanced.currentQuestion).toBe(1);

      // The second click of a spam, landing before question two is answered.
      const again = gameReducer(advanced, { type: "ADVANCE_AFTER_FOLLOWUP" });
      expect(again.currentQuestion, "an unanswered question was stepped over").toBe(1);
      expect(again).toBe(advanced);
    });

    it("cannot be spammed into a verdict the testimony does not support", () => {
      let state = gameReducer(startGame(), { type: "ANSWER_QUESTION", answer: "honest" });
      for (let i = 0; i < 20; i++) {
        state = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
      }
      expect(state.phase, "one answer bought a verdict").toBe("playing");
      expect(state.answers).toHaveLength(1);
      expect(state.currentQuestion).toBe(1);
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

    it("SHOW_VERDICT is refused until every question is answered", () => {
      // The verdict screen dispatches this on arrival, so any mount of that
      // screen reaches it. Letting it through would persist a phase:"verdict"
      // session with zero answers for the resume dialog to offer back.
      expect(gameReducer(initialGameState, { type: "SHOW_VERDICT" })).toBe(initialGameState);

      const playing = startGame();
      const oneAnswer = gameReducer(playing, { type: "ANSWER_QUESTION", answer: "honest" });
      expect(gameReducer(oneAnswer, { type: "SHOW_VERDICT" })).toBe(oneAnswer);
    });

    it("SHOW_VERDICT records completion for a finished test", () => {
      // The verdict screen's own guard path: reached without the last
      // ADVANCE_AFTER_FOLLOWUP, which is what the app itself dispatches.
      let state = startGame();
      for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        state = gameReducer(state, { type: "ANSWER_QUESTION", answer: "honest" });
        if (i < TOTAL_QUESTIONS - 1) {
          state = gameReducer(state, { type: "ADVANCE_AFTER_FOLLOWUP" });
        }
      }
      expect(state.phase).toBe("playing");

      state = gameReducer(state, { type: "SHOW_VERDICT" });
      expect(state.phase).toBe("verdict");
      expect(state.completedAt).toBeGreaterThan(0);
      expect(state.currentAnswer).toBeNull();
      expect(state.answers).toHaveLength(TOTAL_QUESTIONS);
    });

    it("SHOW_VERDICT keeps the original completedAt on a re-read", () => {
      const done = gameReducer(answerAll(startGame(), "honest"), { type: "SHOW_VERDICT" });
      const reread = gameReducer(gameReducer(done, { type: "SHOW_GRACE" }), {
        type: "SHOW_VERDICT",
      });
      expect(reread.completedAt).toBe(done.completedAt);
    });

    it("SHOW_GRACE is only valid from verdict", () => {
      const playing = startGame();
      expect(gameReducer(playing, { type: "SHOW_GRACE" })).toBe(playing);
    });

    it("SHOW_INVITATION is only valid from grace", () => {
      const playing = startGame();
      expect(gameReducer(playing, { type: "SHOW_INVITATION" })).toBe(playing);
    });

    it("REVEAL_GRACE_BEAT never shrinks the count", () => {
      // Back into grace re-mounts the screen, which seeds from the persisted
      // count — a lower value arriving late would take away beats the reader
      // already opened.
      let state = gameReducer(answerAll(startGame(), "honest"), { type: "SHOW_GRACE" });
      state = gameReducer(state, { type: "REVEAL_GRACE_BEAT", count: 3 });
      expect(state.graceBeatsRevealed).toBe(3);

      const shrunk = gameReducer(state, { type: "REVEAL_GRACE_BEAT", count: 1 });
      expect(shrunk).toBe(state);
      expect(gameReducer(state, { type: "REVEAL_GRACE_BEAT", count: 3 })).toBe(state);
      expect(gameReducer(state, { type: "REVEAL_GRACE_BEAT", count: 4 }).graceBeatsRevealed).toBe(4);
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

  describe("SET_SELF_RATING", () => {
    it("records the reader's own claim before the Law begins", () => {
      const state = gameReducer(initialGameState, { type: "SET_SELF_RATING", rating: "yes" });
      expect(state.selfRating).toBe("yes");
    });

    /*
     * START_GAME rebuilds from initialGameState, so without an explicit carry
     * the rating recorded a moment earlier — on the homepage or on the landing
     * screen — is wiped on the way into question one, and the verdict has
     * nothing to quote. Every path sets the rating first and starts second.
     */
    it("survives START_GAME, which rebuilds state from scratch", () => {
      let state = gameReducer(initialGameState, { type: "SET_SELF_RATING", rating: "mostly" });
      state = gameReducer(state, { type: "START_GAME" });

      expect(state.phase).toBe("playing");
      expect(state.selfRating).toBe("mostly");
    });

    /*
     * The reply screen's escape hatch. Three chips sit side by side with nothing
     * confirming the tap, so a mis-tap must stay correctable right up until the
     * questions begin — otherwise it is quoted back at the verdict as though the
     * reader meant it.
     */
    it("clears back to null while still on the landing screen", () => {
      let state = gameReducer(initialGameState, { type: "SET_SELF_RATING", rating: "yes" });
      state = gameReducer(state, { type: "SET_SELF_RATING", rating: null });

      expect(state.selfRating).toBeNull();
      expect(state.phase).toBe("landing");
    });

    it("can be answered again after clearing", () => {
      let state = gameReducer(initialGameState, { type: "SET_SELF_RATING", rating: "yes" });
      state = gameReducer(state, { type: "SET_SELF_RATING", rating: null });
      state = gameReducer(state, { type: "SET_SELF_RATING", rating: "no" });

      expect(state.selfRating).toBe("no");
    });

    it("refuses to change once the Law is under way", () => {
      const playing = gameReducer(
        gameReducer(initialGameState, { type: "SET_SELF_RATING", rating: "no" }),
        { type: "START_GAME" },
      );
      const state = gameReducer(playing, { type: "SET_SELF_RATING", rating: "yes" });

      expect(state).toBe(playing);
      expect(state.selfRating).toBe("no");
    });

    /*
     * Testimony, not a measurement. If the rating ever reaches the scoring path,
     * the verdict stops being what the six answers prove — and a reader who
     * admitted up front would be handed a different verdict for the same
     * answers, which is the one thing this must never do.
     */
    it("does not touch the score or the question count", () => {
      const withRating = answerAll(
        gameReducer(
          gameReducer(initialGameState, { type: "SET_SELF_RATING", rating: "no" }),
          { type: "START_GAME" },
        ),
        "honest",
      );
      const without = answerAll(startGame(), "honest");

      expect(withRating.score).toBe(without.score);
      expect(withRating.answers).toHaveLength(without.answers.length);
      expect(withRating.phase).toBe(without.phase);
    });

    it("carries a saved rating back through RESUME_SESSION", () => {
      const state = gameReducer(initialGameState, {
        type: "RESUME_SESSION",
        session: {
          phase: "playing",
          currentQuestion: 2,
          score: 60,
          answers: [],
          currentAnswer: null,
          showFollowUp: false,
          startedAt: 1_000_000,
          completedAt: null,
          questionStartedAt: null,
          savedAt: 1_090_000,
          graceReached: false,
          graceBeatsRevealed: 0,
          invitationReached: false,
          invitationResponse: null,
          selfRating: "mostly",
        },
      });

      expect(state.selfRating).toBe("mostly");
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
        graceBeatsRevealed: 5,
        invitationReached: true,
        invitationResponse: null,
        selfRating: null,
      };
      const state = gameReducer(initialGameState, {
        type: "RESUME_SESSION",
        session,
      });
      expect(state.invitationReached).toBe(true);
    });
  });
});

describe("RESUME_SESSION timestamp rebasing", () => {
  afterEach(() => vi.useRealTimers());

  /** A saved session, with only the fields a case cares about overridden. */
  function saved(over: Partial<ResumeSessionPayload> = {}): ResumeSessionPayload {
    const startedAt = 1_000_000;
    return {
      phase: "playing",
      currentQuestion: 2,
      score: 60,
      answers: [],
      currentAnswer: null,
      showFollowUp: false,
      startedAt,
      completedAt: null,
      questionStartedAt: null,
      savedAt: startedAt + 90_000, // 90s of active time before saving
      graceReached: false,
      graceBeatsRevealed: 0,
      invitationReached: false,
      invitationResponse: null,
      selfRating: null,
      ...over,
    };
  }

  it("carries active elapsed time across, not wall-clock time away", () => {
    /*
     * The whole point of the rebase, and the reason this is tested: the verdict
     * screen counts deaths "since you started" from state.startedAt, and reports
     * that same span to analytics. Carry startedAt through verbatim and someone
     * resuming a three-day-old session is told that roughly 466,000 people have
     * died since they began — the central claim of the screen, rendered absurd,
     * with every other test still green.
     */
    vi.useFakeTimers();
    const threeDaysLater = 1_000_000 + 3 * 24 * 60 * 60 * 1000;
    vi.setSystemTime(threeDaysLater);

    const state = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session: saved(),
    });

    // 90 seconds of real activity, however long the reader was away.
    expect(Date.now() - state.startedAt).toBe(90_000);
  });

  it("preserves the completed span exactly for a finished test", () => {
    vi.useFakeTimers();
    vi.setSystemTime(5_000_000);

    const session = saved({
      phase: "verdict",
      completedAt: 1_000_000 + 120_000,
      savedAt: 1_000_000 + 500_000, // sat on the verdict for a while
    });
    const state = gameReducer(initialGameState, { type: "RESUME_SESSION", session });

    // The duration the verdict reports is completedAt - startedAt, and it must
    // survive: the reader took two minutes, not the eight they left the tab open.
    expect(state.completedAt).not.toBeNull();
    expect(state.completedAt! - state.startedAt).toBe(120_000);
  });

  it("leaves completedAt null when the test was never finished", () => {
    const state = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session: saved({ completedAt: null }),
    });
    expect(state.completedAt).toBeNull();
  });

  it("never produces a negative elapsed span from a corrupt record", () => {
    vi.useFakeTimers();
    vi.setSystemTime(9_000_000);

    // savedAt before startedAt — a clock change, or a hand-edited record.
    const state = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session: saved({ startedAt: 2_000_000, savedAt: 1_000_000 }),
    });
    expect(Date.now() - state.startedAt).toBe(0);
    expect(state.startedAt).toBeLessThanOrEqual(Date.now());
  });

  it("rebases the current question only while one is genuinely open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(4_000_000);
    const base = { startedAt: 1_000_000, savedAt: 1_000_000 + 60_000 };

    const open = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session: saved({ ...base, phase: "playing", currentAnswer: null, questionStartedAt: 1_000_000 + 45_000 }),
    });
    // 15s had been spent on the question when the session was saved.
    expect(Date.now() - open.questionStartedAt!).toBe(15_000);

    // Already answered, so there is no live question to time.
    const answered = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session: saved({ ...base, phase: "playing", currentAnswer: "honest", questionStartedAt: 1_000_000 + 45_000 }),
    });
    expect(answered.questionStartedAt).toBeNull();

    // Past the questions entirely.
    const later = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session: saved({ ...base, phase: "grace", questionStartedAt: 1_000_000 + 45_000 }),
    });
    expect(later.questionStartedAt).toBeNull();
  });

  it("drops a pending answer that belongs to a phase the reader has left", () => {
    const state = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session: saved({ phase: "verdict", currentAnswer: "justify", showFollowUp: true }),
    });
    expect(state.currentAnswer).toBeNull();
    expect(state.showFollowUp).toBe(false);
  });

  it("restores every persisted flag, not just the ones a screen happens to read", () => {
    const state = gameReducer(initialGameState, {
      type: "RESUME_SESSION",
      session: saved({
        phase: "invitation",
        answers: [{ questionId: 1, answer: "honest", commandment: "9th", scoreChange: -18, timeOnQuestion: 1000 }],
        score: 12,
        currentQuestion: 5,
        graceReached: true,
        graceBeatsRevealed: 4,
        invitationReached: true,
        invitationResponse: "thinking",
      }),
    });
    expect(state.phase).toBe("invitation");
    expect(state.score).toBe(12);
    expect(state.currentQuestion).toBe(5);
    expect(state.answers).toHaveLength(1);
    expect(state.graceReached).toBe(true);
    // The field that was silently defaulting to 0 and wiping the reader's beats.
    expect(state.graceBeatsRevealed).toBe(4);
    expect(state.invitationReached).toBe(true);
    expect(state.invitationResponse).toBe("thinking");
  });
});
