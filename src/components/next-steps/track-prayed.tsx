"use client";

import { motion } from "framer-motion";
import { ShareButtons } from "@/components/share-buttons";
import { Button, ButtonArrow } from "@/components/ui/button";
import { trackNextStepsActionClicked } from "@/lib/discipleship-analytics";
import type { Locale } from "@/lib/i18n";

interface TrackPrayedMessages {
  welcome: string;
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
  shareHeading: string;
  shareMessage: string;
}

interface TrackPrayedProps {
  messages: TrackPrayedMessages;
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

const stagger = (i: number) => ({ duration: 0.8, delay: 0.3 + i * 0.2 });

export function TrackPrayed({ messages, shareMessages, locale }: TrackPrayedProps) {
  const paragraphs = messages.whatHappened.split("\n\n");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {messages.welcome}
      </motion.h1>

      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={stagger(i)}
            className="text-[15px] leading-[1.85] text-white/60 sm:text-base"
          >
            {p}
          </motion.p>
        ))}
      </div>

      <div className="mt-12 space-y-4">
        {/* Read */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.readHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{messages.readBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={messages.readLink} target="_blank" rel="noopener noreferrer" onClick={() => trackNextStepsActionClicked("read", "prayed")}>
              <Button variant="gold" size="sm">
                {messages.readLinkLabel}
                <ButtonArrow />
              </Button>
            </a>
            <a href={`/${locale}/reading-plan`} onClick={() => trackNextStepsActionClicked("reading_plan", "prayed")}>
              <Button variant="ghost" size="sm">
                {messages.readPlanLabel}
                <ButtonArrow />
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Pray */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length + 1)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.prayHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{messages.prayBody}</p>
          <blockquote className="mt-3 border-l border-[#D4A843]/30 pl-4 text-sm italic leading-relaxed text-white/45">
            {messages.prayPrompt}
          </blockquote>
        </motion.div>

        {/* Community */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(paragraphs.length + 2)}
          className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold tracking-wide text-[#D4A843]">{messages.communityHeading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{messages.communityBody}</p>
          <a href={messages.communityLink} target="_blank" rel="noopener noreferrer" onClick={() => trackNextStepsActionClicked("community", "prayed")} className="mt-3 inline-block">
            <Button variant="gold" size="sm">
              {messages.communityLinkLabel}
              <ButtonArrow />
            </Button>
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={stagger(paragraphs.length + 3)}
        className="mt-12"
      >
        <p className="text-center text-sm text-white/30">{messages.shareHeading}</p>
        <ShareButtons
          messages={{ ...shareMessages, whatsappMessage: messages.shareMessage, telegramMessage: messages.shareMessage }}
          locale={locale}
        />
      </motion.div>
    </div>
  );
}
