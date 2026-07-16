"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { ShareButtons } from "@/components/share-buttons";
import { SaveStoryImageButton } from "@/components/blog/save-story-image-button";
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
}

interface TrackCommittedProps {
  messages: TrackCommittedMessages;
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

const stagger = (i: number) => ({ duration: 0.8, delay: 0.3 + i * 0.2 });

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
              transition={stagger(i)}
              className="border-l border-[#D4A843]/30 pl-4 text-left"
            >
              <p className="text-[15px] italic leading-[1.85] text-white/70 sm:text-base">{p}</p>
            </m.blockquote>
          ) : (
            <m.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(i)}
              className="text-[15px] leading-[1.85] text-white/60 sm:text-base"
            >
              {p}
            </m.p>
          );
        })}
      </div>

      <div className="mt-12 space-y-4">
        {/* Read */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.readHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{messages.readBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={messages.readLink} target="_blank" rel="noopener noreferrer" onClick={() => trackNextStepsActionClicked("read", "committed")}>
              <Button variant="gold" size="sm">
                {messages.readLinkLabel}
                <ButtonArrow />
              </Button>
            </a>
            <Link
              href={`/${locale}/reading-plan`}
              onClick={() => trackNextStepsActionClicked("reading_plan", "committed")}
            >
              <Button variant="ghost" size="sm">
                {messages.readPlanLabel}
                <ButtonArrow />
              </Button>
            </Link>
          </div>
        </m.div>

        {/* Pray */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length + 1)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.prayHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{messages.prayBody}</p>
          <blockquote className="mt-3 border-l border-[#D4A843]/30 pl-4 text-sm italic leading-relaxed text-white/60">
            {messages.prayPrompt}
          </blockquote>
        </m.div>

        {/* Community */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length + 2)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.communityHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{messages.communityBody}</p>
          <a href={messages.communityLink} target="_blank" rel="noopener noreferrer" onClick={() => trackNextStepsActionClicked("community", "committed")} className="mt-3 inline-block">
            <Button variant="gold" size="sm">
              {messages.communityLinkLabel}
              <ButtonArrow />
            </Button>
          </a>
        </m.div>

        {/* Learn */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length + 3)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.learnHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{messages.learnBody}</p>
          <Link
            href={`/${locale}/learn`}
            onClick={() => trackNextStepsActionClicked("learn", "committed")}
            className="mt-3 inline-block"
          >
            <Button variant="gold" size="sm">
              {messages.learnLinkLabel}
              <ButtonArrow />
            </Button>
          </Link>
        </m.div>

        {/* Street cards — the physical bridge. Equipping the committed to
            hand the question to people who will never find the URL. */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length + 4)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.streetHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{messages.streetBody}</p>
          <Link
            href={`/${locale}/cards`}
            onClick={() => trackNextStepsActionClicked("cards", "committed")}
            className="mt-3 inline-block"
          >
            <Button variant="gold" size="sm">
              {messages.streetLinkLabel}
              <ButtonArrow />
            </Button>
          </Link>
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={stagger(paragraphs.length + 4)}
        className="mt-12"
      >
        <ShareButtons
          messages={{ ...shareMessages, prompt: messages.shareHeading, whatsappMessage: messages.shareMessage, telegramMessage: messages.shareMessage }}
          locale={locale}
        />
        {/* Testimony story graphic — the journey itself as the shareable
            unit. The sticker link points at the test (UTM: testimony). */}
        <div className="mt-8 text-center">
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
      </m.div>
    </>
  );
}
