import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import { TOPIC_EMBLEMS } from "@/components/emblems";

describe("topic emblems", () => {
  it("every learn topic has an emblem (new topics must be added to TOPIC_EMBLEMS)", () => {
    const slugs = en.learn.topics.map((topic) => topic.slug);
    const missing = slugs.filter((slug) => !TOPIC_EMBLEMS[slug]);
    expect(missing).toEqual([]);
  });
});
