import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import { TOPIC_EMBLEMS } from "@/components/emblems";
import { OG_EMBLEM_SLUGS, getEmblemDataUri } from "@/lib/emblem-og";

describe("topic emblems", () => {
  it("every learn topic has an emblem (new topics must be added to TOPIC_EMBLEMS)", () => {
    const slugs = en.learn.topics.map((topic) => topic.slug);
    const missing = slugs.filter((slug) => !TOPIC_EMBLEMS[slug]);
    expect(missing).toEqual([]);
  });

  it("OG emblem map mirrors TOPIC_EMBLEMS (new emblems must be added to emblem-og.ts)", () => {
    expect(OG_EMBLEM_SLUGS.sort()).toEqual(Object.keys(TOPIC_EMBLEMS).sort());
  });

  it("renders every emblem as an SVG data URI", () => {
    for (const slug of OG_EMBLEM_SLUGS) {
      const uri = getEmblemDataUri(slug, { size: 88, strokeWidth: 1.5, color: "#D4A843" });
      expect(uri).toMatch(/^data:image\/svg\+xml,/);
      const svg = decodeURIComponent(uri!.replace("data:image/svg+xml,", ""));
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain("<path");
    }
    expect(getEmblemDataUri("unknown-slug", { size: 88, strokeWidth: 1.5, color: "#fff" })).toBeNull();
  });
});
