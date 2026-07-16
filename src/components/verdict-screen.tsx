"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
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

const DEATHS_PER_SECOND = 1.8;

export function VerdictScreen({
  messages,
  testMessages,
  state,
}: VerdictScreenProps) {
  const dispatch = useGameDispatch();
  const hasTracked = useRef(false);
  const [showConfession, setShowConfession] = useState(false);
  const [showDeathLine, setShowDeathLine] = useState(false);
  const [showBridge, setShowBridge] = useState(false);

  const confession = buildConfession(state.answers, testMessages);

  // Deaths during test = (completedAt - startedAt) in seconds × 1.8
  const durationMs = Math.max(0, (state.completedAt ?? state.startedAt) - state.startedAt);
  const deathCount = Math.floor((durationMs / 1000) * DEATHS_PER_SECOND);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      const totalHonest = state.answers.filter(
        (a) => a.answer === "honest",
      ).length;
      const totalJustify = state.answers.filter(
        (a) => a.answer === "justify",
      ).length;
      trackVerdictReached(totalHonest, totalJustify, durationMs);
    }

    // Staggered reveals — compressed: a reader should never sit in front of
    // a finished screen waiting for the only button to exist. Order:
    // GUILTY (0.3s) → standard line (0.8s) → confession → count → bridge.
    const t1 = setTimeout(() => setShowConfession(true), 1400);
    const t2 = setTimeout(() => setShowDeathLine(true), 2200);
    const t3 = setTimeout(() => setShowBridge(true), 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [state.answers, durationMs]);

  function handleBridgeClick() {
    dispatch({ type: "SHOW_GRACE" });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
      {/* aria-live: the confession, count, and bridge fade in on timers —
          without a live region, screen readers never hear them arrive. */}
      <div aria-live="polite" className="flex w-full max-w-md flex-col items-center text-center">
        {/* The scales — the court's emblem, arriving with the prelude */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          aria-hidden="true"
        >
          <VerdictEmblem className="mb-3 size-6 text-red-400/60" strokeWidth={1.6} />
        </m.div>

        {/* Prelude */}
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75"
        >
          {testMessages.verdict.prelude}
        </m.p>

        {/* GUILTY — stamped verdict block. Entrance lands from above
            (1.15 → 1, composite-only) instead of growing in: a stamp hit,
            not a bloom. Double hairlines frame it as an official record. */}
        <m.div
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.3, ease: EASE_OUT_STRONG }}
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

        {/* The standard — why the verdict stands. This copy existed in the
            messages all along but was never rendered. */}
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-4 max-w-sm text-[13px] italic leading-relaxed text-white/55 sm:text-sm"
        >
          {messages.subtitle}
        </m.p>

        {/* Dynamic confession prose — the personalized center of the screen.
            Always in DOM, opacity animated. */}
        <m.p
          initial={false}
          animate={{ opacity: showConfession ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="mt-6 max-w-sm text-base leading-relaxed text-white/85 sm:text-lg"
          aria-hidden={!showConfession}
        >
          {confession}
        </m.p>

        {/* The evidence — the ledger chips carried through from the test.
            The verdict cites the record; the record is laid on the table. */}
        {state.answers.length > 0 && (
          <m.div
            initial={false}
            animate={{ opacity: showConfession ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-5 flex max-w-sm flex-wrap justify-center gap-1.5"
            aria-hidden={!showConfession}
          >
            {state.answers.map((answer, i) => {
              const label = testMessages.verdictLabels[answer.commandment];
              if (!label) return null;
              const isJustified = answer.answer === "justify";
              return (
                <span
                  key={i}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${
                    isJustified
                      ? "border-dashed border-red-900/30 bg-red-950/10 opacity-50"
                      : "border-red-900/40 bg-red-950/25"
                  }`}
                >
                  <span className="font-mono text-[10px] tabular-nums text-red-400/75">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[11px] lowercase italic text-red-400/85">
                    {label}
                  </span>
                </span>
              );
            })}
          </m.div>
        )}

        {/* Death line — always in DOM, opacity animated */}
        <m.div
          initial={false}
          animate={{ opacity: showDeathLine ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 w-full max-w-xs border-t border-b border-red-500/15 py-5 sm:max-w-sm"
          aria-hidden={!showDeathLine}
        >
          <p className="font-mono text-3xl font-extrabold tabular-nums text-red-500 sm:text-4xl">
            {deathCount.toLocaleString()}
          </p>
          <p className="mt-2 text-xs italic leading-relaxed text-white/60 sm:text-[13px]">
            {testMessages.verdict.deathLineTemplate}
          </p>
        </m.div>

        {/* Bridge button — always in DOM, opacity animated */}
        <m.div
          initial={false}
          animate={{ opacity: showBridge ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8"
          aria-hidden={!showBridge}
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
