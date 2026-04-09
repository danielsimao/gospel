"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackVerdictReached } from "@/lib/analytics";
import { buildConfession } from "@/lib/confession";
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
  const durationMs = state.completedAt
    ? state.completedAt - state.startedAt
    : Date.now() - state.startedAt;
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

    // Staggered reveals
    const t1 = setTimeout(() => setShowConfession(true), 1200);
    const t2 = setTimeout(() => setShowDeathLine(true), 2400);
    const t3 = setTimeout(() => setShowBridge(true), 3600);
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
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* Prelude */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75"
        >
          {testMessages.verdict.prelude}
        </motion.p>

        {/* GUILTY */}
        <motion.p
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 text-5xl font-black uppercase tracking-[0.15em] text-red-500 sm:text-6xl md:text-7xl"
          style={{
            textShadow:
              "0 0 80px rgba(239,68,68,0.35), 0 0 160px rgba(239,68,68,0.12), 0 4px 40px rgba(0,0,0,0.8)",
          }}
        >
          {messages.title.replace(/\.$/, "")}
        </motion.p>

        {/* Dynamic confession prose — always in DOM, opacity animated */}
        <motion.p
          initial={false}
          animate={{ opacity: showConfession ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="mt-5 max-w-sm text-sm leading-relaxed text-white/55"
          aria-hidden={!showConfession}
        >
          {confession}
        </motion.p>

        {/* Death line — always in DOM, opacity animated */}
        <motion.div
          initial={false}
          animate={{ opacity: showDeathLine ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 w-full max-w-xs border-t border-b border-red-500/15 py-5 sm:max-w-sm"
          aria-hidden={!showDeathLine}
        >
          <p className="font-mono text-3xl font-extrabold tabular-nums text-red-500 sm:text-4xl">
            {deathCount.toLocaleString()}
          </p>
          <p className="mt-2 text-[11px] italic leading-relaxed text-white/60 sm:text-xs">
            {testMessages.verdict.deathLineTemplate}
          </p>
        </motion.div>

        {/* Bridge button — always in DOM, opacity animated */}
        <motion.div
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
        </motion.div>
      </div>
    </div>
  );
}
