"use client";

import { m } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { SelfRating, type SelfRatingMessages } from "@/components/home/self-rating";
import { trackGameStarted, trackSelfRating } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import type { SelfRating as SelfRatingValue } from "@/lib/types";

interface LandingProps {
  messages: {
    title: string;
    cta: string;
    label: string;
    subtitle: string;
    selfRating: SelfRatingMessages;
  };
  locale: Locale;
}

/**
 * The threshold screen, reached only by readers who came straight to `/test` —
 * from the nav, a share link or a bookmark. Anyone arriving from the homepage
 * answered the question there and is sent past this screen by the shell.
 *
 * Its h1 has always been "Are you a good person?"; what changed is that the
 * question is now answerable here instead of merely stated with a Begin button
 * beneath it. One rule holds across both entry points: the question is asked
 * exactly once, wherever the reader first meets it.
 */
export function Landing({ messages, locale }: LandingProps) {
  const dispatch = useGameDispatch();

  function handleSelect(rating: SelfRatingValue) {
    // Order matters: the rating must be in state before START_GAME, which
    // rebuilds from initialGameState and carries only what is already there.
    dispatch({ type: "SET_SELF_RATING", rating });
    trackSelfRating(rating, "test_landing");
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
        <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
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

      {/* The answer. Tapping any option records the claim and begins the Law —
          one action, so the screen no longer states a question and then asks
          for a separate click to get past it. */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="mt-10"
      >
        <SelfRating
          messages={messages.selfRating}
          onSelect={handleSelect}
          ariaLabel={messages.title}
        />
      </m.div>
    </m.div>
  );
}
