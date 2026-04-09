"use client";

import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="mt-10"
      >
        <Button variant="red" mist onClick={handleStart}>
          {messages.cta}
          <ButtonArrow />
        </Button>
      </motion.div>
    </motion.div>
  );
}
