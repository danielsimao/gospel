import { describe, expect, it } from "vitest";
import { LEARN_BANDS } from "@/lib/learn-bands";
import en from "../messages/en.json";

const topicSlugs = en.learn.topics.map((t: { slug: string }) => t.slug);

describe("LEARN_BANDS", () => {
  it("covers every topic exactly once", () => {
    const banded = LEARN_BANDS.flatMap((b) => b.slugs);
    expect(banded.sort()).toEqual([...topicSlugs].sort());
    expect(new Set(banded).size).toBe(banded.length);
  });

  it("references only real slugs", () => {
    const real = new Set(topicSlugs);
    for (const band of LEARN_BANDS) {
      for (const slug of band.slugs) {
        expect(real.has(slug), `unknown slug ${slug} in band ${band.key}`).toBe(true);
      }
    }
  });
});
