# Site Navigation & Accessibility Improvements

## Problem

The site has grown to 6+ pages (home, test, chat, learn topics, reading plan, next steps) but has no global navigation. Users can only discover content by completing sections linearly. There's no footer, no sitemap, no robots.txt. The eternity CTA section still links to external sites instead of the internal content we've built.

## Solution

Three changes:
1. **Global footer** on every page — 3-column categorized links + scripture + locale switcher
2. **Improved eternity CTA section** — replace external resource links with internal content links
3. **SEO basics** — sitemap.xml + robots.txt

---

## Feature 1: Global Footer

A shared footer component rendered in the locale layout (`src/app/[locale]/layout.tsx`), appearing on every page.

### Layout: 3-column

| Explore | Learn | Grow |
|---------|-------|------|
| Home | Who is Jesus? | 7-Day Reading Plan |
| Take the Test | What is Sin? | Next Steps |
| Chat | Why the Cross? | Find a Church (EN: 9Marks / PT: Maps list) |
| | What is Repentance? | |
| | What Happens When I Die? | Living Waters |
| | | needGod.net |

### Below columns
- Divider line (1px white/6%)
- Scripture quote: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life." — John 3:16
- Bottom row: site domain (left) + locale switcher EN · PT (right)

### Visual treatment
- Same dark bg (#060404)
- Column headings: monospace, 9px, uppercase, tracking-[2.5px], gold at 50% — matching existing label patterns
- Links: 12-13px, white at 35%, hover to 60%
- Scripture: 11px, italic, white at 20%
- Locale switcher: current locale bold/white, other locale as link at 30%
- Top border: 1px white/4% to separate from page content
- Padding: py-12 px-4, max-w-lg centered (matching existing page widths)
- **Mobile:** 3 columns stack to single column on `< sm` breakpoint. Each group stacked vertically with spacing between.

### External resources
Living Waters and needGod.net move from the eternity CTA section into the footer Grow column (below "Find a Church"). Accessible but no longer competing with internal CTAs.

### Locale switcher behavior
- Clicking "PT" on `/en/learn/who-is-jesus` navigates to `/pt/learn/who-is-jesus` (same slug, different locale)
- Uses simple `<a>` tags — no client-side routing needed

### i18n
New key `footer` in `en.json` / `pt.json`:
```
footer: {
  exploreLabel: "Explore",
  learnLabel: "Learn",
  growLabel: "Grow",
  homeLink: "Home",
  testLink: "Take the Test",
  chatLink: "Chat",
  readingPlanLink: "7-Day Reading Plan",
  nextStepsLink: "Next Steps",
  churchLink: "Find a Church",
  churchUrl: "https://www.9marks.org/church-search/",  // EN; PT: "https://maps.app.goo.gl/NMMMdeJa5H5BR5Vp9"
  livingWatersLink: "Are You a Good Person? — Living Waters",
  livingWatersUrl: "https://livingwaters.com/are-you-a-good-person/",
  needGodLink: "needGod.net",
  needGodUrl: "https://needgod.net/",
  scripture: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.",
  scriptureRef: "John 3:16 (NKJV)"
}
```
Learn topic titles are already in `learn.topics[].title` — reuse those.

---

## Feature 2: Improved Eternity CTA Section

### Current state
The "What will you do?" section has:
- Heading + subtitle
- External resource links (Living Waters, needGod.net)
- Share buttons

### New state
Replace external links with internal content links:
- **Take the Test** → `/{locale}/test`
- **Learn More** → `/{locale}/learn/who-is-jesus` (first topic)
- **Start the Reading Plan** → `/{locale}/reading-plan`

The external resources (Living Waters, needGod.net) are removed from the CTA section. They remain accessible via the footer's "Find a Church" link and the invitation screen's resource list.

### Visual treatment
- Same card styling as existing resource links but slightly more prominent
- Internal links styled with subtle gold hint (border-[#D4A843]/15) to distinguish from external

### i18n changes
Update `eternity.cta` in both locale files:
- Remove `resources` array
- Add `learnCta: "Learn more"` and `readingPlanCta: "Start the reading plan"`

---

## Feature 3: SEO Basics

### sitemap.xml
Dynamic Next.js sitemap at `src/app/sitemap.ts` that generates URLs for:
- `/{locale}` (home) — both EN and PT
- `/{locale}/test`
- `/{locale}/chat`
- `/{locale}/reading-plan`
- `/{locale}/next-steps`
- `/{locale}/learn/{slug}` — all 5 topics × 2 locales

### robots.txt
Dynamic file at `src/app/robots.ts` using `NEXT_PUBLIC_SITE_URL` env var:
```
User-agent: *
Allow: /
Sitemap: https://${NEXT_PUBLIC_SITE_URL}/sitemap.xml
```

### Environment variable
`NEXT_PUBLIC_SITE_URL` — the production domain (e.g., `gospel.ruisimao.com`). Used by sitemap.ts and robots.ts. Falls back to `localhost:3000` in dev.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/shared/footer.tsx` | Global footer component |
| `src/app/sitemap.ts` | Dynamic sitemap generation |
| `src/app/robots.ts` | Robots.txt generation |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/[locale]/layout.tsx` | Add Footer component after children |
| `src/components/eternity/eternity-shell.tsx` | Replace external resource links with internal CTAs |
| `src/messages/en.json` | Add `footer` key, update `eternity.cta` |
| `src/messages/pt.json` | Same |

---

## Analytics

New event:
- `footer_link_clicked` — { link: string, locale: string }

---

## Verification

1. Visit `/en` — scroll to bottom, see footer with 3 columns, scripture, locale switcher
2. Click "PT" in footer → navigates to `/pt` with Portuguese footer
3. Visit `/en/learn/who-is-jesus` — same footer appears
4. Eternity CTA section shows "Take the Test", "Learn more", "Start the Reading Plan" — no external links
5. Visit `/sitemap.xml` — see all page URLs
6. Visit `/robots.txt` — see allow all + sitemap reference
