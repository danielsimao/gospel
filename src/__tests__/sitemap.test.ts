import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/seo";
import { TOPIC_DATES } from "@/lib/topic-dates";
import { getPublishedPosts, getPostDateModified } from "@/content/blog/posts";

const entries = await sitemap();
const byUrl = new Map(entries.map((entry) => [entry.url, entry]));

/** Pages whose only "modification" is a deploy. */
const DATELESS = ["/test", "/reading-plan", "/about", "/privacy", "/terms", "/find-a-church"];

describe("sitemap", () => {
  it("lists every URL once, absolute and locale-prefixed", () => {
    expect(byUrl.size).toBe(entries.length);
    for (const entry of entries) {
      expect(entry.url.startsWith(`${SITE_URL}/en`) || entry.url.startsWith(`${SITE_URL}/pt`)).toBe(
        true,
      );
    }
  });

  it.each(DATELESS)("sends no lastmod for %s, which has no honest date", (path) => {
    // Stamping the build time here told Google that sixteen pages had changed
    // on a CSS-only deploy, and a lastmod that always moves is one crawlers
    // learn to ignore.
    for (const locale of ["en", "pt"]) {
      const entry = byUrl.get(`${SITE_URL}/${locale}${path}`);
      expect(entry, `${locale}${path} missing from sitemap`).toBeDefined();
      expect(entry?.lastModified, `${locale}${path}`).toBeUndefined();
    }
  });

  it("dates the homepage and the learn hub from the content they carry", () => {
    const newestTopic = Object.values(TOPIC_DATES)
      .map((dates) => dates.modified)
      .reduce((latest, date) => (date > latest ? date : latest));
    const newestPost = getPublishedPosts()
      .map(getPostDateModified)
      .reduce((latest, date) => (date > latest ? date : latest));
    const newestContent = newestPost > newestTopic ? newestPost : newestTopic;

    for (const locale of ["en", "pt"]) {
      expect(byUrl.get(`${SITE_URL}/${locale}`)?.lastModified).toEqual(new Date(newestContent));
      expect(byUrl.get(`${SITE_URL}/${locale}/learn`)?.lastModified).toEqual(
        new Date(newestTopic),
      );
    }
  });

  it("dates each learn topic from TOPIC_DATES", () => {
    for (const [slug, dates] of Object.entries(TOPIC_DATES)) {
      const entry = byUrl.get(`${SITE_URL}/en/learn/${slug}`);
      expect(entry, slug).toBeDefined();
      expect(entry?.lastModified, slug).toEqual(new Date(dates.modified));
    }
  });

  it("dates each post from its own modified date", () => {
    for (const post of getPublishedPosts()) {
      const entry = byUrl.get(`${SITE_URL}/en/blog/${post.slug}`);
      expect(entry, post.slug).toBeDefined();
      expect(entry?.lastModified, post.slug).toEqual(new Date(getPostDateModified(post)));
    }
  });

  it("carries hreflang alternates on every entry", () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages;
      expect(languages, entry.url).toBeDefined();
      expect(languages?.["x-default"], entry.url).toBeTruthy();
    }
  });
});
