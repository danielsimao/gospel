import { GameState, GameAction, AnswerType } from "./types";
import { QUESTION_CONFIGS, TOTAL_QUESTIONS, INITIAL_SCORE } from "./questions";

export const initialGameState: GameState = {
  phase: "landing",
  currentQuestion: 0,
  score: INITIAL_SCORE,
  answers: [],
  currentAnswer: null,
  showFollowUp: false,
  startedAt: 0,
  completedAt: null,
  graceReached: false,
  graceBeatsRevealed: 0,
  invitationReached: false,
  invitationResponse: null,
  questionStartedAt: null,
  selfRating: null,
};

function calculateDrain(questionIndex: number, answer: AnswerType): number {
  const config = QUESTION_CONFIGS[questionIndex];
  if (!config) return 0;
  return answer === "honest" ? config.honestDrain : config.justifyDrain;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...initialGameState,
        phase: "playing",
        startedAt: Date.now(),
        questionStartedAt: Date.now(),
        // Carried through the reset. The rating is answered *before* the game
        // starts — on the homepage or on the landing screen — so rebuilding
        // from initialGameState would discard the one thing already recorded.
        selfRating: state.selfRating,
      };

    case "ANSWER_QUESTION": {
      if (state.phase !== "playing") return state;
      if (state.currentAnswer) return state;
      const config = QUESTION_CONFIGS[state.currentQuestion];
      if (!config) return state;

      const drain = calculateDrain(state.currentQuestion, action.answer);
      const newScore = Math.max(0, state.score - drain);
      const timeOnQuestion = state.questionStartedAt
        ? Date.now() - state.questionStartedAt
        : 0;

      const newAnswer = {
        questionId: config.id,
        answer: action.answer,
        commandment: config.commandment,
        scoreChange: -drain,
        timeOnQuestion,
      };

      return {
        ...state,
        score: newScore,
        answers: [...state.answers, newAnswer],
        currentAnswer: action.answer,
        showFollowUp: false,
      };
    }

    case "UNDO_ANSWER": {
      // Mis-tap protection only: valid while the answer awaits confirmation
      // (Next not yet tapped). Once ADVANCE_AFTER_FOLLOWUP runs, testimony
      // is recorded and there is no way back — by design.
      if (state.phase !== "playing") return state;
      if (!state.currentAnswer || state.answers.length === 0) return state;

      const remaining = state.answers.slice(0, -1);
      // Replay the drains from scratch — exact inverse even when the
      // per-answer clamp at 0 made subtraction non-invertible.
      const score = remaining.reduce(
        (s, a) => Math.max(0, s + a.scoreChange),
        INITIAL_SCORE,
      );

      return {
        ...state,
        score,
        answers: remaining,
        currentAnswer: null,
        showFollowUp: false,
        questionStartedAt: Date.now(),
      };
    }

    case "SHOW_FOLLOWUP":
      if (state.phase !== "playing" || state.currentAnswer !== "justify") {
        return state;
      }

      return {
        ...state,
        showFollowUp: true,
      };

    case "ADVANCE_AFTER_FOLLOWUP": {
      if (state.phase !== "playing") return state;
      /*
       * Only off a question that has been answered.
       *
       * Answers are appended one per question, so `answers.length` is also the
       * index of the first unanswered one: while it is greater than
       * `currentQuestion` this question has testimony behind it, and while it
       * is not, nothing has been said here yet. UNDO_ANSWER pops the last
       * answer, which returns this to false in the same move.
       *
       * Without it, the advance checked only the phase — so a reader who
       * answered question one and spam-tapped Next rode the extra clicks
       * straight through the remaining questions: reproduced at eight clicks,
       * landing on `currentQuestion: 6`, phase `verdict`, one answer recorded,
       * the screen reading GUILTY. A verdict is the reader's own testimony
       * read back to them; it cannot be reached over questions they never
       * answered.
       *
       * Here rather than on the button because a disabled control during the
       * transition leaves keyboard, voice and assistive activation to find the
       * same hole. This is the move every path has to make.
       */
      if (state.answers.length <= state.currentQuestion) return state;

      const nextQuestion = state.currentQuestion + 1;

      if (nextQuestion >= TOTAL_QUESTIONS) {
        return {
          ...state,
          phase: "verdict",
          currentQuestion: nextQuestion,
          currentAnswer: null,
          showFollowUp: false,
          completedAt: Date.now(),
          questionStartedAt: null,
        };
      }

      return {
        ...state,
        currentQuestion: nextQuestion,
        currentAnswer: null,
        showFollowUp: false,
        questionStartedAt: Date.now(),
      };
    }

    case "SHOW_VERDICT":
      // Only from a finished test. The verdict screen dispatches this on
      // arrival as a belt-and-braces record of the phase, so without the guard
      // any mount of that screen could manufacture a verdict from an empty
      // session — and the resume dialog would then offer to pick it up.
      if (state.answers.length < TOTAL_QUESTIONS) return state;
      return {
        ...state,
        phase: "verdict",
        currentAnswer: null,
        showFollowUp: false,
        completedAt: state.completedAt ?? Date.now(),
        questionStartedAt: null,
      };

    case "REVEAL_GRACE_BEAT":
      // Monotonic: navigating back into grace must never shrink the count.
      if (action.count <= state.graceBeatsRevealed) return state;
      return { ...state, graceBeatsRevealed: action.count };

    case "SHOW_GRACE":
      if (state.phase !== "verdict") return state;
      return {
        ...state,
        phase: "grace",
        graceReached: true,
      };

    case "SHOW_INVITATION":
      if (state.phase !== "grace") return state;
      return {
        ...state,
        phase: "invitation",
        invitationReached: true,
      };

    case "BACK_TO_VERDICT":
      // Re-reading the recorded testimony, not reopening it — answers,
      // score and completion stay exactly as they were.
      if (state.phase !== "grace") return state;
      return { ...state, phase: "verdict" };

    case "BACK_TO_GRACE":
      // Only while the invitation is unanswered. A recorded response
      // closes the book.
      if (state.phase !== "invitation" || state.invitationResponse) {
        return state;
      }
      return { ...state, phase: "grace" };

    case "SET_INVITATION_RESPONSE":
      if (state.phase !== "invitation") return state;
      return {
        ...state,
        invitationResponse: action.response,
      };

    case "SET_SELF_RATING":
      // Only before the Law begins. Once questions are being answered the
      // reader's own claim is history and must not be editable — the verdict
      // quotes it, so a mid-test change would rewrite what they said.
      if (state.phase !== "landing") return state;
      return { ...state, selfRating: action.rating };

    case "RESUME_SESSION": {
      // Rebase timestamps so active elapsed time survives resume without
      // counting the time spent away from the tab.
      const now = Date.now();
      const activeElapsedMs = action.session.completedAt
        ? Math.max(0, action.session.completedAt - action.session.startedAt)
        : Math.max(0, action.session.savedAt - action.session.startedAt);
      const questionElapsedMs = action.session.questionStartedAt
        ? Math.max(0, action.session.savedAt - action.session.questionStartedAt)
        : 0;

      return {
        ...initialGameState,
        phase: action.session.phase,
        currentQuestion: action.session.currentQuestion,
        score: action.session.score,
        answers: action.session.answers,
        currentAnswer:
          action.session.phase === "playing"
            ? action.session.currentAnswer
            : null,
        showFollowUp:
          action.session.phase === "playing" &&
          action.session.currentAnswer === "justify"
            ? action.session.showFollowUp
            : false,
        graceReached: action.session.graceReached,
        graceBeatsRevealed: action.session.graceBeatsRevealed,
        invitationReached: action.session.invitationReached,
        invitationResponse: action.session.invitationResponse,
        selfRating: action.session.selfRating,
        startedAt: now - activeElapsedMs,
        completedAt:
          action.session.completedAt === null ? null : now,
        questionStartedAt:
          action.session.phase === "playing" &&
          action.session.currentAnswer === null &&
          action.session.questionStartedAt
            ? now - questionElapsedMs
            : null,
      };
    }

    default:
      return state;
  }
}
