import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["en", "pt"];
const DEFAULT_LOCALE = "en";

function preferredLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
  return preferred && SUPPORTED_LOCALES.includes(preferred)
    ? preferred
    : DEFAULT_LOCALE;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Bare domain gets the locale home REWRITTEN, not redirected — the 307
  // round trip cost ~330ms of blank screen on every first visit. The /en
  // page's canonical/hreflang metadata still points search engines at the
  // locale URL, and every in-app link is locale-prefixed from there.
  if (pathname === "/") {
    return NextResponse.rewrite(
      new URL(`/${preferredLocale(request)}`, request.url),
    );
  }

  // Locale-less deep links (typed or shared without /en) get the locale
  // prefixed instead of 404ing: /test → /en/test, /learn/... → /en/learn/...
  // These stay redirects so the canonical locale URL lands in the address
  // bar for sharing.
  return NextResponse.redirect(
    new URL(`/${preferredLocale(request)}${pathname}`, request.url),
  );
}

export const config = {
  // Everything except Next internals, API routes, and files with extensions
  // (icons, sitemap.xml, robots.txt, manifest.webmanifest, images, …)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
