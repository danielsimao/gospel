"use client";

import { createContext, useContext, useReducer, useEffect, type Dispatch } from "react";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import type { GameState, GameAction, AnswerType } from "@/lib/types";
import { readQuizAnswers } from "@/lib/quiz-storage";
import { QUESTION_CONFIGS } from "@/lib/questions";

const GameStateContext = createContext<GameState>(initialGameState);
const GameDispatchContext = createContext<Dispatch<GameAction>>(() => {});

export function useGameState() {
  return useContext(GameStateContext);
}

export function useGameDispatch() {
  return useContext(GameDispatchContext);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  useEffect(() => {
    const stored = readQuizAnswers();
    const entries = Object.entries(stored);
    if (entries.length === 0) return;

    const validIds = new Set(QUESTION_CONFIGS.map((c) => c.id));
    const answers = entries
      .filter(([id]) => validIds.has(Number(id)))
      .map(([id, answer]) => ({
        questionId: Number(id),
        answer: answer as AnswerType,
      }));

    if (answers.length > 0) {
      dispatch({ type: "HYDRATE_ANSWERS", answers, startAt: Date.now() });
    }
  }, []);

  return (
    <GameStateContext value={state}>
      <GameDispatchContext value={dispatch}>
        {children}
      </GameDispatchContext>
    </GameStateContext>
  );
}
