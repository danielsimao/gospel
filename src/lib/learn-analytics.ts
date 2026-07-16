import { capture as safeCapture } from "@/lib/posthog";

export function trackTopicPageViewed(slug: string, locale: string) {
  safeCapture("topic_page_viewed", { slug, locale });
}

export function trackTopicSectionReached(slug: string, sectionIndex: number, locale: string) {
  safeCapture("topic_section_reached", { slug, section_index: sectionIndex, locale });
}

export function trackTopicCtaClicked(slug: string, locale: string) {
  safeCapture("topic_cta_clicked", { slug, locale });
}

export function trackTopicNavClicked(slug: string, direction: "next" | "prev", locale: string) {
  safeCapture("topic_nav_clicked", { slug, direction, locale });
}

export function trackTopicFeedback(slug: string, locale: string, answer: "yes" | "no") {
  safeCapture("topic_feedback", { slug, locale, answer });
}

export function trackLearnProgressReset(locale: string) {
  safeCapture("learn_progress_reset", { locale });
}
