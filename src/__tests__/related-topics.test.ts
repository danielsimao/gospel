import { describe, expect, it } from "vitest";
import { RELATED_TOPICS } from "@/lib/related-topics";
import { LEARN_BANDS } from "@/lib/learn-bands";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

const enSlugs = new Set(en.learn.topics.map((t: { slug: string }) => t.slug));
const ptSlugs = new Set(pt.learn.topics.map((t: { slug: string }) => t.slug));

// The same order TopicNav's "Next up" is built from (see the [slug]/page.tsx
// server component): band order, unbanded topics appended at the end.
const displayOrder = [
  ...LEARN_BANDS.flatMap((b) => b.slugs),
  ...en.learn.topics.map((t) => t.slug).filter((s) => !LEARN_BANDS.some((b) => b.slugs.includes(s))),
];
const nextTopicOf = (slug: string) => {
  const i = displayOrder.indexOf(slug);
  return i === -1 || i === displayOrder.length - 1 ? null : displayOrder[i + 1];
};

describe("RELATED_TOPICS", () => {
  /*
   * A hand-curated pastoral map, so nothing else keeps its slugs honest.
   * Rename or drop a topic and a "Keep digging" row would point at a dead
   * link — the failure is silent in the browser and loud here.
   */
  it("keys and names only real topics, in both locales", () => {
    for (const [slug, related] of Object.entries(RELATED_TOPICS)) {
      expect(enSlugs.has(slug), `unknown key slug: ${slug}`).toBe(true);
      expect(ptSlugs.has(slug), `unknown key slug: ${slug}`).toBe(true);
      for (const r of related) {
        expect(enSlugs.has(r), `${slug} names unknown related slug: ${r}`).toBe(true);
        expect(ptSlugs.has(r), `${slug} names unknown related slug: ${r}`).toBe(true);
      }
    }
  });

  it("never lists a topic as its own related topic", () => {
    for (const [slug, related] of Object.entries(RELATED_TOPICS)) {
      expect(related.includes(slug), `${slug} lists itself`).toBe(false);
    }
  });

  it("holds 1-2 entries per topic, with no duplicates", () => {
    for (const [slug, related] of Object.entries(RELATED_TOPICS)) {
      expect(related.length, `${slug} has ${related.length} related topics`).toBeGreaterThanOrEqual(1);
      expect(related.length, `${slug} has ${related.length} related topics`).toBeLessThanOrEqual(2);
      expect(new Set(related).size, `${slug} repeats a related topic`).toBe(related.length);
    }
  });

  /*
   * Caught live during plan 015's own verification: every rescue-band entry
   * originally pointed at exactly the topic TopicNav's "Next up" already
   * shows, because the rescue band's arc is tightly sequential and each
   * pairing was picked by "what comes after this, pastorally" — which is
   * what "Next up" is for. "Keep digging" exists to jump ACROSS the arc, not
   * re-show it, so a related slug that equals the next-up slug is a defect,
   * not a stylistic choice.
   */
  it("never repeats the topic TopicNav's Next up already shows", () => {
    const collisions: string[] = [];
    for (const [slug, related] of Object.entries(RELATED_TOPICS)) {
      const next = nextTopicOf(slug);
      if (next && related.includes(next)) {
        collisions.push(`${slug} lists its own next-up topic (${next}) as related`);
      }
    }
    expect(collisions).toEqual([]);
  });
});
