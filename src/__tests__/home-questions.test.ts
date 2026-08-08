import { describe, expect, it } from "vitest";
import { HOME_QUESTION_SLUGS } from "@/lib/home-questions";
import { TOPIC_EMBLEMS } from "@/components/emblems";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

const enSlugs = new Set(en.learn.topics.map((t: { slug: string }) => t.slug));
const ptSlugs = new Set(pt.learn.topics.map((t: { slug: string }) => t.slug));

describe("HOME_QUESTION_SLUGS", () => {
  /*
   * The list is hand-curated for pull, so nothing else keeps it honest. Rename
   * or drop a topic and the homepage would render a chip with no title — the
   * failure is silent in the browser and loud here.
   */
  it("names only real topics, in both locales", () => {
    for (const slug of HOME_QUESTION_SLUGS) {
      expect(enSlugs.has(slug), `unknown slug in en: ${slug}`).toBe(true);
      expect(ptSlugs.has(slug), `unknown slug in pt: ${slug}`).toBe(true);
    }
  });

  /** Every chip carries its topic's symbol; a missing one renders nothing. */
  it("has an emblem for every question shown", () => {
    for (const slug of HOME_QUESTION_SLUGS) {
      expect(TOPIC_EMBLEMS[slug], `no emblem for ${slug}`).toBeDefined();
    }
  });

  it("has no duplicates", () => {
    expect(new Set(HOME_QUESTION_SLUGS).size).toBe(HOME_QUESTION_SLUGS.length);
  });

  /*
   * The band is one row of three cards — sm+ renders grid-cols-3 directly
   * from this list, so a fourth entry would wrap into a lonely second row and
   * a second entry would leave a hole. The count is part of the design.
   */
  it("holds exactly one row of cards", () => {
    expect(HOME_QUESTION_SLUGS.length).toBe(3);
  });
});
