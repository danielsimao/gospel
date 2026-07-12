import { describe, it, expect } from "vitest";
import { buildArticleSchema, buildBreadcrumbSchema, SITE_URL } from "@/lib/seo";

describe("buildArticleSchema", () => {
  it("builds a complete Article node", () => {
    const schema = buildArticleSchema({
      locale: "en",
      slug: "am-i-a-good-person",
      title: "Am I a Good Person?",
      description: "desc",
      datePublished: "2026-07-12",
      dateModified: "2026-07-12",
    });
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("Am I a Good Person?");
    expect(schema.mainEntityOfPage).toBe(`${SITE_URL}/en/learn/am-i-a-good-person`);
    expect(schema.inLanguage).toBe("en");
    expect(schema.datePublished).toBe("2026-07-12");
    expect(schema.publisher).toEqual({ "@id": `${SITE_URL}#organization` });
    expect(schema.image).toContain("/en/opengraph-image");
  });
});

describe("buildBreadcrumbSchema", () => {
  it("builds positioned ListItems", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Home", url: "https://x/en" },
      { name: "Learn", url: "https://x/en/learn" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Learn",
      item: "https://x/en/learn",
    });
  });
});
