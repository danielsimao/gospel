"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { DeathCounter } from "@/components/eternity/death-counter";
import { trackVerdictReached } from "@/lib/analytics";
import { splitConfession, type ConfessionTone } from "@/lib/confession";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { TestMessages } from "@/lib/types";

interface VerdictScreenProps {
  messages: { title: string };
  testMessages: TestMessages;
}

/**
 * When the gold CTA becomes real. Everything else on this screen is present
 * from mount and revealed by motion delay — only the button needs a gate,
 * because a button at opacity 0 is an invisible click target.
 */
const BRIDGE_DELAY_MS = 1200;

/*
 * One class per tone, as a total map rather than a ternary. The distinction is
 * content correctness, not styling: rendering an evaded commandment with the
 * same force as a confessed one states something the reader did not say. A
 * ternary made every tone that was not "admitted" render as a denial, so adding
 * a fourth would have been silent — this way it fails the build.
 */
const TONE_CLASS: Record<Exclude<ConfessionTone, "plain">, string> = {
  admitted: "text-red-400",
  denied: "text-white/45",
};

export function VerdictScreen({
  messages,
  testMessages,
}: VerdictScreenProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const hasTracked = useRef(false);
  // Grace is only reachable through the full verdict, so graceReached
  // exactly means "verdict fully seen" — re-entry replays nothing.
  const returning = state.graceReached;
  const [showBridge, setShowBridge] = useState(returning);

  const confession = splitConfession(state.answers, testMessages);

  // Active elapsed test time, frozen at the verdict. This is what analytics
  // reports. RESUME_SESSION rebases startedAt so time spent away from the tab
  // is excluded (game-reducer.ts:172-201), so a session resumed days later
  // still reports minutes, not days.
  //
  // Frozen at mount rather than read live, because SHOW_VERDICT below is what
  // sets completedAt: on a first arrival it is still null throughout this
  // render, and reading it directly would report a duration of 0. On a re-read
  // it is already set and this is exact.
  const [completedAtMs] = useState(() => state.completedAt ?? Date.now());
  const durationMs = Math.max(0, completedAtMs - state.startedAt);

  // What the live counter counts, which is NOT durationMs. durationMs stops at
  // completedAt, so seeding the counter with it meant the number climbed while
  // the reader sat here and then snapped back down on a re-read from grace —
  // a count that visibly goes backwards. Measuring from startedAt to now is
  // monotonic across re-reads and is literally what the copy claims ("since
  // you started"). Frozen at mount so re-renders don't restart the count-up.
  const [counterBaseMs] = useState(() =>
    state.startedAt > 0 ? Math.max(0, Date.now() - state.startedAt) : durationMs,
  );

  // Idempotent, and a guard rather than the mechanism: ADVANCE_AFTER_FOLLOWUP
  // is what moves the last question to the verdict. The reducer refuses this
  // unless every question is answered, so it can never manufacture a verdict.
  useEffect(() => {
    dispatch({ type: "SHOW_VERDICT" });
  }, [dispatch]);

  useEffect(() => {
    if (!hasTracked.current && !returning) {
      hasTracked.current = true;
      const totalHonest = state.answers.filter(
        (a) => a.answer === "honest",
      ).length;
      const totalJustify = state.answers.filter(
        (a) => a.answer === "justify",
      ).length;
      trackVerdictReached(totalHonest, totalJustify, durationMs);
    }

    // Re-read: the CTA is live from mount, no timer to run.
    if (returning) return;

    const t = setTimeout(() => setShowBridge(true), BRIDGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.answers, durationMs, returning]);

  // Forward moves are a dispatch. The shell watches the phase and stamps the
  // history entry, so back still works without the screen knowing about URLs.
  function handleBridgeClick() {
    dispatch({ type: "SHOW_GRACE" });
  }

  // Stage delays in ms → seconds, collapsed to 0 on re-read. The whole
  // sequence lands in 1.2s (was 2.9s) and every beat enters with its own
  // gesture: stamp, rise, rise, land-from-above, rise.
  const at = (ms: number) => (returning ? 0 : ms / 1000);

  return (
    /*
     * The charge, not a report.
     *
     * What was here: eight centred blocks in one column — emblem, eyebrow,
     * GUILTY in a double frame, scripture, confession, mirror, the count in an
     * identical double frame, CTA. Measured on a 390x844 phone it came to 889px
     * of content, so the gold way out sat below the fold, behind the consent
     * banner on a first visit.
     *
     * Three things were wrong and only one of them was the scroll. GUILTY and
     * the count were the same colour, the same weight and wore the same frame,
     * so two heroes fought and neither won. The frame itself appeared four
     * times, which is texture rather than emphasis. And the confession — the
     * one sentence on this screen assembled from what this reader just said —
     * was set at 16px between them, the third-loudest thing on a screen that
     * exists to deliver it.
     *
     * So the hierarchy is inverted rather than tuned. The confession is the
     * screen. GUILTY is a stamp, because a verdict is stamped on a document and
     * is not the document. Everything else is evidence, set small, at the
     * bottom on a phone and in a rail on a desktop.
     *
     * The bottom padding is a reserve, not spacing. This screen no longer
     * scrolls, so anything the fixed consent banner covers on a first visit is
     * unrecoverable rather than a scroll away — and the evidence block now sits
     * at the bottom edge. --consent-h is published by the banner itself and
     * resolves to 0 for every returning reader, as does the safe-area inset on
     * every device without a home indicator.
     */
    <div className="relative flex flex-1 flex-col px-6 pt-14 pb-[calc(3.5rem+env(safe-area-inset-bottom)+var(--consent-h,0px))] sm:px-10 sm:pt-16 lg:px-16">
      {/* Judgment pressing down, now from the same corner the charge starts in
          rather than from dead centre. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 18% 0%, rgba(239,68,68,0.12) 0%, transparent 62%)",
        }}
      />

      {/* No aria-live, and this is load-bearing — the count's text node changes
          ~2x/second and a polite live region containing it would announce a new
          number forever. The whole verdict is in the DOM from mount, so it
          reads as ordinary content. */}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col sm:max-w-xl lg:max-w-5xl lg:flex-row lg:items-end lg:gap-14">
        <div className="flex flex-col lg:flex-1">
          {/*
           * GUILTY, stamped. Two degrees off true is the whole gesture: this
           * app has no other rotated element, and without it the block reads as
           * a badge — a label the interface applied — rather than a mark
           * pressed onto a finished record.
           */}
          <m.div
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: at(150), ease: EASE_OUT_STRONG }}
            className="-rotate-2 self-start rounded-sm border-[1.5px] border-red-500/55 px-3 py-1"
          >
            <p className="font-mono text-xs font-bold uppercase tracking-[5px] text-red-500">
              {messages.title.replace(/\.$/, "")}
            </p>
          </m.div>

          {/*
           * The subject. Ranged left, not centred: centred body text gives the
           * eye no edge to return to, and the reader has just spent ninety
           * seconds on question screens that are all ranged left.
           *
           * The tone colours are doing more work at this size than they ever
           * did at 16px — admitted runs are what the reader owns, denied runs
           * recede, and at 31px and up that contrast carries before the sentence
           * is read at all.
           */}
          <m.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: at(320), ease: EASE_OUT_STRONG }}
            className="mt-7 text-[31px] font-medium leading-[1.22] tracking-[-0.02em] text-white/90 sm:mt-9 sm:text-[44px] sm:leading-[1.18] lg:text-[52px] lg:leading-[1.14]"
          >
            {confession.map((segment, i) => {
              if (segment.tone === "plain") {
                return <Fragment key={i}>{segment.text}</Fragment>;
              }
              return (
                <span key={i} className={TONE_CLASS[segment.tone]}>
                  {segment.text}
                </span>
              );
            })}
          </m.p>

          {/* The way out. Full-width on a phone because it is the only control
              and the thumb is at the bottom; inline from sm up, where nothing
              is reaching for it. */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: at(1200), ease: EASE_OUT_STRONG }}
            className="mt-8 flex sm:mt-10 sm:justify-start"
          >
            <Button
              variant="gold"
              mist={showBridge}
              onClick={handleBridgeClick}
              disabled={!showBridge}
              className="w-full sm:w-auto"
            >
              {testMessages.verdict.bridgeButton}
              <ButtonArrow direction="down" />
            </Button>
          </m.div>
        </div>

        {/*
         * Evidence. Pushed to the bottom of the screen by mt-auto below lg, and
         * turned into a rail beside the charge above it — the extra width of a
         * desktop becomes a second column rather than bigger type, and both
         * columns land on the same baseline.
         *
         * Delayed past the counter's first frame. DeathCounter paints a literal
         * "0" for one frame before its first rAF tick, and this block is at
         * opacity 0 until well past it. Do not shorten below ~100ms.
         */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: at(700), ease: EASE_OUT_STRONG }}
          className="mt-auto flex flex-col pt-12 lg:mt-0 lg:w-80 lg:shrink-0 lg:border-l lg:border-white/[0.08] lg:pt-0 lg:pl-8"
        >
          {/* James 2:10 is the exact argument the six questions build — one
              point failed, guilty of all. It cites the law rather than
              asserting guilt in the app's own voice. */}
          <p className="text-[12.5px] italic leading-[1.7] text-white/50 sm:text-[15px] lg:text-[13.5px]">
            &ldquo;{testMessages.verdict.scripture}&rdquo;{" "}
            {/* red-400/75 is the AA floor for text this size on #060404
                (≈4.6:1). red-400/70 measures 4.1:1 and fails 1.4.3. Do not
                dim it. */}
            <span className="whitespace-nowrap font-mono text-[9px] uppercase not-italic tracking-[2px] text-red-400/75 sm:text-[11px] lg:text-[10px]">
              {testMessages.verdict.scriptureRef}
            </span>
          </p>

          {/*
           * The reader's own claim, quoted back — and only when they made one.
           * Someone who reached the test without passing the question simply
           * does not meet this beat; it is testimony, so there is nothing to
           * infer when it is absent.
           */}
          {state.selfRating && (
            <p className="mt-4 border-l border-red-500/30 pl-3 text-[12.5px] leading-[1.65] text-white/60 sm:mt-5 sm:text-[15px] lg:text-[13.5px]">
              {testMessages.verdict.selfRatingMirror[state.selfRating]}
            </p>
          )}

          {/*
           * The count, live, and no longer a monument. It keeps its red and its
           * tick and loses the 44px and the double frame, so it stops competing
           * with a verdict for the same role.
           *
           * Still its own line rather than inline in the sentence: the
           * component carries minWidth 7ch to stop the digits shifting as they
           * are added, which inside a run of prose would open a gap around a
           * three-digit number.
           */}
          <div className="mt-5 border-t border-white/[0.08] pt-5 sm:mt-7 sm:pt-7">
            <DeathCounter
              baseMs={counterBaseMs}
              className="font-mono text-2xl font-bold tabular-nums text-red-500"
              style={{ textShadow: "0 0 40px rgba(239,68,68,0.25)" }}
            />
            <p className="mt-1.5 text-[12.5px] italic leading-[1.6] text-white/55 sm:text-[14px] lg:text-[13px]">
              {testMessages.verdict.deathLineTemplate}
            </p>
            <p className="mt-1 text-[12.5px] leading-[1.6] text-red-400/85 sm:text-[14px] lg:text-[13px]">
              {testMessages.verdict.deathLineImplication}
            </p>
          </div>
        </m.div>
      </div>
    </div>
  );
}
