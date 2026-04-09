"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeathCounter } from "@/components/eternity/death-counter";
import { RotatingFacts } from "@/components/eternity/rotating-facts";
import { WorldMap } from "@/components/eternity/world-map";
import { ShareButtons } from "@/components/share-buttons";
import { Button, ButtonArrow } from "@/components/ui/button";
import {
  trackHomeViewed,
  trackHomeCtaClicked,
  trackHomeSecondaryClicked,
} from "@/lib/eternity-analytics";
import type { HomeMessages } from "@/lib/types";
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
  home: HomeMessages;
  share: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

const RATE_CARDS = [
  { value: "1.8", key: "perSecond" },
  { value: "108", key: "perMinute" },
  { value: "6,500", key: "perHour" },
  { value: "155,000", key: "perDay" },
] as const;

export function HomeShell({ hero, home, share, locale }: HomeShellProps) {
  const [testCompleted, setTestCompleted] = useState(false);

  useEffect(() => {
    trackHomeViewed(locale);
    try {
      setTestCompleted(localStorage.getItem("test_completed") === "1");
    } catch {}
  }, [locale]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#060404]">
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
          <div className="mt-6 w-full sm:mt-10 sm:max-w-2xl">
            <WorldMap />
          </div>

          {/* === Bottom CTA section — adapts based on test completion === */}
          {testCompleted ? (
            <>
              {/* Returning visitor */}
              <h2 className="mt-10 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-14 sm:text-3xl md:text-4xl">
                {home.returningQuestion}
              </h2>

              {/* Primary: Reading plan */}
              <Link href={`/${locale}/reading-plan`} onClick={() => trackHomeCtaClicked()} className="mt-8">
                <Button variant="gold" size="lg" mist>
                  {home.readingPlanCta}
                  <ButtonArrow />
                </Button>
              </Link>

              {/* Secondary actions — grouped as a row */}
              <div className="mt-6 flex items-center gap-3 text-xs">
                <Link href={`/${locale}/learn`} onClick={() => trackHomeSecondaryClicked()} className="text-white/70 transition-colors hover:text-white/60">
                  {home.learnCta}
                </Link>
                <span className="text-white/50">·</span>
                <Link href={`/${locale}/test`} className="text-white/70 transition-colors hover:text-white/60">
                  {home.retakeCta}
                </Link>
              </div>

              {/* Share */}
              <div className="mt-10">
                <ShareButtons messages={share} locale={locale} sharePath="/test" />
              </div>
            </>
          ) : (
            <>
              {/* New visitor */}
              <h2 className="mt-10 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-14 sm:text-3xl md:text-4xl">
                {home.provocativeQuestion}
              </h2>

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
