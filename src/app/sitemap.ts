import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { getLocaleUrl, getLanguageAlternates } from "@/lib/seo";
import { TOPIC_DATES } from "@/lib/topic-dates";

const BUILD_TIMESTAMP = new Date();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const messages = await import("@/messages/en.json");
  const learnSlugs = (messages.default.learn?.topics ?? []).map((topic) => topic.slug);
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    // Static pages
    const staticPages = ["", "/test", "/reading-plan", "/learn", "/about", "/privacy", "/terms"];
    for (const page of staticPages) {
      entries.push({
        url: getLocaleUrl(locale, page),
        lastModified: BUILD_TIMESTAMP,
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : page === "/test" ? 0.9 : 0.7,
        alternates: { languages: getLanguageAlternates(page) },
      });
    }

    // Learn pages — honest per-topic dates, matching the Article schema
    for (const slug of learnSlugs) {
      const dates = TOPIC_DATES[slug];
      entries.push({
        url: getLocaleUrl(locale, `/learn/${slug}`),
        lastModified: dates ? new Date(dates.modified) : BUILD_TIMESTAMP,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages: getLanguageAlternates(`/learn/${slug}`) },
      });
    }
  }

  return entries;
}
