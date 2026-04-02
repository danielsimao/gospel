"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DeathCounter } from "./death-counter";
import { WorldMap } from "./world-map";
import { LawQuiz, type LawQuizMessages } from "./law-quiz";
import { GraceReveal, type GraceMessages } from "./grace-reveal";
import { ShareButtons } from "@/components/share-buttons";
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

  // Track scroll depth via IntersectionObserver
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
      { threshold: 0.5 },
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
    <div className="snap-y snap-mandatory h-dvh overflow-y-auto bg-[#060404]" id="eternity-container">
      {/* Sticky counter — thin, tense, always present */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-center gap-3 border-b border-red-900/20 bg-[#060404]/90 px-6 py-2 backdrop-blur-xl">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-[eternity-pulse-dot_2s_ease-in-out_infinite]" />
        <DeathCounter className="font-mono text-sm font-semibold tabular-nums text-red-400/90 tracking-wide" />
        <span className="text-[10px] tracking-widest uppercase text-white/20">{messages.counter.label}</span>
      </div>

      {/* Progress dots — minimal vertical rail */}
      <div className="fixed right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3">
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
        className="relative flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-6 pt-20 pb-16"
      >
        {/* Subtle radial vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

        <div className="relative z-[1] flex flex-col items-center">
          <p className="text-[10px] font-mono uppercase tracking-[5px] text-white/20">
            {messages.hero.label}
          </p>

          <DeathCounter
            fromMidnight
            className="mt-5 font-mono text-7xl font-black tabular-nums tracking-tighter text-red-500 sm:text-8xl md:text-9xl"
            style={{ textShadow: "0 0 80px rgba(239,68,68,0.25), 0 4px 60px rgba(0,0,0,0.8)" }}
          />

          <p className="mt-3 text-base tracking-wide text-white/40 sm:text-lg">
            {messages.hero.suffix}
          </p>

          {/* Rate cards — horizontal strip */}
          <div className="mt-14 flex flex-wrap justify-center gap-px rounded-lg border border-white/[0.04] overflow-hidden">
            {RATE_CARDS.map((card, idx) => (
              <div
                key={card.key}
                className={`min-w-[110px] bg-white/[0.015] px-6 py-5 text-center ${
                  idx < RATE_CARDS.length - 1 ? "border-r border-white/[0.04]" : ""
                }`}
              >
                <p className="font-mono text-2xl font-bold tabular-nums text-red-400/80">
                  {card.value}
                </p>
                <p className="mt-1 text-[9px] font-mono uppercase tracking-[2px] text-white/25">
                  {messages.hero[card.key]}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 w-full max-w-2xl opacity-60">
            <WorldMap />
          </div>
        </div>

        {/* Scroll affordance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 2.5 }}
          className="absolute bottom-10 flex flex-col items-center gap-2"
        >
          <div className="relative h-8 w-5 rounded-full border border-white/15">
            <span className="absolute left-1/2 top-1.5 h-1.5 w-[2px] -translate-x-1/2 rounded-full bg-white/25 animate-[eternity-scroll-wheel_2s_ease-in-out_infinite]" />
          </div>
          <span className="text-[9px] font-mono uppercase tracking-[3px] text-white/15">
            {messages.hero.scroll}
          </span>
        </motion.div>
      </section>

      {/* ═══════════════ SECTION 2: LAW QUIZ ═══════════════ */}
      <section
        id="eternity-law"
        className="flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-6 py-24"
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
        className="relative flex min-h-dvh snap-start snap-always flex-col items-center justify-center px-6 py-24"
      >
        <GraceReveal messages={messages.grace} />
      </section>

      {/* ═══════════════ SECTION 4: CTA ═══════════════ */}
      <section
        id="eternity-cta"
        className="flex min-h-[80dvh] snap-start snap-always flex-col items-center justify-center px-6 py-24"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{messages.cta.heading}</h2>
        <p className="mt-3 text-sm tracking-wide text-white/40">{messages.cta.subtitle}</p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <a
            href={`/${locale}/test`}
            onClick={() => trackEternityCtaClicked("test")}
            className="group flex min-h-[52px] items-center justify-center rounded-lg border border-[#D4A843]/25 px-6 py-4 text-sm font-medium tracking-wide text-[#D4A843] transition-all duration-300 hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.06] hover:shadow-[0_0_30px_rgba(212,168,67,0.08)]"
          >
            {messages.cta.testCta}
            <span className="ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
          </a>
          <a
            href={`/${locale}/chat`}
            onClick={() => trackEternityCtaClicked("chat")}
            className="group flex min-h-[52px] items-center justify-center rounded-lg border border-white/[0.08] px-6 py-4 text-sm font-medium tracking-wide text-white/50 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.03]"
          >
            {messages.cta.chatCta}
            <span className="ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
          </a>
        </div>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
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
