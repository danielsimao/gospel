"use client";

import { m } from "framer-motion";
import { EASE_OUT_STRONG } from "@/lib/motion";

interface FollowUpProps {
  text: string;
}

export function FollowUp({ text }: FollowUpProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // No delay here. question-card already gates this component behind a
      // timer before it mounts; a second delay on top meant the follow-up —
      // the conviction beat — didn't finish until 1.4s, after the Next button
      // had already appeared at 1.0s. One gate, not two.
      transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
      className="mt-4 border-l border-red-800/40 pl-3 max-w-sm"
    >
      <p className="text-xs leading-relaxed text-white/60 italic">{text}</p>
    </m.div>
  );
}
