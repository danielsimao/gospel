"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import { estimateTestTakerCount } from "@/lib/test-stats";
import type { Locale } from "@/lib/i18n";

interface PassedBandProps {
  locale: Locale;
  messages: {
    eyebrow: string;
    /** The pulsing badge over the red side — "ao vivo" / "live". */
    liveBadge: string;
    /** Under the red number: "chumbaram" / "failed". */
    failedCaption: string;
    /** Under the gold 1: "passou" / "passed". */
    passedCaption: string;
    whoCta: string;
    testCta: string;
  };
  /** Readers who reached the verdict, or null when neither counter can
      answer — in which case the modelled estimate stands in. Both are floors:
      consent-gating hides decliners, and the anonymous counter only reaches
      back to the day it shipped. */
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
 * rather than either number alone.
 *
 * The red side is built to feel live, because a score nobody is keeping is
 * just typography: it counts up when the band enters the viewport, wears the
 * test page's own "ao vivo" pulse, and keeps ticking upward slowly while the
 * reader lingers. When no real count is available the modelled estimate
 * stands in (see lib/test-stats) — a rate, like the death counter, with the
 * real number taking over as the counters accumulate. The gold side arrives
 * only after the red stops climbing: gold arriving late, after the Law has
 * finished, is the site's own grammar.
 */
export function PassedBand({ locale, messages, count }: PassedBandProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const [passVisible, setPassVisible] = useState(false);

  // Day-granular estimate, so server and client render the same number and
  // hydration has nothing to disagree about.
  const target = count ?? estimateTestTakerCount();
  const formatter = new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-US");

  /*
   * Count-up and tick, off the React render path on purpose: sixty state
   * updates a second through setState would re-render the whole band per
   * frame for a number only one span cares about. The ref writes textContent
   * directly; React never knows the animation happened.
   */
  useEffect(() => {
    const root = rootRef.current;
    const el = countRef.current;
    if (!root || !el) return;

    let raf = 0;
    let tickTimer: ReturnType<typeof setTimeout> | undefined;
    let live = target;

    /*
     * The slow tick: +1 at an uneven 34–60s. Most readers never see one —
     * the liveness they feel is the count-up and the pulse — but the reader
     * who lingers sees the score move under them, which is the point. Jitter
     * so two ticks never feel metronomic; the drift from the real count is at
     * most a handful before the hourly revalidation corrects it.
     */
    const scheduleTick = () => {
      tickTimer = setTimeout(() => {
        live += 1;
        el.textContent = formatter.format(live);
        scheduleTick();
      }, 34_000 + Math.random() * 26_000);
    };

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      // No entrance, but the score still lives: the tick is content, not motion.
      el.textContent = formatter.format(target);
      setPassVisible(true);
      scheduleTick();
      return () => clearTimeout(tickTimer);
    }

    el.textContent = "0";
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
          el.textContent = formatter.format(Math.round(eased * target));
          if (t < 1) raf = requestAnimationFrame(tick);
          else {
            // The pause before gold is the design: the Law finishes first.
            setTimeout(() => setPassVisible(true), 350);
            scheduleTick();
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(tickTimer);
    };
  }, [target, locale]);

  return (
    <div ref={rootRef} className="mt-14 w-full max-w-md text-left sm:max-w-2xl">
      <BandSpine label={messages.eyebrow} />

      {/* Open, not boxed: this is a beat of the page, not a widget. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-6 sm:gap-6 sm:py-8">
        <div className="text-center">
          {/* The test page's own liveness mark: a pulsing red point. It stops
              pulsing under reduced motion and stays visible — the fact-crawl
              precedent. */}
          <span className="mb-2.5 flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-[2px] text-red-400/70">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-red-500 animate-pulse motion-reduce:animate-none"
            />
            {messages.liveBadge}
          </span>
          <span
            ref={countRef}
            // The estimate is day-granular so both sides of hydration agree,
            // but a band mounted at midnight straddles the boundary.
            suppressHydrationWarning
            className="font-score text-[clamp(2.9rem,12vw,4.6rem)] font-bold leading-[0.85] tracking-[0.01em] text-red-400 tabular-nums"
          >
            {formatter.format(target)}
          </span>
          <span className="mt-2.5 block font-mono text-[10px] uppercase tracking-[2.6px] text-red-400/60">
            {messages.failedCaption}
          </span>
        </div>

        <div
          aria-hidden="true"
          className="h-24 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent sm:h-28"
        />

        {/* Same size as the red side — the values carry the asymmetry. */}
        <div
          className={`text-center transition-[opacity,transform] duration-700 ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
            passVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          {/* Spacer mirroring the live badge, so both numerals share a baseline. */}
          <span aria-hidden="true" className="mb-2.5 block font-mono text-[9px]">
            &nbsp;
          </span>
          <span
            className="font-score text-[clamp(2.9rem,12vw,4.6rem)] font-bold leading-[0.85] tracking-[0.01em] text-[#D4A843] tabular-nums"
            style={{ textShadow: "0 0 70px rgba(212,168,67,0.4)" }}
          >
            1
          </span>
          <span className="mt-2.5 block font-mono text-[10px] uppercase tracking-[2.6px] text-[#D4A843]/75">
            {messages.passedCaption}
          </span>
        </div>
      </div>

      {/* Two pills, deliberately unequal: the gold door is the one this band
          exists for, the test is the quiet second for whoever hears the
          scoreline as a challenge. Pills rather than bare links — the band is
          open and centred, and two loose text links under two large numerals
          read as footnotes rather than doors. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/${locale}/learn/who-is-jesus`}
          className="rounded-full border border-[#D4A843]/60 bg-[#D4A843]/[0.08] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[1.6px] text-[#D4A843] transition-colors hover:border-[#D4A843]/90 hover:bg-[#D4A843]/[0.14]"
          style={{ boxShadow: "0 0 40px rgba(212,168,67,0.12)" }}
        >
          {messages.whoCta} &rarr;
        </Link>
        <Link
          href={`/${locale}/test`}
          className="rounded-full border border-white/[0.13] px-5 py-2.5 text-[13px] text-white/60 transition-colors hover:border-white/25 hover:text-white/80"
        >
          {messages.testCta}
        </Link>
      </div>
    </div>
  );
}
