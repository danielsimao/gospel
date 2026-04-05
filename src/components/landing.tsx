"use client";

import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { trackGameStarted } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

interface LandingProps {
  messages: { title: string; cta: string; label: string; subtitle: string };
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
      {/* Docket label */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex items-center gap-2"
      >
        <span className="h-px w-6 bg-red-500/40" />
        <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/60">
          {messages.label}
        </span>
        <span className="h-px w-6 bg-red-500/40" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-5 max-w-md text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
      >
        {messages.title}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-4 max-w-sm text-xs italic text-white/35 sm:text-sm"
      >
        {messages.subtitle}
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        onClick={handleStart}
        whileTap={{ scale: 0.97 }}
        className="group mt-10 rounded-xl border border-red-500/30 bg-red-950/20 px-7 py-3.5 text-sm font-medium tracking-wide text-red-300 transition-all duration-300 hover:border-red-500/60 hover:bg-red-950/40 hover:text-red-200 min-h-[48px]"
      >
        {messages.cta}
        <span className="ml-2 transition-transform group-hover:translate-x-1">
          &rarr;
        </span>
      </motion.button>
    </motion.div>
  );
}
