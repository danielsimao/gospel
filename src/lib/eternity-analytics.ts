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

/** The last-word band's door, kept apart from the hero CTA so the two test
    entries on the page stay separable in the funnel. */
export function trackHomeLastWordClicked() {
  safeCapture("home_last_word_clicked", { destination: "test" });
}

export function trackTopBarLearnClicked() {
  safeCapture("top_bar_learn_clicked");
}

export function trackTopBarTestClicked() {
  safeCapture("top_bar_test_clicked");
}

export function trackGraceRevealed() {
  safeCapture("grace_revealed");
}

export function trackGraceBeatRevealed(beatIndex: number) {
  safeCapture("grace_beat_revealed", { beat_index: beatIndex });
}

/**
 * A reader moved grace on a beat by tapping.
 *
 * Grace answers a tap, a swipe, the wheel and the keyboard alike, one beat per
 * gesture. Against grace_beat_revealed this says how many of those moves were
 * taps — which gesture readers actually reach for, and so which one the hint
 * should keep naming.
 */
export function trackGraceTapAdvance() {
  safeCapture("grace_tap_advance");
}

export function trackHomeBlogCardClicked(slug: string) {
  safeCapture("home_blog_card_clicked", { slug });
}

export function trackTopBarBlogClicked() {
  safeCapture("top_bar_blog_clicked");
}
