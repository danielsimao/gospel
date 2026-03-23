"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { CrackOverlay } from "@/components/crack-overlay";
import { trackVerdictReached } from "@/lib/analytics";
import type { GameState } from "@/lib/types";

interface VerdictScreenProps {
  messages: { title: string; subtitle: string };
  state: GameState;
}

export function VerdictScreen({ messages, state }: VerdictScreenProps) {
  const dispatch = useGameDispatch();

  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const totalHonest = state.answers.filter((a) => a.answer === "honest").length;
    const totalJustify = state.answers.filter((a) => a.answer === "justify").length;
    const totalTime = state.completedAt
      ? state.completedAt - state.startedAt
      : Date.now() - state.startedAt;

    trackVerdictReached(totalHonest, totalJustify, totalTime);

    const timer = setTimeout(() => {
      dispatch({ type: "SHOW_GRACE" });
    }, 5000);

    return () => clearTimeout(timer);
  }, [dispatch, state]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <CrackOverlay />

      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="relative z-50 text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
      >
        {messages.title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.0 }}
        className="relative z-50 mt-6 text-lg text-white/60 max-w-md"
      >
        {messages.subtitle}
      </motion.p>
    </div>
  );
}
