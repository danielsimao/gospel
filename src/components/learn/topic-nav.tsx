"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { readProgress, getCompletedCount } from "@/lib/reading-storage";
import { trackTopicCtaClicked, trackTopicNavClicked } from "@/lib/learn-analytics";

const TOTAL_DAYS = 7;

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
  const [cta, setCta] = useState<{ heading: string; button: string; href: string } | null>(null);

  useEffect(() => {
    try {
      const testDone = localStorage.getItem("test_completed") === "1";
      const readingDone = getCompletedCount(readProgress(), TOTAL_DAYS) >= TOTAL_DAYS;

      if (!testDone) {
        setCta({ heading: ctaHeading, button: ctaButton, href: `/${locale}/test` });
      } else if (!readingDone && completedCtaHeading && completedCtaButton) {
        setCta({ heading: completedCtaHeading, button: completedCtaButton, href: `/${locale}/reading-plan` });
      }
    } catch {}
  }, [locale, ctaHeading, ctaButton, completedCtaHeading, completedCtaButton]);

  return (
    <nav className="mt-16">
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

      {/* ── CTA: the parting call-to-action ── */}
      {cta && (
        <div className="mt-12 text-center">
          <p className="text-sm text-white/60">{cta.heading}</p>
          <Link href={cta.href} onClick={() => trackTopicCtaClicked(slug, locale)} className="mt-3 inline-block">
            <Button variant="gold" mist>
              {cta.button}
              <ButtonArrow />
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
