"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { ScoreBar } from "@/components/score-bar";
import { trackGraceViewed } from "@/lib/analytics";

interface GraceScreenProps {
  messages: {
    heading: string;
    body: string;
    scripture: string;
    scriptureRef: string;
    continueLabel: string;
  };
}

export function GraceScreen({ messages }: GraceScreenProps) {
  const dispatch = useGameDispatch();
  const startTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const depth = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      if (depth > maxScrollDepth.current) maxScrollDepth.current = depth;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      trackGraceViewed(Date.now() - startTime.current, maxScrollDepth.current);
    };
  }, []);

  function handleContinue() {
    dispatch({ type: "SHOW_INVITATION" });
  }

  const paragraphs = messages.body.split("\n\n");

  return (
    <div className="relative flex flex-1 flex-col min-h-dvh">
      <div className="pointer-events-none fixed inset-0 z-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 3 }}
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 40%, transparent 0deg, rgba(212, 168, 67, 0.3) 15deg, transparent 30deg, transparent 60deg, rgba(212, 168, 67, 0.2) 75deg, transparent 90deg, transparent 150deg, rgba(212, 168, 67, 0.25) 165deg, transparent 180deg, transparent 240deg, rgba(212, 168, 67, 0.15) 255deg, transparent 270deg, transparent 330deg, rgba(212, 168, 67, 0.2) 345deg, transparent 360deg)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <ScoreBar score={100} isRefilling />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-3xl font-bold text-[#D4A843] sm:text-4xl"
        >
          {messages.heading}
        </motion.h2>

        <div className="mt-10 space-y-6 text-left">
          {paragraphs.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 + i * 0.4 }}
              className="text-base leading-relaxed text-white/80 sm:text-lg"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 + paragraphs.length * 0.4 + 0.5 }}
          className="mt-10 border-l-2 border-[#D4A843] pl-4 text-left"
        >
          <p className="text-base italic text-white/70 sm:text-lg">
            &ldquo;{messages.scripture}&rdquo;
          </p>
          <p className="mt-2 text-sm text-white/40">{messages.scriptureRef}</p>
        </motion.blockquote>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 1.5 + paragraphs.length * 0.4 + 1.5,
          }}
          onClick={handleContinue}
          whileTap={{ scale: 0.97 }}
          className="mt-12 rounded-full border border-[#D4A843]/40 px-8 py-4 text-lg font-medium text-[#D4A843] transition-colors hover:bg-[#D4A843]/5 active:bg-[#D4A843]/10 min-h-[44px]"
        >
          {messages.continueLabel} &rarr;
        </motion.button>
      </div>
    </div>
  );
}
