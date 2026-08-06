import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import { BandTexture } from "@/components/home/band-texture";
import { TopicEmblem } from "@/components/emblems";
import { HOME_QUESTION_SLUGS, HOME_QUESTIONS_MOBILE } from "@/lib/home-questions";
import type { Locale } from "@/lib/i18n";

interface QuestionsBandProps {
  locale: Locale;
  label: string;
  allLabel: string;
  /** Every learn topic, so the band can resolve its slugs to titles. */
  topics: Array<{ slug: string; title: string }>;
}

/**
 * Six of the fourteen learn topics, as their own question.
 *
 * This replaced a row that read "Honest answers / Short answers to the hard
 * questions" — a description of a filing cabinet whose contents are the best
 * copy on the site. "Am I a Good Person?" and "Why Are You Afraid to Die?" are
 * already written, already translated, and were being kept off the page by a
 * sentence about them.
 *
 * Each chip carries its topic's emblem, the same symbol that marks it on
 * /learn, so the mark means something rather than filling a column: a reader
 * who arrives at the hub recognises where they have been.
 *
 * Only the first four survive on a phone. Six stacked made this section a full
 * viewport on its own, and the rest are one tap away behind "All topics".
 * Hidden in CSS rather than sliced, so the markup is the same at every width.
 */
export function QuestionsBand({ locale, label, allLabel, topics }: QuestionsBandProps) {
  const bySlug = new Map(topics.map((t) => [t.slug, t.title]));
  // A slug with no title means the topic was renamed. The unit test fails the
  // build for that, so this only ever drops one at runtime if messages and code
  // ship out of step — better a shorter grid than a chip with no words in it.
  const questions = HOME_QUESTION_SLUGS.flatMap((slug) => {
    const title = bySlug.get(slug);
    return title ? [{ slug: slug as string, title }] : [];
  });

  if (questions.length === 0) return null;

  return (
    <div className="relative mt-14 w-full max-w-md text-left sm:max-w-2xl">
      <BandTexture texture="dots" />
      <div className="relative">
      <BandSpine label={label} />
      {/* Two columns from sm: at one column the six chips are a 350px stack
          that dwarfs the plan and the blog below them. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {questions.map((q, i) => (
          <Link
            key={q.slug}
            href={`/${locale}/learn/${q.slug}`}
            className={`group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.015] px-3.5 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.04] ${
              i >= HOME_QUESTIONS_MOBILE ? "hidden sm:flex" : ""
            }`}
          >
            <TopicEmblem
              slug={q.slug}
              className="size-4 shrink-0 text-[#D4A843]/70"
              strokeWidth={1.6}
            />
            <span className="min-w-0 flex-1 text-sm text-white/80 transition-colors group-hover:text-white/95">
              {q.title}
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 text-[13px] text-white/30 transition-transform group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </Link>
        ))}
      </div>
      {/* Centred with the header above it. The chips keep their left edge —
          a list of questions wants one — but a lone link hard left under a
          centred rule is the two dialects arguing inside one band. */}
      <Link
        href={`/${locale}/learn`}
        className="mx-auto mt-4 block w-fit font-mono text-[10px] uppercase tracking-[1.6px] text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
      >
        {allLabel}{" "}
        &rarr;
      </Link>
      </div>
    </div>
  );
}
