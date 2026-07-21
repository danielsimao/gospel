"use client";

import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { useJourney, TOTAL_READING_DAYS } from "@/lib/use-journey";
import { trackTopicCtaClicked, trackTopicNavClicked } from "@/lib/learn-analytics";

interface TopicNavProps {
  slug: string;
  locale: string;
  prevLabel: string;
  nextLabel: string;
  prevTopic: { slug: string; title: string } | null;
  nextTopic: { slug: string; title: string } | null;
  ctaHeading: string;
  ctaButton: string;
  completedCtaHeading?: string;
  completedCtaButton?: string;
  allTopicsLabel?: string;
}

export function TopicNav({ slug, locale, prevLabel, nextLabel, prevTopic, nextTopic, ctaHeading, ctaButton, completedCtaHeading, completedCtaButton, allTopicsLabel }: TopicNavProps) {
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

      {/* ── Navigation: prev / all topics / next ── */}
      <div className="border-t border-white/[0.06] pt-6">
        <div className="flex items-start justify-between">
          {prevTopic ? (
            <Link
              href={`/${locale}/learn/${prevTopic.slug}`}
              onClick={() => trackTopicNavClicked(slug, "prev", locale)}
              className="group max-w-[40%] text-sm text-white/70 transition-colors hover:text-white/60"
            >
              <span className="block font-mono text-[10px] uppercase tracking-[2px] text-white/60 group-hover:text-white/70">{prevLabel}</span>
              <span className="mt-1 block">← {prevTopic.title}</span>
            </Link>
          ) : (
            <div />
          )}
          {nextTopic ? (
            <Link
              href={`/${locale}/learn/${nextTopic.slug}`}
              onClick={() => trackTopicNavClicked(slug, "next", locale)}
              className="group max-w-[40%] text-right text-sm text-white/70 transition-colors hover:text-white/60"
            >
              <span className="block font-mono text-[10px] uppercase tracking-[2px] text-white/60 group-hover:text-white/70">{nextLabel}</span>
              <span className="mt-1 block">{nextTopic.title} →</span>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* All topics — centered below prev/next */}
        {allTopicsLabel && (
          <div className="mt-5 text-center">
            <Link
              href={`/${locale}/learn`}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
            >
              ← {allTopicsLabel}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
