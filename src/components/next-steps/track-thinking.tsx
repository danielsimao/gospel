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
          {/* The shared pressable-row idiom — quiet card frame, 2px lift,
              arrow slide. */}
          <a
            href={messages.talkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackNextStepsActionClicked("talk", "thinking")}
            className="group mt-2 flex min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/75 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-[#D4A843]/35 hover:bg-white/[0.045] hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <MessageCircle className="size-4 shrink-0 text-white/50" aria-hidden="true" />
            <span className="flex-1">{messages.talkLink}</span>
            <span aria-hidden="true" className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
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

        {/* The same quiet card rows the committed track wears. */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/${locale}/learn`}
            onClick={() => trackNextStepsActionClicked("learn", "thinking")}
            className="group flex min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/70 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-white/25 hover:bg-white/[0.045] hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <Compass className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.learnLinkLabel}</span>
            <span aria-hidden="true" className="text-white/30 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
          </Link>
          <Link
            href={`/${locale}/reading-plan`}
            onClick={() => trackNextStepsActionClicked("reading_plan", "thinking")}
            className="group flex min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/70 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-white/25 hover:bg-white/[0.045] hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <CalendarDays className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.readingPlanLabel}</span>
            <span aria-hidden="true" className="text-white/30 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
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
