"use client";

import { motion } from "framer-motion";

interface FollowUpProps {
  text: string;
}

export function FollowUp({ text }: FollowUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 border-l border-red-800/40 pl-3 max-w-sm"
    >
      <p className="text-xs leading-relaxed text-white/60 italic">{text}</p>
    </motion.div>
  );
}
