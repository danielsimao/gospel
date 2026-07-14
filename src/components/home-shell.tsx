"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { DeathCounter } from "@/components/eternity/death-counter";
import { RotatingFacts } from "@/components/eternity/rotating-facts";
import { JourneyTracker } from "@/components/journey-tracker";
import { LatestPostCard } from "@/components/home/latest-post-card";
import { Button, ButtonArrow } from "@/components/ui/button";
import { hasAnsweredConsent, subscribeToConsentAnswered } from "@/lib/consent";
import { useJourney } from "@/lib/use-journey";
import { saveInvitationResponse, resetJourney } from "@/lib/journey-storage";
import { clearSession } from "@/lib/test-session-storage";
import {
  trackHomeViewed,
  trackHomeCtaClicked,
  trackHomeSecondaryClicked,
  trackHomeRetakeClicked,
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
  latestPost?: {
    slug: string;
    title: string;
    hook: string;
    datePublished: string;
    localeAvailable: boolean;
  } | null;
}

/** "earlier today" / "yesterday" / "{n} days ago" / "{n} weeks ago" — pure. */
function sincePhrase(
  days: number,
  m: { today: string; yesterday: string; daysAgo: string; weeksAgo: string },
): string {
  if (days <= 0) return m.today;
  if (days === 1) return m.yesterday;
  if (days < 14) return m.daysAgo.replace("{n}", String(days));
  return m.weeksAgo.replace("{n}", String(Math.floor(days / 7)));
}

const RATE_CARDS = [
  { value: "1.8", key: "perSecond" },
  { value: "108", key: "perMinute" },
  { value: "6,500", key: "perHour" },
  { value: "155,000", key: "perDay" },
] as const;

export function HomeShell({ hero, home, share, locale, topicSlugs, latestPost }: HomeShellProps) {
  const journey = useJourney(topicSlugs);
  const [scrolled, setScrolled] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const viewTracked = useRef(false);

  // Reveal the scroll hint only once the consent banner is gone. Server render
  // reports "unanswered" for stable hydration; hasAnsweredConsent also counts
  // an explicit accept/decline this session, so private-mode browsers (where
  // the storage write can fail) still dismiss the hint gate.
  const consentAnswered = useSyncExternalStore(
    subscribeToConsentAnswered,
    hasAnsweredConsent,
    () => false,
  );

  useEffect(() => {
    if (viewTracked.current || !journey.ready) return;
    viewTracked.current = true;
    trackHomeViewed(locale, journey.stage);
  }, [journey.ready, journey.stage, locale]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Only hint at scrolling when there is actually content below the fold.
  // The WorldMap mounts after first paint (ssr: false), so re-measure on any
  // layout change via ResizeObserver, not just on mount.
  useEffect(() => {
    const root = document.documentElement;
    function measure() {
      setIsScrollable(root.scrollHeight - window.innerHeight > 24);
    }
    measure();
    window.addEventListener("resize", measure);

    // ResizeObserver catches the late WorldMap mount; degrade to resize-only
    // where it's unavailable (older webviews, jsdom) instead of throwing.
    if (typeof ResizeObserver === "undefined") {
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const showScrollHint =
    journey.stage === "visitor" && !scrolled && consentAnswered && isScrollable;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#060404]">
      {/* Scroll hint — shown to new visitors at the top, once consent is answered and the page overflows the viewport */}
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center"
        initial={false}
        animate={{ opacity: showScrollHint ? 1 : 0 }}
        transition={{ duration: 0.5, delay: showScrollHint ? 1.2 : 0 }}
      >
        <m.div
          className="flex flex-col items-center"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="size-5 text-red-400/70" strokeWidth={2.5} />
          <ChevronDown className="-mt-3 size-5 text-red-400/40" strokeWidth={2.5} />
        </m.div>
      </m.div>

      <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
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
              <RotatingFacts facts={home.facts} interval={9000} />
            </div>
          )}

          {/* World map */}
          <div className="mt-6 w-full sm:mt-10 sm:max-w-2xl" style={{ aspectRatio: "600 / 340" }}>
            <WorldMap />
          </div>

          {/* === Bottom CTA section — adapts to journey stage === */}
          {journey.stage === "committed" && (
            <div className="relative mt-10 flex w-full flex-col items-center sm:mt-14">
              {/* Warm grace glow — this state continues the grace screen's atmosphere */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -top-12 bottom-1/3"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 25%, rgba(212,168,67,0.08) 0%, transparent 65%)",
                  filter: "blur(32px)",
                }}
              />
              {/* Conditional promise — scripture treatment, honored not celebrated */}
              <blockquote className="relative max-w-md border-l border-[#D4A843]/30 pl-4 text-left">
                <p className="text-[15px] italic leading-relaxed text-white/80 sm:text-base">
                  {home.journeyStages.committed.heading}
                </p>
              </blockquote>
              <div className="relative mt-7 flex items-center gap-2">
                <span className="h-px w-6 bg-[#D4A843]/40" />
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#D4A843]/80">
                  {home.journeyStages.committed.subheading}
                </span>
                <span className="h-px w-6 bg-[#D4A843]/40" />
              </div>
              <JourneyTracker
                snapshot={journey}
                locale={locale}
                messages={home.journey}
                shareMessages={share}
                topicSlugs={topicSlugs}
              />
              {/* Persistent bridge to the relational track — pray/community/church
                  guidance must survive beyond the one-shot invitation CTA */}
              <Link
                href={`/${locale}/next-steps`}
                className="group mt-3 block w-full max-w-md rounded-xl border border-[#D4A843]/25 bg-[#D4A843]/[0.03] p-5 transition-all hover:border-[#D4A843]/45"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/90">
                      {home.journeyStages.committed.nextStepsCard.label}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/60">
                      {home.journeyStages.committed.nextStepsCard.description}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 text-[#D4A843]/70 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </Link>
            </div>
          )}

          {journey.stage === "undecided" && (
            <>
              {/* Red docket eyebrow — the verdict is still on the table */}
              <div className="mt-10 flex items-center gap-2 sm:mt-14">
                <span className="h-px w-6 bg-red-500/40" />
                <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/80 sm:text-[10px] sm:tracking-[4px]">
                  {home.journeyStages.undecided.eyebrow}
                </span>
                <span className="h-px w-6 bg-red-500/40" />
              </div>
              <h1 className="mt-3 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-4 sm:text-3xl">
                {home.journeyStages.undecided.heading}
              </h1>
              {/* Temporal mirror — the honest urgency device: how long "later"
                  has already lasted, stated once, no pressure mechanics. */}
              {journey.daysSinceTest !== null && (
                <p className="mt-3 max-w-sm text-center text-[13px] italic leading-relaxed text-white/55">
                  {home.journeyStages.undecided.sinceLine.replace(
                    "{when}",
                    sincePhrase(journey.daysSinceTest, home.journeyStages.since),
                  )}
                </p>
              )}
              <Link href={`/${locale}/test`} onClick={() => trackHomeCtaClicked()} className="mt-8">
                <Button variant="gold" size="lg" mist>
                  {home.journeyStages.undecided.cta}
                  <ButtonArrow />
                </Button>
              </Link>
            </>
          )}

          {journey.stage === "thinking" && (
            <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3 sm:mt-14">
              {/* Dim gold eyebrow — leaning toward grace, not there yet */}
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-[#D4A843]/30" />
                <span className="font-mono text-[9px] uppercase tracking-[3px] text-[#D4A843]/60">
                  {home.journeyStages.thinking.eyebrow}
                </span>
                <span className="h-px w-6 bg-[#D4A843]/30" />
              </div>
              {journey.daysSinceResponse !== null && (
                <p className="text-center text-[13px] italic leading-relaxed text-white/55">
                  {home.journeyStages.thinking.sinceLine.replace(
                    "{when}",
                    sincePhrase(journey.daysSinceResponse, home.journeyStages.since),
                  )}
                </p>
              )}
              <p className="text-center text-sm leading-relaxed text-white/70">
                {home.journeyStages.thinking.reflection}
              </p>
              {/* Primary card — John 3, gold-accented */}
              <a
                href={home.journeyStages.thinking.johnCard.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-2 block w-full rounded-xl border border-[#D4A843]/25 bg-[#D4A843]/[0.03] p-5 transition-all hover:border-[#D4A843]/45"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/90">
                      {home.journeyStages.thinking.johnCard.label}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/60">
                      {home.journeyStages.thinking.johnCard.description}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 text-[#D4A843]/70 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </a>
              {/* Secondary card — foundations, ghost */}
              <Link
                href={`/${locale}/learn`}
                className="group block w-full rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all hover:border-white/[0.14]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/85">
                      {home.journeyStages.thinking.learnCard.label}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/60">
                      {home.journeyStages.thinking.learnCard.description}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 text-white/40 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </Link>
              {/* The decision — same gold commitment button as the invitation screen */}
              <Button
                variant="gold"
                size="sm"
                mist
                onClick={() => saveInvitationResponse("committed")}
                className="mt-4 w-full max-w-sm"
              >
                {home.journeyStages.thinking.commitLabel}
              </Button>
              <Link
                href={`/${locale}/test`}
                onClick={() => {
                  trackHomeRetakeClicked();
                  resetJourney();
                  clearSession();
                }}
                className="mt-1 font-mono text-[10px] uppercase tracking-[2px] text-white/35 transition-colors hover:text-white/55"
              >
                {home.journeyStages.thinking.retakeLabel}
              </Link>
            </div>
          )}

          {journey.stage === "dismissed" && (
            <>
              {/* The door line — quiet framed gesture, no pressure */}
              <div className="mt-10 flex w-full max-w-md items-center justify-center gap-4 sm:mt-14">
                <span aria-hidden="true" className="h-px flex-1 max-w-12 bg-white/[0.12]" />
                <p className="max-w-[16rem] text-center text-[15px] italic leading-relaxed text-white/65">
                  {home.journeyStages.dismissed.line}
                </p>
                <span aria-hidden="true" className="h-px flex-1 max-w-12 bg-white/[0.12]" />
              </div>
              <Link
                href={`/${locale}/test`}
                onClick={() => {
                  trackHomeRetakeClicked();
                  resetJourney();
                  clearSession();
                }}
                className="mt-7"
              >
                <Button variant="ghost" size="sm">
                  {home.journeyStages.dismissed.retakeCta}
                </Button>
              </Link>
              <Link href={`/${locale}/learn`} onClick={() => trackHomeSecondaryClicked()} className="mt-3">
                <Button variant="text">{home.secondaryLink}</Button>
              </Link>
            </>
          )}

          {journey.stage === "visitor" && (
            <>
              {/* New visitor */}
              <p className="mt-10 font-mono text-[10px] uppercase tracking-[3px] text-red-400/80 sm:mt-14 sm:text-[11px] sm:tracking-[4px]">
                {home.mortalityStat}
              </p>
              <h1 className="mt-3 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-4 sm:text-3xl md:text-4xl">
                {home.provocativeQuestion}
              </h1>
              <Link href={`/${locale}/test`} onClick={() => trackHomeCtaClicked()} className="mt-8">
                <Button variant="gold" size="lg" mist>
                  {home.ctaButton}
                  <ButtonArrow />
                </Button>
              </Link>
              <Link href={`/${locale}/learn`} onClick={() => trackHomeSecondaryClicked()} className="mt-4">
                <Button variant="text">{home.secondaryLink}</Button>
              </Link>
            </>
          )}

          {latestPost && (
            <LatestPostCard locale={locale} eyebrow={home.blogCard.eyebrow} post={latestPost} />
          )}
        </div>
      </section>
    </div>
  );
}
