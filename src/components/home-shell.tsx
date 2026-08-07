"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeathCounter } from "@/components/eternity/death-counter";
import { LatestPostCard } from "@/components/home/latest-post-card";
import { PassedBand } from "@/components/home/passed-band";
import { QuestionsBand } from "@/components/home/questions-band";
import { ReadingBand, type ReadingDay } from "@/components/home/reading-band";
import { StageSpine } from "@/components/home/stage-spine";
import { SelfRating } from "@/components/home/self-rating";
import { Button, ButtonArrow } from "@/components/ui/button";
import { useJourney } from "@/lib/use-journey";
import { saveInvitationResponse } from "@/lib/journey-storage";
import { clearSession } from "@/lib/test-session-storage";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import { SELF_RATINGS } from "@/lib/self-rating";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { STAGE_PREPAINT_SCRIPT } from "@/lib/stage-prepaint-script";
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
  topics: Array<{ slug: string; title: string }>;
  readingDays: ReadingDay[];
  readingLabels: { dayLabel: string; complete: string };
  /** Reused from the learn hub and the blog index rather than restated here. */
  allTopicsLabel: string;
  allPostsLabel: string;
  /** Distinct readers who reached the verdict, or null when unavailable —
      resolved on the server, because the key that can read it must never
      travel to a browser. */
  testTakerCount: number | null;
  latestPost?: {
    slug: string;
    title: string;
    hook: string;
    datePublished: string;
    localeAvailable: boolean;
  } | null;
}

/*
 * Whether the globe is the cropped corner one.
 *
 * Its speed and tilt are cobe arguments, not CSS, so they cannot be switched
 * with a responsive class the way its size is — the breakpoint has to be read
 * at runtime. Matches Tailwind's `lg`. The server always reports false; the
 * globe is `ssr: false` and mounts client-side only, so there is no markup to
 * mismatch.
 */
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktop(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
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

/**
 * Splits a `whatHappened` sentence at its `{when}` placeholder so the clause
 * that names a date can be withheld until the date is actually known.
 *
 * The undecided and thinking stages are the only copy on this page that depends
 * on a stored timestamp, and both blocks are now rendered by the server, which
 * has no timestamp. Passing `daysSince ?? 0` therefore resolved `{when}` to
 * "earlier today" and the first painted frame told a reader who took the test
 * three weeks ago that they took it today — a false statement about their own
 * history, corrected milliseconds later. `journey-storage` already carries a
 * comment about the last time this app made that mistake from the other
 * direction.
 *
 * The fix is not to hide the sentence: it would reflow when the words arrived.
 * Only the phrase is deferred, inside a box wide enough for the longest form it
 * can take, so the line count cannot change when the real value lands. Blank
 * for a moment is honest; "earlier today" is not.
 */
function splitWhen(template: string): { before: string; after: string } | null {
  const at = template.indexOf("{when}");
  // Null rather than [template, ""]: with no placeholder there is nothing to
  // defer, and rendering the reserve anyway appended a blank box to the sentence
  // and then left the phrase dangling past its full stop once it resolved. Not
  // reachable with today's copy, but the owner's PT pass is open and a dropped
  // placeholder is exactly how it would arrive.
  if (at === -1) return null;
  return { before: template.slice(0, at), after: template.slice(at + "{when}".length) };
}

function WhatHappened({
  template,
  days,
  since,
  ready,
}: {
  template: string;
  days: number | null;
  since: { today: string; yesterday: string; daysAgo: string; weeksAgo: string };
  ready: boolean;
}) {
  const parts = splitWhen(template);
  const known = ready && days !== null;
  if (!parts) return <>{template}</>;
  return (
    <>
      {parts.before}
      <span
        /*
         * Reserves the phrase while it is still unknown, and stops reserving
         * the moment it lands.
         *
         * 15ch, not the 13ch this started at. 13 was eyeballed against English
         * and measured too narrow for Portuguese: at 14px in Geist,
         * "há 156 semanas" is 103.5px against 13ch = 101.2px, so a pt reader
         * whose record is 100+ weeks old — reachable in 2028 — would re-wrap
         * the line, which is the one thing the box exists to prevent. 15ch
         * clears every form in both locales through four-digit weeks.
         *
         * The reserve used to survive resolution, and that is a worse bug than
         * the one it was fixing. 15ch is 141.7px; "earlier today" is 85px. Every
         * returning reader on the undecided stage read "You stood trial earlier
         * today" followed by 57px of nothing and then the full stop — measured,
         * not estimated — and the same hole opened in the thinking stage's
         * "That was {when}." A held-open box is only honest while it is empty.
         *
         * Dropping it on resolution costs one reflow of this sentence at
         * hydration, which is the shift the reserve existed to prevent. It is
         * the right trade: that shift is sub-second and happens once, and no
         * reserve can be both wide enough for the unknown phrase and exactly as
         * wide as the phrase that arrives. Permanent beats momentary.
         */
        style={known ? undefined : { display: "inline-block", minWidth: "15ch" }}
        /* Empty until the timestamp is known, and a screen reader should not
           announce the gap as part of the sentence. */
        aria-hidden={known ? undefined : true}
      >
        {known ? sincePhrase(days, since) : " "}
      </span>
      {parts.after}
    </>
  );
}

const RATE_CARDS = [
  { value: "1.8", key: "perSecond" },
  { value: "108", key: "perMinute" },
  { value: "6,500", key: "perHour" },
  { value: "155,000", key: "perDay" },
] as const;

export function HomeShell({
  hero,
  home,
  locale,
  topicSlugs,
  topics,
  readingDays,
  readingLabels,
  allTopicsLabel,
  allPostsLabel,
  testTakerCount,
  latestPost,
}: HomeShellProps) {
  const journey = useJourney(topicSlugs);

  const router = useRouter();
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
  /*
   * Retaking the test clears the test, and nothing else.
   *
   * All three retake links used to call resetJourney() as well, which deletes
   * the journey record — and that record is where the decision lives. A reader
   * who had professed faith and then tapped "take the test again", to show
   * someone or to walk it a second time, had that erased: the homepage dropped
   * from "This is the beginning, not the finish line" back to a stranger's
   * front door, and their next-steps track went with it.
   *
   * Reading and learn progress were never affected — those are separate keys —
   * but the response was, and a diagnostic should not be able to revoke it.
   * The response is overwritten when they answer the invitation again; until
   * then their last actual decision is still the true one, so the homepage
   * goes on showing it while the retake is in progress.
   */
  function handleSelfRating(rating: SelfRatingValue) {
    trackSelfRating(rating, "homepage");
    trackHomeCtaClicked();
    // The answer travels in the route, not in storage. /test/{rating} is
    // prerendered with the reply already rendered, so the screen the reader
    // lands on never asks them the question they just answered.
    router.push(`/${locale}/test/${rating}`);
  }

  /*
   * Warm the route before it is asked for. The gap a reader actually feels
   * between tapping an answer and seeing the reply is the RSC fetch, not the
   * animation — prefetching makes the push resolve immediately.
   */
  useEffect(() => {
    // All three, not just one: they are prerendered and tiny, and which one the
    // reader will tap is exactly what is not known in advance. The unseeded
    // /test is prefetched too — the other links on this page point at it.
    router.prefetch(`/${locale}/test`);
    for (const rating of SELF_RATINGS) router.prefetch(`/${locale}/test/${rating}`);
  }, [router, locale]);

  const desktopGlobe = useSyncExternalStore(subscribeToDesktop, isDesktop, () => false);

  /*
   * Keeps the attribute the stage CSS reads in step with the journey.
   *
   * STAGE_PREPAINT_SCRIPT stamps it during HTML parse, which is what makes the
   * first paint correct — but it fires once, on a full page load, and nothing
   * else was updating it. React does not execute <script> elements it inserts
   * (react-dom builds script hosts through a throwaway fragment parse, so they
   * are born with the spec's "already started" flag and never run), so a
   * client-side navigation back to the homepage left whatever the last hard
   * load had written; and committing on this page updated React without
   * updating the attribute at all. A reader who answered the invitation and
   * returned here was still being shown "Are you a good person?" until they
   * happened to hard-refresh.
   *
   * Before paint, not after: on a client navigation this is the only thing
   * choosing the stage, so an effect that ran afterwards would show the wrong
   * block for a frame — the exact fault the script exists to avoid.
   *
   * Guarded on `ready` so the first client render, which reports "visitor"
   * before storage has been read, cannot overwrite what the script got right.
   *
   * Cleared on unmount. The attribute
   * is global and the selectors that read it are not scoped to this route, so
   * leaving it set would make the homepage's stage a fact about every other
   * page in the session.
   */
  useIsomorphicLayoutEffect(() => {
    if (!journey.ready) return;
    document.documentElement.dataset.journeyStage = journey.stage;
    return () => {
      delete document.documentElement.dataset.journeyStage;
    };
  }, [journey.ready, journey.stage]);

  useEffect(() => {
    if (viewTracked.current || !journey.ready) return;
    viewTracked.current = true;
    trackHomeViewed(locale, journey.stage);
  }, [journey.ready, journey.stage, locale]);

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#060404]">
      {/* Ahead of the stage blocks it governs, so the attribute is already set
          by the time they are parsed. */}
      <script dangerouslySetInnerHTML={{ __html: STAGE_PREPAINT_SCRIPT }} />
      <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-start overflow-hidden px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
        {/* Offsets in px, not %: a percentage `top` resolves against the
            containing block's height, which for this section is viewport-derived
            and put the sphere almost entirely above the fold. */}
        {/*
         * Sizes are not a smooth ramp. Phone: large, because the sphere is the
         * counter's backdrop and a small one behind that number reads as
         * texture rather than a globe. Tablet: the smallest of the three — it
         * is still centred behind the counter but the viewport is wide enough
         * that a phone-scale sphere would swamp the column. Desktop: largest,
         * because most of it is off-canvas and only the arc is doing the work.
         */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[5.5rem] left-1/2 -translate-x-1/2 sm:-top-[6rem] lg:left-auto lg:right-[-12rem] lg:top-[-10rem] lg:translate-x-0 xl:right-[-9rem] xl:top-[-11rem]"
        >
          <DeathGlobe
            className="relative w-[32rem] sm:w-[26rem] lg:w-[40rem] xl:w-[46rem]"
            // A quarter speed on desktop. Stopped, it stops being the thing it
            // is for; at full speed beside the question it pulls the eye off
            // the words. Slow enough to read as alive, not as movement.
            rotationScale={desktopGlobe ? 0.25 : 1}
            // Tipped further on desktop so the northern population band walks
            // down into the cropped arc; Europe sits above the crop otherwise.
            theta={desktopGlobe ? 0.45 : 0.18}
            // Brighter below lg, where the sphere sits behind the counter and
            // the scrim protecting that number is the same one flattening the
            // landmass. On desktop the globe has its own ground and needs none.
            mapBrightness={desktopGlobe ? 1.8 : 4.2}
          />
        </div>

        {/* Scrims. Two jobs: hold the counter legible over the dot field, and
            clear the ground under everything below it. The first mockups of
            this layout were unreadable until the type had its own ground. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_46%_12%_at_50%_15%,rgba(6,4,4,0.72)_0%,rgba(6,4,4,0.2)_66%,transparent_88%),linear-gradient(to_bottom,transparent_24%,rgba(6,4,4,0.86)_40%,#060404_54%)] lg:bg-[linear-gradient(to_bottom,rgba(6,4,4,0.8)_0%,rgba(6,4,4,0.25)_9%,transparent_16%),linear-gradient(to_right,#060404_20%,rgba(6,4,4,0.88)_50%,rgba(6,4,4,0.12)_70%,transparent_100%)]"
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
            className="mt-4 font-score text-6xl font-bold tabular-nums tracking-[0.01em] text-red-500 sm:mt-5 sm:text-8xl md:text-9xl lg:text-[10rem]"
            style={{
              textShadow:
                "0 0 80px rgba(239,68,68,0.25), 0 4px 60px rgba(0,0,0,0.8)",
            }}
          />

          {/* Suffix */}
          <p className="mt-2 text-sm tracking-wide text-white/60 sm:mt-3 sm:text-base">
            {hero.suffix}
          </p>

          {/*
           * Rate cards. Below sm they are bare figures — no panel, no border,
           * no fills: the globe sits directly behind them there, and a boxed
           * grid over a dot sphere made two competing surfaces where the
           * numbers should simply be lying on the earth. From sm up the globe
           * moves out from behind them and the panel returns.
           */}
          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 sm:mt-14 sm:flex sm:flex-wrap sm:justify-center sm:gap-px sm:overflow-hidden sm:rounded-lg sm:border sm:border-white/[0.04]">
            {RATE_CARDS.map((card, idx) => (
              <div
                key={card.key}
                className={`text-center sm:min-w-[110px] sm:bg-white/[0.015] sm:px-6 sm:py-5 ${
                  idx < RATE_CARDS.length - 1
                    ? "sm:border-r sm:border-white/[0.04]"
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


          {/*
           * === Bottom CTA section — adapts to journey stage ===
           *
           * All five stages are rendered, always, and CSS shows exactly one.
           *
           * They used to be branched on `journey.stage`, which is read from
           * localStorage and therefore unknown to the server: every render
           * emitted the visitor block and the real one replaced it at
           * hydration. Hiding the wrong block before first paint stopped the
           * reader seeing it, but not the swap — the variants differ enough in
           * height that everything below the fold still jumped once the right
           * one arrived. Measured at 390px wide in July 2026 the five ran
           * 1454–1587px, a 133px spread; the figure will drift with the copy
           * but it is not going to become zero. Reserving a fixed height
           * instead would have handed that spread to visitors as dead space,
           * and they are both the commonest case and the one the page is trying
           * to convert.
           *
           * With every variant in the markup, the pre-paint script's choice is
           * final: the correct block is laid out in the first frame and nothing
           * moves afterwards.
           *
           * One cost, deliberate: four unused blocks ride in every HTML
           * response. They are out of the accessibility tree, being
           * display:none, but present in the served document, so this page's
           * source carries four stages' worth of copy for a crawler to see.
           * That is why the four returning-stage headings are h2 and only the
           * visitor block keeps an h1 — see stage-spine. Hidden copy itself is
           * left alone: it is state-dependent UI, which is a pattern search
           * engines discount rather than penalise, and removing it would hand
           * the layout jump back to the visitors this page exists to convert.
           *
           * The wrappers carry no `display` class of their own. globals.css
           * supplies it in both the shown and the hidden case, and a
           * `class="contents"` here was inert — it tied on specificity and lost
           * on source order — while being the only thing that could ever
           * compete with those rules. See the note beside them for the
           * constraint that does matter.
           */}
          <div data-slot="journey-stage" data-stage="committed">
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
                  clearSession();
                }}
                className="mt-5 text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
              >
                {home.journey.retakeLabel}
              </Link>
            </div>
          </div>

          <div data-slot="journey-stage" data-stage="undecided">
              {/* whatHappened carries the temporal mirror that sinceLine used
                  to hold — how long "later" has already lasted, stated once,
                  no pressure mechanics — folded into the result sentence. */}
              <StageSpine
                tone="red"
                eyebrow={home.journeyStages.undecided.eyebrow}
                heading={home.journeyStages.undecided.heading}
                whatHappened={
                  <WhatHappened
                    template={home.journeyStages.undecided.whatHappened}
                    days={journey.daysSinceTest}
                    since={home.journeyStages.since}
                    ready={journey.ready}
                  />
                }
              />
              <Link href={`/${locale}/test`} onClick={() => trackHomeCtaClicked()} className="mt-8">
                <Button variant="gold" size="lg" mist>
                  {home.journeyStages.undecided.cta}
                  <ButtonArrow />
                </Button>
              </Link>
          </div>

          <div data-slot="journey-stage" data-stage="thinking">
            <div className="flex w-full max-w-md flex-col items-center">
              <StageSpine
                tone="dim"
                eyebrow={home.journeyStages.thinking.eyebrow}
                heading={home.journeyStages.thinking.heading}
                whatHappened={
                  <WhatHappened
                    template={home.journeyStages.thinking.whatHappened}
                    days={journey.daysSinceResponse}
                    since={home.journeyStages.since}
                    ready={journey.ready}
                  />
                }
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
                  clearSession();
                }}
                className="mt-2 text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
              >
                {home.journeyStages.thinking.retakeLabel}
              </Link>
            </div>
          </div>

          <div data-slot="journey-stage" data-stage="dismissed">
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
          </div>

          {/* `contents` on every wrapper so none of them adds a box of its own
              and the children stay direct flex items of the column. They exist
              only to give the pre-paint rule something to select. */}
          <div data-slot="journey-stage" data-stage="visitor">
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

              {/* No "Have questions first? Learn more" here any more. It sat
                  forty pixels above the questions band, which answers the same
                  offer with six real questions and an All topics link — it was
                  the first of eight routes to /learn on one page, and the only
                  one that asked rather than showed. The dismissed stage keeps
                  its own copy: that reader has declined the test, so a quiet
                  non-test door is the point rather than a duplicate. */}
          </div>

          {/*
           * Three ungated bands, identical on all five stages. Each shows what
           * is actually inside it rather than describing it: the topics as
           * their own questions, the plan as the day this reader is on, the
           * blog as its newest headline. Rendered once here rather than inside
           * each stage branch, so they cannot drift between them.
           */}
          {/* First of the bands, because it is the strongest hook on the
              page: a score that ends "1 passed" leaves a question, and the
              question has a door. */}
          <PassedBand locale={locale} messages={home.passedBand} count={testTakerCount} />

          <QuestionsBand
            locale={locale}
            label={home.questionsLabel}
            allLabel={allTopicsLabel}
            topics={topics}
          />

          <ReadingBand
            locale={locale}
            label={home.journey.reading.label}
            dayLabel={readingLabels.dayLabel}
            completeDescription={readingLabels.complete}
            days={readingDays}
            completed={journey.readingDone}
          />

          {latestPost && (
            <LatestPostCard
              locale={locale}
              eyebrow={home.blogCard.eyebrow}
              allLabel={allPostsLabel}
              post={latestPost}
            />
          )}


        </div>
      </section>

      {/*
       * The wire feed, flush against the footer.
       *
       * Outside the section rather than inside it: the section carries the
       * page's horizontal padding and a bottom pad of its own, so in there the
       * crawl needed negative margins to reach the edges and still left a gap
       * underneath. As the last child of <main> it is full-bleed by default and
       * sits flush on the footer — measured gap 0. (Two hairlines meet at that
       * seam, the crawl's border-y and the footer's border-t, at different
       * opacities. Left alone deliberately; collapsing them is a look decision,
       * not a layout one.)
       *
       * No top margin of its own either. The section above ends in pb-12 /
       * sm:pb-16, which leaves ~50px on its own; stacking a margin on that
       * doubled the gap between the blog card and the feed.
       *
       * It runs on every stage, including committed. It was once withheld there
       * on the grounds globals.css gives for retiring the broadcast strip over
       * grace — "a ticking death count over the grace screen argues against the
       * screen" — but that reasoning was about proximity, and back then the
       * crawl ran directly under the gold copy. Down here the questions band,
       * the reading plan and the blog card all sit in between. A reader who has
       * professed faith is not owed a homepage with the world's dead edited out
       * of it; the facts are still true, they are simply no longer the thing
       * being said to them.
       */}
      <div>
        {/* The crawl moved to the footer's top edge, where it is now site-wide.
            It sat here, immediately above the footer, so the homepage loses
            nothing but the duplicate. */}
      </div>
    </main>
  );
}
