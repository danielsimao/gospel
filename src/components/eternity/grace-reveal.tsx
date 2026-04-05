"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { trackGraceRevealed } from "@/lib/eternity-analytics";

export interface GraceMessages {
  heading: string;
  body1: string;
  body2: string;
  scripture: string;
  scriptureRef: string;
}

interface GraceRevealProps {
  messages: GraceMessages;
}

export function GraceReveal({ messages }: GraceRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          trackGraceRevealed();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="relative w-full max-w-xs text-center sm:max-w-md md:max-w-lg">
      {/* Warm atmospheric glow */}
      <div
        className="pointer-events-none absolute -inset-32 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl font-bold tracking-tight text-[#D4A843] sm:text-5xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {messages.heading}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="mt-8 text-[15px] leading-[1.85] text-white/60 sm:text-base"
      >
        {messages.body1}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="mt-6 text-[15px] leading-[1.85] text-white/60 sm:text-base"
      >
        {messages.body2}
      </motion.p>

      <motion.blockquote
        initial={{ opacity: 0, y: 16 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 2 }}
        className="mt-10 border-l border-[#D4A843]/30 pl-5 text-left"
      >
        <p className="text-[15px] italic leading-[1.85] text-white/55 sm:text-base">
          &ldquo;{messages.scripture}&rdquo;
        </p>
        <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-[#D4A843]/40">
          {messages.scriptureRef}
        </p>
      </motion.blockquote>
    </div>
  );
}
