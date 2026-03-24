"use client";

import { motion } from "framer-motion";

interface ChatLandingProps {
  messages: { title: string; subtitle: string; cta: string };
  onStart: () => void;
}

export function ChatLanding({ messages, onStart }: ChatLandingProps) {
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

      <p className="mt-4 text-lg text-white/50 max-w-md">
        {messages.subtitle}
      </p>

      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        className="mt-12 rounded-full border border-white/20 px-8 py-4 text-lg font-medium transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px]"
      >
        {messages.cta}
      </motion.button>
    </motion.div>
  );
}
