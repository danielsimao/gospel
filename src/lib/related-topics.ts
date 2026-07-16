/**
 * Curated related-topic map for learn articles (SEO topical cluster +
 * reader guidance). Slugs must exist in messages learn.topics — the
 * unit test enforces it. Order = display order.
 */
export const RELATED_TOPICS: Record<string, string[]> = {
  "am-i-a-good-person": ["what-is-sin", "what-happens-when-i-die"],
  "who-is-jesus": ["why-the-cross", "does-god-exist"],
  "what-is-sin": ["am-i-a-good-person", "how-can-my-sins-be-forgiven"],
  "why-the-cross": ["who-is-jesus", "how-can-my-sins-be-forgiven"],
  "how-can-my-sins-be-forgiven": ["what-is-repentance", "why-the-cross"],
  "what-is-repentance": ["how-can-my-sins-be-forgiven", "what-is-sin"],
  "what-happens-when-i-die": ["is-there-life-after-death", "why-are-you-afraid-to-die"],
  "does-god-exist": ["who-is-jesus", "what-happens-when-i-die"],
  "is-there-life-after-death": ["what-happens-when-i-die", "does-god-exist"],
  "what-is-the-meaning-of-life": ["does-god-exist", "is-there-life-after-death"],
  "why-are-you-afraid-to-die": ["what-happens-when-i-die", "is-there-life-after-death"],
  "how-can-i-be-saved": ["what-is-repentance", "how-can-my-sins-be-forgiven"],
  "why-does-god-allow-suffering": ["does-god-exist", "is-there-life-after-death"],
};
