"use client";

import { motion } from "framer-motion";

interface ScoreBarProps {
  score: number;
  isRefilling?: boolean;
}

function getBarColor(score: number): string {
  if (score > 60) return "#22c55e";
  if (score > 35) return "#eab308";
  if (score > 15) return "#f97316";
  return "#ef4444";
}

export function ScoreBar({ score, isRefilling = false }: ScoreBarProps) {
  const color = isRefilling ? "#D4A843" : getBarColor(score);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-white/10">
      <motion.div
        className="h-full"
        style={{ backgroundColor: color }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-live="polite"
      />
      <span
        className="fixed top-3 right-4 font-mono text-sm tabular-nums"
        style={{ color }}
        aria-hidden="true"
      >
        {score}
      </span>
    </div>
  );
}
