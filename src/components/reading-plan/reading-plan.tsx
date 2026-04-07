"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { DayCard } from "./day-card";
import { readProgress, markDayRead, getCompletedCount } from "@/lib/reading-storage";
import { trackReadingPlanViewed, trackReadingPlanDayCompleted, trackReadingPlanCompleted } from "@/lib/discipleship-analytics";
import type { Locale } from "@/lib/i18n";

interface DayMessages {
  title: string;
  passage: string;
  passageUrl: string;
  keyVerse: string;
  keyVerseRef: string;
  reflection: string;
  prayer: string;
}

interface ReadingPlanMessages {
  heading: string;
  subtitle: string;
  progressLabel: string;
  dayLabel: string;
  markReadLabel: string;
  completedLabel: string;
  allCompleteHeading: string;
  allCompleteBody: string;
  continueReadingLink: string;
  continueReadingLabel: string;
  days: DayMessages[];
}

interface ReadingPlanProps {
  messages: ReadingPlanMessages;
  locale: Locale;
}

export function ReadingPlan({ messages, locale }: ReadingPlanProps) {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const totalDays = messages.days.length;

  useEffect(() => {
    setProgress(readProgress());
    trackReadingPlanViewed(locale);
  }, [locale]);

  const completedCount = getCompletedCount(progress, totalDays);
  const allComplete = completedCount >= totalDays;

  let currentDay = totalDays + 1;
  for (let i = 1; i <= totalDays; i++) {
    if (!progress[String(i)]) {
      currentDay = i;
      break;
    }
  }

  const handleMarkRead = useCallback((day: number) => {
    const success = markDayRead(day);
    if (!success) return;
    setProgress(prev => {
      const updated = { ...prev, [String(day)]: true };
      const newCount = getCompletedCount(updated, totalDays);
      if (newCount >= totalDays) {
        trackReadingPlanCompleted(locale);
      }
      return updated;
    });
    trackReadingPlanDayCompleted(day, locale);
  }, [totalDays, locale]);

  const progressLabel = messages.progressLabel
    .replace("{current}", String(Math.min(completedCount + 1, totalDays)))
    .replace("{total}", String(totalDays));

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1
          className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
          style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
        >
          {messages.heading}
        </h1>
        <p className="mt-2 text-sm text-white/40">{messages.subtitle}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-6"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/50">
            {progressLabel}
          </span>
        </div>
        <div className="flex gap-1.5">
          {messages.days.map((_, i) => (
            <div key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                initial={false}
                animate={{ width: progress[String(i + 1)] ? "100%" : "0%" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-[#D4A843]"
              />
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-8 space-y-4">
        {messages.days.map((day, i) => (
          <DayCard
            key={i}
            day={i + 1}
            messages={day}
            isCompleted={!!progress[String(i + 1)]}
            isCurrent={currentDay === i + 1}
            dayLabel={messages.dayLabel}
            markReadLabel={messages.markReadLabel}
            completedLabel={messages.completedLabel}
            onMarkRead={() => handleMarkRead(i + 1)}
          />
        ))}
      </div>

      {allComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-10 text-center"
        >
          <h2 className="text-2xl font-bold text-[#D4A843]">{messages.allCompleteHeading}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50">{messages.allCompleteBody}</p>
          <a
            href={messages.continueReadingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center rounded-lg border border-[#D4A843]/30 px-5 py-2.5 text-sm font-medium text-[#D4A843] transition-colors hover:bg-[#D4A843]/[0.06] min-h-[44px]"
          >
            {messages.continueReadingLabel} &rarr;
          </a>
        </motion.div>
      )}
    </div>
  );
}
