"use client";

import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { TopicEmblem } from "@/components/emblems";
import { useJourney, TOTAL_READING_DAYS } from "@/lib/use-journey";
import { trackTopicCtaClicked, trackTopicNavClicked } from "@/lib/learn-analytics";

interface TopicNavProps {
  slug: string;
  locale: string;
  nextLabel: string;
  nextTopic: { slug: string; title: string; subtitle: string; number: number } | null;
  ctaHeading: string;
  ctaButton: string;
  completedCtaHeading?: string;
  completedCtaButton?: string;
  allTopicsLabel?: string;
}

export function TopicNav({ slug, locale, nextLabel, nextTopic, ctaHeading, ctaButton, completedCtaHeading, completedCtaButton, allTopicsLabel }: TopicNavProps) {
  // Server render and first client render have no reliable journey/reading
  // state (it lives in localStorage), so no CTA renders until `ready` flips
  // post-mount — matches FooterNextStepsLink's gate on the same hook.
  const { stage, readingDone, ready } = useJourney();
  const testDone = stage !== "visitor";
  const readingComplete = readingDone >= TOTAL_READING_DAYS;

  const cta = !ready
    ? null
    : !testDone
      ? { heading: ctaHeading, button: ctaButton, href: `/${locale}/test` }
      : !readingComplete && completedCtaHeading && completedCtaButton
        ? { heading: completedCtaHeading, button: completedCtaButton, href: `/${locale}/reading-plan` }
        : null;

  return (
    <nav className="mt-16">
      {/* ── CTA first: the journey ask (test → reading plan) is the page's
          one primary action — same stage-aware ask as the blog card and
          hub. Sequence navigation is the secondary voice below it. ── */}
      {cta && (
        <div className="mb-12 text-center">
          <p className="text-sm text-white/60">{cta.heading}</p>
          <Link href={cta.href} onClick={() => trackTopicCtaClicked(slug, locale)} className="mt-3 inline-block">
            <Button variant="gold" mist>
              {cta.button}
              <ButtonArrow />
            </Button>
          </Link>
        </div>
      )}

      {/* ── Next up: the argument's next stop, in the hub's row vocabulary.
          One object on one axis — no prev (the browser and the hub cover
          going back), no two-column skeleton to collapse on the arc's
          endpoints. Absent on the last topic; the CTA carries the tail. ── */}
      {nextTopic && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
            {nextLabel}
          </p>
          <Link
            href={`/${locale}/learn/${nextTopic.slug}`}
            onClick={() => trackTopicNavClicked(slug, "next", locale)}
            className="group mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-5 py-3.5 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03] sm:px-6"
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] tabular-nums text-[#D4A843]/70">
                {String(nextTopic.number).padStart(2, "0")}
              </span>
              <TopicEmblem
                slug={nextTopic.slug}
                className="size-5 shrink-0 text-[#D4A843]/60 transition-colors group-hover:text-[#D4A843]/80"
                strokeWidth={1.7}
              />
              <div>
                <p className="text-[15px] font-semibold text-white/85 sm:text-base">{nextTopic.title}</p>
                <p className="mt-0.5 text-xs text-white/60">{nextTopic.subtitle}</p>
              </div>
            </div>
            <span className="text-white/50 transition-all group-hover:translate-x-1 group-hover:text-[#D4A843]/70">
              &rarr;
            </span>
          </Link>
        </div>
      )}

      {/* All topics — one quiet centered line */}
      {allTopicsLabel && (
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/learn`}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
          >
            &larr; {allTopicsLabel}
          </Link>
        </div>
      )}
    </nav>
  );
}
