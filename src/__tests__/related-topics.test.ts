import { describe, expect, it } from "vitest";
import { RELATED_TOPICS } from "@/lib/related-topics";
import en from "../messages/en.json";

const slugs = new Set(en.learn.topics.map((t: { slug: string }) => t.slug));

describe("RELATED_TOPICS", () => {
  it("covers every topic", () => {
    expect(Object.keys(RELATED_TOPICS).sort()).toEqual([...slugs].sort());
  });

  it("references only real slugs, never itself", () => {
    for (const [slug, related] of Object.entries(RELATED_TOPICS)) {
      expect(related.length).toBeGreaterThanOrEqual(2);
      for (const r of related) {
        expect(slugs.has(r)).toBe(true);
        expect(r).not.toBe(slug);
      }
    }
  });
});
