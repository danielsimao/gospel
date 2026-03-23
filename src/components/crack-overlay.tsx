"use client";

import { motion } from "framer-motion";

export function CrackOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-none fixed inset-0 z-40"
    >
      <svg
        viewBox="0 0 400 800"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <motion.path
          d="M200 400 L195 350 L205 300 L190 250 L210 200 L185 150 L200 100 L195 50 L200 0"
          stroke="white"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.path
          d="M200 400 L205 450 L195 500 L210 550 L190 600 L215 650 L200 700 L205 750 L200 800"
          stroke="white"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        />
        <motion.path
          d="M195 350 L150 320 L120 280"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        />
        <motion.path
          d="M205 300 L260 270 L290 230"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        />
        <motion.path
          d="M205 450 L250 480 L280 520"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        />
        <motion.path
          d="M195 500 L150 530 L110 570"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        />
        <motion.path
          d="M150 320 L130 350 L100 360"
          stroke="white"
          strokeWidth="1"
          fill="none"
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
        <motion.path
          d="M260 270 L280 290 L310 285"
          stroke="white"
          strokeWidth="1"
          fill="none"
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.55 }}
        />
      </svg>
    </motion.div>
  );
}
