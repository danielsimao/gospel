"use client";

import { useState, useEffect } from "react";
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
  /** Shown instead of "Take the test" if user already completed it */
  completedCtaHeading?: string;
  completedCtaButton?: string;
}

export function TopicNav({ slug, locale, prevLabel, nextLabel, prevTopic, nextTopic, ctaHeading, ctaButton, completedCtaHeading, completedCtaButton }: TopicNavProps) {
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
      // If both done, cta stays null → no CTA shown
    } catch {}
  }, [locale, ctaHeading, ctaButton, completedCtaHeading, completedCtaButton]);

  return (
    <div className="mt-16">
      {cta && (
        <div className="text-center">
          <p className="text-sm text-white/40">{cta.heading}</p>
          <a href={cta.href} onClick={() => trackTopicCtaClicked(slug, locale)} className="mt-3 inline-block">
            <Button variant="gold" mist>
              {cta.button}
              <ButtonArrow />
            </Button>
          </a>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between border-t border-white/[0.06] pt-6">
        {prevTopic ? (
          <a
            href={`/${locale}/learn/${prevTopic.slug}`}
            onClick={() => trackTopicNavClicked(slug, "prev", locale)}
            className="text-sm text-white/40 transition-colors hover:text-white/60"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[2px] text-white/40">{prevLabel}</span>
            ← {prevTopic.title}
          </a>
        ) : (
          <div />
        )}
        {nextTopic ? (
          <a
            href={`/${locale}/learn/${nextTopic.slug}`}
            onClick={() => trackTopicNavClicked(slug, "next", locale)}
            className="text-right text-sm text-white/40 transition-colors hover:text-white/60"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[2px] text-white/40">{nextLabel}</span>
            {nextTopic.title} →
          </a>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
