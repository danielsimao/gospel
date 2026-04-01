"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const DEATHS_PER_SECOND = 1.8;

interface DeathCounterProps {
  prefix: string;
  suffix: string;
}

export function DeathCounter({ prefix, suffix }: DeathCounterProps) {
  const [count, setCount] = useState(0);
  const startTime = useRef(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const elapsed = (Date.now() - startTime.current) / 1000;
      setCount(Math.floor(elapsed * DEATHS_PER_SECOND));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="text-center"
    >
      <p className="text-sm uppercase tracking-widest text-white/40">
        {prefix}
      </p>
      <p className="mt-3 font-mono text-5xl font-bold tabular-nums tracking-tight text-white sm:text-7xl">
        {count.toLocaleString()}
      </p>
      <p className="mt-2 text-lg text-white/50 sm:text-xl">
        {suffix}
      </p>
    </motion.div>
  );
}
