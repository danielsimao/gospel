"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { DeathCounter } from "@/components/eternity/death-counter";
import { trackVerdictReached } from "@/lib/analytics";
import { buildConfession } from "@/lib/confession";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { VerdictEmblem } from "@/components/emblems";
import type { GameState, TestMessages } from "@/lib/types";

interface VerdictScreenProps {
  messages: { title: string; subtitle: string };
  testMessages: TestMessages;
  state: GameState;
}

/**
 * When the gold CTA becomes real. Everything else on this screen is present
 * from mount and revealed by motion delay — only the button needs a gate,
 * because a button at opacity 0 is an invisible click target.
 */
const BRIDGE_DELAY_MS = 1200;

export function VerdictScreen({
  messages,
  testMessages,
  state,
}: VerdictScreenProps) {
  const dispatch = useGameDispatch();
  const hasTracked = useRef(false);
  // Grace is only reachable through the full verdict, so graceReached
  // exactly means "verdict fully seen" — re-entry replays nothing.
  const returning = state.graceReached;
  const [showBridge, setShowBridge] = useState(returning);

  const confession = buildConfession(state.answers, testMessages);

  // Active elapsed test time, frozen at the verdict. This is what analytics
  // reports. RESUME_SESSION rebases startedAt so time spent away from the tab
  // is excluded (game-reducer.ts:172-201), so a session resumed days later
  // still reports minutes, not days.
  const durationMs = Math.max(0, (state.completedAt ?? state.startedAt) - state.startedAt);

  // What the live counter counts, which is NOT durationMs. durationMs stops at
  // completedAt, so seeding the counter with it meant the number climbed while
  // the reader sat here and then snapped back down on a re-read from grace —
  // a count that visibly goes backwards. Measuring from startedAt to now is
  // monotonic across re-reads and is literally what the copy claims ("since
  // you started"). Frozen at mount so re-renders don't restart the count-up.
  const [counterBaseMs] = useState(() =>
    state.startedAt > 0 ? Math.max(0, Date.now() - state.startedAt) : durationMs,
  );

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

  function handleBridgeClick() {
    dispatch({ type: "SHOW_GRACE" });
  }

  // Stage delays in ms → seconds, collapsed to 0 on re-read. The whole
  // sequence lands in 1.2s (was 2.9s) and every beat enters with its own
  // gesture: stamp, rise, rise, land-from-above, rise.
  const at = (ms: number) => (returning ? 0 : ms / 1000);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
      {/* Judgment pressing down from above. Grace has a warm wash from centre
          and the invitation has a two-point crossroads gradient; the verdict
          was the only screen in the flow on bare black. No blur filter here
          (unlike grace): the gradient already fades out at 58%, and blurring
          a fixed full-viewport layer costs a composited pass for nothing. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.13) 0%, transparent 58%)",
        }}
      />

      {/* No aria-live here, and this is load-bearing. The old screen needed it
          because the confession, count, and CTA arrived on setTimeout — with
          nothing announced, a screen reader never heard them. Now the whole
          verdict is in the DOM from mount, so it reads as ordinary content.
          Keeping aria-live would be actively harmful: the counter's text node
          changes ~2×/second, and a polite live region containing it would
          announce a new number forever. */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* The scales + the house eyebrow. At the old size-6/60% the emblem
            was invisible — paying for a graphic and not getting one. The
            hairline-label-hairline row is the pattern grace and the
            invitation both use; the verdict was the odd one out. */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VerdictEmblem
            className="mx-auto mb-3.5 size-10 text-red-400/70"
            strokeWidth={1.4}
            aria-hidden
          />
          <div className="flex items-center justify-center gap-2">
            <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
            <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
              {testMessages.verdict.prelude}
            </span>
            <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
          </div>
        </m.div>

        {/* GUILTY — stamped verdict block. Entrance lands from above
            (1.15 → 1, composite-only) instead of growing in: a stamp hit,
            not a bloom. Double hairlines frame it as an official record. */}
        <m.div
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: at(200), ease: EASE_OUT_STRONG }}
          className="mt-4 w-full max-w-sm border-y-2 border-red-500/30 py-4 sm:py-5"
        >
          <p
            className="text-5xl font-black uppercase tracking-[0.15em] text-red-500 sm:text-6xl md:text-7xl"
            style={{
              textShadow:
                "0 0 80px rgba(239,68,68,0.35), 0 0 160px rgba(239,68,68,0.12), 0 4px 40px rgba(0,0,0,0.8)",
            }}
          >
            {messages.title.replace(/\.$/, "")}
          </p>
        </m.div>

        {/* The authority. Previously the screen asserted guilt in the app's
            own voice (messages.subtitle) and the law screen cited no law.
            James 2:10 is the exact argument the eight questions build — one
            point failed, guilty of all — and it rhymes with the heading above
            it in both languages. Red border, not the house gold: this is the
            law side of the flow. */}
        <m.blockquote
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: at(520), ease: EASE_OUT_STRONG }}
          className="mt-6 w-full max-w-sm border-l border-red-500/30 pl-4 text-left"
        >
          <p className="text-sm italic leading-[1.8] text-white/60 sm:text-[15px]">
            &ldquo;{testMessages.verdict.scripture}&rdquo;
          </p>
          {/* red-400/75 is the AA floor for small text on #060404 (≈4.6:1) —
              the same value the existing chips and prelude already use.
              red-400/70 measures 4.1:1 and fails 1.4.3. Do not dim it. */}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[2px] text-red-400/75">
            {testMessages.verdict.scriptureRef}
          </p>
        </m.blockquote>

        {/* Dynamic confession prose — the personalised centre of the screen. */}
        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: at(700), ease: EASE_OUT_STRONG }}
          className="mt-6 max-w-sm text-base leading-relaxed text-white/85 sm:text-lg"
        >
          {confession}
        </m.p>

        {/* No evidence list here. The old chips were the test HUD's markup
            verbatim, and promoting them to a full record would have restated
            the confession sentence above — which already names every
            commandment and how it was answered — while adding ~270px that
            pushed the CTA off a 390×844 viewport. The confession IS the
            record, in better prose. */}

        {/* The count, live. A number whose entire meaning is "time is
            passing" cannot be a static fade-in, and because it never stops
            the reader is never parked in front of a finished screen. Framed
            in the same border-y-2 as GUILTY so the word and the number read
            as siblings instead of one dominating. Lands from above. */}
        <m.div
          initial={{ opacity: 0, y: -14, scale: 1.06 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.62, delay: at(880), ease: EASE_OUT_STRONG }}
          className="mt-8 w-full max-w-sm border-y-2 border-red-500/25 py-5"
        >
          {/* The component's own minWidth: 7ch stays — at these sizes it is
              ≈200-250px inside a 384px column, and it is what stops the
              centred number shifting as digits are added. The span also
              paints a literal "0" for one frame before the first rAF tick;
              that frame happens at opacity 0 behind this block's 880ms
              delay, so it is never visible. Do not shorten that delay below
              ~100ms without re-checking. */}
          <DeathCounter
            baseMs={counterBaseMs}
            className="font-mono text-5xl font-extrabold tabular-nums text-red-500 sm:text-6xl"
            style={{ textShadow: "0 0 60px rgba(239,68,68,0.28)" }}
          />
          <p className="mt-2.5 text-xs italic leading-relaxed text-white/60 sm:text-[13px]">
            {testMessages.verdict.deathLineTemplate}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-red-400/85 sm:text-[13px]">
            {testMessages.verdict.deathLineImplication}
          </p>
        </m.div>

        {/* Bridge — the one gold thing on a red screen. */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: at(1200), ease: EASE_OUT_STRONG }}
          className="mt-9"
        >
          <Button
            variant="gold"
            mist={showBridge}
            onClick={handleBridgeClick}
            disabled={!showBridge}
          >
            {testMessages.verdict.bridgeButton}
            <ButtonArrow direction="down" />
          </Button>
        </m.div>
      </div>
    </div>
  );
}
