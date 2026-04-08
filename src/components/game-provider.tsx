"use client";

import { createContext, useContext, useReducer, type Dispatch } from "react";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import type { GameState, GameAction } from "@/lib/types";

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

  return (
    <GameStateContext value={state}>
      <GameDispatchContext value={dispatch}>
        {children}
      </GameDispatchContext>
    </GameStateContext>
  );
}
