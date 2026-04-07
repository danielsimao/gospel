"use client";

import { motion } from "framer-motion";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isCompleted && !isCurrent ? 0.4 : 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl border p-5 sm:p-6 ${
        isCurrent
          ? "border-[#D4A843]/30 bg-[#D4A843]/[0.02] border-l-2 border-l-[#D4A843]"
          : isCompleted
          ? "border-white/[0.04] bg-white/[0.01]"
          : "border-white/[0.06] bg-white/[0.015]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/50">
            {dayLabel} {day}
          </span>
          <h3 className="text-base font-semibold text-white/90 sm:text-lg">{messages.title}</h3>
        </div>
        {isCompleted && (
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-[#D4A843]/50">
            {completedLabel}
          </span>
        )}
      </div>

      <a
        href={messages.passageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center text-sm font-medium text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
      >
        {messages.passage} &rarr;
      </a>

      <blockquote className="mt-4 border-l border-[#D4A843]/30 pl-4">
        <p className="text-sm italic leading-[1.8] text-white/50">
          &ldquo;{messages.keyVerse}&rdquo;
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#D4A843]/35">
          {messages.keyVerseRef}
        </p>
      </blockquote>

      <p className="mt-4 text-sm leading-relaxed text-white/50">{messages.reflection}</p>

      <div className="mt-4 rounded-lg bg-white/[0.02] p-3">
        <p className="text-sm italic leading-relaxed text-white/40">{messages.prayer}</p>
      </div>

      {!isCompleted && (
        <button
          onClick={onMarkRead}
          className="mt-4 rounded-lg border border-[#D4A843]/25 px-4 py-2 text-xs font-medium text-[#D4A843]/70 transition-all hover:border-[#D4A843]/40 hover:bg-[#D4A843]/[0.05] hover:text-[#D4A843] min-h-[44px]"
        >
          {markReadLabel}
        </button>
      )}
    </motion.div>
  );
}
