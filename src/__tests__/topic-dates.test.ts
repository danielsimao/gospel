import { describe, it, expect } from "vitest";
import { TOPIC_DATES } from "@/lib/topic-dates";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

describe("TOPIC_DATES ↔ learn.topics sync", () => {
  const enSlugs = en.learn.topics.map((t: { slug: string }) => t.slug);
  const ptSlugs = pt.learn.topics.map((t: { slug: string }) => t.slug);

  it("locales agree on slugs and order", () => {
    expect(ptSlugs).toEqual(enSlugs);
  });

  it("every topic has a date entry and no stale entries exist", () => {
    expect(Object.keys(TOPIC_DATES).sort()).toEqual([...enSlugs].sort());
  });
});
