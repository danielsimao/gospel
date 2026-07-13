"use client";

import { useEffect } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopicSection } from "./topic-section";
import { TopicNav } from "./topic-nav";
import { trackTopicPageViewed } from "@/lib/learn-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { PageShell } from "@/components/shared/page-shell";

interface SectionMessages {
  heading: string;
  body: string;
  scripture: string;
  scriptureRef: string;
  quiz?: {
    question: string;
    options: string[];
    correct: number;
    reveal: string;
  };
}

interface TopicMessages {
  slug: string;
  title: string;
  subtitle: string;
  sections: SectionMessages[];
}

interface TopicPageProps {
  topic: TopicMessages;
  locale: string;
  label: string;
  ctaHeading: string;
  ctaButton: string;
  completedCtaHeading?: string;
  completedCtaButton?: string;
  allTopicsLabel?: string;
  prevLabel: string;
  nextLabel: string;
  prevTopic: { slug: string; title: string } | null;
  nextTopic: { slug: string; title: string } | null;
  relatedTopics: Array<{ slug: string; title: string; subtitle: string }>;
  relatedLabel: string;
  faq: Array<{ question: string; answer: string }>;
}

export function TopicPage({ topic, locale, label, ctaHeading, ctaButton, completedCtaHeading, completedCtaButton, allTopicsLabel, prevLabel, nextLabel, prevTopic, nextTopic, relatedTopics, relatedLabel, faq }: TopicPageProps) {
  useEffect(() => {
    trackTopicPageViewed(topic.slug, locale);
  }, [topic.slug, locale]);

  return (
    <PageShell>
      <article>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_OUT_STRONG }}
        >
          <Link
            href={`/${locale}/learn`}
            className="group mb-6 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[2px] text-white/60 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03] hover:text-[#D4A843]/70"
          >
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
            {label}
          </Link>
          <h1
            className="mt-3 text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl md:text-5xl"
            style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
          >
            {topic.title}
          </h1>
          <p className="mt-3 text-sm text-white/60">{topic.subtitle}</p>
        </m.div>

        <div className="mt-12">
          {topic.sections.map((section, i) => (
            <TopicSection
              key={i}
              heading={section.heading}
              body={section.body}
              scripture={section.scripture}
              scriptureRef={section.scriptureRef}
              index={i}
              slug={topic.slug}
              locale={locale}
              quiz={section.quiz}
              isLast={i === topic.sections.length - 1}
            />
          ))}
        </div>

        {relatedTopics.length > 0 && (
          <div className="mt-14">
            <h2 className="font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {relatedLabel}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedTopics.map((related) => (
                <Link
                  key={related.slug}
                  href={`/${locale}/learn/${related.slug}`}
                  className="group block rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03]"
                >
                  <p className="text-sm font-semibold text-white/85 group-hover:text-white/95">
                    {related.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                    {related.subtitle}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {faq.length > 0 && (
          <div className="mt-14">
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.015] transition-colors open:border-[#D4A843]/20"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 text-sm font-semibold text-white/85 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-white/40 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[13px] leading-relaxed text-white/60">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}

        <TopicNav
          slug={topic.slug}
          locale={locale}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
          prevTopic={prevTopic}
          nextTopic={nextTopic}
          ctaHeading={ctaHeading}
          ctaButton={ctaButton}
          completedCtaHeading={completedCtaHeading}
          completedCtaButton={completedCtaButton}
          allTopicsLabel={allTopicsLabel}
        />
      </article>
    </PageShell>
  );
}
