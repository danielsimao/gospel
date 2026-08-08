"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, ButtonArrow } from "@/components/ui/button";
import { ShareButtons } from "@/components/share-buttons";
import { subscribeToStorage } from "@/lib/client-storage";
import { isTopicCompleted, clearAllTopicProgress } from "@/lib/learn-progress-storage";
import { clearAllQuizAnswers, hasAnyQuizAnswers } from "@/lib/learn-quiz-storage";
import { readProgress, getCompletedCount } from "@/lib/reading-storage";
import { readJourney, deriveStage } from "@/lib/journey-storage";
import { trackLearnProgressReset } from "@/lib/learn-analytics";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageShell } from "@/components/shared/page-shell";
import { TopicCoverCard } from "@/components/learn/topic-cover-card";
import { LEARN_BANDS } from "@/lib/learn-bands";
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
  bandLabels: { law: string; questions: string; rescue: string };
  quizLabel: string;
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
      const testDone = deriveStage(readJourney()) !== "visitor";
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

export function LearnHub({ label, subtitle, progressLabel, allCompleteHeading, allCompleteTestCta, allCompleteReadingCta, allCompleteShareCta, resetLabel, resetConfirmTitle, resetConfirmBody, resetConfirmButton, resetCancelButton, shareMessages, bandLabels, quizLabel, topics, locale }: LearnHubProps) {
  // Pre-existing hydration bug, caught while verifying this redesign: the
  // initializer used to branch on `typeof window === "undefined"` directly,
  // which is false by the time the *client's* first render runs — so a
  // returning reader with any progress got a client tree that already had
  // the progress bar mounted, against server HTML that didn't. React then
  // discards and regenerates the mismatched subtree, which on this page
  // lands mid-animation and leaves a whole band's fadeInUp stuck at its
  // 0%-opacity keyframe — cover cards present in the DOM (confirmed loaded)
  // but invisible. Starting empty unconditionally, on both passes, and
  // syncing the real snapshot only after mount (the same "flush after
  // ready" shape TopicNav's CTA already uses) removes the mismatch instead
  // of papering over its symptom.
  const [snapshot, setSnapshot] = useState<LearnHubSnapshot>(getEmptyLearnHubState);

  useEffect(() => {
    const sync = () =>
      setSnapshot(
        readLearnHubState(
          topics,
          locale,
          allCompleteTestCta,
          allCompleteReadingCta,
          allCompleteShareCta,
        ),
      );
    sync();
    return subscribeToStorage(sync);
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
    <PageShell>
      <div className="animate-[fadeInUp_0.5s_ease-out_both]">
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
        <div className="mt-6 animate-[fadeInUp_0.5s_ease-out_both]" style={{ animationDelay: "80ms" }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/70">
              {progress}
            </span>
            <button
              type="button"
              onClick={() => setResetDialogOpen(true)}
              className="font-mono text-[10px] uppercase tracking-[2px] text-white/60 transition-colors hover:text-white/80"
            >
              {resetLabel}
            </button>
          </div>
          <div className="flex gap-1.5">
            {topics.map((topic) => (
              <div key={topic.slug} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full bg-[#D4A843] transition-[width] duration-600 ease-out"
                  style={{ width: snapshot.completed.has(topic.slug) ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All-complete banner */}
      {allDone && snapshot.completionCta && (
        <div className="mt-8 rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.03] p-5 text-center animate-[fadeInUp_0.5s_ease-out_both]" style={{ animationDelay: "120ms" }}>
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
              <ShareButtons messages={shareMessages} locale={locale} sharePath={`/${locale}/test`} utmCampaign="learn" />
            </div>
          )}
        </div>
      )}

      {/* The argument's arc, made visible: Law → the big questions → the
          rescue. Bands are grouping, not prerequisites — every topic stays
          an entry-anywhere page. Unbanded topics (drift guard) fall into
          the final band rather than disappearing.

          Band eyebrows stay neutral (white, not red/gold): those two colours
          are event colours — the Law's verdict, grace's arrival — and a
          filing label above a library index is not either event. Spending
          gold here in front of a reader who hasn't taken the test yet is the
          exact "gold before the test" mistake the method guards against
          elsewhere; red as a category tag has the same problem in reverse. */}
      <div className="mt-10 flex flex-col gap-8">
        {LEARN_BANDS.map((band, bandIdx) => {
          // Render in band.slugs order (the argument's order), not the
          // messages-array order — otherwise numbering reads 10…14, 09.
          const inBand = band.slugs
            .map((slug) => topics.find((t) => t.slug === slug))
            .filter((t): t is Topic => Boolean(t));
          const banded =
            bandIdx === LEARN_BANDS.length - 1
              ? [
                  ...inBand,
                  ...topics.filter(
                    (t) => !LEARN_BANDS.some((b) => b.slugs.includes(t.slug)),
                  ),
                ]
              : inBand;
          if (banded.length === 0) return null;
          return (
            <div
              key={band.key}
              className="animate-[fadeInUp_0.5s_ease-out_both]"
              style={{ animationDelay: `${120 + bandIdx * 80}ms` }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px w-6 bg-white/[0.14]" />
                <span className="font-mono text-[9px] uppercase tracking-[3px] text-white/60">
                  {bandLabels[band.key]}
                </span>
                <span className="h-px flex-1 bg-white/[0.14] opacity-40" />
              </div>
              {/* Two-up rather than three: at three, a card falls below the
                  ~250px width where the set's two weakest covers stop
                  reading as anything (measured full-size against all 14
                  real covers, plan 015 — the failure held at every desktop
                  card size this layout can produce, which is why those two
                  covers were regenerated rather than the grid re-tuned). */}
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                {banded.map((topic, idxInBand) => {
                  // Number by display position (bands reorder the array).
                  const displayOrder = LEARN_BANDS.flatMap((b) => b.slugs);
                  const pos = displayOrder.indexOf(topic.slug);
                  const i = pos === -1 ? displayOrder.length : pos;
                  const isDone = snapshot.completed.has(topic.slug);
                  return (
                    <TopicCoverCard
                      key={topic.slug}
                      slug={topic.slug}
                      href={`/${locale}/learn/${topic.slug}`}
                      title={topic.title}
                      subtitle={topic.subtitle}
                      number={i + 1}
                      isDone={isDone}
                      quizTag={quizLabel}
                      // Only the hub's own first row is a plausible LCP
                      // element — one column on mobile, two on desktop, so
                      // the first two cards of the first band cover both.
                      priority={bandIdx === 0 && idxInBand < 2}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
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
    </PageShell>
  );
}
