import { capture as safeCapture } from "@/lib/posthog";

export function trackBlogPostViewed(slug: string, locale: string) {
  safeCapture("blog_post_viewed", { slug, locale });
}

export function trackBlogScrollDepth(slug: string, quartile: 25 | 50 | 75 | 100) {
  safeCapture("blog_scroll_depth", { slug, quartile });
}

export function trackBlogCtaClicked(
  slug: string,
  position: "sticky" | "card" | "personal_turn",
  stage: string,
) {
  safeCapture("blog_cta_clicked", { slug, position, stage });
}

export function trackBlogCardDismissed(slug: string, stage: string) {
  safeCapture("blog_card_dismissed", { slug, stage });
}

export function trackStoryLinkCopied(slug: string) {
  safeCapture("blog_story_link_copied", { slug });
}

/**
 * The story graphic leaving the page — the step the Instagram funnel actually
 * turns on, and the one that was previously unmeasured. `method` separates the
 * native share sheet (which hands straight off to Instagram) from the download
 * and open-in-tab fallbacks, so a fallback path with real volume shows up
 * rather than hiding inside one undifferentiated count.
 */
export function trackStorySaved(slug: string, method: "share" | "download" | "open") {
  safeCapture("blog_story_saved", { slug, method });
}
