import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["en", "pt"];
const DEFAULT_LOCALE = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return NextResponse.next();

  if (pathname !== "/") return NextResponse.next();

  const acceptLanguage = request.headers.get("accept-language");
  let locale = DEFAULT_LOCALE;
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
    if (preferred && SUPPORTED_LOCALES.includes(preferred)) {
      locale = preferred;
    }
  }

  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

export const config = {
  matcher: ["/"],
};
