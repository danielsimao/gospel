import { capture as safeCapture } from "@/lib/posthog";

export function trackHomeViewed(locale: string, stage?: string) {
  safeCapture("home_page_viewed", { locale, stage });
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

export function trackTopBarBlogClicked() {
  safeCapture("top_bar_blog_clicked");
}
