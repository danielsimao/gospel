"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DeathCounter } from "./death-counter";
import { WorldMap } from "./world-map";
import { LawQuiz, type LawQuizMessages } from "./law-quiz";
import { GraceReveal, type GraceMessages } from "./grace-reveal";
import { ShareButtons } from "@/components/share-buttons";
import { StickyDeathCounter } from "@/components/shared/sticky-death-counter";
import type { Locale } from "@/lib/i18n";
import {
  trackEternityViewed,
  trackEternityCtaClicked,
  trackScrollDepth,
} from "@/lib/eternity-analytics";

export interface EternityMessages {
  hero: {
    label: string;
    suffix: string;
    perSecond: string;
    perMinute: string;
    perHour: string;
    perDay: string;
    scroll: string;
  };
  quiz: LawQuizMessages;
  grace: GraceMessages;
  cta: {
    heading: string;
    subtitle: string;
    testCta: string;
    chatCta: string;
    resources: Array<{ name: string; url: string }>;
  };
  share: {
    prompt: string;
    whatsappMessage: string;
    telegramMessage: string;
    linkCopied: string;
  };
  counter: {
    label: string;
  };
}

interface EternityShellProps {
  messages: EternityMessages;
  locale: Locale;
}

const RATE_CARDS = [
  { value: "1.8", key: "perSecond" },
  { value: "108", key: "perMinute" },
  { value: "6,500", key: "perHour" },
  { value: "155,000", key: "perDay" },
] as const;

export function EternityShell({ messages, locale }: EternityShellProps) {
  const [activeSection, setActiveSection] = useState(0);
  const graceRef = useRef<HTMLElement>(null);
  const maxDepthRef = useRef(0);

  useEffect(() => {
    trackEternityViewed(locale);
  }, [locale]);

  useEffect(() => {
    const sectionIds = ["eternity-hero", "eternity-law", "eternity-grace", "eternity-cta"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionIds.indexOf(entry.target.id);
            if (idx >= 0) {
              setActiveSection(idx);
              if (idx > maxDepthRef.current) {
                maxDepthRef.current = idx;
                trackScrollDepth(idx);
              }
            }
          }
        });
      },
      { threshold: 0.3 },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleBridgeClick = useCallback(() => {
    graceRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#060404]" id="eternity-container">
      <StickyDeathCounter label={messages.counter.label} />

      {/* Progress dots — hidden on mobile, visible on larger screens */}
      <div className="fixed right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 sm:flex">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => {
              const ids = ["eternity-hero", "eternity-law", "eternity-grace", "eternity-cta"];
              document.getElementById(ids[i])?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
              activeSection === i
                ? i === 2
                  ? "bg-[#D4A843] shadow-[0_0_6px_rgba(212,168,67,0.5)] scale-150"
                  : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)] scale-150"
                : "bg-white/10"
            }`}
            aria-label={`Section ${i + 1}`}
          />
        ))}
      </div>

      {/* ═══════════════ SECTION 1: HERO ═══════════════ */}
      <section
        id="eternity-hero"
        className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pt-16 pb-20 sm:px-6 sm:pt-20"
      >
        {/* Subtle radial vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

        <div className="relative z-[1] flex w-full flex-col items-center">
          <p className="text-[9px] font-mono uppercase tracking-[4px] text-white/20 sm:text-[10px] sm:tracking-[5px]">
            {messages.hero.label}
          </p>

          <DeathCounter
            fromMidnight
            className="mt-4 font-mono text-5xl font-black tabular-nums tracking-tighter text-red-500 sm:mt-5 sm:text-7xl md:text-8xl lg:text-9xl"
            style={{ textShadow: "0 0 80px rgba(239,68,68,0.25), 0 4px 60px rgba(0,0,0,0.8)" }}
          />

          <p className="mt-2 text-sm tracking-wide text-white/40 sm:mt-3 sm:text-base">
            {messages.hero.suffix}
          </p>

          {/* Rate cards — 2×2 grid on mobile, single row on desktop */}
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.04] sm:mt-14 sm:flex sm:flex-wrap sm:justify-center">
            {RATE_CARDS.map((card, idx) => (
              <div
                key={card.key}
                className={`bg-white/[0.015] px-4 py-4 text-center sm:min-w-[110px] sm:px-6 sm:py-5 ${
                  idx < RATE_CARDS.length - 1 ? "sm:border-r sm:border-white/[0.04]" : ""
                } ${idx < 2 ? "border-b border-white/[0.04] sm:border-b-0" : ""} ${
                  idx % 2 === 0 ? "border-r border-white/[0.04] sm:border-r-0" : ""
                } ${idx === 1 ? "sm:border-r sm:border-white/[0.04]" : ""} ${
                  idx === 2 ? "sm:border-r sm:border-white/[0.04]" : ""
                }`}
              >
                <p className="font-mono text-xl font-bold tabular-nums text-red-400/80 sm:text-2xl">
                  {card.value}
                </p>
                <p className="mt-1 text-[8px] font-mono uppercase tracking-[1.5px] text-white/25 sm:text-[9px] sm:tracking-[2px]">
                  {messages.hero[card.key]}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 w-full sm:mt-14 sm:max-w-2xl">
            <WorldMap />
          </div>
        </div>

        {/* Scroll affordance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 2.5 }}
          className="absolute bottom-6 flex flex-col items-center gap-1.5 sm:bottom-10 sm:gap-2"
        >
          <div className="relative h-7 w-4 rounded-full border border-white/15 sm:h-8 sm:w-5">
            <span className="absolute left-1/2 top-1 h-1.5 w-[2px] -translate-x-1/2 rounded-full bg-white/25 animate-[eternity-scroll-wheel_2s_ease-in-out_infinite] sm:top-1.5" />
          </div>
          <span className="text-[8px] font-mono uppercase tracking-[3px] text-white/15 sm:text-[9px]">
            {messages.hero.scroll}
          </span>
        </motion.div>
      </section>

      {/* ═══════════════ SECTION 2: LAW QUIZ ═══════════════ */}
      <section
        id="eternity-law"
        className="flex min-h-[100svh] flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24"
        style={{
          background: "linear-gradient(180deg, #060404 0%, #0a0606 50%, #060404 100%)",
        }}
      >
        <LawQuiz messages={messages.quiz} onBridgeClick={handleBridgeClick} />
      </section>

      {/* ═══════════════ SECTION 3: GRACE ═══════════════ */}
      <section
        ref={graceRef}
        id="eternity-grace"
        className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24"
      >
        <GraceReveal messages={messages.grace} />
      </section>

      {/* ═══════════════ SECTION 4: CTA ═══════════════ */}
      <section
        id="eternity-cta"
        className="flex min-h-[80svh] flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24"
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{messages.cta.heading}</h2>
        <p className="mt-2 text-xs tracking-wide text-white/40 sm:mt-3 sm:text-sm">{messages.cta.subtitle}</p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:mt-10">
          <a
            href={`/${locale}/test`}
            onClick={() => trackEternityCtaClicked("test")}
            className="group flex min-h-[48px] items-center justify-center rounded-lg border border-[#D4A843]/25 px-5 py-3.5 text-sm font-medium tracking-wide text-[#D4A843] transition-all duration-300 hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.06] sm:min-h-[52px] sm:px-6 sm:py-4"
          >
            {messages.cta.testCta}
            <span className="ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
          </a>
        </div>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:mt-8">
          {messages.cta.resources.map((resource) => (
            <a
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEternityCtaClicked("resource", resource.name)}
              className="rounded border border-white/[0.04] px-4 py-2.5 text-xs tracking-wide text-white/30 transition-colors hover:border-white/[0.08] hover:text-white/50"
            >
              {resource.name} &rarr;
            </a>
          ))}
        </div>

        <ShareButtons messages={messages.share} locale={locale} />
      </section>
    </div>
  );
}
