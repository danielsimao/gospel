"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  trackGraceRevealed,
  trackGraceBeatRevealed,
  trackGraceCtaClicked,
} from "@/lib/eternity-analytics";
import type { Locale } from "@/lib/i18n";

export interface GraceMessages {
  heading: string;
  beats: [string, string, string, string];
  tapContinue: string;
  scripture: string;
  scriptureRef: string;
  testCta: string;
}

interface GraceRevealProps {
  messages: GraceMessages;
  locale: Locale;
}

export function GraceReveal({ messages, locale }: GraceRevealProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [entryRevealed, setEntryRevealed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const totalBeats = messages.beats.length;
  const allRevealed = revealedCount >= totalBeats;

  // Reveal heading + beat 0 on scroll into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntryRevealed(true);
          setRevealedCount(1);
          trackGraceRevealed();
          trackGraceBeatRevealed(0);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleTapContinue = useCallback(() => {
    if (revealedCount >= totalBeats) return;
    const nextBeat = revealedCount;
    trackGraceBeatRevealed(nextBeat);
    setRevealedCount(nextBeat + 1);
  }, [revealedCount, totalBeats]);

  return (
    <div ref={sectionRef} className="relative w-full max-w-xs text-center sm:max-w-md">
      {/* Warm atmospheric glow */}
      <div
        className="pointer-events-none absolute -inset-32 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        animate={entryRevealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl font-bold tracking-tight text-[#D4A843] sm:text-5xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {messages.heading}
      </motion.h2>

      {/* Beats */}
      <div className="mt-10 text-left">
        {messages.beats.map((text, i) => {
          const isRevealed = i < revealedCount;
          const isActive = i === revealedCount - 1;
          const isGold = i === 2 || i === 3;

          if (!isRevealed) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: isActive ? 1 : 0.32,
                y: 0,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="border-t border-white/[0.04] py-4 first:border-t-0 first:pt-0"
            >
              <p className="mb-2 font-mono text-[8px] uppercase tracking-[2.5px] text-[#D4A843]/45">
                {["I", "II", "III", "IV", "V", "VI"][i] ?? String(i + 1)}
              </p>
              <p
                className={`text-lg font-semibold leading-snug sm:text-xl ${
                  isGold ? "text-[#D4A843]" : "text-white/95"
                }`}
              >
                {text}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Tap to continue pill */}
      <AnimatePresence>
        {entryRevealed && !allRevealed && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            onClick={handleTapContinue}
            className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#D4A843]/22 px-6 py-3 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70 transition-all hover:border-[#D4A843]/40 hover:bg-[#D4A843]/[0.05] min-h-[48px]"
            style={{ animation: "eternity-gentle-pulse 2.4s ease-in-out infinite" }}
          >
            {messages.tapContinue} <span aria-hidden="true">↓</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scripture + CTA — revealed after all beats */}
      <AnimatePresence>
        {allRevealed && (
          <>
            <motion.blockquote
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 border-l border-[#D4A843]/30 pl-5 text-left"
            >
              <p className="text-[15px] italic leading-[1.85] text-white/55 sm:text-base">
                &ldquo;{messages.scripture}&rdquo;
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/40">
                {messages.scriptureRef}
              </p>
            </motion.blockquote>

            <motion.a
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              href={`/${locale}/test`}
              onClick={() => trackGraceCtaClicked()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4A843]/35 bg-[#D4A843]/[0.04] px-6 py-3.5 text-sm font-semibold tracking-wide text-[#D4A843] shadow-[0_0_24px_rgba(212,168,67,0.08)] transition-all hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.08] min-h-[48px]"
            >
              {messages.testCta} <span aria-hidden="true">→</span>
            </motion.a>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
