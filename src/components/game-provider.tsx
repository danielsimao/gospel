"use client";

import { createContext, useContext, useEffect, useReducer, type Dispatch } from "react";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import { writeSession, clearSession } from "@/lib/test-session-storage";
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

  useEffect(() => {
    if (state.phase === "landing") {
      // Nothing in progress — leave any prior saved session alone so the
      // resume modal can still pick it up. Initialization handles its own clear.
      return;
    }
    if (state.phase === "invitation" && state.invitationResponse) {
      // Test is functionally complete once a response is recorded.
      clearSession();
      return;
    }
    writeSession(state);
  }, [state]);

  return (
    <GameStateContext value={state}>
      <GameDispatchContext value={dispatch}>
        {children}
      </GameDispatchContext>
    </GameStateContext>
  );
}
