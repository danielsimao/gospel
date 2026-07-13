"use client";

import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { useJourney, TOTAL_READING_DAYS } from "@/lib/use-journey";
import { trackBlogCtaClicked } from "@/lib/blog-analytics";

interface PersonalTurnProps {
  slug: string;
  locale: string;
  setup: string;
  question: string;
  ctaButton: string;
  readingCtaButton: string;
}

/**
 * The Living Waters pivot that ends every post: the story was about them —
 * this is about you. CTA is stage-aware (same decision table as TopicNav):
 * not tested → the test; tested but reading incomplete → reading plan;
 * fully walked → the question stands on its own.
 */
export function PersonalTurn({ slug, locale, setup, question, ctaButton, readingCtaButton }: PersonalTurnProps) {
  const { stage, readingDone, ready } = useJourney();
  const testDone = stage !== "visitor";
  const readingComplete = readingDone >= TOTAL_READING_DAYS;

  const cta = !ready
    ? null
    : !testDone
      ? { label: ctaButton, href: `/${locale}/test` }
      : !readingComplete
        ? { label: readingCtaButton, href: `/${locale}/reading-plan` }
        : null;

  return (
    <section id="personal-turn" className="mt-16 border-t border-white/[0.06] pt-10 text-center">
      <p className="mx-auto max-w-md text-[15px] leading-[1.85] text-white/60 sm:text-base">{setup}</p>
      <p className="mx-auto mt-6 max-w-md text-xl font-bold italic leading-snug text-white/90 sm:text-2xl">
        {question}
      </p>
      {/* CTA slot is height-reserved so the stage-aware button appearing
          post-hydration never shifts the references block below. */}
      <div className="mt-8 flex min-h-[52px] items-start justify-center">
        {cta && (
          <Link href={cta.href} onClick={() => trackBlogCtaClicked(slug, "personal_turn", stage)}>
            <Button variant="gold" mist>
              {cta.label}
              <ButtonArrow />
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
