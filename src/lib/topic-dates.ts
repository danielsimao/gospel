/**
 * Publication dates for learn topics, keyed by slug. Locale-independent —
 * kept out of the message JSON so EN/PT can't drift. `modified` is bumped
 * only on meaningful content changes, not typo fixes.
 */
export const TOPIC_DATES: Record<string, { published: string; modified: string }> = {
  "am-i-a-good-person": { published: "2026-07-12", modified: "2026-07-12" },
  "who-is-jesus": { published: "2026-04-07", modified: "2026-04-07" },
  "what-is-sin": { published: "2026-04-07", modified: "2026-04-07" },
  "why-the-cross": { published: "2026-04-07", modified: "2026-04-07" },
  "how-can-my-sins-be-forgiven": { published: "2026-07-12", modified: "2026-07-12" },
  "what-is-repentance": { published: "2026-04-07", modified: "2026-04-07" },
  "what-happens-when-i-die": { published: "2026-04-07", modified: "2026-07-12" },
  "does-god-exist": { published: "2026-07-12", modified: "2026-07-12" },
};
