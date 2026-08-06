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

  const segments = pathname.split("/");
  const firstSegment = segments[1] ?? "";

  /*
   * A miscased short link, normalised for the same reason the locale segment
   * below is: capitalisation arrives on its own, from mail clients and phone
   * keyboards, on a URL somebody typed off a sticker.
   *
   * The matcher exempts `go/` case-sensitively, so `/GO/card` is not exempt —
   * it lands here, and without this it would be treated as a locale-less deep
   * link and sent to `/en/GO/card`, which is a 404 with a printed code on it.
   * 308, like the locale casing: the canonical casing of a code does not
   * change, only what it resolves to.
   */
  if (firstSegment.toLowerCase() === "go" && firstSegment !== "go") {
    segments[1] = "go";
    const lowered = request.nextUrl.clone();
    lowered.pathname = segments.join("/");
    return NextResponse.redirect(lowered, 308);
  }
  const localePrefix = SUPPORTED_LOCALES.find(
    (locale) => firstSegment.toLowerCase() === locale,
  );

  if (localePrefix) {
    if (firstSegment === localePrefix) return NextResponse.next();

    // The prefix is a locale, just miscased. This used to fall through to the
    // deep-link branch below, which prepends a locale to whatever it is given:
    // /EN/learn became /en/EN/learn, a 404. Capitalisation arrives on its own
    // — mail clients and phone keyboards both do it to a typed URL — so the
    // casing is normalised rather than treated as a missing prefix. 308: a
    // locale segment's canonical casing does not change.
    segments[1] = localePrefix;
    const normalized = request.nextUrl.clone();
    normalized.pathname = segments.join("/");
    return NextResponse.redirect(normalized, 308);
  }

  // Bare domain gets the locale home REWRITTEN, not redirected — the 307
  // round trip cost ~330ms of blank screen on every first visit. The /en
  // page's canonical/hreflang metadata still points search engines at the
  // locale URL, and every in-app link is locale-prefixed from there.
  if (pathname === "/") {
    const home = request.nextUrl.clone();
    home.pathname = `/${preferredLocale(request)}`;
    return NextResponse.rewrite(home);
  }

  // Locale-less deep links (typed or shared without /en) get the locale
  // prefixed instead of 404ing: /test → /en/test, /learn/... → /en/learn/...
  // These stay redirects so the canonical locale URL lands in the address
  // bar for sharing.
  //
  // Cloned rather than rebuilt from `request.url`: a fresh URL drops the query
  // string, so a shared /test?utm_source=tract lost its attribution on the way
  // to /en/test and the street cards' scans landed in PostHog as direct.
  const localized = request.nextUrl.clone();
  localized.pathname = `/${preferredLocale(request)}${pathname}`;
  return NextResponse.redirect(localized);
}

export const config = {
  // Everything except Next internals, API routes, printed short links, and
  // files with extensions (icons, sitemap.xml, robots.txt, manifest.webmanifest,
  // images, …)
  //
  // `go/` carries the trailing slash deliberately. A bare `go` in the lookahead
  // is a prefix match, so it would also exempt /gospel and anything else
  // beginning with those two letters — and the exemption is invisible until a
  // route by that name exists. The short links are locale-less by design: the
  // handler picks the locale from accept-language, so a scan that came through
  // here first would spend a redirect reaching /en/go/… before resolving.
  matcher: ["/((?!_next|api|go/|.*\\..*).*)"],
};
