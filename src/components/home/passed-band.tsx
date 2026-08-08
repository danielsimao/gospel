"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import { BandTexture } from "@/components/home/band-texture";
import { Button, ButtonArrow } from "@/components/ui/button";
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
    /** Under the verdict bar, with `{n}` for the live count. */
    barCaption: string;
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
 * The zero has to be written before the browser paints, not after.
 *
 * The span renders the real number in JSX — it must, so the server sends it
 * and a reader without JS still gets a score. But the count-up then rewinds
 * that span to "0", and in a plain effect (which runs after paint) the reader
 * saw the final number, a flash to zero, and only then the climb. Rewinding
 * in a layout effect happens in the same frame as hydration, so the first
 * thing painted is already the zero.
 *
 * `useEffect` on the server: layout effects never run there, and React warns
 * if one is scheduled during SSR. The value is only ever read on the client,
 * where this is always useLayoutEffect.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * How much of the band has to be on screen for the count-up to be its
 * entrance. Read twice — once to decide whether there is anything left to
 * reveal at hydration, once as the observer's own threshold — and it has to be
 * the same number both times or the band can fall between them and never
 * animate at all.
 */
const VISIBLE_THRESHOLD = 0.5;

/**
 * How much of the band is on screen, as a fraction of how much of it *could*
 * be — never of its own height.
 *
 * IntersectionObserver's own ratio is target-relative, so a band taller than
 * twice the viewport can never reach 0.5 no matter how it is scrolled.
 * Verified in Chromium: a box three viewports tall, filling the screen, still
 * reports ratio 0.333 and isIntersecting false against a 0.5 threshold — the
 * count-up would never fire and the score would sit at "0" permanently, which
 * is not a missing animation but a wrong number. Not hypothetical: at high
 * browser zoom (WCAG 1.4.4 asks for 400%) the viewport shrinks under a band
 * whose height does not.
 *
 * Capping the denominator at the viewport makes "half of what you could see"
 * always reachable. The observer callback re-measures through this same
 * function rather than trusting entry.intersectionRatio, so the staged check
 * and the fired check cannot disagree.
 */
function revealedRatio(rect: DOMRect, viewportHeight: number): number {
  const reachable = Math.min(rect.height, viewportHeight);
  if (reachable <= 0) return 0;
  const visible = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  return Math.max(0, visible) / reachable;
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
  /* The verdict bar's caption repeats the count in words. Every write to the
     numeral writes here too — count-up, slow tick, rewind — because two copies
     of one live number that can disagree is worse than either alone. */
  const captionCountRef = useRef<HTMLSpanElement | null>(null);
  /*
   * Visible until JavaScript says otherwise, not hidden until it says so.
   *
   * This started false, so the server sent the gold column at opacity-0 and
   * only a client effect ever revealed it — a reader without JS got "1,845
   * failed" and no "1 passed" at all. The ratio IS the argument here; half of
   * it is not a degraded version of this band, it is the opposite claim.
   *
   * So the hiding happens in the layout effect, in the one branch that is
   * actually going to animate, and before paint — see the staging note below.
   */
  const [passVisible, setPassVisible] = useState(true);

  /*
   * The real count when there is one. The model only when there is not.
   *
   * This was `Math.max(count ?? 0, estimateTestTakerCount())`, added to stop
   * the score going backwards if PostHog answered lower than the model. It did
   * stop that, and in exchange it guaranteed the opposite failure: the model
   * grows 35/day unconditionally, so the real number could never surface until
   * it out-ran a figure that keeps running away from it. On 2026-08-07, with
   * the key finally configured and PostHog answering, the homepage still
   * published 1,845 — the model, to the digit — because max() discarded the
   * truth every hour. A number that can never be true is worse than a number
   * that can go down.
   *
   * Owner's call, and the right one for this band: it wears a pulsing "live"
   * badge, and liveness is the thing it trades on. A real number that moves is
   * the point; a modelled one that only ever climbs is a prop. Slight
   * over-count is accepted deliberately — the anonymous counter dedupes per
   * device, not per person.
   *
   * Day-granular on both sides, so server and client still agree at hydration.
   */
  const target = count ?? estimateTestTakerCount();
  const formatter = new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-US");

  /*
   * Count-up and tick, off the React render path on purpose: sixty state
   * updates a second through setState would re-render the whole band per
   * frame for a number only one span cares about. The ref writes textContent
   * directly; React never knows the animation happened.
   */
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const el = countRef.current;
    if (!root || !el) return;

    let raf = 0;
    let tickTimer: ReturnType<typeof setTimeout> | undefined;
    let goldTimer: ReturnType<typeof setTimeout> | undefined;
    let live = target;

    /* One write for the two places the number lives. */
    const writeCount = (value: string) => {
      el.textContent = value;
      if (captionCountRef.current) captionCountRef.current.textContent = value;
    };

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
        writeCount(formatter.format(live));
        scheduleTick();
      }, 34_000 + Math.random() * 26_000);
    };

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      // No entrance, but the score still lives: the tick is content, not
      // motion. The gold is already visible — it ships that way — so there is
      // nothing to reveal here, only the running count to keep.
      writeCount(formatter.format(target));
      scheduleTick();
      return () => clearTimeout(tickTimer);
    }

    /*
     * Rewind to zero only while the band is still off-screen.
     *
     * The span is server-rendered with the real number, so the browser paints
     * "1,845" the moment the HTML lands — before React has hydrated and can
     * rewind it. Measured: four frames of the final number, then 0, then the
     * climb. A layout effect does not help; the gap is hydration itself, not
     * effect timing.
     *
     * So the count-up is only staged when there is something left to reveal.
     * Below the fold (where this band lives) the rewind happens unseen and the
     * reader gets the full climb on scroll. Already in view at hydration — a
     * tall window, a restored scroll position, an anchor — and the number
     * simply stays the number: no flash, no rewind, no animation that would
     * have to start by contradicting what was already read.
     *
     * Measured against the observer's OWN rule rather than "is any part of it
     * on screen". A first attempt used `top < innerHeight`, which counts a band
     * peeking one pixel over the fold as visible: at 390x760 the band's top
     * sits at 659, so the rewind was skipped while the observer — needing half
     * the band — would never have fired either, and the count-up was lost
     * entirely. One function, one rule, so the two cannot disagree.
     */
    if (revealedRatio(root.getBoundingClientRect(), window.innerHeight) >= VISIBLE_THRESHOLD) {
      scheduleTick();
      return () => clearTimeout(tickTimer);
    }

    /*
     * Stage the entrance: rewind the count and take the gold back.
     *
     * Both writes happen here rather than in the markup so the server's HTML
     * stays complete — the whole score is in it, and a reader without JS keeps
     * both halves. This branch only runs when the band is still off-screen, in
     * a layout effect, so nothing that gets hidden was ever painted.
     */
    setPassVisible(false);
    writeCount("0");
    const observer = new IntersectionObserver(
      () => {
        /*
         * Re-measured rather than read off entry.intersectionRatio, which is
         * target-relative and unreachable for a band taller than two
         * viewports. The several thresholds are only there to get called
         * during the scroll at all — a single 0 fires on the way in and never
         * again, so a band that entered at 10% would be judged once, at 10%,
         * and never animate.
         */
        if (revealedRatio(root.getBoundingClientRect(), window.innerHeight) < VISIBLE_THRESHOLD) {
          return;
        }
        observer.disconnect();
        const start = performance.now();
        const DURATION = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          // ease-out quartic: fast early, settling late, like the house curve
          const eased = 1 - (1 - t) ** 4;
          writeCount(formatter.format(Math.round(eased * target)));
          if (t < 1) raf = requestAnimationFrame(tick);
          else {
            // The pause before gold is the design: the Law finishes first.
            // Held, not fired and forgotten: an effect re-run during the pause
            // would otherwise reveal gold over a freshly staged count-up.
            goldTimer = setTimeout(() => setPassVisible(true), 350);
            scheduleTick();
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: [0, 0.25, VISIBLE_THRESHOLD, 0.75, 1] },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(tickTimer);
      clearTimeout(goldTimer);
    };
  }, [target, locale]);

  return (
    <div ref={rootRef} className="relative mt-14 w-full max-w-md text-left sm:max-w-2xl">
      <BandTexture texture="tally" />
      <div className="relative">
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

      {/*
       * The verdict bar — the whole score as one graphic: a wall of red for
       * everyone who stood trial, one gold stroke for the One who passed.
       * This is the tally texture's own documented idea ("the single gold
       * stroke is drawn in code on top, so the count stays honest" —
       * PROMPTS.md §1) promoted from background to instrument. The stroke
       * breathes on the LIVE pulse and holds still, visible, under reduced
       * motion — the fact-crawl precedent, again.
       *
       * The caption restates the ratio in words, in the interface mono — not
       * the score face, which stays on the two numerals alone. Its count is a
       * second copy of a live number, so every write to the numeral writes
       * here too (see writeCount); a caption that lags the score it captions
       * would be the band contradicting itself in one breath.
       */}
      <div className="mb-7">
        <div className="relative h-[5px] rounded-full bg-gradient-to-r from-red-400/50 to-red-400/25">
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-1/2 h-[15px] w-[3px] -translate-y-1/2 rounded-[2px] bg-[#D4A843] shadow-[0_0_12px_rgba(212,168,67,0.8),0_0_30px_rgba(212,168,67,0.4)] animate-pulse motion-reduce:animate-none"
          />
        </div>
        <p className="mt-3 text-center font-mono text-[9.5px] uppercase tracking-[1.8px] text-white/40">
          {messages.barCaption.split("{n}").map((part, i) =>
            i === 0 ? (
              part
            ) : (
              <span key={i}>
                <span ref={captionCountRef} suppressHydrationWarning>
                  {formatter.format(target)}
                </span>
                {part}
              </span>
            ),
          )}
        </p>
      </div>

      {/* One door owns the band. The ghost "take the test" button that stood
          beside the gold one split the band's question in two — and the ask
          above this band already IS the test's entry. The test door stays,
          demoted to the quiet underlined line the journey stages use for
          retake: present for whoever hears the scoreline as a challenge,
          silent for everyone else. */}
      <div className="flex flex-col items-center">
        <Link href={`/${locale}/learn/who-is-jesus`}>
          <Button variant="gold" size="sm">
            {messages.whoCta}
            <ButtonArrow />
          </Button>
        </Link>
        <Link
          href={`/${locale}/test`}
          className="mt-4 text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
        >
          {messages.testCta}
        </Link>
      </div>
      </div>
    </div>
  );
}
