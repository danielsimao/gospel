"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { BookOpen, HeartHandshake, Users, Compass, Printer } from "lucide-react";
import { ShareButtons } from "@/components/share-buttons";
import { SaveStoryImageButton } from "@/components/blog/save-story-image-button";
import { BandHeader } from "./band-header";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackNextStepsActionClicked } from "@/lib/discipleship-analytics";
import { readJourney } from "@/lib/journey-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";

const FRESH_WINDOW_MS = 60 * 60 * 1000;

interface TrackCommittedMessages {
  welcome: string;
  welcomeReturn: string;
  whatHappened: string;
  readHeading: string;
  readBody: string;
  readLink: string;
  readLinkLabel: string;
  readPlanLabel: string;
  prayHeading: string;
  prayBody: string;
  prayPrompt: string;
  communityHeading: string;
  communityBody: string;
  communityLink: string;
  communityLinkLabel: string;
  learnHeading: string;
  learnBody: string;
  learnLinkLabel: string;
  shareHeading: string;
  shareMessage: string;
  streetHeading: string;
  streetBody: string;
  streetLinkLabel: string;
  storyButton: string;
  storyHint: string;
  storyCopyButton: string;
  storyCopied: string;
  bands: { today: string; week: string; grow: string };
}

interface TrackCommittedProps {
  messages: TrackCommittedMessages;
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

// One gentle rise per paragraph, capped so the emotional opener still
// reads in sequence but never runs longer than ~1s total.
const para = (i: number) => ({ duration: 0.7, delay: 0.15 + Math.min(i, 3) * 0.12, ease: EASE_OUT_STRONG });
// Each band reveals as a single group (not six staggered cards) — the
// page feels shorter and the hierarchy reads instantly.
const band = { duration: 0.7, ease: EASE_OUT_STRONG };


export function TrackCommitted({ messages, shareMessages, locale }: TrackCommittedProps) {
  const paragraphs = messages.whatHappened.split("\n\n");

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
        className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {isFresh ? messages.welcome : messages.welcomeReturn}
      </m.h1>

      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => {
          // Scripture paragraphs (quote-prefixed) get the house blockquote
          // treatment, matching the grace screen.
          const isScripture = /^["“]/.test(p);
          return isScripture ? (
            <m.blockquote
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={para(i)}
              className="border-l border-[#D4A843]/30 pl-4 text-left"
            >
              <p className="text-[15px] italic leading-[1.85] text-white/70 sm:text-base">{p}</p>
            </m.blockquote>
          ) : (
            <m.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={para(i)}
              className="text-[15px] leading-[1.85] text-white/60 sm:text-base"
            >
              {p}
            </m.p>
          );
        })}
      </div>

      {/* ── TODAY: one primary action, one quiet secondary ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: 0.15 + Math.min(paragraphs.length, 3) * 0.12 + 0.1 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.today} tone="gold" />

        {/* PRIMARY — Read. The one loud card on the page. */}
        <div className="rounded-2xl border border-[#D4A843]/40 bg-[#D4A843]/[0.05] p-6 shadow-[0_0_40px_-12px_rgba(212,168,67,0.25)]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-[#D4A843]" aria-hidden="true" />
            <h3 className="text-base font-semibold tracking-wide text-[#D4A843]">{messages.readHeading}</h3>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">{messages.readBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={messages.readLink} target="_blank" rel="noopener noreferrer" onClick={() => trackNextStepsActionClicked("read", "committed")}>
              <Button variant="gold" size="sm">
                {messages.readLinkLabel}
                <ButtonArrow />
              </Button>
            </a>
            <Link href={`/${locale}/reading-plan`} onClick={() => trackNextStepsActionClicked("reading_plan", "committed")}>
              <Button variant="ghost" size="sm">
                {messages.readPlanLabel}
                <ButtonArrow />
              </Button>
            </Link>
          </div>
        </div>

        {/* Pray — inline, quiet. */}
        <div className="mt-6 pl-1">
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="size-4 text-[#D4A843]/70" aria-hidden="true" />
            <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]/90">{messages.prayHeading}</h3>
          </div>
          <blockquote className="mt-2 border-l border-[#D4A843]/30 pl-4 text-sm italic leading-relaxed text-white/60">
            {messages.prayPrompt}
          </blockquote>
        </div>

        {/* Warm secondary — a person/community, not a loud card. Points at the
            on-site explainer: we teach the gospel marks of a sound church
            rather than recommending a specific church or directory. */}
        <Link
          href={`/${locale}/find-a-church`}
          onClick={() => trackNextStepsActionClicked("community", "committed")}
          className="mt-5 flex min-h-[44px] items-center gap-3 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-[#D4A843]/25 hover:text-[#D4A843]/80"
        >
          <Users className="size-4 shrink-0 text-white/50" aria-hidden="true" />
          <span className="flex-1">{messages.communityLinkLabel}</span>
          <span aria-hidden="true" className="text-white/40">&rarr;</span>
        </Link>
      </m.div>

      {/* ── AS YOU GROW: quiet list + the one real graphic ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: 0.15 + Math.min(paragraphs.length, 3) * 0.12 + 0.25 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.grow} tone="dim" />

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          <Link
            href={`/${locale}/learn`}
            onClick={() => trackNextStepsActionClicked("learn", "committed")}
            className="flex min-h-[52px] items-center gap-3 px-1 py-3 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <Compass className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.learnLinkLabel}</span>
            <span aria-hidden="true" className="text-white/30">&rarr;</span>
          </Link>
          <Link
            href={`/${locale}/cards`}
            onClick={() => trackNextStepsActionClicked("cards", "committed")}
            className="flex min-h-[52px] items-center gap-3 px-1 py-3 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <Printer className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.streetLinkLabel}</span>
            <span aria-hidden="true" className="text-white/30">&rarr;</span>
          </Link>
        </div>

        {/* Share block — owns the one graphic on the page. */}
        <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">
          <ShareButtons
            messages={{ ...shareMessages, prompt: messages.shareHeading, whatsappMessage: messages.shareMessage, telegramMessage: messages.shareMessage }}
            locale={locale}
            sharePath={`/${locale}/test`}
            utmCampaign="testimony"
            copyText={messages.shareMessage}
          />
          <div className="mt-8 text-center">
            {/* The testimony story graphic, previewed inline (9:16, lazy so it
                never competes for LCP). Reserved aspect box keeps CLS at 0. */}
            <div className="mx-auto mb-4 w-full max-w-[190px] overflow-hidden rounded-xl border border-white/10">
              <img
                src={`/${locale}/testimony/story`}
                alt=""
                loading="lazy"
                width={1080}
                height={1920}
                className="block h-auto w-full"
              />
            </div>
            <SaveStoryImageButton
              locale={locale}
              slug="testimony"
              label={messages.storyButton}
              hint={messages.storyHint}
              copyLabel={messages.storyCopyButton}
              copiedLabel={messages.storyCopied}
              storyPath={`/${locale}/testimony/story`}
              stickerPath={`/${locale}/test`}
            />
          </div>
        </div>
      </m.div>
    </>
  );
}
