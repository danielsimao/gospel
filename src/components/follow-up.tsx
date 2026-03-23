"use client";

import { motion } from "framer-motion";

interface FollowUpProps {
  text: string;
}

export function FollowUp({ text }: FollowUpProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-6 text-sm text-white/60 italic max-w-sm"
    >
      {text}
    </motion.p>
  );
}
