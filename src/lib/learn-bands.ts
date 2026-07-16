/**
 * The learn hub's argument arc, made visible: the Law examines, the big
 * questions press, the rescue answers. Bands express the designed reading
 * order without imposing prerequisites — every topic stays an
 * entry-anywhere lander. The unit test enforces that every topic in
 * messages belongs to exactly one band.
 */
export type LearnBandKey = "law" | "questions" | "rescue";

export const LEARN_BANDS: Array<{ key: LearnBandKey; slugs: string[] }> = [
  {
    key: "law",
    slugs: ["am-i-a-good-person", "what-is-sin", "what-happens-when-i-die"],
  },
  {
    key: "questions",
    slugs: [
      "does-god-exist",
      "is-there-life-after-death",
      "what-is-the-meaning-of-life",
      "why-are-you-afraid-to-die",
      "why-does-god-allow-suffering",
    ],
  },
  {
    key: "rescue",
    slugs: [
      "what-is-the-gospel",
      "who-is-jesus",
      "why-the-cross",
      "how-can-my-sins-be-forgiven",
      "what-is-repentance",
      "how-can-i-be-saved",
    ],
  },
];
