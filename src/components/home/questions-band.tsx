import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import { TopicEmblem } from "@/components/emblems";
import { hasTopicCover } from "@/components/learn/topic-cover";
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
 * A question with a shipped cover (`hasTopicCover`, same source of truth as
 * /learn's topic pages) gets that photo, title set into the frame exactly
 * like TopicCover. Everything else gets the medallion the reading band
 * already carries — the emblem that was too small to read at 16px, at 44px
 * in a glowing ring instead. One column, not a grid: a square photo tile and
 * a wide text row have no shape in common, so nothing has to reconcile them.
 * The day a third question gets a cover, that row flips from medallion to
 * photo and nothing else moves.
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
    <div className="relative mt-24 w-full max-w-md text-left sm:max-w-2xl">
      <div className="relative">
      <BandSpine label={label} />
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => {
          const hidden = i >= HOME_QUESTIONS_MOBILE;
          return hasTopicCover(q.slug) ? (
            <Link
              key={q.slug}
              href={`/${locale}/learn/${q.slug}`}
              className={`group relative block aspect-[2.6/1] overflow-hidden rounded-2xl border border-white/[0.08] ${
                hidden ? "hidden sm:block" : ""
              }`}
            >
              <picture>
                <source srcSet={`/graphics/covers/${q.slug}.avif`} type="image/avif" />
                {/* The photo leans in on hover/focus — transform only, so it
                    never repaints, and the frame's overflow-hidden crops the
                    growth. The house strong ease-out, slow enough to read as
                    the picture breathing rather than a zoom control. Keyboard
                    gets the same move via group-focus-visible; reduced motion
                    gets a still photo, which loses nothing this band says. */}
                <img
                  src={`/graphics/covers/${q.slug}.webp`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-[var(--ease-out-strong)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-[#060404] from-[10%] via-[#060404]/45 via-[45%] to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-3.5">
                <span
                  className="text-[15px] font-bold text-[#D4A843]"
                  style={{ textShadow: "0 0 20px rgba(212,168,67,0.4), 0 2px 10px rgba(0,0,0,0.7)" }}
                >
                  {q.title}
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[13px] text-white/40 transition-transform group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          ) : (
            <Link
              key={q.slug}
              href={`/${locale}/learn/${q.slug}`}
              className={`group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.015] px-3.5 py-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.04] ${
                hidden ? "hidden sm:flex" : ""
              }`}
            >
              <span
                aria-hidden="true"
                className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-[#D4A843]/25 shadow-[0_0_22px_-4px_rgba(212,168,67,0.35),inset_0_0_12px_rgba(212,168,67,0.08)]"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, rgba(212,168,67,0.16), rgba(212,168,67,0.03) 70%)",
                }}
              >
                <TopicEmblem slug={q.slug} className="size-5 text-[#D4A843]" strokeWidth={1.6} />
              </span>
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
          );
        })}
      </div>
      {/* Centred with the header above it. The rows keep their left edge —
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
