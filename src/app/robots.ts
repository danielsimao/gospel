import type { MetadataRoute } from "next";
import { SITE_URL, getAbsoluteUrl } from "@/lib/seo";

/**
 * Nothing is disallowed, deliberately.
 *
 * A wildcard rule covering the two `next-steps` routes used to be, while the
 * page itself also sent `noindex, nofollow`. The two cancel: a crawler barred
 * from fetching the page never sees the noindex, so a URL linked from the
 * sitewide footer can still be listed from the link alone, with no snippet to
 * explain it. The page's own noindex is the instruction that actually removes
 * it, and it only works if the page can be fetched.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: SITE_URL,
    sitemap: getAbsoluteUrl("/sitemap.xml"),
  };
}
