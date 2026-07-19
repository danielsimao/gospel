"use client";

import { m } from "framer-motion";
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
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    >
      {/* Docket label */}
      <m.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="flex items-center gap-2"
      >
        <span className="h-px w-6 bg-red-500/40" />
        <span className="font-mono text-[10px] uppercase tracking-[3px] text-red-400/80">
          {messages.label}
        </span>
        <span className="h-px w-6 bg-red-500/40" />
      </m.div>

      {/* Title */}
      <m.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-5 max-w-md text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
      >
        {messages.title}
      </m.h1>

      {/* Subtitle */}
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-4 max-w-sm text-xs italic text-white/60 sm:text-sm"
      >
        {messages.subtitle}
      </m.p>

      {/* CTA */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="mt-10"
      >
        <Button variant="red" mist onClick={handleStart}>
          {messages.cta}
          <ButtonArrow />
        </Button>
      </m.div>
    </m.div>
  );
}
