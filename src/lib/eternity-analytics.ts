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
 * A reader moved grace on by tapping rather than scrolling.
 *
 * The tap surface exists on a hunch — that five taps through the verdict train
 * a gesture grace then abandons — and it costs text selection on that screen.
 * This is how we find out whether the hunch was right and whether the cost is
 * being paid for something.
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
