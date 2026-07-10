# ACTION-PLAN

## Summary

The codebase-level SEO issues found during the audit have been fixed in this repository. The remaining work is deployment validation, not additional repo mutation.

## Completed Fixes

1. Metadata and localization
   - Added a centralized SEO helper for absolute URLs, canonical tags, hreflang alternates, Open Graph, and Twitter metadata.
   - Added route-level metadata coverage for `/[locale]`, `/test`, `/chat`, `/learn`, `/learn/[slug]`, `/reading-plan`, and `/next-steps`.
   - Added `metadataBase` at the app root.

2. Structured data
   - Added baseline `WebSite` and `Organization` schema at the layout level.
   - Added `WebPage` schema for key pages.

3. Crawl and index controls
   - Normalized `robots.txt` and sitemap URLs against the real site URL helper.
   - Rebuilt the sitemap from actual learn-topic content instead of a hardcoded slug list.
   - Marked `/next-steps` as `noindex, nofollow` and removed it from the sitemap.

4. Content structure
   - Restored a primary H1 on the localized homepage experience.
   - Switched hostname generation to prefer Vercel's `VERCEL_PROJECT_PRODUCTION_URL` and normalize it to `https://www.` for custom domains.

## Post-Deploy Validation

1. Confirm `VERCEL_PROJECT_PRODUCTION_URL` on Vercel resolves to the intended canonical production domain.
2. Deploy and verify canonical, hreflang, Open Graph, Twitter, and JSON-LD output on the live domain.
3. Submit `/sitemap.xml` in Search Console and Bing Webmaster Tools.
4. Run PageSpeed Insights on `/en`, `/pt`, `/en/test`, and `/en/learn/who-is-jesus`.
5. Validate structured data on the live site with Google Rich Results Test.

## Acceptance Criteria

- `pnpm build` succeeds.
- Production pages emit absolute canonical URLs on the correct hostname.
- Each localized page emits `hreflang` links for `en`, `pt`, and `x-default`.
- `/next-steps` is not indexed and is absent from the sitemap.
- Sitemap and robots both reference the production hostname.
