import type { Metadata } from "next";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./i18n";

const FALLBACK_SITE_URL = "http://localhost:3000";
const BRAND_NAME = "If You Died Today";

function shouldAddWww(hostname: string): boolean {
  return !hostname.startsWith("www.") && !hostname.endsWith(".vercel.app") && hostname.includes(".");
}

function normalizeSiteUrl(rawUrl?: string): string {
  if (!rawUrl) return FALLBACK_SITE_URL;

  const trimmed = rawUrl.trim();
  if (!trimmed) return FALLBACK_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.protocol === "https:" && shouldAddWww(url.hostname)) {
      url.hostname = `www.${url.hostname}`;
    }

    url.pathname = url.pathname.replace(/\/+$/, "");

    return url.toString().replace(/\/$/, "");
  } catch {
    return withProtocol.replace(/\/+$/, "");
  }
}

export const SITE_URL = normalizeSiteUrl(
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL,
);

function normalizePath(path = ""): string {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function getMetadataBase(): URL {
  return new URL(SITE_URL);
}

export function getAbsoluteUrl(path = ""): string {
  return new URL(path || "/", SITE_URL).toString();
}

export function getLocalePath(locale: Locale, path = ""): string {
  return `/${locale}${normalizePath(path)}`;
}

export function getLocaleUrl(locale: Locale, path = ""): string {
  return getAbsoluteUrl(getLocalePath(locale, path));
}

export function getLanguageAlternates(
  path = "",
  locales: readonly Locale[] = SUPPORTED_LOCALES,
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    languages[locale] = getLocaleUrl(locale, path);
  }

  const xDefault = locales.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : locales[0];
  languages["x-default"] = getLocaleUrl(xDefault, path);

  return languages;
}

function getOpenGraphLocale(locale: Locale): string {
  return locale === "pt" ? "pt_PT" : "en_US";
}

type BuildPageMetadataArgs = {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  robots?: Metadata["robots"];
  /** Locales this page exists in; hreflang is emitted only for these. Defaults to all. */
  availableLocales?: readonly Locale[];
  /** When set, emits og:type article with published/modified times. */
  article?: { publishedTime: string; modifiedTime?: string };
};

export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
  robots,
  availableLocales,
  article,
}: BuildPageMetadataArgs): Metadata {
  const url = getLocaleUrl(locale, path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: getLanguageAlternates(path, availableLocales),
    },
    openGraph: {
      url,
      siteName: BRAND_NAME,
      locale: getOpenGraphLocale(locale),
      title,
      description,
      ...(article
        ? {
            type: "article",
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime ?? article.publishedTime,
          }
        : { type: "website" }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots,
  };
}

export function buildSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name: BRAND_NAME,
        description: "Are you a good person? Take the test — a direct, honest look at morality, God, and eternity.",
        inLanguage: [...SUPPORTED_LOCALES],
        publisher: { "@id": `${SITE_URL}#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        url: SITE_URL,
        name: BRAND_NAME,
        description: "A direct, honest look at the gospel — measure yourself against God's standard and see what comes next.",
        logo: {
          "@type": "ImageObject",
          url: getAbsoluteUrl("/en/opengraph-image"),
        },
      },
    ],
  };
}

type BuildWebPageSchemaArgs = {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
};

export function buildWebPageSchema({
  locale,
  path = "",
  title,
  description,
}: BuildWebPageSchemaArgs) {
  const url = getLocaleUrl(locale, path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: locale,
    isPartOf: {
      "@id": `${SITE_URL}#website`,
    },
  };
}

type BuildArticleSchemaArgs = {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  /** URL section the article lives under. Defaults to /learn. */
  basePath?: string;
  /** Absolute image URL. Defaults to the locale's generic OG card. */
  image?: string;
  type?: "Article" | "BlogPosting";
};

export function buildArticleSchema({
  locale,
  slug,
  title,
  description,
  datePublished,
  dateModified,
  basePath = "/learn",
  image,
  type = "Article",
}: BuildArticleSchemaArgs) {
  const url = getLocaleUrl(locale, `${basePath}/${slug}`);

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#article`,
    headline: title,
    description,
    url,
    inLanguage: locale,
    mainEntityOfPage: url,
    datePublished,
    dateModified,
    image: image ?? getAbsoluteUrl(`/${locale}/opengraph-image`),
    author: { "@id": `${SITE_URL}#organization` },
    publisher: { "@id": `${SITE_URL}#organization` },
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
