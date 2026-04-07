"use client";

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
}

export function TopicNav({ slug, locale, prevLabel, nextLabel, prevTopic, nextTopic, ctaHeading, ctaButton }: TopicNavProps) {
  return (
    <div className="mt-16">
      <div className="text-center">
        <p className="text-sm text-white/40">{ctaHeading}</p>
        <a
          href={`/${locale}/test`}
          onClick={() => trackTopicCtaClicked(slug, locale)}
          className="mt-3 inline-flex items-center rounded-lg border border-[#D4A843]/35 bg-[#D4A843]/[0.04] px-6 py-3 text-sm font-semibold text-[#D4A843] transition-all hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.08] min-h-[48px]"
        >
          {ctaButton} <span className="ml-2" aria-hidden="true">→</span>
        </a>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-white/[0.06] pt-6">
        {prevTopic ? (
          <a
            href={`/${locale}/learn/${prevTopic.slug}`}
            onClick={() => trackTopicNavClicked(slug, "prev", locale)}
            className="text-sm text-white/40 transition-colors hover:text-white/60"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[2px] text-white/25">{prevLabel}</span>
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
            <span className="block font-mono text-[10px] uppercase tracking-[2px] text-white/25">{nextLabel}</span>
            {nextTopic.title} →
          </a>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
