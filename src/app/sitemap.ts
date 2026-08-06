import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { getLocaleUrl, getLanguageAlternates } from "@/lib/seo";
import { TOPIC_DATES } from "@/lib/topic-dates";
import { getPublishedPosts, getPostLocales, getPostDateModified } from "@/content/blog/posts";
import { BLOG_ENABLED } from "@/lib/flags";

function newest(dates: string[]): Date | undefined {
  if (!dates.length) return undefined;
  return new Date(dates.reduce((latest, date) => (date > latest ? date : latest)));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const messages = await import("@/messages/en.json");
  const learnSlugs = (messages.default.learn?.topics ?? []).map((topic) => topic.slug);
  const entries: MetadataRoute.Sitemap = [];

  const posts = getPublishedPosts();
  /* With the blog's entrances hidden the homepage no longer carries the latest
     post, so a new post must not move the homepage's date. The posts keep their
     own sitemap rows either way — hidden is not unpublished. */
  const newestPostDate = BLOG_ENABLED
    ? newest(posts.map(getPostDateModified))
    : undefined;
  const newestTopicDate = newest(
    learnSlugs.map((slug) => TOPIC_DATES[slug]?.modified).filter((d): d is string => Boolean(d)),
  );
  // The homepage carries the topic list, and the latest post when the blog's
  // entrances are on, so its date is honestly the newest of what it shows.
  const newestContentDate = newest(
    [newestPostDate, newestTopicDate]
      .filter((d): d is Date => d !== undefined)
      .map((d) => d.toISOString()),
  );

  /**
   * Every static page used to stamp `new Date()` at build. A CSS-only deploy
   * then told Google that sixteen pages had changed, on a site where a real
   * content change is a post or a topic — and a lastmod that moves every
   * deploy is one crawlers learn to ignore, which costs the pages that do
   * change. Pages with no honest date now send none: lastmod is optional, and
   * omitting it says less than a wrong value does.
   */
  const staticPageDates: Record<string, Date | undefined> = {
    "": newestContentDate,
    "/learn": newestTopicDate,
  };

  for (const locale of SUPPORTED_LOCALES) {
    // Static pages
    const staticPages = ["", "/test", "/reading-plan", "/learn", "/about", "/privacy", "/terms", "/find-a-church"];
    for (const page of staticPages) {
      const lastModified = staticPageDates[page];
      entries.push({
        url: getLocaleUrl(locale, page),
        ...(lastModified ? { lastModified } : {}),
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
        ...(dates ? { lastModified: new Date(dates.modified) } : {}),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages: getLanguageAlternates(`/learn/${slug}`) },
      });
    }
  }

  // Blog — the index exists in every locale; posts only in locales they declare
  for (const locale of SUPPORTED_LOCALES) {
    entries.push({
      url: getLocaleUrl(locale, "/blog"),
      ...(newestPostDate ? { lastModified: newestPostDate } : {}),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: getLanguageAlternates("/blog") },
    });
  }

  for (const post of posts) {
    for (const locale of getPostLocales(post)) {
      entries.push({
        url: getLocaleUrl(locale, `/blog/${post.slug}`),
        lastModified: new Date(getPostDateModified(post)),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: getLanguageAlternates(`/blog/${post.slug}`, getPostLocales(post)),
        },
      });
    }
  }

  return entries;
}
