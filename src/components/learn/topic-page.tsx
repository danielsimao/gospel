"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopicSection } from "./topic-section";
import { TopicNav } from "./topic-nav";
import { trackTopicPageViewed } from "@/lib/learn-analytics";

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
}

export function TopicPage({ topic, locale, label, ctaHeading, ctaButton, completedCtaHeading, completedCtaButton, allTopicsLabel, prevLabel, nextLabel, prevTopic, nextTopic }: TopicPageProps) {
  useEffect(() => {
    trackTopicPageViewed(topic.slug, locale);
  }, [topic.slug, locale]);

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

      <article className="relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
        </motion.div>

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
    </main>
  );
}
