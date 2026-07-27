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
import { StageSpine } from "@/components/home/stage-spine";
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

const DeathGlobe = dynamic(
  () => import("@/components/eternity/death-globe").then((mod) => mod.DeathGlobe),
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
  // The DeathGlobe mounts after first paint (ssr: false), so re-measure on any
  // layout change via ResizeObserver, not just on mount.
  useEffect(() => {
    const root = document.documentElement;
    function measure() {
      setIsScrollable(root.scrollHeight - window.innerHeight > 24);
    }
    measure();
    window.addEventListener("resize", measure);

    // ResizeObserver catches the late DeathGlobe mount; degrade to resize-only
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
    <main className="min-h-dvh overflow-x-hidden bg-[#060404]">
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

      <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-start px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
        {/* Radial vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

        <div className="relative z-[1] flex w-full flex-col items-center">
          {/* Label */}
          <p className="font-mono text-[9px] uppercase tracking-[4px] text-white/60 sm:text-[10px] sm:tracking-[5px]">
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
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[1.5px] text-white/60 sm:text-[9px] sm:tracking-[2px]">
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

          {/* Death globe — one red ping per ~0.5s, drag to spin. Reserve the
              square with padding-top (percentage padding is resolved from the
              width and survives flex sizing), not aspect-square: an empty
              aspect-square flex child collapses to 0 height until the canvas
              mounts (~200ms in), which grew the centered hero and shifted it
              (CLS 0.34). The padding box holds the full square from first paint. */}
          <div className="mx-auto mt-6 w-full max-w-[380px] sm:mt-10 sm:max-w-[440px]">
            <div className="relative w-full pt-[100%]">
              <div className="absolute inset-0">
                <DeathGlobe />
              </div>
            </div>
          </div>

          {/* === Bottom CTA section — adapts to journey stage === */}
          {journey.stage === "committed" && (
            <div className="relative flex w-full flex-col items-center">
              {/* Warm grace glow — this state continues the grace screen's atmosphere */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 top-0 bottom-1/3"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 25%, rgba(212,168,67,0.08) 0%, transparent 65%)",
                  filter: "blur(32px)",
                }}
              />
              <StageSpine
                tone="gold"
                eyebrow={home.journeyStages.committed.eyebrow}
                heading={home.journeyStages.committed.title}
                whatHappened={home.journeyStages.committed.whatHappened}
              >
                {/* Conditional promise — scripture treatment, honored not
                    celebrated. It kept its exact wording; it just stops being
                    asked to work as this stage's headline, which is what left
                    the page with no h1 at all. */}
                <blockquote className="relative mt-5 max-w-md border-l border-[#D4A843]/30 pl-4 text-left">
                  <p className="text-[14px] italic leading-[1.75] text-white/70 sm:text-[15px]">
                    {home.journeyStages.committed.heading}
                  </p>
                </blockquote>
              </StageSpine>

              {/* The one primary action, matching every other stage's shape.
                  Was a link-card, which is why this stage rendered zero buttons. */}
              <Link
                href={`/${locale}/next-steps`}
                className="relative mt-8 w-full max-w-sm"
              >
                <Button variant="gold" size="lg" mist className="w-full">
                  {home.journeyStages.committed.nextStepsCard.label}
                  <ButtonArrow />
                </Button>
              </Link>

              {/* Held, not removed: the discipleship tracker is the one change
                  that could measurably reduce reading-plan engagement, so it
                  stays until the shared spine has had a chance to fix the
                  disorientation on its own. Demoted below the primary action so
                  the top of every stage now reads identically. */}
              <div className="relative mt-4 flex items-center gap-2">
                <span aria-hidden="true" className="h-px w-6 bg-[#D4A843]/40" />
                <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#D4A843]/80">
                  {home.journeyStages.committed.subheading}
                </span>
                <span aria-hidden="true" className="h-px w-6 bg-[#D4A843]/40" />
              </div>
              <JourneyTracker
                snapshot={journey}
                locale={locale}
                messages={home.journey}
                shareMessages={share}
                topicSlugs={topicSlugs}
              />
              {/* Retake — quiet sentence-case escape hatch at the very end.
                  It resets the whole journey; it must never wear the mono-
                  uppercase header costume or sit between card groups (it
                  read as a section title for whatever followed). */}
              <Link
                href={`/${locale}/test`}
                onClick={() => {
                  trackHomeRetakeClicked();
                  resetJourney();
                  clearSession();
                }}
                className="mt-5 text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
              >
                {home.journey.retakeLabel}
              </Link>
            </div>
          )}

          {journey.stage === "undecided" && (
            <>
              {/* whatHappened carries the temporal mirror that sinceLine used
                  to hold — how long "later" has already lasted, stated once,
                  no pressure mechanics — folded into the result sentence. */}
              <StageSpine
                tone="red"
                eyebrow={home.journeyStages.undecided.eyebrow}
                heading={home.journeyStages.undecided.heading}
                whatHappened={home.journeyStages.undecided.whatHappened.replace(
                  "{when}",
                  sincePhrase(journey.daysSinceTest ?? 0, home.journeyStages.since),
                )}
              />
              <Link href={`/${locale}/test`} onClick={() => trackHomeCtaClicked()} className="mt-8">
                <Button variant="gold" size="lg" mist>
                  {home.journeyStages.undecided.cta}
                  <ButtonArrow />
                </Button>
              </Link>
            </>
          )}

          {journey.stage === "thinking" && (
            <div className="flex w-full max-w-md flex-col items-center">
              <StageSpine
                tone="dim"
                eyebrow={home.journeyStages.thinking.eyebrow}
                heading={home.journeyStages.thinking.heading}
                whatHappened={home.journeyStages.thinking.whatHappened.replace(
                  "{when}",
                  sincePhrase(journey.daysSinceResponse ?? 0, home.journeyStages.since),
                )}
              >
                {/* The pastoral centre of this stage — kept as the second beat,
                    in the house blockquote. The John 3 and foundations cards
                    that used to sit here were competing with the decision, which
                    is the whole point of the stage; they live on /learn. */}
                <blockquote className="mt-5 max-w-md border-l border-white/[0.14] pl-4 text-left">
                  <p className="text-[13px] italic leading-[1.7] text-white/60 sm:text-sm">
                    {home.journeyStages.thinking.reflection}
                  </p>
                </blockquote>
              </StageSpine>
              {/* The decision — same gold commitment button as the invitation screen */}
              <Button
                variant="gold"
                size="lg"
                mist
                onClick={() => saveInvitationResponse("committed")}
                className="mt-8 w-full max-w-sm"
              >
                {home.journeyStages.thinking.commitLabel}
              </Button>
              {/* Quiet sentence-case retake — mono-uppercase here read as a
                  section header for the block below it. */}
              <Link
                href={`/${locale}/test`}
                onClick={() => {
                  trackHomeRetakeClicked();
                  resetJourney();
                  clearSession();
                }}
                className="mt-2 text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
              >
                {home.journeyStages.thinking.retakeLabel}
              </Link>
            </div>
          )}

          {journey.stage === "dismissed" && (
            <>
              {/* The only stage with a ghost primary. Present, honest,
                  unpressured — someone who said no should not be sold to. */}
              <StageSpine
                tone="dim"
                eyebrow={home.journeyStages.dismissed.eyebrow}
                heading={home.journeyStages.dismissed.title}
                whatHappened={home.journeyStages.dismissed.whatHappened}
              />
              <Link
                href={`/${locale}/test`}
                onClick={() => {
                  trackHomeRetakeClicked();
                  resetJourney();
                  clearSession();
                }}
                className="mt-8"
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
    </main>
  );
}
