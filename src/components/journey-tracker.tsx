"use client";

import Link from "next/link";
import { ShareButtons } from "@/components/share-buttons";
import { resetJourney } from "@/lib/journey-storage";
import { TOTAL_READING_DAYS, type JourneySnapshot } from "@/lib/use-journey";
import { clearSession } from "@/lib/test-session-storage";
import {
  trackHomeJourneyStepClicked,
  trackHomeRetakeClicked,
} from "@/lib/eternity-analytics";
import type { JourneyMessages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

type StepId = "test" | "reading" | "learn" | "share";
type CardState = "complete" | "active" | "upcoming" | "all-done";

interface ShareMessages {
  prompt: string;
  whatsappMessage: string;
  telegramMessage: string;
  linkCopied: string;
}

interface JourneyTrackerProps {
  locale: Locale;
  messages: JourneyMessages;
  shareMessages: ShareMessages;
  topicSlugs: string[];
  snapshot: JourneySnapshot;
}

function deriveActiveId(
  testComplete: boolean,
  readingComplete: boolean,
  learnComplete: boolean,
): StepId {
  if (!testComplete) return "test";
  if (!readingComplete) return "reading";
  if (!learnComplete) return "learn";
  return "share";
}

export function JourneyTracker({
  locale,
  messages,
  shareMessages,
  topicSlugs,
  snapshot,
}: JourneyTrackerProps) {
  const totalTopics = topicSlugs.length;
  const testComplete = snapshot.stage !== "visitor";
  const readingComplete = snapshot.readingDone >= TOTAL_READING_DAYS;
  // Guard totalTopics > 0: if topic list is empty (message file drift),
  // learn never "auto-completes" and share never falsely unlocks.
  const learnComplete = totalTopics > 0 && snapshot.learnDone >= totalTopics;
  const shareReady = testComplete && readingComplete && learnComplete;
  const activeId = deriveActiveId(testComplete, readingComplete, learnComplete);

  function stateFor(id: StepId): CardState {
    if (id === "share") return shareReady ? "all-done" : "upcoming";
    const done =
      (id === "test" && testComplete) ||
      (id === "reading" && readingComplete) ||
      (id === "learn" && learnComplete);
    if (done) return "complete";
    return id === activeId ? "active" : "upcoming";
  }

  function readingDescription(state: CardState): string {
    if (state === "complete") return messages.reading.descComplete;
    if (state === "upcoming") return messages.reading.descUpcoming;
    if (snapshot.readingDone === 0) return messages.reading.descActiveStart;
    return messages.reading.descActiveProgress
      .replace("{current}", String(snapshot.readingDone))
      .replace("{total}", String(TOTAL_READING_DAYS));
  }

  function learnDescription(state: CardState): string {
    if (state === "complete") return messages.learn.descComplete;
    if (state === "upcoming") return messages.learn.descUpcoming;
    if (snapshot.learnDone === 0) return messages.learn.descActiveStart;
    return messages.learn.descActiveProgress
      .replace("{current}", String(snapshot.learnDone))
      .replace("{total}", String(totalTopics));
  }

  const testState = stateFor("test");
  const readingState = stateFor("reading");
  const learnState = stateFor("learn");
  const shareState = stateFor("share");

  return (
    <div className="mt-10 flex w-full max-w-md flex-col sm:mt-14">
      <JourneyCard
        number="01"
        state={testState}
        label={messages.test.label}
        description={
          testComplete
            ? messages.test.descComplete
            : messages.test.descActive
        }
        /* Test has no href: complete → plain div, active would be handled by new-visitor branch */
      />

      <Rail filled={testComplete} />

      <JourneyCard
        number="02"
        state={readingState}
        label={messages.reading.label}
        description={readingDescription(readingState)}
        href={
          readingState === "active" || readingState === "complete"
            ? `/${locale}/reading-plan`
            : undefined
        }
        onClick={() =>
          trackHomeJourneyStepClicked("reading", readingState)
        }
      />

      <Rail filled={readingComplete} />

      <JourneyCard
        number="03"
        state={learnState}
        label={messages.learn.label}
        description={learnDescription(learnState)}
        href={
          learnState === "active" || learnState === "complete"
            ? `/${locale}/learn`
            : undefined
        }
        onClick={() => trackHomeJourneyStepClicked("learn", learnState)}
      />

      <Rail filled={learnComplete} />

      <JourneyCard
        number="04"
        state={shareState}
        label={messages.share.label}
        description={
          shareReady ? messages.share.descActive : messages.share.descUpcoming
        }
        shareSlot={
          shareReady ? (
            <div className="mt-4">
              <ShareButtons
                messages={shareMessages}
                locale={locale}
                sharePath="/test"
              />
            </div>
          ) : null
        }
      />

      <Link
        href={`/${locale}/test`}
        onClick={() => {
          trackHomeRetakeClicked();
          resetJourney();
          clearSession();
        }}
        className="mt-3 self-center font-mono text-[10px] uppercase tracking-[2px] text-white/40 transition-colors hover:text-white/60"
      >
        {messages.retakeLabel}
      </Link>
    </div>
  );
}

/**
 * Vertical connector between journey cards — the timeline rail. Gold once
 * the step above is complete, faint otherwise. Replaces the old flex gap,
 * so the card rhythm stays ~16px.
 */
function Rail({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`h-4 w-px self-center ${filled ? "bg-[#D4A843]/45" : "bg-white/[0.08]"}`}
    />
  );
}

interface JourneyCardProps {
  number: string;
  state: CardState;
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  shareSlot?: React.ReactNode;
}

const STATE_BASE: Record<CardState, string> = {
  complete: "border-white/[0.06] bg-white/[0.015]",
  active:
    "border-[#D4A843]/25 bg-[#D4A843]/[0.03] shadow-[0_0_60px_rgba(212,168,67,0.06)]",
  upcoming: "border-white/[0.04] bg-transparent opacity-60",
  "all-done": "border-[#D4A843]/25 bg-[#D4A843]/[0.03]",
};

const LINK_HOVER: Record<CardState, string> = {
  complete: "hover:border-[#D4A843]/20",
  active: "hover:border-[#D4A843]/35",
  upcoming: "",
  "all-done": "",
};

function CardBody({
  number,
  state,
  label,
  description,
  shareSlot,
  showArrow,
}: Pick<JourneyCardProps, "number" | "state" | "label" | "description" | "shareSlot"> & {
  showArrow: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 font-mono text-[10px] tabular-nums text-[#D4A843]/70">
            {number}
          </span>
          <div>
            <p
              className={`text-sm font-semibold tracking-tight ${
                state === "upcoming" ? "text-white/50" : "text-white/85"
              }`}
            >
              {label}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/60">
              {description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {state === "complete" && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4A843]/15 text-[#D4A843]">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 5.5L4 7.5L8 3" />
              </svg>
            </span>
          )}
          {showArrow && (
            <span
              aria-hidden="true"
              className={`text-white/50 transition-all group-hover:translate-x-1 ${
                state === "active" ? "group-hover:text-[#D4A843]" : "group-hover:text-[#D4A843]/70"
              }`}
            >
              →
            </span>
          )}
        </div>
      </div>
      {shareSlot}
    </>
  );
}

function JourneyCard({
  number,
  state,
  label,
  description,
  href,
  onClick,
  shareSlot,
}: JourneyCardProps) {
  // Only active/complete cards with a real href render as links. Defensive
  // against stale props: upcoming/all-done never become interactive.
  const effectiveHref =
    (state === "active" || state === "complete") && href ? href : undefined;
  const base = "block rounded-xl border p-5 sm:p-6 transition-all";

  if (effectiveHref) {
    const className = `group ${base} ${STATE_BASE[state]} ${LINK_HOVER[state]}`;
    return (
      <Link href={effectiveHref} onClick={onClick} className={className}>
        <CardBody
          number={number}
          state={state}
          label={label}
          description={description}
          shareSlot={shareSlot}
          showArrow
        />
      </Link>
    );
  }

  const className = `${base} ${STATE_BASE[state]}`;

  return (
    <div className={className}>
      <CardBody
        number={number}
        state={state}
        label={label}
        description={description}
        shareSlot={shareSlot}
        showArrow={false}
      />
    </div>
  );
}
