"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackHomeLastWordClicked } from "@/lib/eternity-analytics";
import type { Locale } from "@/lib/i18n";

interface LastWordBandProps {
  locale: Locale;
  /** The statistic itself — `home.mortalityStat`, unchanged. */
  heading: string;
  messages: {
    eyebrow: string;
    turn: string;
    scripture: string;
    scriptureRef: string;
  };
  /** `home.ctaButton` — the same door the learn and blog CTAs reuse. */
  cta: string;
}

/**
 * The page's last word: the Living Waters statistic, turned on the reader.
 *
 * This line opened the visitor block once, as an eyebrow, and was removed for
 * restating what the counter above and the crawl below already say. Down here
 * it has a different job in the one region of the page where mortality has
 * gone quiet: the reader who reaches it scrolled past the question without
 * answering, and the bands between have been talking about topics, plans and
 * posts. The A6 tract makes the same move — 10/10 on the front, the test on
 * the back — so the band ends in the tract's order: statistic, the turn, the
 * appointment, one door.
 *
 * Law register only. The statement takes the score face and the counter's red
 * glow — a declaration, per the layout's signage rule — and no gold appears:
 * this reader is pre-Law, the exact place gold costs the most to spend
 * (METHOD.md). The door is ghost and single, which is the shape the score
 * band settled after its two-door split; the scripture wording is the app's
 * committed Hebrews 9:27 phrasing from the eternity topic, quoted by markup
 * the way the verdict quotes James.
 *
 * Visitor-only, but not via a prop: the reveal rides `data-slot="visitor-band"`
 * in globals.css on the same pre-paint attribute as the stage blocks, so the
 * choice is made before first paint. Placement is load-bearing — METHOD.md's
 * "stake, not a lever" forbids mortality between a question and its answer,
 * and this sits a full page below the self-rating ask.
 */
export function LastWordBand({ locale, heading, messages, cta }: LastWordBandProps) {
  return (
    <section className="mt-24 flex w-full flex-col items-center text-center">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
        <p className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/85 sm:text-[10px] sm:tracking-[4px]">
          {messages.eyebrow}
        </p>
        <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
      </div>

      {/* Uppercasing is CSS — the copy itself stays the committed string.
          text-balance so the phone widths that cannot hold one line break
          into two even halves instead of orphaning the last word. */}
      <h2
        className="mt-5 max-w-md text-balance font-score text-[clamp(2.1rem,9vw,3.6rem)] font-bold uppercase leading-[0.95] tracking-[0.02em] text-red-500"
        style={{
          textShadow:
            "0 0 90px rgba(239,68,68,0.3), 0 0 220px rgba(239,68,68,0.14)",
        }}
      >
        {heading}
      </h2>

      <p className="mt-5 max-w-md text-[15px] leading-[1.7] text-white/60">
        {messages.turn}
      </p>

      <p className="mt-6 max-w-md text-[14px] italic leading-[1.75] text-white/70 sm:text-[15px]">
        &ldquo;{messages.scripture}&rdquo;
      </p>
      <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[3px] text-white/45">
        {messages.scriptureRef}
      </p>

      <Link
        href={`/${locale}/test`}
        onClick={() => trackHomeLastWordClicked()}
        className="mt-8"
      >
        <Button variant="ghost" size="sm">
          {cta}
        </Button>
      </Link>
    </section>
  );
}
