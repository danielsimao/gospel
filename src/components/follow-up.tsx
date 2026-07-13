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
      transition={{ duration: 0.45, delay: 0.35, ease: EASE_OUT_STRONG }}
      className="mt-4 border-l border-red-800/40 pl-3 max-w-sm"
    >
      <p className="text-xs leading-relaxed text-white/60 italic">{text}</p>
    </m.div>
  );
}
