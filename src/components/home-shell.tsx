"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { DeathCounter } from "@/components/eternity/death-counter";
import { RotatingFacts } from "@/components/eternity/rotating-facts";
import { JourneyTracker } from "@/components/journey-tracker";
import { Button, ButtonArrow } from "@/components/ui/button";
import { subscribeToStorage } from "@/lib/client-storage";
import {
  trackHomeViewed,
  trackHomeCtaClicked,
  trackHomeSecondaryClicked,
} from "@/lib/eternity-analytics";
import type { HomeMessages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

const WorldMap = dynamic(
  () => import("@/components/eternity/world-map").then((mod) => mod.WorldMap),
  {
    ssr: false,
    loading: () => null,
  },
);

interface HeroMessages {
  label: string;
  suffix: string;
  perSecond: string;
  perMinute: string;
  perHour: string;
  perDay: string;
}

interface HomeShellProps {
  hero: HeroMessages;
  home: HomeMessages;
  share: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
  topicSlugs: string[];
}

const RATE_CARDS = [
  { value: "1.8", key: "perSecond" },
  { value: "108", key: "perMinute" },
  { value: "6,500", key: "perHour" },
  { value: "155,000", key: "perDay" },
] as const;

export function HomeShell({ hero, home, share, locale, topicSlugs }: HomeShellProps) {
  const [testCompleted, setTestCompleted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("test_completed") === "1";
    } catch {
      return false;
    }
  });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    trackHomeViewed(locale);

    function readTestCompleted() {
      try {
        setTestCompleted(localStorage.getItem("test_completed") === "1");
      } catch {}
    }

    window.addEventListener("pageshow", readTestCompleted);
    const unsubscribe = subscribeToStorage(readTestCompleted);
    return () => {
      window.removeEventListener("pageshow", readTestCompleted);
      unsubscribe();
    };
  }, [locale]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showScrollHint = !testCompleted && !scrolled;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#060404]">
      {/* Scroll hint — visible at top of page for new visitors */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center"
        initial={false}
        animate={{ opacity: showScrollHint ? 1 : 0 }}
        transition={{ duration: 0.5, delay: showScrollHint ? 1.2 : 0 }}
      >
        <motion.div
          className="flex flex-col items-center gap-1.5 text-red-400/70"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="h-px w-5 bg-red-500/50" />
          <span className="font-mono text-[11px] leading-none">↓</span>
        </motion.div>
      </motion.div>

      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        {/* Radial vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

        <div className="relative z-[1] flex w-full flex-col items-center">
          {/* Label */}
          <p className="font-mono text-[9px] uppercase tracking-[4px] text-white/50 sm:text-[10px] sm:tracking-[5px]">
            {hero.label}
          </p>

          {/* Death counter */}
          <DeathCounter
            fromMidnight
            className="mt-4 font-mono text-5xl font-black tabular-nums tracking-tighter text-red-500 sm:mt-5 sm:text-7xl md:text-8xl lg:text-9xl"
            style={{
              textShadow:
                "0 0 80px rgba(239,68,68,0.25), 0 4px 60px rgba(0,0,0,0.8)",
            }}
          />

          {/* Suffix */}
          <p className="mt-2 text-sm tracking-wide text-white/60 sm:mt-3 sm:text-base">
            {hero.suffix}
          </p>

          {/* Rate cards */}
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.04] sm:mt-14 sm:flex sm:flex-wrap sm:justify-center">
            {RATE_CARDS.map((card, idx) => (
              <div
                key={card.key}
                className={`bg-white/[0.015] px-4 py-4 text-center sm:min-w-[110px] sm:px-6 sm:py-5 ${
                  idx < RATE_CARDS.length - 1
                    ? "sm:border-r sm:border-white/[0.04]"
                    : ""
                } ${idx < 2 ? "border-b border-white/[0.04] sm:border-b-0" : ""} ${
                  idx % 2 === 0
                    ? "border-r border-white/[0.04] sm:border-r-0"
                    : ""
                }`}
              >
                <p className="font-mono text-xl font-bold tabular-nums text-red-400/80 sm:text-2xl">
                  {card.value}
                </p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[1.5px] text-white/50 sm:text-[9px] sm:tracking-[2px]">
                  {hero[card.key]}
                </p>
              </div>
            ))}
          </div>

          {/* Rotating facts — news ticker */}
          {home.facts.length > 0 && (
            <div className="mt-8 w-full max-w-md sm:mt-10">
              <RotatingFacts facts={home.facts} />
            </div>
          )}

          {/* World map */}
          <div className="mt-6 w-full sm:mt-10 sm:max-w-2xl" style={{ aspectRatio: "600 / 340" }}>
            <WorldMap />
          </div>

          {/* === Bottom CTA section — adapts based on test completion === */}
          {testCompleted ? (
            <JourneyTracker
              locale={locale}
              messages={home.journey}
              shareMessages={share}
              topicSlugs={topicSlugs}
            />
          ) : (
            <>
              {/* New visitor */}
              <h1 className="mt-10 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-14 sm:text-3xl md:text-4xl">
                {home.provocativeQuestion}
              </h1>

              {/* Primary CTA */}
              <Link href={`/${locale}/test`} onClick={() => trackHomeCtaClicked()} className="mt-8">
                <Button variant="gold" size="lg" mist>
                  {home.ctaButton}
                  <ButtonArrow />
                </Button>
              </Link>

              {/* Secondary link */}
              <Link href={`/${locale}/learn`} onClick={() => trackHomeSecondaryClicked()} className="mt-4">
                <Button variant="text">
                  {home.secondaryLink}
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
