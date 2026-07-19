"use client";

import { useEffect, useRef, useState, useCallback, createRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackGraceViewed } from "@/lib/analytics";
import {
  trackGraceRevealed,
  trackGraceBeatRevealed,
} from "@/lib/eternity-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";

interface GraceScreenProps {
  messages: {
    scripture: string;
    scriptureRef: string;
    continueLabel: string;
    label: string;
    beatsHeading: string;
    beats: Array<{ headline: string; subtitle: string }>;
    tapContinue: string;
    rereadVerdict: string;
  };
  returning: boolean;
  onBack: () => void;
}

export function GraceScreen({ messages, returning, onBack }: GraceScreenProps) {
  const dispatch = useGameDispatch();
  const startTime = useRef(0);
  const maxScrollDepth = useRef(0);

  // Beat 1 is reserved in the layout from mount to avoid a content shift
  // when it fades in. Subsequent beats are revealed by user tap, which
  // intentionally shifts the page.
  const [revealedCount, setRevealedCount] = useState(returning ? messages.beats.length : 1);
  // The spotlight beat. Follows the newest reveal, but tapping any earlier
  // beat moves it back — re-reading the argument is supported, not punished.
  const [activeIndex, setActiveIndex] = useState(0);
  const allBeatsRevealed = revealedCount >= messages.beats.length;
  const [beatRefs] = useState(() => messages.beats.map(() => createRef<HTMLDivElement>()));

  // Track scroll depth + time
  useEffect(() => {
    startTime.current = Date.now();

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

  // Track grace phase entry. Beat 1 is already present in the layout
  // (see useState(1) above) — its visual fade-in is delayed via motion
  // transition so the title animates first without causing a layout shift.
  useEffect(() => {
    if (returning) return; // re-read, already counted
    trackGraceRevealed();
    trackGraceBeatRevealed(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
  }, []);

  const handleTapContinue = useCallback(() => {
    if (revealedCount >= messages.beats.length) return;
    const nextBeat = revealedCount;
    trackGraceBeatRevealed(nextBeat);
    setRevealedCount(nextBeat + 1);
    setActiveIndex(nextBeat);
    // Scroll to the newly revealed beat after a short delay for the animation
    setTimeout(() => {
      beatRefs[nextBeat]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [beatRefs, revealedCount, messages.beats.length]);

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
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <span className="h-px w-6 bg-[#D4A843]/40" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#D4A843]/75">
              {messages.label}
            </span>
            <span className="h-px w-6 bg-[#D4A843]/40" />
          </m.div>

          {/* Beats heading */}
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: EASE_OUT_STRONG }}
            className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl md:text-5xl"
            style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
          >
            {messages.beatsHeading}
          </m.h2>

          {/* Beats */}
          {/* aria-live: beats are revealed by taps — announce each arrival
              to screen readers instead of silently growing the page. */}
          <div aria-live="polite" className="mt-10 text-left">
            {messages.beats.map((beat, i) => {
              const isRevealed = i < revealedCount;
              // Once every beat is revealed the spotlight lifts entirely —
              // the whole argument reads as one document before Continue.
              const isActive = allBeatsRevealed || i === activeIndex;
              const isGold = i >= 2;

              if (!isRevealed) return null;

              return (
                <m.div
                  key={i}
                  ref={beatRefs[i]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    // Rest state stays readable (this is the gospel argument,
                    // not decoration) while the active beat still leads.
                    opacity: isActive ? 1 : 0.6,
                    y: 0,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: i === 0 && !returning ? 1.5 : 0 }}
                  onClick={allBeatsRevealed ? undefined : () => setActiveIndex(i)}
                  role={allBeatsRevealed ? undefined : "button"}
                  tabIndex={allBeatsRevealed ? undefined : 0}
                  onKeyDown={
                    allBeatsRevealed
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveIndex(i);
                          }
                        }
                  }
                  className={`border-t border-white/[0.04] py-4 first:border-t-0 first:pt-0 ${
                    allBeatsRevealed ? "" : "cursor-pointer"
                  }`}
                >
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
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
                </m.div>
              );
            })}
          </div>

          {/* Tap to continue pill — fades out when the last beat is revealed */}
          <AnimatePresence>
            {revealedCount > 0 && !allBeatsRevealed && (
              <m.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0 } }}
                transition={{ duration: 0.4, delay: 2.2 }}
                className="mt-6 flex justify-center"
              >
                <Button variant="gold" size="sm" mist onClick={handleTapContinue}>
                  <span className="font-mono text-[10px] uppercase tracking-[2.5px]">
                    {messages.tapContinue}
                  </span>
                  <ButtonArrow direction="down" />
                </Button>
              </m.div>
            )}
          </AnimatePresence>

          {/* Scripture + Continue — after all beats */}
          <AnimatePresence>
            {allBeatsRevealed && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <m.blockquote
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
                </m.blockquote>

                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="mt-10"
                >
                  <Button variant="gold" mist onClick={handleContinue}>
                    {messages.continueLabel}
                    <ButtonArrow />
                  </Button>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Quiet walk-back — re-reading the verdict, not reopening it */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onBack}
              className="text-[11px] text-white/30 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/50"
            >
              {messages.rereadVerdict}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
