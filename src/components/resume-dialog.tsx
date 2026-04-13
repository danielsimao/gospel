"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ResumeDialogProps {
  open: boolean;
  title: string;
  continueLabel: string;
  startOverLabel: string;
  onContinue: () => void;
  onStartOver: () => void;
}

export function ResumeDialog({
  open,
  title,
  continueLabel,
  startOverLabel,
  onContinue,
  onStartOver,
}: ResumeDialogProps) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Continue is the safe default; auto-focus so Enter key picks it.
    const focusTimer = setTimeout(() => continueRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-dialog-title"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0808] p-6 shadow-2xl"
          >
            <h2
              id="resume-dialog-title"
              className="text-lg font-semibold text-white/90"
            >
              {title}
            </h2>
            <div className="mt-6 flex flex-col items-stretch gap-2">
              <Button
                ref={continueRef}
                variant="gold"
                size="sm"
                mist
                onClick={onContinue}
              >
                {continueLabel}
              </Button>
              <Button variant="ghost" size="sm" onClick={onStartOver}>
                {startOverLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
