"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { trackNextStepsActionClicked } from "@/lib/discipleship-analytics";
import type { Locale } from "@/lib/i18n";

interface TrackThinkingMessages {
  acknowledgment: string;
  reflections: string[];
  readingHeading: string;
  readingBody: string;
  readingLink: string;
  readingLinkLabel: string;
  readingPlanLabel: string;
  learnHeading: string;
  learnBody: string;
  learnLinkLabel: string;
  comeBack: string;
}

interface TrackThinkingProps {
  messages: TrackThinkingMessages;
  locale: Locale;
}

export function TrackThinking({ messages, locale }: TrackThinkingProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-2xl font-bold tracking-tight text-white/90 sm:text-3xl"
      >
        {messages.acknowledgment}
      </motion.h1>

      <div className="mt-10 space-y-6">
        {messages.reflections.map((question, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.3 }}
            className="border-l border-white/10 pl-5"
          >
            <p className="text-[15px] leading-relaxed text-white/60 sm:text-base italic">{question}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 + messages.reflections.length * 0.3 }}
        className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-5"
      >
        <h3 className="text-sm font-semibold tracking-wide text-white/70">{messages.readingHeading}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{messages.readingBody}</p>
        <a
          href={messages.readingLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackNextStepsActionClicked("read", "thinking")}
          className="mt-3 inline-flex items-center rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 min-h-[44px]"
        >
          {messages.readingLinkLabel} &rarr;
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.5 + (messages.reflections.length + 1) * 0.3,
        }}
        className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-5"
      >
        <h3 className="text-sm font-semibold tracking-wide text-white/70">{messages.learnHeading}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{messages.learnBody}</p>
        <Link
          href={`/${locale}/learn`}
          onClick={() => trackNextStepsActionClicked("learn", "thinking")}
          className="mt-3 inline-flex items-center rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 min-h-[44px]"
        >
          {messages.learnLinkLabel} &rarr;
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 + (messages.reflections.length + 2) * 0.3 }}
        className="mt-10 text-center"
      >
        <p className="text-sm leading-relaxed text-white/60">{messages.comeBack}</p>
        <Link
          href={`/${locale}/reading-plan`}
          onClick={() => trackNextStepsActionClicked("reading_plan", "thinking")}
          className="mt-4 inline-flex items-center text-sm text-white/60 transition-colors hover:text-white/60"
        >
          {messages.readingPlanLabel} &rarr;
        </Link>
      </motion.div>
    </div>
  );
}
