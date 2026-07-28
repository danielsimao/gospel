"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { BookOpen, ChevronDown, Compass } from "lucide-react";
import { DeathCounter } from "@/components/eternity/death-counter";
import { LatestPostCard } from "@/components/home/latest-post-card";
import { AlsoHere, type AlsoHereRow } from "@/components/home/also-here";
import { StageSpine } from "@/components/home/stage-spine";
import { FactCrawl, FactList } from "@/components/home/fact-crawl";
import { SelfRating } from "@/components/home/self-rating";
import { Button, ButtonArrow } from "@/components/ui/button";
import { hasAnsweredConsent, subscribeToConsentAnswered } from "@/lib/consent";
import { useJourney, TOTAL_READING_DAYS } from "@/lib/use-journey";
import { saveInvitationResponse, resetJourney } from "@/lib/journey-storage";
import { clearSession } from "@/lib/test-session-storage";
import { writeSelfRating } from "@/lib/self-rating-storage";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import { trackSelfRating } from "@/lib/analytics";
import {
  trackHomeViewed,
  trackHomeCtaClicked,
  trackHomeSecondaryClicked,
  trackHomeRetakeClicked,
} from "@/lib/eternity-analytics";
import type { HomeMessages, SelfRating as SelfRatingValue } from "@/lib/types";
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

export function HomeShell({ hero, home, locale, topicSlugs, latestPost }: HomeShellProps) {
  const journey = useJourney(topicSlugs);

  /*
   * The band's rows. Progress replaces the description only once the reader has
   * actually started — a count is information about something you began, not a
   * prompt. Both destinations stay linked either way; nothing here gates.
   */
  const alsoHereRows: AlsoHereRow[] = [
    {
      href: `/${locale}/reading-plan`,
      label: home.journey.reading.label,
      description:
        journey.readingDone > 0
          ? home.journey.reading.descActiveProgress
              .replace("{current}", String(journey.readingDone))
              .replace("{total}", String(TOTAL_READING_DAYS))
          : home.alsoHere.readingDescription,
      icon: <BookOpen className="size-4" aria-hidden="true" />,
    },
    {
      href: `/${locale}/learn`,
      label: home.journey.learn.label,
      description:
        journey.learnDone > 0
          ? home.journey.learn.descActiveProgress
              .replace("{current}", String(journey.learnDone))
              .replace("{total}", String(topicSlugs.length))
          : home.alsoHere.learnDescription,
      icon: <Compass className="size-4" aria-hidden="true" />,
    },
  ];

  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const viewTracked = useRef(false);

  /*
   * The answer is handed to the test through storage, not a route param: /test
   * is prerendered, and reading search params during its render would push the
   * whole route into client rendering.
   *
   * Written before navigating so the value is already there when the shell's
   * first frame looks for it — the shell skips its landing screen only if it
   * finds one, and a race would mean the reader is asked the question twice.
   */
  function handleSelfRating(rating: SelfRatingValue) {
    writeSelfRating(rating);
    trackSelfRating(rating, "homepage");
    trackHomeCtaClicked();
    router.push(`/${locale}/test`);
  }

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

      {/*
       * The globe used to be a stacked block between the counter and the ask:
       * 440px on desktop, and 358px of a 844px phone screen — 42% of the first
       * thing anyone saw, spent on atmosphere, sitting exactly where the turn to
       * the reader belongs. It is the same globe, moved to a layer instead of a
       * row, so it costs no vertical space at either size.
       *
       * Two anchors, one element. From lg its centre sits off the top-right
       * corner and only an arc is in frame: a cropped sphere reads as larger
       * than the screen, where a small complete one reads as an object on a
       * table. Below lg there is no corner to spare, so it sits behind the
       * counter — the pings and the number they are counting become one
       * statement rather than two, 500px apart.
       *
       * overflow-hidden on the section is what does the cropping. No changes to
       * DeathGlobe: cobe already inscribes the sphere in a square canvas, so
       * cropping the container crops the sphere.
       */}
      <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-start overflow-hidden px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
        {/* Offsets in px, not %: a percentage `top` resolves against the
            containing block's height, which for this section is viewport-derived
            and put the sphere almost entirely above the fold. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[7rem] left-1/2 -translate-x-1/2 lg:left-auto lg:right-[-8rem] lg:top-[-10rem] lg:translate-x-0"
        >
          <DeathGlobe className="relative w-[26rem] sm:w-[30rem] lg:w-[34rem]" />
        </div>

        {/* Scrims. Two jobs: hold the counter legible over the dot field, and
            clear the ground under everything below it. The first mockups of
            this layout were unreadable until the type had its own ground. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_52%_14%_at_50%_16%,rgba(6,4,4,0.85)_0%,rgba(6,4,4,0.3)_62%,transparent_84%),linear-gradient(to_bottom,transparent_16%,rgba(6,4,4,0.92)_34%,#060404_46%)] lg:bg-[linear-gradient(to_right,#060404_26%,rgba(6,4,4,0.86)_50%,rgba(6,4,4,0.12)_72%,transparent_100%)]"
        />

        {/* Radial vignette — mobile only. It fades everything past 75% from the
            centre to solid #060404, which is precisely where the desktop globe
            now sits: left on at lg it erased the corner completely. Above lg the
            left-to-right scrim above does this job instead, and only on the side
            that holds type. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)] lg:bg-none" />

        <div className="relative z-[1] flex w-full flex-col items-center">
          {/* Label */}
          <p className="font-mono text-[9px] uppercase tracking-[4px] text-white/60 sm:text-[10px] sm:tracking-[5px]">
            {hero.label}
          </p>

          {/* Death counter. The daily 99,999 → 100,000 crossing does not shift
              it: DeathCounter reserves minWidth 7ch and centres inside that
              itself, so nothing is needed here. */}
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
              {/*
               * The turn from the world's dead to this reader's own standing.
               *
               * The eternity line is the bridge, not the ask — it states the
               * stake the question is about, and it sits here rather than as the
               * heading because a heading should be the thing the reader is
               * about to act on. What they are about to answer is the good-person
               * question, which is already this site's headline everywhere else:
               * the page title, the test's own landing screen, and both share
               * messages all lead with it.
               *
               * The `10 / 10 people will die` eyebrow that used to open this
               * block is gone. The counter above and the crawl below both make
               * that point; a third statement of it in between was the page
               * repeating its premise instead of turning it on the reader.
               */}
              <p className="mt-8 max-w-md text-center text-[15px] leading-relaxed tracking-wide text-white/60 sm:mt-10 sm:text-base">
                {home.provocativeQuestion}
              </p>

              <span
                aria-hidden="true"
                className="mt-7 h-px w-24 bg-gradient-to-r from-transparent via-white/[0.14] to-transparent sm:mt-9"
              />

              <h1 className="mt-7 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white/90 sm:mt-9 sm:text-3xl md:text-4xl">
                {home.selfRatingQuestion}
              </h1>

              {/*
               * One ask, three doors, all the same door.
               *
               * This is the front-door question the page briefly tried before
               * and reverted: that attempt put a *commandment* here and left the
               * gold button beside it, so the entry point genuinely was split in
               * two. Here there is no second control — every option answers the
               * question and begins the test — and the question is not the Law,
               * it is the Law's opening question, which the test already asks on
               * its own landing screen.
               */}
              <SelfRating
                messages={home.selfRating}
                ariaLabel={home.selfRatingQuestion}
                onSelect={handleSelfRating}
                className="mt-8"
              />

              {/* What a tap does, in the step bar the test itself uses. Cold
                  visitors do not hesitate over motivation so much as over not
                  knowing what "take the test" costs them. */}
              <div className="mt-6 flex flex-col items-center gap-2.5">
                <div
                  aria-hidden="true"
                  className="flex h-[3px] w-40 items-center gap-1.5 sm:w-48"
                >
                  {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-[3px] flex-1 rounded-full ${
                        i === 0 ? "bg-white/70" : "bg-white/[0.14]"
                      }`}
                    />
                  ))}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[1.6px] text-white/50">
                  {home.testPreview}
                </p>
              </div>

              <Link href={`/${locale}/learn`} onClick={() => trackHomeSecondaryClicked()} className="mt-6">
                <Button variant="text">{home.secondaryLink}</Button>
              </Link>
            </>
          )}

          {/*
           * The wire feed, between the hero and the other doors.
           *
           * Withheld from the committed stage on the same grounds globals.css
           * retires the broadcast strip over grace: "a ticking death count over
           * the grace screen argues against the screen." That stage carries the
           * gold grace atmosphere, and a mortality crawl running under it would
           * be arguing with the copy directly above it.
           */}
          {journey.stage !== "committed" && (
            <div className="-mx-4 mt-12 w-[calc(100%+2rem)] sm:-mx-6 sm:mt-14 sm:w-[calc(100%+3rem)]">
              <FactCrawl facts={home.facts} />
              <FactList facts={home.facts} />
            </div>
          )}

          {/* Ungated content band, identical on all five stages — the journey
              tracker's replacement. Rendered once here rather than inside each
              stage branch, so it cannot drift between them. */}
          <AlsoHere label={home.alsoHere.label} rows={alsoHereRows} />

          {latestPost && (
            <LatestPostCard locale={locale} eyebrow={home.blogCard.eyebrow} post={latestPost} />
          )}
        </div>
      </section>
    </main>
  );
}
