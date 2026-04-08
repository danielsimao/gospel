import { GameState, GameAction, AnswerType } from "./types";
import { QUESTION_CONFIGS, TOTAL_QUESTIONS, INITIAL_SCORE } from "./questions";

export const initialGameState: GameState = {
  phase: "landing",
  currentQuestion: 0,
  score: INITIAL_SCORE,
  answers: [],
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
      };
    }

    case "ADVANCE_AFTER_FOLLOWUP": {
      if (state.phase !== "playing") return state;

      const nextQuestion = state.currentQuestion + 1;

      if (nextQuestion >= TOTAL_QUESTIONS) {
        return {
          ...state,
          phase: "verdict",
          currentQuestion: nextQuestion,
          completedAt: Date.now(),
        };
      }

      return {
        ...state,
        currentQuestion: nextQuestion,
        questionStartedAt: Date.now(),
      };
    }

    case "SHOW_VERDICT":
      return {
        ...state,
        phase: "verdict",
        completedAt: state.completedAt ?? Date.now(),
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

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}
