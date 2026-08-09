/**
 * "Keep digging" — 1-2 topics to jump to from wherever a reader currently is,
 * chosen across bands rather than along the hub's arc.
 *
 * `TopicNav`'s "Next up" already carries the arc in order; this is the other
 * kind of navigation — someone reading What is Sin? whose real question is
 * How Can My Sins Be Forgiven? shouldn't have to walk the Law → questions →
 * rescue path to get there. Pastoral pairings, not a data structure that can
 * be derived — which is exactly why they need the owner's eye, and why
 * `related-topics.test.ts` only checks the mechanical half: every slug named
 * here is a real topic, in both locales, and no topic lists itself.
 */
export const RELATED_TOPICS: Record<string, readonly string[]> = {
  "am-i-a-good-person": ["what-is-the-gospel", "how-can-i-be-saved"],
  "what-is-sin": ["how-can-my-sins-be-forgiven", "what-is-the-gospel"],
  "what-happens-when-i-die": ["is-there-life-after-death", "what-is-the-gospel"],
  "does-god-exist": ["who-is-jesus"],
  "is-there-life-after-death": ["what-happens-when-i-die", "how-can-i-be-saved"],
  "what-is-the-meaning-of-life": ["what-is-the-gospel"],
  "why-are-you-afraid-to-die": ["what-happens-when-i-die", "how-can-i-be-saved"],
  "why-does-god-allow-suffering": ["why-the-cross"],
  // The rescue band's own arc (gospel → Jesus → cross → forgiveness →
  // repentance → saved) is already tight and sequential — "Next up" already
  // walks it. Every rescue-band entry below deliberately points somewhere
  // OTHER than its own next stop, back across the law/questions bands,
  // which is the whole reason this row exists.
  "what-is-the-gospel": ["am-i-a-good-person", "how-can-i-be-saved"],
  "who-is-jesus": ["what-is-sin", "how-can-i-be-saved"],
  "why-the-cross": ["why-does-god-allow-suffering"],
  "how-can-my-sins-be-forgiven": ["what-is-sin"],
  "what-is-repentance": ["am-i-a-good-person"],
  "how-can-i-be-saved": ["what-is-the-gospel"],
};
