import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app
  }
}

export function trackHomeViewed(locale: string) {
  safeCapture("home_page_viewed", { locale });
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
