import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app
  }
}

export function trackEternityViewed(locale: string) {
  safeCapture("eternity_page_viewed", { locale });
}

export function trackQuizAnswered(questionIndex: number, answer: "yes" | "no") {
  safeCapture("eternity_quiz_answered", { question_index: questionIndex, answer });
}

export function trackGuiltyShown() {
  safeCapture("eternity_guilty_shown");
}

export function trackBridgeClicked() {
  safeCapture("eternity_bridge_clicked");
}

export function trackGraceRevealed() {
  safeCapture("eternity_grace_revealed");
}

export function trackEternityCtaClicked(cta: "test" | "chat" | "resource", resourceName?: string) {
  safeCapture("eternity_cta_clicked", { cta, resource_name: resourceName });
}

export function trackEternityShared(method: "whatsapp" | "telegram" | "copy" | "native", locale: string) {
  safeCapture("eternity_shared", { share_method: method, locale });
}

export function trackScrollDepth(section: number) {
  safeCapture("eternity_scroll_depth", { furthest_section: section });
}

export function trackGraceBeatRevealed(beatIndex: number) {
  safeCapture("eternity_grace_beat_revealed", { beat_index: beatIndex });
}

export function trackGraceCtaClicked() {
  safeCapture("eternity_grace_cta_clicked");
}
