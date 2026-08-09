"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { TopicCoverCard } from "@/components/learn/topic-cover-card";
import { isTopicCompleted } from "@/lib/learn-progress-storage";
import { useJourney, TOTAL_READING_DAYS } from "@/lib/use-journey";
import { trackTopicCtaClicked, trackTopicNavClicked } from "@/lib/learn-analytics";

interface TopicNavProps {
  slug: string;
  locale: string;
  nextLabel: string;
  nextTopic: { slug: string; title: string; subtitle: string; number: number } | null;
  relatedLabel?: string;
  relatedTopics: Array<{ slug: string; title: string; subtitle: string; number: number }>;
  quizLabel: string;
  ctaHeading: string;
  ctaButton: string;
  completedCtaHeading?: string;
  completedCtaButton?: string;
  allTopicsLabel?: string;
}

export function TopicNav({ slug, locale, nextLabel, nextTopic, relatedLabel, relatedTopics, quizLabel, ctaHeading, ctaButton, completedCtaHeading, completedCtaButton, allTopicsLabel }: TopicNavProps) {
  // Server render and first client render have no reliable journey/reading
  // state (it lives in localStorage), so no CTA renders until `ready` flips
  // post-mount — matches FooterNextStepsLink's gate on the same hook.
  const { stage, readingDone, ready } = useJourney();
  const testDone = stage !== "visitor";
  const readingComplete = readingDone >= TOTAL_READING_DAYS;

  // Same reason: localStorage isn't readable during the server render or the
  // first client pass, so the "✓ read" chip starts absent and fills in after
  // mount rather than risking a hydration mismatch against the server HTML.
  const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const slugs = [nextTopic?.slug, ...relatedTopics.map((t) => t.slug)].filter(
      (s): s is string => Boolean(s),
    );
    setCompleted(new Set(slugs.filter((s) => isTopicCompleted(s))));
  }, [nextTopic, relatedTopics]);

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

      {/* ── Next up: the argument's next stop, now a cover card rather than
          the emblem row — finishing a topic should feel like arriving at
          the next poster, not the next list item. Absent on the last topic;
          the CTA carries the tail. ── */}
      {nextTopic && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
            {nextLabel}
          </p>
          <div className="mt-3">
            <TopicCoverCard
              slug={nextTopic.slug}
              href={`/${locale}/learn/${nextTopic.slug}`}
              title={nextTopic.title}
              subtitle={nextTopic.subtitle}
              number={nextTopic.number}
              isDone={completed.has(nextTopic.slug)}
              onClick={() => trackTopicNavClicked(slug, "next", locale)}
            />
          </div>
        </div>
      )}

      {/* ── Keep digging: 1-2 covers chosen across bands rather than along
          the arc — the reader on What is Sin? whose real question is How
          Can My Sins Be Forgiven? shouldn't have to walk the whole
          argument to get there. Quiet by design: smaller cards, below the
          page's one primary ask. ── */}
      {relatedLabel && relatedTopics.length > 0 && (
        <div className="mt-10">
          <p className="font-mono text-[10px] uppercase tracking-[2.5px] text-white/50">
            {relatedLabel}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            {relatedTopics.map((topic) => (
              <TopicCoverCard
                key={topic.slug}
                slug={topic.slug}
                href={`/${locale}/learn/${topic.slug}`}
                title={topic.title}
                subtitle={topic.subtitle}
                number={topic.number}
                isDone={completed.has(topic.slug)}
                quizTag={quizLabel}
                onClick={() => trackTopicNavClicked(slug, "related", locale)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All topics — one quiet centered line */}
      {allTopicsLabel && (
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/learn`}
            className="inline-flex items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white/70"
          >
            &larr; {allTopicsLabel}
          </Link>
        </div>
      )}
    </nav>
  );
}
