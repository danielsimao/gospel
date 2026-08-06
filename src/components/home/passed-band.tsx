"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BandHeader } from "@/components/next-steps/band-header";
import type { Locale } from "@/lib/i18n";

interface PassedBandProps {
  locale: Locale;
  messages: {
    eyebrow: string;
    /** Under the red number: "chumbaram" / "failed". */
    failedCaption: string;
    /** Under the gold 1: "passou" / "passed". */
    passedCaption: string;
    /** The red side's value when no count is available — "Todos" / "All".
        The sentence "todos chumbaram · 1 passou" needs no number to land. */
    failedFallback: string;
    whoCta: string;
    testCta: string;
  };
  /** Readers who reached the verdict, or null when unavailable. A floor
      either way: consent-gating hides decliners from the historic count, and
      the anonymous counter only reaches back to the day it shipped. */
  count: number | null;
}

/*
 * The face-off: two numbers, either side of a line.
 *
 * The doctrine first, because it licenses the layout. The test is the Law,
 * and exactly one person in history kept it — not a quip but the load-bearing
 * fact of the gospel: he could pay the fine because he owed nothing. Grace's
 * third movement says it as "lived the life you couldn't"; this band says it
 * as a scoreline.
 *
 * Both sides are set at the SAME type size, and that is the design. The
 * asymmetry is carried entirely by the values and the colours — thousands in
 * red against a single gold 1 — which is what makes the ratio the argument
 * rather than either number alone. Red fails, gold passes: the palette is the
 * legend, no labels needed beyond one word under each.
 *
 * The red side counts up when the band scrolls into view, and the gold side
 * arrives only after it stops — gold arriving late, after the Law has done
 * its work, is the site's own grammar. Reduced motion gets the final state.
 *
 * Two doors out, deliberately unequal: "Descobre quem" is the primary — the
 * reader this band hooks wants the answer — and the test is the quiet second,
 * for whoever hears the scoreline as a challenge.
 */
export function PassedBand({ locale, messages, count }: PassedBandProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const [passVisible, setPassVisible] = useState(false);

  const formatted =
    count === null
      ? messages.failedFallback
      : new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-US").format(count);

  /*
   * The count-up, off the main React render path on purpose: sixty state
   * updates a second through setState would re-render the whole band per
   * frame for a number only one span cares about. The ref writes textContent
   * directly; React never knows the animation happened.
   */
  useEffect(() => {
    const root = rootRef.current;
    const target = countRef.current;
    if (!root || !target) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // No number to climb to, no observer, or no motion: the band simply is.
    if (count === null || reduced || typeof IntersectionObserver === "undefined") {
      target.textContent = formatted;
      setPassVisible(true);
      return;
    }

    target.textContent = "0";
    const formatter = new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-US");
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const DURATION = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          // ease-out quartic: fast early, settling late, like the house curve
          const eased = 1 - (1 - t) ** 4;
          target.textContent = formatter.format(Math.round(eased * count));
          if (t < 1) raf = requestAnimationFrame(tick);
          // The pause before gold is the design: the Law finishes first.
          else setTimeout(() => setPassVisible(true), 350);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [count, formatted, locale]);

  return (
    <div ref={rootRef} className="mt-12 w-full max-w-md text-left sm:max-w-2xl">
      <BandHeader label={messages.eyebrow} tone="dim" />

      {/* Open, not boxed: this is a beat of the page, not a widget. The grid
          centres both sides on the divider whatever the number's width. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-6 sm:gap-6 sm:py-8">
        <div className="text-center">
          <span
            ref={countRef}
            className="font-mono text-[clamp(2.1rem,9vw,3.4rem)] leading-none tracking-tight text-red-400 tabular-nums"
          >
            {formatted}
          </span>
          <span className="mt-2.5 block font-mono text-[10px] uppercase tracking-[2.6px] text-red-400/60">
            {messages.failedCaption}
          </span>
        </div>

        <div
          aria-hidden="true"
          className="h-20 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent sm:h-24"
        />

        {/* Same size as the red side — the values carry the asymmetry. */}
        <div
          className={`text-center transition-[opacity,transform] duration-700 ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
            passVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <span
            className="font-mono text-[clamp(2.1rem,9vw,3.4rem)] leading-none tracking-tight text-[#D4A843] tabular-nums"
            style={{ textShadow: "0 0 70px rgba(212,168,67,0.4)" }}
          >
            1
          </span>
          <span className="mt-2.5 block font-mono text-[10px] uppercase tracking-[2.6px] text-[#D4A843]/75">
            {messages.passedCaption}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <Link
          href={`/${locale}/learn/who-is-jesus`}
          className="font-mono text-[11px] uppercase tracking-[1.6px] text-[#D4A843]/90 transition-colors hover:text-[#D4A843]"
        >
          {messages.whoCta} &rarr;
        </Link>
        <Link
          href={`/${locale}/test`}
          className="text-[13px] text-white/50 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/70"
        >
          {messages.testCta}
        </Link>
      </div>
    </div>
  );
}
