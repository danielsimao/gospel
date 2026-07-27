"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { Button, ButtonArrow } from "@/components/ui/button";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { GoodEnoughMessages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/**
 * The turn, and the way out.
 *
 * This is not a payoff, it is a safety mechanism. The bar deliberately induces
 * the attribution the research calls stable and global — it stops there for
 * everyone, always, whatever you do — and that is a state nobody should be left
 * in. So the turn is on screen the moment the reader has proved it for
 * themselves, never a scroll away.
 *
 * The CTA goes to /test, never straight to grace, and the reason is sharper here
 * than for any other page: the bar proves *inability*, not *guilt*. A reader who
 * only has inability concludes either "nobody gets in" or "God must let everyone
 * in", and neither is the gospel. The test is what makes it personal — so the
 * `turn` copy names the swap out loud rather than leaving them to feel
 * bait-and-switched.
 *
 * `/test` is also correct for a reader who has already taken it: that route is
 * the router, and its resume dialog forwards them from the saved session — the
 * source of truth — rather than from the separate journey flag, which can drift.
 */
export function Reveal({
  copy,
  locale,
  onCtaClick,
}: {
  copy: GoodEnoughMessages["reveal"];
  locale: Locale;
  onCtaClick: () => void;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_STRONG }}
      className="mt-8 w-full max-w-md text-left"
    >
      <p className="text-[15px] leading-relaxed text-white/80">{copy.lead}</p>

      <blockquote className="mt-6 border-l border-red-500/30 pl-4">
        <p className="text-sm italic leading-[1.8] text-white/65 sm:text-[15px]">
          &ldquo;{copy.scripture}&rdquo;
        </p>
        <cite className="mt-2 block font-mono text-[10px] uppercase not-italic tracking-[2px] text-red-400/75">
          {copy.scriptureRef}
        </cite>
      </blockquote>

      <p className="mt-6 text-[15px] leading-relaxed text-white/80">{copy.turn}</p>

      {/* Link, not router.push: this is the page built to be shared, so prefetch
          and cmd-click are worth having. Matches home-shell.tsx, which wraps its
          gold CTA the same way. */}
      <Link
        href={`/${locale}/test`}
        onClick={onCtaClick}
        className="mt-8 inline-block"
      >
        <Button variant="gold" mist>
          {copy.cta}
          <ButtonArrow />
        </Button>
      </Link>
    </m.div>
  );
}
