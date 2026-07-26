"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { BookOpen, MessageCircle, Compass, CalendarDays } from "lucide-react";
import { trackNextStepsActionClicked } from "@/lib/discipleship-analytics";
import { BandHeader } from "./band-header";
import { Button, ButtonArrow } from "@/components/ui/button";
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

  // One gentle rise per reflection, capped so the questions read in
  // sequence but never run past ~1s total (was 0.5 + i*0.3 — far too slow).
  const para = (i: number) => ({ duration: 0.7, delay: 0.15 + Math.min(i, 3) * 0.12, ease: EASE_OUT_STRONG });
  // Each section reveals as one group, not per-card.
  const band = { duration: 0.7, ease: EASE_OUT_STRONG };
  const groupDelay = 0.15 + Math.min(messages.reflections.length, 3) * 0.12;

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
            transition={para(i)}
            className="border-l border-white/10 pl-5"
          >
            <p className="text-[15px] leading-relaxed text-white/60 sm:text-base italic">{question}</p>
          </m.div>
        ))}
      </div>

      {/* ── TODAY: one primary read + warm human secondary ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: groupDelay + 0.1 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.today} tone="gold" />

        {/* PRIMARY — one thing to read. No glow: the committed track's glow
            celebrates a decision; a skeptic gets a calm invite, not a pitch. */}
        <div className="rounded-2xl border border-[#D4A843]/40 bg-[#D4A843]/[0.04] p-6">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-[#D4A843]" aria-hidden="true" />
            <h3 className="text-base font-semibold tracking-wide text-[#D4A843]">{messages.readingHeading}</h3>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">{messages.readingBody}</p>
          <div className="mt-4">
            <a
              href={messages.readingLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNextStepsActionClicked("read", "thinking")}
            >
              <Button variant="gold" size="sm">
                {messages.readingLinkLabel}
                <ButtonArrow />
              </Button>
            </a>
          </div>
        </div>

        {/* Warm secondary — a real conversation. Highest-value option for a
            skeptic after reading, so it sits directly under the primary. */}
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-white/60">{messages.talkLabel}</p>
          <a
            href={messages.talkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackNextStepsActionClicked("talk", "thinking")}
            className="mt-2 flex min-h-[44px] items-center gap-3 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#D4A843]/25 hover:text-[#D4A843]/80"
          >
            <MessageCircle className="size-4 shrink-0 text-white/50" aria-hidden="true" />
            <span className="flex-1">{messages.talkLink}</span>
            <span aria-hidden="true" className="text-white/40">&rarr;</span>
          </a>
        </div>
      </m.div>

      {/* ── GOING DEEPER: quiet list ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: groupDelay + 0.25 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.deeper} tone="dim" />

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          <Link
            href={`/${locale}/learn`}
            onClick={() => trackNextStepsActionClicked("learn", "thinking")}
            className="flex min-h-[52px] items-center gap-3 px-1 py-3 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <Compass className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.learnLinkLabel}</span>
            <span aria-hidden="true" className="text-white/30">&rarr;</span>
          </Link>
          <Link
            href={`/${locale}/reading-plan`}
            onClick={() => trackNextStepsActionClicked("reading_plan", "thinking")}
            className="flex min-h-[52px] items-center gap-3 px-1 py-3 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <CalendarDays className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.readingPlanLabel}</span>
            <span aria-hidden="true" className="text-white/30">&rarr;</span>
          </Link>
        </div>
      </m.div>

      {/* Closing beat — the mortality press. Plain text, no CTA. */}
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...band, delay: groupDelay + 0.4 }}
        className="mt-10 text-center text-sm leading-relaxed text-white/60"
      >
        {messages.comeBack}
      </m.p>
    </>
  );
}
