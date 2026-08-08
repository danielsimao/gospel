/**
 * The learn topics the homepage puts in front of a reader who has not taken
 * the test.
 *
 * Three, not six, and each one a cover card. Curated for pull rather than
 * derived from `LEARN_BANDS`, which orders the hub by argument (the Law
 * examines, the big questions press, the rescue answers). That arc is right
 * once someone is reading; it is not what stops a stranger scrolling. These
 * three are the ones that read as someone's own question, and three is what
 * one row of cards holds — the other eleven are one tap away behind
 * "All topics".
 *
 * Covers: `am-i-a-good-person` and `does-god-exist` ship theirs already.
 * `why-are-you-afraid-to-die` is prompted in docs/graphics/PROMPTS.md §15 and
 * wears the medallion card until the asset lands and its slug joins
 * TOPIC_COVERS — the flip is automatic, nothing else moves.
 *
 * A hand-kept list of slugs can rot silently: rename a topic and the homepage
 * renders a card with no title. `home-questions.test.ts` fails the build
 * instead, the same way learn-bands is guarded.
 */
export const HOME_QUESTION_SLUGS = [
  "am-i-a-good-person",
  "why-are-you-afraid-to-die",
  "does-god-exist",
] as const;
