"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
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
      const maxScroll = scrollHeight - clientHeight;
      const depth = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
      if (depth > maxScrollDepth.current) maxScrollDepth.current = depth;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    const start = startTime.current;
    const maxDepth = maxScrollDepth;
    return () => {
      window.removeEventListener("scroll", handleScroll);
      trackGraceViewed(Date.now() - start, maxDepth.current);
    };
  }, []);

  function handleContinue() {
    dispatch({ type: "SHOW_INVITATION" });
  }

  const paragraphs = messages.body.split("\n\n");

  return (
    <div className="relative flex flex-1 flex-col min-h-dvh">
      {/* Warm radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-24">
        <div className="max-w-lg w-full">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <span className="h-px w-6 bg-[#D4A843]/40" />
            <span className="font-mono text-[9px] uppercase tracking-[3px] text-[#D4A843]/60">
              Grace
            </span>
            <span className="h-px w-6 bg-[#D4A843]/40" />
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl md:text-5xl"
            style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
          >
            {messages.heading}
          </motion.h2>

          {/* Body paragraphs */}
          <div className="mt-8 space-y-5 text-left">
            {paragraphs.map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 + i * 0.3 }}
                className="text-[15px] leading-[1.8] text-white/65 sm:text-base"
              >
                {paragraph}
              </motion.p>
            ))}
          </div>

          {/* Scripture */}
          <motion.blockquote
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 + paragraphs.length * 0.3 }}
            className="mt-8 border-l border-[#D4A843]/30 pl-4 text-left"
          >
            <p className="text-[15px] italic leading-[1.8] text-white/60 sm:text-base">
              &ldquo;{messages.scripture}&rdquo;
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/50">
              {messages.scriptureRef}
            </p>
          </motion.blockquote>

          {/* Continue button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.9 + paragraphs.length * 0.3 + 0.6,
            }}
            onClick={handleContinue}
            whileTap={{ scale: 0.97 }}
            className="mt-10 rounded-xl border border-[#D4A843]/30 px-7 py-3.5 text-sm font-medium tracking-wide text-[#D4A843] transition-all duration-300 hover:border-[#D4A843]/60 hover:bg-[#D4A843]/[0.06] min-h-[48px]"
          >
            {messages.continueLabel} &rarr;
          </motion.button>
        </div>
      </div>
    </div>
  );
}
