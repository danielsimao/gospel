"use client";

import { useEffect, useRef, useState, useCallback, createRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackGraceViewed } from "@/lib/analytics";
import {
  trackGraceRevealed,
  trackGraceBeatRevealed,
} from "@/lib/eternity-analytics";

interface GraceScreenProps {
  messages: {
    scripture: string;
    scriptureRef: string;
    continueLabel: string;
    label: string;
    beatsHeading: string;
    beats: Array<{ headline: string; subtitle: string }>;
    tapContinue: string;
  };
}

export function GraceScreen({ messages }: GraceScreenProps) {
  const dispatch = useGameDispatch();
  const startTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);

  const [revealedCount, setRevealedCount] = useState(0);
  const allBeatsRevealed = revealedCount >= messages.beats.length;
  const beatRefs = useRef(messages.beats.map(() => createRef<HTMLDivElement>()));

  // Track scroll depth + time
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

  // Track grace phase entry + auto-reveal beat 1
  useEffect(() => {
    trackGraceRevealed();
    const timer = setTimeout(() => {
      setRevealedCount(1);
      trackGraceBeatRevealed(0);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleTapContinue = useCallback(() => {
    if (revealedCount >= messages.beats.length) return;
    const nextBeat = revealedCount;
    trackGraceBeatRevealed(nextBeat);
    setRevealedCount(nextBeat + 1);
    // Scroll to the newly revealed beat after a short delay for the animation
    setTimeout(() => {
      beatRefs.current[nextBeat]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [revealedCount, messages.beats.length]);

  function handleContinue() {
    dispatch({ type: "SHOW_INVITATION" });
  }

  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

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
              {messages.label}
            </span>
            <span className="h-px w-6 bg-[#D4A843]/40" />
          </motion.div>

          {/* Beats heading */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl md:text-5xl"
            style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
          >
            {messages.beatsHeading}
          </motion.h2>

          {/* Beats */}
          <div className="mt-10 text-left">
            {messages.beats.map((beat, i) => {
              const isRevealed = i < revealedCount;
              const isActive = i === revealedCount - 1;
              const isGold = i >= 2;

              if (!isRevealed) return null;

              return (
                <motion.div
                  key={i}
                  ref={beatRefs.current[i]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: isActive ? 1 : 0.32,
                    y: 0,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="border-t border-white/[0.04] py-4 first:border-t-0 first:pt-0"
                >
                  <p className="mb-2 font-mono text-[8px] uppercase tracking-[2.5px] text-[#D4A843]/70">
                    {ROMAN[i] ?? String(i + 1)}
                  </p>
                  <p
                    className={`text-lg font-semibold leading-snug sm:text-xl ${
                      isGold ? "text-[#D4A843]" : "text-white/95"
                    }`}
                  >
                    {beat.headline}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60 sm:text-sm">
                    {beat.subtitle}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Tap to continue pill — no exit animation, just unmounts when the last beat is revealed */}
          {revealedCount > 0 && !allBeatsRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mt-6 flex justify-center"
            >
              <Button variant="gold" size="sm" mist onClick={handleTapContinue}>
                <span className="font-mono text-[10px] uppercase tracking-[2.5px]">
                  {messages.tapContinue}
                </span>
                <ButtonArrow direction="down" />
              </Button>
            </motion.div>
          )}

          {/* Scripture + Continue — after all beats */}
          <AnimatePresence>
            {allBeatsRevealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <motion.blockquote
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mt-8 border-l border-[#D4A843]/30 pl-4 text-left"
                >
                  <p className="text-[15px] italic leading-[1.8] text-white/60 sm:text-base">
                    &ldquo;{messages.scripture}&rdquo;
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
                    {messages.scriptureRef}
                  </p>
                </motion.blockquote>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="mt-10"
                >
                  <Button variant="gold" mist onClick={handleContinue}>
                    {messages.continueLabel}
                    <ButtonArrow />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
