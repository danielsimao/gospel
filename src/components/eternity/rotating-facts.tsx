"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface RotatingFactsProps {
  facts: string[];
  /** Cycle interval in ms. Default 6000. */
  interval?: number;
}

export function RotatingFacts({ facts, interval = 6000 }: RotatingFactsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (facts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % facts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [facts.length, interval]);

  return (
    <div className="relative h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 text-center text-xs tracking-wide text-white/30 sm:text-sm"
        >
          {facts[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
