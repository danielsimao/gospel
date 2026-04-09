import type { Metadata } from "next";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./i18n";

const FALLBACK_SITE_URL = "http://localhost:3000";
const BRAND_NAME = "Gospel";

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

export function getLanguageAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = getLocaleUrl(locale, path);
  }

  languages["x-default"] = getLocaleUrl(DEFAULT_LOCALE, path);

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
};

export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
  robots,
}: BuildPageMetadataArgs): Metadata {
  const url = getLocaleUrl(locale, path);
  const imageUrl = getAbsoluteUrl(`/og-image-${locale}.png`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: getLanguageAlternates(path),
    },
    openGraph: {
      type: "website",
      url,
      siteName: BRAND_NAME,
      locale: getOpenGraphLocale(locale),
      title,
      description,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
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
        inLanguage: [...SUPPORTED_LOCALES],
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        url: SITE_URL,
        name: BRAND_NAME,
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
