"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DayCardMessages {
  title: string;
  passage: string;
  passageUrl: string;
  keyVerse: string;
  keyVerseRef: string;
  reflection: string;
  prayer: string;
}

interface DayCardProps {
  day: number;
  messages: DayCardMessages;
  isCompleted: boolean;
  isCurrent: boolean;
  dayLabel: string;
  markReadLabel: string;
  completedLabel: string;
  onMarkRead: () => void;
}

export function DayCard({ day, messages, isCompleted, isCurrent, dayLabel, markReadLabel, completedLabel, onMarkRead }: DayCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(isCurrent);

  // Sync expanded state with current day: when isCurrent flips, follow it.
  // This collapses the just-read day and auto-expands the new current day.
  // Cards whose isCurrent doesn't change keep whatever the user manually set.
  useEffect(() => {
    setIsExpanded(isCurrent);
  }, [isCurrent]);

  // Scroll into view when this card becomes current
  useEffect(() => {
    if (isCurrent && cardRef.current) {
      // Small delay so the collapse/expand animation starts first
      const timer = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isCurrent]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl border overflow-hidden ${
        isCurrent
          ? "border-[#D4A843]/30 bg-[#D4A843]/[0.02] border-l-2 border-l-[#D4A843]"
          : isCompleted
          ? "border-white/[0.04] bg-white/[0.01]"
          : "border-white/[0.06] bg-white/[0.015]"
      }`}
    >
      {/* Header — always visible, toggles expand on click */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.02] sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/70">
            {dayLabel} {day}
          </span>
          <h3 className="text-base font-semibold text-white/90 sm:text-lg">{messages.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="font-mono text-[9px] uppercase tracking-[2px] text-[#D4A843]/70">
              {completedLabel}
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ChevronDown className="size-4 text-white/50" />
          </motion.div>
        </div>
      </button>

      {/* Content — animated expand/collapse */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.3, delay: 0.05 },
            }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <a
                href={messages.passageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
              >
                {messages.passage} &rarr;
              </a>

              <blockquote className="mt-4 border-l border-[#D4A843]/30 pl-4">
                <p className="text-sm italic leading-[1.8] text-white/60">
                  &ldquo;{messages.keyVerse}&rdquo;
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#D4A843]/70">
                  {messages.keyVerseRef}
                </p>
              </blockquote>

              <p className="mt-4 text-sm leading-relaxed text-white/60">{messages.reflection}</p>

              <div className="mt-4 rounded-lg bg-white/[0.02] p-3">
                <p className="text-sm italic leading-relaxed text-white/60">{messages.prayer}</p>
              </div>

              {isCurrent && !isCompleted && (
                <div className="mt-4">
                  <Button variant="gold" size="sm" onClick={onMarkRead}>
                    {markReadLabel}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
