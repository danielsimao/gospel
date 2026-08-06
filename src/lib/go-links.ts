import type { Locale } from "@/lib/i18n";

/**
 * Printed links, and the one thing print cannot do: change its mind.
 *
 * A QR pointing straight at `/pt/test?utm_campaign=…` is a decision made
 * permanent by a printer. If the destination ever moves, if a campaign name
 * turns out wrong, if a sticker outlives the thing it advertised — the paper is
 * dead and the only fix is reprinting it.
 *
 * So nothing printed points at a page. It points at a code, and the code is
 * resolved here, at request time. `ifyoudiedtoday.com/go/sk1` can mean one
 * thing this month and another next year, and every sticker already on a wall
 * follows along.
 *
 * That is also why the handler answers 307 and never caches: a permanent
 * redirect would be re-targeting on paper and a lie in the browser, which had
 * already cached the old destination for good.
 */

/** Every printed piece is `print`. Kept constant rather than per-entry — the
    street cards shipped with `utm_medium=print` and a second vocabulary for the
    same thing splits the funnel for no gain. */
export const GO_MEDIUM = "print";

/**
 * Codes are read off paper by a human when the camera fails, so the alphabet
 * excludes what gets misread: `l` for `1`, `o` for `0`, and the digits `0` and
 * `1` themselves. Two to four characters — long enough to be distinct, short
 * enough that the QR stays coarse and scans from further away.
 */
export const GO_CODE_PATTERN = /^[a-km-np-z2-9]{2,4}$/;

export interface GoLink {
  /**
   * Where the scan lands, without a locale and without a query. The locale is
   * chosen from the reader's own `accept-language` at request time — a sticker
   * in a Lisbon café should not hand an English tourist Portuguese.
   */
  destination: string;
  /** The physical object. `utm_source`. */
  source: "sticker" | "tract" | "card";
  /** The specific design. `utm_campaign`. */
  campaign: string;
  /** Where this one was put — `porto-cafe-1`. `utm_content`, and the reason two
      identical stickers can be told apart. */
  content?: string;
  /** Forces a locale, for a piece printed for one language only. Unset means
      the reader's device decides, which is almost always what you want. */
  locale?: Locale;
  /** What this code is stuck to, in words. The registry is the only record of
      what is out there in the world. */
  note: string;
}

/**
 * The codes in circulation.
 *
 * Add a row before printing, never after: a code that reaches paper before it
 * reaches this file resolves to the unknown-code fallback, and the scan is
 * spent.
 *
 * Retiring a piece does not mean deleting its row — the paper is still out
 * there. Point `destination` somewhere that still makes sense and leave the
 * code standing.
 */
export const GO_LINKS: Record<string, GoLink> = {
  /* The business-card sheet at /cards. Straight into the test: these are handed
     to someone by a person who is standing there, so the question has already
     been framed out loud. */
  card: {
    destination: "/test",
    source: "card",
    campaign: "street-card",
    note: "Business-card sheet printed from /cards",
  },

  /* The three A6 tract designs. Also handed over, also straight to the test. */
  /* `six`, not `law`: `l` is not in the alphabet above, and the registry is
     where that rule gets tested rather than remembered. */
  six: {
    destination: "/test",
    source: "tract",
    campaign: "tract-law",
    note: "A6 tract — front is 'És uma boa pessoa?' and the six questions",
  },
  cnt: {
    destination: "/test",
    source: "tract",
    campaign: "tract-count",
    note: "A6 tract — front is 10/10 and the mortality count",
  },
  crt: {
    destination: "/test",
    source: "tract",
    campaign: "tract-court",
    note: "A6 tract — front is the court record, back is PAGA POR INTEIRO",
  },

  /* Stickers land on the homepage, not the test, and the difference is not a
     detail. A tract is handed over by someone who has already asked the
     question out loud; a sticker on a wall has nobody to frame it, and
     "Are you a good person?" as the first thing a stranger meets, with no
     context, is the Law arriving before anyone has been given a reason to
     listen. The homepage does the framing the person would have done. */
  sk2: {
    destination: "/",
    source: "sticker",
    campaign: "sticker-v1",
    note: "First sticker run — placement recorded per code, see sk3 onwards",
  },
};

/** Where a code nobody recognises goes.
 *
 * A 404 would be the honest answer and the wrong one: the code is printed, the
 * reader did nothing wrong, and the scan cannot be had again. They land on the
 * homepage, and the campaign value says the code was bad so it shows up in
 * PostHog instead of vanishing. */
export const GO_FALLBACK: GoLink = {
  destination: "/",
  source: "sticker",
  campaign: "go-unknown",
  note: "Fallback for a code that is not in the registry",
};

/**
 * The full destination for a scan: locale, path, and the UTMs the funnel is
 * broken down by.
 *
 * Any query the scan already carried is kept and takes precedence — a code can
 * be overridden in the field (`/go/crt?utm_content=braga`) without a deploy.
 */
export function resolveGoLink(
  code: string,
  readerLocale: Locale,
  incoming?: URLSearchParams,
): { link: GoLink; known: boolean; path: string } {
  const known = Object.hasOwn(GO_LINKS, code);
  const link = known ? (GO_LINKS[code] as GoLink) : GO_FALLBACK;
  const locale = link.locale ?? readerLocale;

  const params = new URLSearchParams({
    utm_source: link.source,
    utm_medium: GO_MEDIUM,
    utm_campaign: link.campaign,
  });
  if (link.content) params.set("utm_content", link.content);
  if (!known) params.set("utm_content", code);
  for (const [key, value] of incoming ?? []) params.set(key, value);

  /* `/` is the homepage, which is `/{locale}` — not `/{locale}/`, which would
     be a second URL for the same page and a second row in every report. */
  const suffix = link.destination === "/" ? "" : link.destination;
  return { link, known, path: `/${locale}${suffix}?${params.toString()}` };
}
