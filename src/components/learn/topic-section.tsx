"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { SectionQuiz } from "./section-quiz";
import { markTopicCompleted } from "@/lib/learn-progress-storage";
import { trackTopicSectionReached } from "@/lib/learn-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";

interface QuizData {
  question: string;
  options: string[];
  correct: number;
  reveal: string;
}

interface TopicSectionProps {
  heading: string;
  body: string;
  scripture: string;
  scriptureRef: string;
  index: number;
  slug: string;
  locale: string;
  quiz?: QuizData;
  isLast?: boolean;
  /** The section's own reveal firing, reused for the page's honest section-progress bar. */
  onSectionReached?: (index: number) => void;
}

export function TopicSection({ heading, body, scripture, scriptureRef, index, slug, locale, quiz, isLast, onSectionReached }: TopicSectionProps) {
  // The first section sits right under the cover/title — already on
  // screen at load, not something a reader scrolls to discover. Gating it
  // behind the same IntersectionObserver as the rest meant a tall cover on
  // a short viewport could leave the opening paragraph blank until the
  // reader scrolled past the 0.3 threshold.
  const [revealed, setRevealed] = useState(index === 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          trackTopicSectionReached(slug, index, locale);
          onSectionReached?.(index);
          if (isLast) markTopicCompleted(slug);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [slug, index, locale, isLast, onSectionReached]);

  const paragraphs = body.split("\n\n");

  return (
    <div ref={ref} className="mt-12 first:mt-0">
      <m.div
        initial={index === 0 ? false : { opacity: 0, y: 16 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: EASE_OUT_STRONG }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-6 bg-red-500/40" />
          <h2 className="text-xl font-bold text-white/90 sm:text-2xl">{heading}</h2>
        </div>

        <div className="space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.85] text-white/60 sm:text-base">
              {p}
            </p>
          ))}
        </div>

        {/* Quiz — between body and scripture */}
        {quiz && (
          <SectionQuiz
            quiz={quiz}
            topicSlug={slug}
            sectionIndex={index}
          />
        )}

        <blockquote className="mt-6 border-l border-[#D4A843]/30 pl-5">
          <p className="text-[15px] italic leading-[1.85] text-white/55 sm:text-base">
            &ldquo;{scripture}&rdquo;
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
            {scriptureRef}
          </p>
        </blockquote>
      </m.div>
    </div>
  );
}
