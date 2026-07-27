"use client";

import { createContext, useContext, useEffect, useReducer, type Dispatch } from "react";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import { writeSession } from "@/lib/test-session-storage";
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
    // The session is NOT cleared once a response is recorded. /test/decision
    // stays reachable and read-only afterwards, and back through grace and the
    // verdict keeps working — none of which survives if the state it renders
    // from is thrown away. A completed session simply stops being offered as a
    // resume (see TestLanding), rather than being deleted.
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
