import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.warn("[learn-analytics] Capture failed:", error);
  }
}

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
