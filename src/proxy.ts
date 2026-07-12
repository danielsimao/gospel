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

  // Locale-less deep links (typed or shared without /en) get the locale
  // prefixed instead of 404ing: /test → /en/test, /learn/... → /en/learn/...
  return NextResponse.redirect(
    new URL(
      `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`,
      request.url,
    ),
  );
}

export const config = {
  // Everything except Next internals, API routes, and files with extensions
  // (icons, sitemap.xml, robots.txt, manifest.webmanifest, images, …)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
