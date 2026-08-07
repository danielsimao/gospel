import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import { TopicEmblem } from "@/components/emblems";
import { hasTopicCover } from "@/components/learn/topic-cover";
import { HOME_QUESTION_SLUGS } from "@/lib/home-questions";
import type { Locale } from "@/lib/i18n";

interface QuestionsBandProps {
  locale: Locale;
  label: string;
  allLabel: string;
  /** Every learn topic, so the band can resolve its slugs to titles. */
  topics: Array<{ slug: string; title: string }>;
}

/**
 * Three of the fourteen learn topics, as their own question, as cards.
 *
 * This section replaced a row that read "Honest answers / Short answers to the
 * hard questions" — a description of a filing cabinet whose contents are the
 * best copy on the site — first with six stacked rows, now with one row of
 * three cover cards. Six mixed shapes (two photo tiles among four text rows)
 * read as a list with two decorated entries; three uniform cards read as a
 * section with an approach, and the six-row list still exists one tap away
 * on /learn.
 *
 * Every card is the same frame — cover photo when the topic has one
 * (`hasTopicCover`, the same source of truth as /learn's topic pages), the
 * gold medallion on its own ground until then. The day the third cover lands
 * in TOPIC_COVERS, its card flips from medallion to photo and nothing else
 * moves. The title seats into the frame's bottom scrim exactly like
 * TopicCover, so the cards and the topic pages they open read as one idiom.
 *
 * Stacked wide on a phone, three portrait columns from sm — the same cards,
 * recropped by aspect rather than rebuilt, which is why the covers keep
 * generous dark space around their subjects (see PROMPTS.md §§9–11, 15).
 */
export function QuestionsBand({ locale, label, allLabel, topics }: QuestionsBandProps) {
  const bySlug = new Map(topics.map((t) => [t.slug, t.title]));
  // A slug with no title means the topic was renamed. The unit test fails the
  // build for that, so this only ever drops one at runtime if messages and code
  // ship out of step — better a shorter row than a card with no words in it.
  const questions = HOME_QUESTION_SLUGS.flatMap((slug) => {
    const title = bySlug.get(slug);
    return title ? [{ slug: slug as string, title }] : [];
  });

  if (questions.length === 0) return null;

  return (
    <div className="relative mt-24 w-full max-w-md text-left sm:max-w-2xl">
      <div className="relative">
        <BandSpine label={label} />
        <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {questions.map((q) => (
            <Link
              key={q.slug}
              href={`/${locale}/learn/${q.slug}`}
              className="group relative block aspect-[2.6/1] overflow-hidden rounded-2xl border border-white/[0.08] transition-colors hover:border-white/20 sm:aspect-[3/4]"
            >
              {hasTopicCover(q.slug) ? (
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
              ) : (
                /* The cover-less card: the reading band's medallion idiom on
                   the card's own ground, centred in the space the title's
                   scrim leaves free. Same frame, same title seat — a reader
                   sees three cards, not two photos and an apology. */
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center bg-white/[0.015] pb-10"
                >
                  <span
                    className="relative flex size-13 items-center justify-center rounded-full border border-[#D4A843]/25 shadow-[0_0_22px_-4px_rgba(212,168,67,0.35),inset_0_0_12px_rgba(212,168,67,0.08)]"
                    style={{
                      background:
                        "radial-gradient(circle at 35% 30%, rgba(212,168,67,0.16), rgba(212,168,67,0.03) 70%)",
                    }}
                  >
                    <TopicEmblem slug={q.slug} className="size-6 text-[#D4A843]" strokeWidth={1.6} />
                  </span>
                </span>
              )}
              {/* One scrim for both card kinds, so the title always sits on
                  the same ground — over a photo it seats the line, over the
                  medallion ground it is invisible against near-identical
                  darkness. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#060404] from-[10%] via-[#060404]/45 via-[45%] to-transparent"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
                <span
                  className="text-[15px] font-bold leading-snug text-[#D4A843]"
                  style={{ textShadow: "0 0 20px rgba(212,168,67,0.4), 0 2px 10px rgba(0,0,0,0.7)" }}
                >
                  {q.title}
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 pb-0.5 text-[13px] text-white/40 transition-transform group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          ))}
        </div>
        {/* Centred with the header above it — a lone link hard left under a
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
