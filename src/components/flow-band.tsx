"use client";

import { m } from "framer-motion";
import { FLOW_STAGES, type FlowStage } from "@/lib/flow-stages";
import type { TestMessages } from "@/lib/types";

interface FlowBandProps {
  /** Where the reader is standing. */
  current: FlowStage;
  /** Index of the furthest stage ever reached — see furthestStageIndex. */
  furthest: number;
  onNavigate: (stage: FlowStage) => void;
  testMessages: TestMessages;
  /** Tint for the current stage's name, so the band speaks the screen's own
      colour rather than importing a fifth one. */
  tone?: "red" | "gold" | "plain";
}

const CURRENT_TONE: Record<NonNullable<FlowBandProps["tone"]>, string> = {
  red: "text-red-400/80",
  gold: "text-[#D4A843]/80",
  plain: "text-white/75",
};

/**
 * Where the reader is, and everything they can walk back to.
 *
 * ── Why it is one band and not two ──────────────────────────────────────────
 *
 * Every screen after the questions already announces itself — "The verdict",
 * "Someone paid your fine", "The decision" — in mono caps at the top. A
 * separate wayfinding strip above that would have carried the same fact twice,
 * 60px apart. So this replaces the eyebrow rather than joining it: the current
 * stage's name sits where the eyebrow sat, in the eyebrow's weight, with the
 * passed stages quiet to its left.
 *
 * ── What is never shown ─────────────────────────────────────────────────────
 *
 * Names of stages the reader has not reached. A visible "Decision" three
 * screens early pre-announces the ask, which METHOD.md's own framing forbids —
 * the Law lands one commandment at a time and the decision has to arrive as a
 * question, not as a scheduled stop. What remains is drawn as an unnamed dark
 * mark: the journey has a shape, and the next step has no name until it comes.
 *
 * `furthest` rather than the current index decides what is lit, because walking
 * backwards must not retract what was reached — a reader who returns to the
 * verdict from the decision keeps grace and the decision tappable, which is how
 * forward navigation comes for free.
 */
export function FlowBand({
  current,
  furthest,
  onNavigate,
  testMessages,
  tone = "plain",
}: FlowBandProps) {
  const currentIndex = FLOW_STAGES.indexOf(current);
  const flow = testMessages.flow;
  const labels: Record<FlowStage, string> = {
    test: flow.test,
    verdict: flow.verdict,
    paid: flow.paid,
    decision: flow.decision,
  };

  return (
    <m.nav
      aria-label={flow.label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[9px] uppercase tracking-[2px] sm:text-[10px]"
    >
      {FLOW_STAGES.map((stage, i) => {
        const reached = i <= furthest;
        const isCurrent = i === currentIndex;
        const separator =
          i === 0 ? null : (
            <span aria-hidden="true" className="text-white/20">
              ›
            </span>
          );

        if (!reached) {
          return (
            <span key={stage} className="flex items-center gap-x-2">
              {separator}
              {/* Unnamed on purpose. Shape without content. */}
              <span
                aria-hidden="true"
                className="size-[5px] rounded-full bg-white/[0.14]"
              />
            </span>
          );
        }

        if (isCurrent) {
          return (
            <span key={stage} className="flex items-center gap-x-2">
              {separator}
              <span aria-current="step" className={CURRENT_TONE[tone]}>
                {labels[stage]}
              </span>
            </span>
          );
        }

        return (
          <span key={stage} className="flex items-center gap-x-2">
            {separator}
            <button
              type="button"
              onClick={() => onNavigate(stage)}
              /* The test's label promises the test; what opens is the reader's
                 own answers, sealed. The accessible name says so. */
              aria-label={stage === "test" ? flow.review : undefined}
              className="inline-flex min-h-[32px] items-center text-white/45 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/70"
            >
              {labels[stage]}
            </button>
          </span>
        );
      })}
    </m.nav>
  );
}
