"use client";

import { useCallback, useEffect, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { BookOpen, HeartHandshake, Users, Compass, Share2 } from "lucide-react";
import { ShareButtons } from "@/components/share-buttons";
import { SaveStoryImageButton } from "@/components/blog/save-story-image-button";
import { BandHeader } from "./band-header";
import { Button, ButtonArrow } from "@/components/ui/button";
import { DayTicketBody, currentDay, type ReadingDay } from "@/components/shared/day-ticket";
import {
  trackNextStepsActionClicked,
  trackScriptureOpened,
  trackReadingPlanDayCompleted,
  trackReadingPlanCompleted,
} from "@/lib/discipleship-analytics";
import { readJourney } from "@/lib/journey-storage";
import { useJourney } from "@/lib/use-journey";
import { markDayRead } from "@/lib/reading-storage";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";

const FRESH_WINDOW_MS = 60 * 60 * 1000;

interface TrackCommittedMessages {
  welcome: string;
  welcomeReturn: string;
  whatHappened: string;
  readHeading: string;
  readPlanLabel: string;
  prayHeading: string;
  prayPrompt: string;
  communityLinkLabel: string;
  learnLinkLabel: string;
  shareHeading: string;
  shareMessage: string;
  storyButton: string;
  storyHint: string;
  storyCopyButton: string;
  storyCopied: string;
  bands: { today: string; grow: string };
}

interface TrackCommittedProps {
  messages: TrackCommittedMessages;
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
  /** The plan's days and the ticket's labels — the Read card shows the
      reader's actual day via the shared DayTicketBody, not a description. */
  readingDays: ReadingDay[];
  readingLabels: {
    dayProgress: string;
    complete: string;
    /** "Read {passage}" — templated so the door names the day it opens. */
    readDay: string;
    continueLabel: string;
    continueUrl: string;
    /** Reused from reading-plan.markReadLabel — the same action deserves the
        same word, not a second phrase for one surface. */
    markReadLabel: string;
  };
}

// One gentle rise per paragraph, capped so the emotional opener still
// reads in sequence but never runs longer than ~1s total.
const para = (i: number) => ({ duration: 0.7, delay: 0.15 + Math.min(i, 3) * 0.12, ease: EASE_OUT_STRONG });
// Each band reveals as a single group (not six staggered cards) — the
// page feels shorter and the hierarchy reads instantly.
const band = { duration: 0.7, ease: EASE_OUT_STRONG };


export function TrackCommitted({
  messages,
  shareMessages,
  locale,
  readingDays,
  readingLabels,
}: TrackCommittedProps) {
  const paragraphs = messages.whatHappened.split("\n\n");
  // The reader's real progress, so a returning believer meets day four, not a
  // pitch for day one. Same source the homepage band reads.
  const { readingDone } = useJourney();

  /*
   * The door has to open the day the ticket names.
   *
   * The card used to describe the plan in a paragraph, so one fixed "Read John
   * 1" was honest. Now the ticket says "DAY 4 OF 7 · JOHN 10:1–18" — a fixed
   * chapter link beside it is a button that lies about where it goes. Day one
   * is unchanged in practice: the plan's first passageUrl IS John 1.
   *
   * Finished readers have no day to open, so they get the plan's own
   * continue-reading door (John 8 onwards) rather than being sent back to the
   * beginning.
   */
  const today = currentDay(readingDays, readingDone);
  const readHref = today ? today.passageUrl : readingLabels.continueUrl;
  const readLabel = today
    ? readingLabels.readDay.replace("{passage}", today.passage)
    : readingLabels.continueLabel;

  /*
   * Mirrors reading-plan.tsx's handleMarkRead: the shared, contiguity-guarded
   * writer is the only thing allowed to touch progress, and it is what makes
   * `readingDone + 1` safe to call "the current day" here at all. On success,
   * useJourney's own storage subscription (not a local copy of progress)
   * re-reads and re-renders this card on the next day — nothing here caches
   * `readingDone` itself. A refused write (would-skip) does nothing, silently,
   * same as the reading plan's own handler.
   */
  const handleMarkRead = useCallback(() => {
    const day = readingDone + 1;
    if (!markDayRead(day)) return;
    if (day >= readingDays.length) {
      trackReadingPlanCompleted(locale);
    }
    trackReadingPlanDayCompleted(day, locale, "next_steps");
  }, [readingDone, readingDays.length, locale]);

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

  // The share block was about a third of the page, permanently open, while
  // the reader was being asked to do one thing. It is still here; it just
  // waits to be wanted.
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      {/*
       * The light the reader left, arriving with them. A CSS wash in the same
       * idiom as the decision screen's crossroads atmosphere — no asset, so
       * nothing here touches the flow-graphic budget. Adoption register, not
       * celebration: the courtroom stopped at the decision.
       *
       * Fixed and full-bleed, not absolute inside the reading column. Anchored
       * to the column it began at the top of the content area — which is the
       * exact pixel the header ends, so the glow started with a hard horizontal
       * edge under the chrome — and it inherited the column's width, so a wash
       * meant to light the page was a 512px band down the middle of a 1512px
       * viewport. The header is transparent and painted above this (z-10 over
       * the shell's z-[1]), so running underneath it is what removes the seam.
       */}
      <div
        aria-hidden="true"
        data-dawn
        className="pointer-events-none fixed inset-x-0 top-0 h-64 sm:h-80"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 50% 0%, rgba(212,168,67,0.15) 0%, rgba(212,168,67,0.05) 45%, transparent 75%)",
        }}
      />
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

        {/* PRIMARY — Read. The one loud card on the page, now showing the
            reader's actual day instead of a paragraph describing the plan:
            the shared DayTicketBody, identical by construction to the
            homepage band's. The old readBody line retired with the change —
            it described what the ticket now shows. Both doors survive. */}
        <div className="rounded-2xl border border-[#D4A843]/40 bg-[#D4A843]/[0.05] p-6 shadow-[0_0_40px_-12px_rgba(212,168,67,0.25)]">
          <div className="mb-4 flex items-center gap-2.5">
            <BookOpen className="size-5 text-[#D4A843]" aria-hidden="true" />
            <h3 className="text-base font-semibold tracking-wide text-[#D4A843]">{messages.readHeading}</h3>
          </div>
          <DayTicketBody
            dayProgress={readingLabels.dayProgress}
            completeDescription={readingLabels.complete}
            days={readingDays}
            completed={readingDone}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={readHref} rel="noopener noreferrer" onClick={() => {
              trackNextStepsActionClicked("read", "committed");
              trackScriptureOpened("next_steps_committed", today ? readingDays.indexOf(today) + 1 : null, locale);
            }}>
              <Button variant="gold" size="sm">
                {readLabel}
                <ButtonArrow />
              </Button>
            </a>
            {/* Opening the passage is not reading it — this is the only
                thing on the card that advances the day, and it only exists
                while there is a day left to mark. Once the plan is finished
                `today` is null and the card is already in the continue-
                reading state above; nothing here should re-open that. */}
            {today && (
              <Button variant="gold" size="sm" onClick={handleMarkRead}>
                {readingLabels.markReadLabel}
              </Button>
            )}
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
      </m.div>

      {/* ── AS YOU GROW: quiet list + the one real graphic ── */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...band, delay: 0.15 + Math.min(paragraphs.length, 3) * 0.12 + 0.25 }}
        className="mt-12"
      >
        <BandHeader label={messages.bands.grow} tone="dim" />

        {/* Hairline dividers traded for the quiet card rows the homepage
            wears — each one lifts, none of them shouts. */}
        <div className="flex flex-col gap-2">
          {/* Warm secondary — a person/community, not a loud card. Points at the
              on-site explainer: we teach the gospel marks of a sound church
              rather than recommending a specific church or directory. */}
          {/* The shared pressable-row idiom: quiet card frame, 2px lift, arrow
              slide — the move every pressable surface on the site now makes. */}
          <Link
            href={`/${locale}/find-a-church`}
            onClick={() => trackNextStepsActionClicked("community", "committed")}
            className="group flex min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/75 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-[#D4A843]/35 hover:bg-white/[0.045] hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <Users className="size-4 shrink-0 text-white/50" aria-hidden="true" />
            <span className="flex-1">{messages.communityLinkLabel}</span>
            <span aria-hidden="true" className="text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
          </Link>
          <Link
            href={`/${locale}/learn`}
            onClick={() => trackNextStepsActionClicked("learn", "committed")}
            className="group flex min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/70 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-white/25 hover:bg-white/[0.045] hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <Compass className="size-4 shrink-0 text-white/40" aria-hidden="true" />
            <span className="flex-1">{messages.learnLinkLabel}</span>
            <span aria-hidden="true" className="text-white/30 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
          </Link>
        </div>

        {/* Share block — owns the one graphic on the page. */}
        <button
          type="button"
          onClick={() => setShareOpen((open) => !open)}
          aria-expanded={shareOpen}
          // aria-controls only while the panel exists: it is unmounted when
          // closed, and pointing at an id that is not in the document is a
          // broken relationship rather than an absent one.
          {...(shareOpen ? { "aria-controls": "next-steps-share" } : {})}
          className="group mt-2 flex min-h-[48px] w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left text-sm font-semibold text-white/70 transition-[color,border-color,background-color,transform] duration-200 ease-[var(--ease-out-strong)] hover:-translate-y-px hover:border-[#D4A843]/35 hover:bg-white/[0.045] hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <Share2 className="size-4 shrink-0 text-white/40" aria-hidden="true" />
          <span className="flex-1">{messages.shareHeading}</span>
          <span aria-hidden="true" className="text-white/30">{shareOpen ? "−" : "+"}</span>
        </button>
        {shareOpen && (
          <div id="next-steps-share" className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">
            <ShareButtons
              messages={{ ...shareMessages, prompt: messages.shareHeading, whatsappMessage: messages.shareMessage, telegramMessage: messages.shareMessage }}
              locale={locale}
              sharePath={`/${locale}/test`}
              utmCampaign="testimony"
              copyText={messages.shareMessage}
            />
            {/* Preview beside its button from sm, stacked below — the block
                ends level instead of in a centred tower. */}
            <div className="mt-8 text-center sm:flex sm:items-center sm:justify-center sm:gap-6 sm:text-left">
              {/* The testimony story graphic, previewed inline (9:16, lazy so it
                  never competes for LCP). Reserved aspect box keeps CLS at 0. */}
              <div className="mx-auto mb-4 w-full max-w-[190px] shrink-0 overflow-hidden rounded-xl border border-white/10 sm:mx-0 sm:mb-0 sm:max-w-[150px]">
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
        )}
      </m.div>
    </>
  );
}
