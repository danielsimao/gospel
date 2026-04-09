"use client";

import { useEffect } from "react";
import { DeathCounter } from "@/components/eternity/death-counter";
import { WorldMap } from "@/components/eternity/world-map";
import { StickyDeathCounter } from "@/components/shared/sticky-death-counter";
import { Button, ButtonArrow } from "@/components/ui/button";
import {
  trackHomeViewed,
  trackHomeCtaClicked,
  trackHomeSecondaryClicked,
} from "@/lib/eternity-analytics";
import type { Locale } from "@/lib/i18n";

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
  counter: { label: string; liveBadge: string };
  home: { provocativeQuestion: string; ctaButton: string; secondaryLink: string };
  locale: Locale;
}

const RATE_CARDS = [
  { value: "1.8", key: "perSecond" },
  { value: "108", key: "perMinute" },
  { value: "6,500", key: "perHour" },
  { value: "155,000", key: "perDay" },
] as const;

export function HomeShell({ hero, counter, home, locale }: HomeShellProps) {
  useEffect(() => {
    trackHomeViewed(locale);
  }, [locale]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#060404]">
      <StickyDeathCounter label={counter.label} liveBadge={counter.liveBadge} />

      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        {/* Radial vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

        <div className="relative z-[1] flex w-full flex-col items-center">
          {/* Label */}
          <p className="font-mono text-[9px] uppercase tracking-[4px] text-white/20 sm:text-[10px] sm:tracking-[5px]">
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
          <p className="mt-2 text-sm tracking-wide text-white/40 sm:mt-3 sm:text-base">
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
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[1.5px] text-white/25 sm:text-[9px] sm:tracking-[2px]">
                  {hero[card.key]}
                </p>
              </div>
            ))}
          </div>

          {/* World map */}
          <div className="mt-8 w-full sm:mt-14 sm:max-w-2xl">
            <WorldMap />
          </div>

          {/* Provocative question */}
          <h2 className="mt-10 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-14 sm:text-3xl md:text-4xl">
            {home.provocativeQuestion}
          </h2>

          {/* Primary CTA */}
          <a href={`/${locale}/test`} onClick={() => trackHomeCtaClicked()} className="mt-8">
            <Button variant="gold" size="lg" mist>
              {home.ctaButton}
              <ButtonArrow />
            </Button>
          </a>

          {/* Secondary link */}
          <a href={`/${locale}/learn`} onClick={() => trackHomeSecondaryClicked()} className="mt-4">
            <Button variant="text">
              {home.secondaryLink}
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
