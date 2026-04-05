"use client";

import { motion } from "framer-motion";

interface FollowUpProps {
  text: string;
}

export function FollowUp({ text }: FollowUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-4 border-l border-red-800/40 pl-3 max-w-sm"
    >
      <p className="text-xs leading-relaxed text-white/45 italic">{text}</p>
    </motion.div>
  );
}
