/**
 * The learn topics the homepage puts in front of a reader who has not taken
 * the test.
 *
 * Curated for pull rather than derived from `LEARN_BANDS`, which orders the hub
 * by argument (the Law examines, the big questions press, the rescue answers).
 * That arc is right once someone is reading; it is not what stops a stranger
 * scrolling. These six are the ones that read as someone's own question.
 *
 * Order matters twice over. The grid renders it directly, and the first four
 * are the only ones a phone shows — so the strongest have to come first, not
 * the most systematic.
 *
 * A hand-kept list of slugs can rot silently: rename a topic and the homepage
 * renders a chip with no title and no emblem. `home-questions.test.ts` fails
 * the build instead, the same way learn-bands is guarded.
 */
export const HOME_QUESTION_SLUGS = [
  "am-i-a-good-person",
  "what-happens-when-i-die",
  "why-are-you-afraid-to-die",
  "does-god-exist",
  "why-does-god-allow-suffering",
  "what-is-the-gospel",
] as const;

/** How many survive on a phone. The rest are CSS-hidden, not omitted. */
export const HOME_QUESTIONS_MOBILE = 3;
