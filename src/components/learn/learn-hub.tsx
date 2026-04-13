"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { ShareButtons } from "@/components/share-buttons";
import { subscribeToStorage } from "@/lib/client-storage";
import { isTopicCompleted, clearAllTopicProgress } from "@/lib/learn-progress-storage";
import { clearAllQuizAnswers, hasAnyQuizAnswers } from "@/lib/learn-quiz-storage";
import { readProgress, getCompletedCount } from "@/lib/reading-storage";
import { trackLearnProgressReset } from "@/lib/learn-analytics";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Locale } from "@/lib/i18n";

const TOTAL_READING_DAYS = 7;

type CompletionCta = { label: string; href: string; type: "button" | "share" } | null;
type LearnHubSnapshot = {
  completed: Set<string>;
  completionCta: CompletionCta;
  hasQuizProgress: boolean;
};

interface Topic {
  slug: string;
  title: string;
  subtitle: string;
}

interface LearnHubProps {
  label: string;
  subtitle: string;
  progressLabel: string;
  allCompleteHeading: string;
  allCompleteTestCta: string;
  allCompleteReadingCta: string;
  allCompleteShareCta: string;
  resetLabel: string;
  resetConfirmTitle: string;
  resetConfirmBody: string;
  resetConfirmButton: string;
  resetCancelButton: string;
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  topics: Topic[];
  locale: Locale;
}

function readLearnHubState(
  topics: Topic[],
  locale: Locale,
  allCompleteTestCta: string,
  allCompleteReadingCta: string,
  allCompleteShareCta: string,
) {
  const completed = new Set<string>();
  for (const topic of topics) {
    if (isTopicCompleted(topic.slug)) {
      completed.add(topic.slug);
    }
  }

  const hasQuizProgress = hasAnyQuizAnswers();
  let completionCta: CompletionCta = null;

  if (completed.size >= topics.length) {
    try {
      const testDone = localStorage.getItem("test_completed") === "1";
      const readingDone = getCompletedCount(readProgress(), TOTAL_READING_DAYS) >= TOTAL_READING_DAYS;

      if (!testDone) {
        completionCta = { label: allCompleteTestCta, href: `/${locale}/test`, type: "button" };
      } else if (!readingDone) {
        completionCta = { label: allCompleteReadingCta, href: `/${locale}/reading-plan`, type: "button" };
      } else {
        completionCta = { label: allCompleteShareCta, href: "", type: "share" };
      }
    } catch {
      completionCta = null;
    }
  }

  return { completed, hasQuizProgress, completionCta };
}

function getEmptyLearnHubState(): LearnHubSnapshot {
  return {
    completed: new Set<string>(),
    completionCta: null,
    hasQuizProgress: false,
  };
}

export function LearnHub({ label, subtitle, progressLabel, allCompleteHeading, allCompleteTestCta, allCompleteReadingCta, allCompleteShareCta, resetLabel, resetConfirmTitle, resetConfirmBody, resetConfirmButton, resetCancelButton, shareMessages, topics, locale }: LearnHubProps) {
  const [snapshot, setSnapshot] = useState<LearnHubSnapshot>(() =>
    typeof window === "undefined"
      ? getEmptyLearnHubState()
      : readLearnHubState(
          topics,
          locale,
          allCompleteTestCta,
          allCompleteReadingCta,
          allCompleteShareCta,
        ),
  );

  useEffect(() => {
    return subscribeToStorage(() =>
      setSnapshot(
        readLearnHubState(
          topics,
          locale,
          allCompleteTestCta,
          allCompleteReadingCta,
          allCompleteShareCta,
        ),
      ),
    );
  }, [topics, locale, allCompleteTestCta, allCompleteReadingCta, allCompleteShareCta]);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  function handleReset() {
    const topicProgressCleared = clearAllTopicProgress();
    const quizAnswersCleared = clearAllQuizAnswers();
    if (!topicProgressCleared || !quizAnswersCleared) {
      return;
    }
    setResetDialogOpen(false);
    trackLearnProgressReset(locale);
  }

  const completedCount = snapshot.completed.size;
  const totalCount = topics.length;
  const allDone = completedCount >= totalCount;
  const hasAnyProgress = completedCount > 0 || snapshot.hasQuizProgress;
  const progress = progressLabel
    .replace("{completed}", String(completedCount))
    .replace("{total}", String(totalCount));

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

      <div className="relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <div className="animate-[fadeInUp_0.8s_ease-out_both]">
          <p className="font-mono text-[9px] uppercase tracking-[4px] text-[#D4A843]/70">{label}</p>
          <h1
            className="mt-3 text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
            style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
          >
            {subtitle}
          </h1>
        </div>

        {/* Progress bar */}
        {hasAnyProgress && (
          <div className="mt-6 animate-[fadeInUp_0.5s_ease-out_both]" style={{ animationDelay: "200ms" }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/70">
                {progress}
              </span>
              <button
                type="button"
                onClick={() => setResetDialogOpen(true)}
                className="font-mono text-[10px] uppercase tracking-[2px] text-white/40 transition-colors hover:text-white/60"
              >
                {resetLabel}
              </button>
            </div>
            <div className="flex gap-1.5">
              {topics.map((topic) => (
                <div key={topic.slug} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full bg-[#D4A843] transition-all duration-600 ease-out"
                    style={{ width: snapshot.completed.has(topic.slug) ? "100%" : "0%" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All-complete banner */}
        {allDone && snapshot.completionCta && (
          <div className="mt-8 rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.03] p-5 text-center animate-[fadeInUp_0.5s_ease-out_both]" style={{ animationDelay: "300ms" }}>
            <p className="text-sm font-medium text-[#D4A843]">{allCompleteHeading}</p>
            {snapshot.completionCta.type === "button" ? (
              <Link href={snapshot.completionCta.href} className="mt-3 inline-block">
                <Button variant="gold" size="sm" mist>
                  {snapshot.completionCta.label}
                  <ButtonArrow />
                </Button>
              </Link>
            ) : (
              <div className="mt-3">
                <ShareButtons messages={shareMessages} locale={locale} sharePath="/test" />
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3">
          {topics.map((topic, i) => {
            const isDone = snapshot.completed.has(topic.slug);
            return (
              <Link
                key={topic.slug}
                href={`/${locale}/learn/${topic.slug}`}
                className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-5 py-4 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.02] sm:px-6 sm:py-5 animate-[fadeInUp_0.5s_ease-out_both]"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] tabular-nums text-[#D4A843]/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-white/85 sm:text-base">{topic.title}</p>
                    <p className="mt-0.5 text-xs text-white/60">{topic.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isDone && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4A843]/15 text-[#D4A843]">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 5.5L4 7.5L8 3" />
                      </svg>
                    </span>
                  )}
                  <span className="text-white/50 transition-all group-hover:translate-x-1 group-hover:text-[#D4A843]/70">
                    &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={resetDialogOpen}
        title={resetConfirmTitle}
        body={resetConfirmBody}
        confirmLabel={resetConfirmButton}
        cancelLabel={resetCancelButton}
        onConfirm={handleReset}
        onClose={() => setResetDialogOpen(false)}
      />
    </main>
  );
}
