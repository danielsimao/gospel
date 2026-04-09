"use client";

import { motion } from "framer-motion";

interface StageDividerProps {
  text: string;
}

export function StageDivider({ text }: StageDividerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center py-4"
    >
      <div className="h-px flex-1 bg-white/10" />
      <span className="px-4 text-xs text-white/60">{text}</span>
      <div className="h-px flex-1 bg-white/10" />
    </motion.div>
  );
}
