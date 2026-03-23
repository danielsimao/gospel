"use client";

import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { trackGameStarted } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

interface LandingProps {
  messages: { title: string; cta: string };
  locale: Locale;
}

export function Landing({ messages, locale }: LandingProps) {
  const dispatch = useGameDispatch();

  function handleStart() {
    trackGameStarted(locale);
    dispatch({ type: "START_GAME" });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    >
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        {messages.title}
      </h1>

      <motion.button
        onClick={handleStart}
        whileTap={{ scale: 0.97 }}
        className="mt-12 rounded-full border border-white/20 px-8 py-4 text-lg font-medium transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px] min-w-[44px]"
      >
        {messages.cta}
      </motion.button>
    </motion.div>
  );
}
