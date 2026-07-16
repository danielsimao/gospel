"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { trackNextStepsActionClicked } from "@/lib/discipleship-analytics";
import { BandHeader } from "./band-header";
import { readJourney } from "@/lib/journey-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";

const FRESH_WINDOW_MS = 60 * 60 * 1000;

interface TrackThinkingMessages {
  acknowledgment: string;
  acknowledgmentReturn: string;
  reflections: string[];
  readingHeading: string;
  readingBody: string;
  readingLink: string;
  readingLinkLabel: string;
  readingPlanLabel: string;
  learnHeading: string;
  learnBody: string;
  learnLinkLabel: string;
  bands: { today: string; deeper: string };
  talkLabel: string;
  talkLink: string;
  talkUrl: string;
  comeBack: string;
}

interface TrackThinkingProps {
  messages: TrackThinkingMessages;
  locale: Locale;
}

export function TrackThinking({ messages, locale }: TrackThinkingProps) {
  // SSR and first client render show the durable opener; if the visitor
  // arrived within an hour of responding, upgrade to the conversational
  // one post-mount (rAF-deferred — the repo lints synchronous setState
  // in effects). Cold returns never flash the wrong register.
  const [isFresh, setIsFresh] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const respondedAt = readJourney().respondedAt;
      setIsFresh(
        typeof respondedAt === "number" && Date.now() - respondedAt < FRESH_WINDOW_MS,
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <m.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE_OUT_STRONG }}
        className="text-2xl font-bold tracking-tight text-white/90 sm:text-3xl"
      >
        {isFresh ? messages.acknowledgment : messages.acknowledgmentReturn}
      </m.h1>

      <div className="mt-10 space-y-6">
        {messages.reflections.map((question, i) => (
          <m.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.3 }}
            className="border-l border-white/10 pl-5"
          >
            <p className="text-[15px] leading-relaxed text-white/60 sm:text-base italic">{question}</p>
          </m.div>
        ))}
      </div>

      <div className="mt-12">
      <BandHeader label={messages.bands.today} tone="gold" />
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 + messages.reflections.length * 0.3 }}
        className="rounded-xl border border-[#D4A843]/25 bg-[#D4A843]/[0.03] p-5"
      >
        <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.readingHeading}</h3>
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
      </m.div>

      {/* A website cannot disciple — the method's follow-up is human work.
          A real conversation is a today act, so it lives in the TODAY band. */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 + messages.reflections.length * 0.3 + 0.15 }}
        className="mt-5 text-center"
      >
        <p className="text-sm leading-relaxed text-white/60">{messages.talkLabel}</p>
        <a
          href={messages.talkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackNextStepsActionClicked("talk", "thinking")}
          className="mt-2 inline-flex items-center text-sm text-[#D4A843]/70 transition-colors hover:text-[#D4A843]"
        >
          {messages.talkLink} &rarr;
        </a>
      </m.div>

      <BandHeader label={messages.bands.deeper} tone="dim" />
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.5 + (messages.reflections.length + 1) * 0.3,
        }}
        className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
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
      </m.div>

      <m.div
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
      </m.div>
      </div>
    </>
  );
}
