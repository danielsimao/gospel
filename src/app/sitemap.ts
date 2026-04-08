import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/lib/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : "http://localhost:3000";

const LEARN_SLUGS = [
  "who-is-jesus",
  "what-is-sin",
  "why-the-cross",
  "what-is-repentance",
  "what-happens-when-i-die",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    // Static pages
    const staticPages = ["", "/test", "/chat", "/reading-plan", "/next-steps"];
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : page === "/test" ? 0.9 : 0.7,
      });
    }

    // Learn pages
    for (const slug of LEARN_SLUGS) {
      entries.push({
        url: `${BASE_URL}/${locale}/learn/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
