import { describe, it, expect } from "vitest";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildPageMetadata,
  SITE_URL,
} from "@/lib/seo";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";

describe("buildPageMetadata", () => {
  it.each(SUPPORTED_LOCALES)("gives %s pages a share card", (locale) => {
    // Every page outside learn/[slug] and blog/[slug] shipped
    // twitter:card=summary_large_image with no image, because the
    // [locale]/opengraph-image file convention covers its own segment only and
    // the real pages all sit under a route group below it.
    const metadata = buildPageMetadata({
      locale,
      path: "/about",
      title: "About",
      description: "desc",
    });

    const images = metadata.openGraph?.images;
    expect(Array.isArray(images) && images.length).toBeTruthy();
    const [image] = images as Array<{ url: string; alt: string }>;
    expect(image.url).toBe(`${SITE_URL}/${locale}/opengraph-image`);
    expect(image.alt.length).toBeGreaterThan(0);
    expect(metadata.twitter?.images).toEqual([image.url]);
  });

  it("keeps canonical and hreflang on the locale URL", () => {
    const metadata = buildPageMetadata({
      locale: "pt",
      path: "/learn",
      title: "Aprender",
      description: "desc",
    });
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/pt/learn`);
    expect(metadata.alternates?.languages).toEqual({
      en: `${SITE_URL}/en/learn`,
      pt: `${SITE_URL}/pt/learn`,
      "x-default": `${SITE_URL}/en/learn`,
    });
  });
});

describe("home and test metadata", () => {
  // The two strongest URLs on the site shipped byte-identical titles and
  // descriptions, so they competed for the same query with the same words.
  it.each([
    ["en", en],
    ["pt", pt],
  ])("%s gives /test its own title and description", (_locale, messages) => {
    expect(messages.test.metaTitle).not.toBe(messages.meta.title);
    expect(messages.test.metaDescription).not.toBe(messages.meta.description);
    expect(messages.test.metaTitle.length).toBeGreaterThan(0);
    expect(messages.test.metaDescription.length).toBeGreaterThan(0);
  });

  it.each([
    ["en", en],
    ["pt", pt],
  ])("%s keeps both titles inside what a result page shows", (_locale, messages) => {
    expect(messages.meta.title.length).toBeLessThanOrEqual(60);
    expect(messages.test.metaTitle.length).toBeLessThanOrEqual(60);
  });

  it.each([
    ["en", en],
    ["pt", pt],
  ])("%s keeps both descriptions inside the snippet budget", (_locale, messages) => {
    for (const description of [messages.meta.description, messages.test.metaDescription]) {
      expect(description.length).toBeGreaterThanOrEqual(70);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });
});

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

  it("supports blog posts via basePath, image, and type overrides", () => {
    const schema = buildArticleSchema({
      locale: "en",
      slug: "dont-die-movement",
      title: "title",
      description: "desc",
      datePublished: "2026-07-13",
      dateModified: "2026-07-13",
      basePath: "/blog",
      image: `${SITE_URL}/en/blog/dont-die-movement/opengraph-image`,
      type: "BlogPosting",
    });
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.url).toBe(`${SITE_URL}/en/blog/dont-die-movement`);
    expect(schema.mainEntityOfPage).toBe(`${SITE_URL}/en/blog/dont-die-movement`);
    expect(schema.image).toBe(`${SITE_URL}/en/blog/dont-die-movement/opengraph-image`);
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
