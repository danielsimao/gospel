"use client";

import { createContext, useContext, useEffect, useReducer, type Dispatch } from "react";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import { writeSession } from "@/lib/test-session-storage";
import type { GameState, GameAction, SelfRating } from "@/lib/types";

const GameStateContext = createContext<GameState>(initialGameState);
const GameDispatchContext = createContext<Dispatch<GameAction>>(() => {});

export function useGameState() {
  return useContext(GameStateContext);
}

export function useGameDispatch() {
  return useContext(GameDispatchContext);
}

/**
 * @param initialSelfRating The answer the reader gave on the homepage, read
 * from the route rather than from storage. See the seeded page under
 * `test/[rating]` for why it arrives this way.
 */
export function GameProvider({
  children,
  initialSelfRating = null,
}: {
  children: React.ReactNode;
  initialSelfRating?: SelfRating | null;
}) {
  /*
   * Seeded in the initialiser, not by an effect, and this is the entire point.
   *
   * The answer used to be handed over in localStorage and dispatched from a
   * layout effect, which meant the first render always had `selfRating: null`
   * — so the landing screen rendered its *question*, and when the answer
   * arrived a frame later AnimatePresence played the question's 200ms exit.
   * A reader who had just tapped an answer watched it ask them again. Measured
   * at 219ms on the real journey, against a 0.2s exit duration.
   *
   * Three attempts to patch that failed in the same way: a layout effect runs
   * after the first render, and an inline pre-paint script never runs at all on
   * a client-side navigation, which is how readers actually arrive. The answer
   * comes from `params` now, so the very first render already has it — on the
   * server and in the browser alike, with nothing to synchronise.
   */
  const [state, dispatch] = useReducer(gameReducer, initialSelfRating, (rating) =>
    rating ? { ...initialGameState, selfRating: rating } : initialGameState,
  );

  useEffect(() => {
    if (state.phase === "landing") {
      // Nothing in progress — leave any prior saved session alone so the
      // resume modal can still pick it up. Initialization handles its own clear.
      return;
    }
    // The session is NOT cleared once a response is recorded. The decision
    // stays readable afterwards, and back through grace and the verdict keeps
    // working — none of which survives if the state it renders from is thrown
    // away. A completed session simply stops being offered as a
    // resume (see the shell's resume dialog), rather than being deleted.
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
