import { capture as safeCapture } from "@/lib/posthog";

export function trackHomeViewed(locale: string, stage?: string) {
  safeCapture("home_page_viewed", { locale, stage });
}

/** The front-door Law question. Answering it starts the real test at Q1. */
export function trackHomeFirstQuestionAnswered(answer: "honest" | "justify", locale: string) {
  safeCapture("home_first_question_answered", { answer, locale });
}

/** Tapped Next after the front-door question — the actual entry into the test. */
export function trackHomeFirstQuestionAdvanced(answer: "honest" | "justify", locale: string) {
  safeCapture("home_first_question_advanced", { answer, locale });
}

export function trackHomeCtaClicked() {
  safeCapture("home_cta_clicked", { destination: "test" });
}

export function trackHomeSecondaryClicked() {
  safeCapture("home_secondary_clicked", { destination: "learn" });
}

export function trackHomeRetakeClicked() {
  safeCapture("home_retake_clicked");
}

export function trackHomeJourneyStepClicked(
  step: "test" | "reading" | "learn" | "share",
  state: "complete" | "active" | "upcoming" | "all-done",
) {
  safeCapture("home_journey_step_clicked", { step, state });
}

export function trackTopBarLearnClicked() {
  safeCapture("top_bar_learn_clicked");
}

export function trackTopBarTestClicked() {
  safeCapture("top_bar_test_clicked");
}

export function trackTopBarReadingClicked() {
  safeCapture("top_bar_reading_clicked");
}

export function trackGraceRevealed() {
  safeCapture("grace_revealed");
}

export function trackGraceBeatRevealed(beatIndex: number) {
  safeCapture("grace_beat_revealed", { beat_index: beatIndex });
}

export function trackHomeBlogCardClicked(slug: string) {
  safeCapture("home_blog_card_clicked", { slug });
}

/** The shareable Romans 3:23 page. */
export function trackGoodEnoughViewed(locale: string) {
  safeCapture("good_enough_viewed", { locale });
}

/** Every press, including the ones after the bar stopped — the dead taps are the interesting ones. */
export function trackGoodEnoughTapped(tap: number, locale: string) {
  safeCapture("good_enough_tapped", { tap, locale });
}

export function trackGoodEnoughRevealed(taps: number, locale: string) {
  safeCapture("good_enough_revealed", { taps, locale });
}

/**
 * `hadCompletedTest` says whether this page is recruiting strangers or
 * entertaining people who have already been through the flow — the number that
 * decides whether it is worth keeping.
 */
export function trackGoodEnoughCtaClicked(
  locale: string,
  hadCompletedTest: boolean,
  taps: number,
) {
  safeCapture("good_enough_cta_clicked", {
    locale,
    destination: "test",
    had_completed_test: hadCompletedTest,
    taps,
  });
}

export function trackTopBarBlogClicked() {
  safeCapture("top_bar_blog_clicked");
}
