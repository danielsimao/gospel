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
  invitationResponse: null,
  questionStartedAt: null,
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
      return {
        ...state,
        phase: "verdict",
        currentAnswer: null,
        showFollowUp: false,
        completedAt: state.completedAt ?? Date.now(),
        questionStartedAt: null,
      };

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
      };

    case "SET_INVITATION_RESPONSE":
      if (state.phase !== "invitation") return state;
      return {
        ...state,
        invitationResponse: action.response,
      };

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
        invitationResponse: action.session.invitationResponse,
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
