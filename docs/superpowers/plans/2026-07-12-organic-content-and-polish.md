# Organic Content Expansion & Polish Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the post-launch polish batch (Release 1), then three new search-query learn topics + one expansion with Article/BreadcrumbList structured data (Release 2).

**Architecture:** Polish items are surgical fixes in `journey-storage`/`use-journey`/`i18n`/next-steps client plus animation-timing LCP wins on the test landing. Content reuses the existing `learn.topics` JSON machinery end-to-end (rendering, sitemap, nav all derive from the array); schema is two new pure builders in `seo.ts` wired into the learn pages, with per-topic dates in a new TS map.

**Tech Stack:** Next.js 16.2 App Router, TypeScript, Vitest, Tailwind v4, framer-motion, JSON message files (`src/messages/{en,pt}.json`).

**Spec:** `docs/superpowers/specs/2026-07-11-organic-content-and-polish-design.md`

## Global Constraints

- **Living Waters framing:** no copy may assure salvation from a click or from taking the test; assurance points to Christ's work and repentance + faith. Copy is conditional where addressing believers.
- Both locales (`en`, `pt`) updated in the same edit for every message change. EN scripture = NKJV; PT scripture = ARC (Almeida Revista e Corrigida). PT uses informal *tu* and the spelling "veredicto".
- Owner (native PT speaker) reviews all new/changed EN theology + PT register before Release 2 deploys — hard gate.
- Topic order (exact): `am-i-a-good-person`, `who-is-jesus`, `what-is-sin`, `why-the-cross`, `how-can-my-sins-be-forgiven`, `what-is-repentance`, `what-happens-when-i-die`, `does-god-exist`.
- Quizzes on most new sections; skip where artificial (`quiz` is optional in the renderer).
- No new dependencies. No FAQPage schema. Stage explicit paths in every commit; never `git add -A` (untracked `.superpowers/` must stay uncommitted).
- Every task ends with `pnpm test` green and a commit. Release gates: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`.
- Work on branch `content-and-polish` cut from `main`.

## Deviations from spec (found during planning)

1. **Polish item 1 (homepage ready-gating) is DROPPED.** Gating the bottom CTA section on `journey.ready` would remove the `<h1>{provocativeQuestion}</h1>` from server-rendered HTML — the homepage's primary heading and an indexed SEO asset (the final branch review explicitly counted SSR-visitor-h1 as a strength). A one-frame flash for returning users (already an accepted deviation from the previous cycle) is not worth losing it. No change shipped for this item.
2. **Topic dates live in `src/lib/topic-dates.ts` (TS map keyed by slug), not in the topic JSON.** Dates aren't translatable content; duplicating them across `en.json`/`pt.json` invites drift. The schema builder reads the map.

---

## Release 1 — Polish

### Task 1: Migration out of the render path + `EMPTY_RECORD` hardening

**Files:**
- Modify: `src/lib/journey-storage.ts`
- Modify: `src/lib/use-journey.ts`
- Test: `src/__tests__/journey-storage.test.ts`

**Interfaces:**
- Consumes: existing `journey-storage` internals.
- Produces: `migrateLegacyJourney(): void` exported from `@/lib/journey-storage` (idempotent, SSR-safe, emits once when it mutates). `readJourney()` becomes a pure read (no storage writes ever). `useJourney`'s effect calls `migrateLegacyJourney()` once before its first snapshot read.

- [ ] **Step 1: Update the migration tests to call migration explicitly (failing first)**

In `src/__tests__/journey-storage.test.ts`, add `migrateLegacyJourney` to the import from `@/lib/journey-storage`, and change the three tests inside `describe("legacy test_completed migration", ...)` plus the two emit tests so each calls `migrateLegacyJourney()` before `readJourney()`:

```ts
    it("folds a legacy flag into a new record and deletes the flag", () => {
      storage.set("test_completed", "1");
      migrateLegacyJourney();
      const record = readJourney();
      expect(record.testCompletedAt).not.toBeNull();
      expect(storage.has("test_completed")).toBe(false);
    });

    it("does not overwrite an existing record, but still deletes the flag", () => {
      saveInvitationResponse("committed");
      storage.set("test_completed", "1");
      migrateLegacyJourney();
      const record = readJourney();
      expect(record.invitationResponse).toBe("committed");
      expect(storage.has("test_completed")).toBe(false);
    });

    it("ignores a legacy flag that is not '1'", () => {
      storage.set("test_completed", "0");
      migrateLegacyJourney();
      expect(readJourney().testCompletedAt).toBeNull();
      expect(storage.has("test_completed")).toBe(false);
    });

    it("emits a storage change when migrating the legacy flag", () => {
      storage.set("test_completed", "1");
      migrateLegacyJourney();
      expect(vi.mocked(emitStorageChange)).toHaveBeenCalledTimes(1);
    });

    it("does not emit on a plain read with no migration", () => {
      readJourney();
      expect(vi.mocked(emitStorageChange)).not.toHaveBeenCalled();
    });
```

Add two new tests pinning the new contracts:

```ts
    it("readJourney never mutates storage even when a legacy flag exists", () => {
      storage.set("test_completed", "1");
      readJourney();
      expect(storage.has("test_completed")).toBe(true);
      expect(vi.mocked(emitStorageChange)).not.toHaveBeenCalled();
    });

    it("returned empty records are independent copies", () => {
      const a = readJourney();
      (a as { testCompletedAt: number | null }).testCompletedAt = 999;
      expect(readJourney().testCompletedAt).toBeNull();
    });
```

- [ ] **Step 2: Run tests to verify the new/changed ones fail**

Run: `pnpm vitest run src/__tests__/journey-storage.test.ts 2>&1 | tail -15`
Expected: FAIL — `migrateLegacyJourney` is not exported (import error), and after export exists, "readJourney never mutates" fails against current auto-migrating behavior.

- [ ] **Step 3: Implement in `src/lib/journey-storage.ts`**

- Rename `migrateLegacyFlag` → `migrateLegacyJourney`, add `export`, add SSR guard and try/catch (it is now a public entry point), keep the existing comment about the corrupt-record edge:

```ts
/**
 * One-time migration: fold the legacy bare "test_completed" flag into the
 * journey record, then delete the flag. Never overwrites an existing record.
 * Accepted edge: if the journey record exists but is corrupt, the legacy flag
 * is still deleted without folding (same discard policy as corrupt-record reads).
 * Called from useJourney's mount effect — never during render.
 */
export function migrateLegacyJourney(): void {
  if (typeof window === "undefined") return;
  try {
    const legacy = localStorage.getItem(LEGACY_TEST_COMPLETED_KEY);
    if (legacy === null) return;
    if (legacy === "1" && localStorage.getItem(STORAGE_KEY) === null) {
      const record: JourneyRecord = { ...EMPTY_RECORD, testCompletedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    }
    localStorage.removeItem(LEGACY_TEST_COMPLETED_KEY);
    emitStorageChange();
  } catch (error) {
    console.warn("[journey-storage] Failed to migrate legacy flag:", error);
  }
}
```

- In `readJourney()`: delete the `migrateLegacyFlag();` call, and return copies of the empty record. Freeze the constant:

```ts
const EMPTY_RECORD: JourneyRecord = Object.freeze({
  version: CURRENT_VERSION,
  testCompletedAt: null,
  invitationResponse: null,
  respondedAt: null,
});
```

and every `return EMPTY_RECORD;` inside `readJourney` becomes `return { ...EMPTY_RECORD };` (three sites: SSR guard, no-raw, catch — plus the version-mismatch return).

- [ ] **Step 4: Call migration from the hook — `src/lib/use-journey.ts`**

Add `migrateLegacyJourney` to the import from `./journey-storage`. In `useJourney`'s effect, call it once before the first update:

```ts
  useEffect(() => {
    const slugs = slugsKey ? slugsKey.split(",") : [];
    const update = () => setSnapshot(computeJourneySnapshot(slugs));
    migrateLegacyJourney();
    update();
    window.addEventListener("pageshow", update);
    const unsubscribe = subscribeToStorage(update);
    return () => {
      window.removeEventListener("pageshow", update);
      unsubscribe();
    };
  }, [slugsKey]);
```

Coverage note (document in the report, no code): `TopBar` mounts `useJourney` on every page except `/test`, so a legacy visitor migrates on first navigation anywhere; `computeJourneySnapshot` call sites (`topic-nav`) stay pure by design.

- [ ] **Step 5: Run full suite**

Run: `pnpm test 2>&1 | tail -5`
Expected: all suites pass (45 tests: 43 + 2 new).

- [ ] **Step 6: Commit**

```bash
git add src/lib/journey-storage.ts src/lib/use-journey.ts src/__tests__/journey-storage.test.ts
git commit -m "refactor: move legacy journey migration out of the render path, freeze EMPTY_RECORD"
```

### Task 2: i18n validator hardening

**Files:**
- Modify: `src/lib/i18n.ts`
- Test (create): `src/__tests__/i18n-validate.test.ts`

**Interfaces:**
- Consumes: `Messages`, `JourneyStagesMessages` types.
- Produces: `validateMessages(messages: unknown, locale: string): Messages` gains an `export` keyword (needed by the test); every `journeyStages` leaf key is validated.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/i18n-validate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateMessages } from "@/lib/i18n";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

type AnyRecord = Record<string, unknown>;

function cloneMessages(source: unknown): AnyRecord {
  return structuredClone(source) as AnyRecord;
}

describe("validateMessages — journeyStages deep validation", () => {
  it.each([["en", en], ["pt", pt]] as const)(
    "accepts the real %s message file",
    (locale, messages) => {
      expect(() => validateMessages(cloneMessages(messages), locale)).not.toThrow();
    },
  );

  const LEAVES: string[][] = [
    ["undecided", "heading"],
    ["undecided", "cta"],
    ["committed", "heading"],
    ["committed", "subheading"],
    ["thinking", "reflection"],
    ["thinking", "commitLabel"],
    ["thinking", "retakeLabel"],
    ["thinking", "johnCard", "label"],
    ["thinking", "johnCard", "description"],
    ["thinking", "johnCard", "url"],
    ["thinking", "learnCard", "label"],
    ["thinking", "learnCard", "description"],
    ["dismissed", "line"],
    ["dismissed", "retakeCta"],
  ];

  it.each(LEAVES.map((path) => [path.join(".")] as const))(
    "throws when home.journeyStages.%s is missing",
    (dottedPath) => {
      const clone = cloneMessages(en);
      const path = dottedPath.split(".");
      let node = (clone.home as AnyRecord).journeyStages as AnyRecord;
      for (const key of path.slice(0, -1)) node = node[key] as AnyRecord;
      delete node[path[path.length - 1]!];
      expect(() => validateMessages(clone, "en")).toThrow(/journeyStages/);
    },
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/i18n-validate.test.ts 2>&1 | tail -12`
Expected: FAIL — `validateMessages` is not exported; after exporting, the leaf-deletion cases for keys outside the current 4 sentinels (e.g. `thinking.johnCard.url`) fail.

- [ ] **Step 3: Implement in `src/lib/i18n.ts`**

Export `validateMessages` and replace the 4-sentinel `journeyStages` check with a shape walk:

```ts
const JOURNEY_STAGE_LEAVES: string[][] = [
  ["undecided", "heading"],
  ["undecided", "cta"],
  ["committed", "heading"],
  ["committed", "subheading"],
  ["thinking", "reflection"],
  ["thinking", "commitLabel"],
  ["thinking", "retakeLabel"],
  ["thinking", "johnCard", "label"],
  ["thinking", "johnCard", "description"],
  ["thinking", "johnCard", "url"],
  ["thinking", "learnCard", "label"],
  ["thinking", "learnCard", "description"],
  ["dismissed", "line"],
  ["dismissed", "retakeCta"],
];

export function validateMessages(messages: unknown, locale: string): Messages {
  // ... existing landing/questions/verdict/test checks unchanged ...
  const stages = (m as Messages & { home?: { journeyStages?: JourneyStagesMessages } }).home
    ?.journeyStages as unknown;
  for (const path of JOURNEY_STAGE_LEAVES) {
    let node: unknown = stages;
    for (const key of path) {
      node = node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined;
    }
    if (typeof node !== "string" || node.length === 0) {
      throw new Error(
        `[i18n] Missing home.journeyStages.${path.join(".")} for locale "${locale}"`,
      );
    }
  }
  return m;
}
```

(The existing four-condition `if (!stages?...)` block is deleted; the loop replaces it.)

- [ ] **Step 4: Run tests**

Run: `pnpm test 2>&1 | tail -5`
Expected: PASS (45 + 16 new = 61).

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.ts src/__tests__/i18n-validate.test.ts
git commit -m "feat: validate every journeyStages leaf key in both locales"
```

### Task 3: `next_steps_viewed` once-per-mount guard

**Files:**
- Modify: `src/app/[locale]/(content)/next-steps/client.tsx`

**Interfaces:**
- Consumes: existing `NextStepsClient` component.
- Produces: analytics fires at most once per mount, even if `stage` flips (e.g. cross-tab `thinking → committed`) while the page is open.

- [ ] **Step 1: Apply the guard**

In `client.tsx`, add `useRef` to the react import, then change the effect:

```ts
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!track) {
      // No recorded response — the page has nothing honest to say. Go home.
      router.replace(`/${locale}`);
      return;
    }
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackNextStepsViewed(track, locale);
  }, [ready, track, locale, router]);
```

- [ ] **Step 2: Gates**

Run: `pnpm test && npx tsc --noEmit 2>&1 | tail -3`
Expected: green (no unit tests cover this component; tsc is the check).

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(content)/next-steps/client.tsx"
git commit -m "fix: next_steps_viewed fires once per mount"
```

### Task 4: `/test` LCP cheap wins

**Files:**
- Modify: `src/components/landing.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: faster first paint of the landing title (the likely LCP element — it is opacity-animated with a 0.4s delay behind a 0.8s wrapper fade, so full-opacity paint lands ≥1.2s after hydration).

- [ ] **Step 1: Baseline measurement (local)**

```bash
pnpm build && pnpm start &
sleep 5
npx --yes lighthouse http://localhost:3000/en/test --preset=perf --form-factor=mobile --screenEmulation.mobile --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lcp-before.json
node -e "const r=require('/tmp/lcp-before.json');console.log('LCP', r.audits['largest-contentful-paint'].displayValue, '| perf', r.categories.performance.score)"
```

Record the number. (Local absolute values differ from PSI; only the delta matters.)

- [ ] **Step 2: Tighten animation timings in `landing.tsx`**

Compress the staggered entrance (wrapper fade 0.8→0.4s; title delay 0.4→0.1s, duration 0.8→0.5; label delay 0.2→0.05; subtitle delay 0.6→0.3; CTA delay 0.8→0.45). Exact replacements:

- Wrapper `motion.div`: `transition={{ duration: 0.4 }}`
- Docket label: `transition={{ duration: 0.5, delay: 0.05 }}`
- Title `motion.h1`: `transition={{ duration: 0.5, delay: 0.1 }}`
- Subtitle: `transition={{ duration: 0.5, delay: 0.3 }}`
- CTA: `transition={{ duration: 0.5, delay: 0.45 }}`

The sequence keeps its stagger feel; the title reaches full opacity ~0.6s after hydration instead of ~1.2s.

- [ ] **Step 3: Re-measure**

Re-run the Step 1 lighthouse command with `--output-path=/tmp/lcp-after.json` (rebuild first: `pnpm build`). Expected: LCP improves; accept any result ≥ spec target direction (prod target ≤3.0s verified post-deploy). Kill the `pnpm start` server afterwards.

- [ ] **Step 4: Visual sanity**

Run `pnpm dev`, load `/en/test`, confirm the entrance still feels intentional (staggered, not abrupt). Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing.tsx
git commit -m "perf: tighten test-landing entrance timings to improve LCP"
```

### Task 5: Release 1 — gates, merge, deploy

**Files:** none new.

- [ ] **Step 1: Full gates**

Run: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`
Expected: all green.

- [ ] **Step 2: Merge to main and push (production auto-deploys)**

⚠️ Pushing `main` triggers a production deploy — confirm with the owner before this step if not already blanket-approved for this release.

```bash
git checkout main && git pull --ff-only && git merge content-and-polish --no-edit && git push origin main
git checkout content-and-polish && git merge main --ff-only
```

- [ ] **Step 3: Post-deploy check**

Wait for the deploy to go Ready (`vercel ls --scope rui-simos-projects | head -3`), then PSI via the web UI or ask the owner: `/en/test` mobile — record LCP; target ≤3.0s.

---

## Release 2 — Schema + Content

### Task 6: Schema builders + topic dates

**Files:**
- Modify: `src/lib/seo.ts`
- Create: `src/lib/topic-dates.ts`
- Test (create): `src/__tests__/seo-schema.test.ts`

**Interfaces:**
- Consumes: existing `getLocaleUrl`, `getAbsoluteUrl`, `SITE_URL` in `seo.ts`.
- Produces (used by Task 7):
  - `buildArticleSchema({ locale, slug, title, description, datePublished, dateModified })` → Article JSON-LD object
  - `buildBreadcrumbSchema(items: Array<{ name: string; url: string }>)` → BreadcrumbList JSON-LD object
  - `TOPIC_DATES: Record<string, { published: string; modified: string }>` from `@/lib/topic-dates`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/seo-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildArticleSchema, buildBreadcrumbSchema, SITE_URL } from "@/lib/seo";

describe("buildArticleSchema", () => {
  it("builds a complete Article node", () => {
    const schema = buildArticleSchema({
      locale: "en",
      slug: "am-i-a-good-person",
      title: "Am I a Good Person?",
      description: "desc",
      datePublished: "2026-07-12",
      dateModified: "2026-07-12",
    });
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("Am I a Good Person?");
    expect(schema.mainEntityOfPage).toBe(`${SITE_URL}/en/learn/am-i-a-good-person`);
    expect(schema.inLanguage).toBe("en");
    expect(schema.datePublished).toBe("2026-07-12");
    expect(schema.publisher).toEqual({ "@id": `${SITE_URL}#organization` });
    expect(schema.image).toContain("/en/opengraph-image");
  });
});

describe("buildBreadcrumbSchema", () => {
  it("builds positioned ListItems", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Home", url: "https://x/en" },
      { name: "Learn", url: "https://x/en/learn" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Learn",
      item: "https://x/en/learn",
    });
  });
});
```

Note: `SITE_URL` is already exported from `seo.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/seo-schema.test.ts 2>&1 | tail -8`
Expected: FAIL — builders not exported.

- [ ] **Step 3: Implement the builders in `src/lib/seo.ts`** (append after `buildWebPageSchema`, same style)

```ts
type BuildArticleSchemaArgs = {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
};

export function buildArticleSchema({
  locale,
  slug,
  title,
  description,
  datePublished,
  dateModified,
}: BuildArticleSchemaArgs) {
  const url = getLocaleUrl(locale, `/learn/${slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: title,
    description,
    url,
    inLanguage: locale,
    mainEntityOfPage: url,
    datePublished,
    dateModified,
    image: getAbsoluteUrl(`/${locale}/opengraph-image`),
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
```

- [ ] **Step 4: Create `src/lib/topic-dates.ts`**

Dates for existing topics: first commit that introduced each slug. Derive with:

```bash
for s in who-is-jesus what-is-sin why-the-cross what-is-repentance what-happens-when-i-die; do
  echo "$s $(git log --reverse --format=%as -S"\"slug\": \"$s\"" -- src/messages/en.json | head -1)"
done
```

Then write the file (fill the derived dates; new topics use `2026-07-12`):

```ts
/**
 * Publication dates for learn topics, keyed by slug. Locale-independent —
 * kept out of the message JSON so EN/PT can't drift. `modified` is bumped
 * only on meaningful content changes, not typo fixes.
 */
export const TOPIC_DATES: Record<string, { published: string; modified: string }> = {
  "am-i-a-good-person": { published: "2026-07-12", modified: "2026-07-12" },
  "who-is-jesus": { published: "<derived>", modified: "<derived>" },
  "what-is-sin": { published: "<derived>", modified: "<derived>" },
  "why-the-cross": { published: "<derived>", modified: "<derived>" },
  "how-can-my-sins-be-forgiven": { published: "2026-07-12", modified: "2026-07-12" },
  "what-is-repentance": { published: "<derived>", modified: "<derived>" },
  "what-happens-when-i-die": { published: "<derived>", modified: "2026-07-12" },
  "does-god-exist": { published: "2026-07-12", modified: "2026-07-12" },
};
```

(`<derived>` = the git-derived date from the command above — the ONLY permitted placeholder, resolved in this step. `what-happens-when-i-die.modified` is `2026-07-12` because Release 2 expands it.)

- [ ] **Step 5: Run tests, commit**

Run: `pnpm test 2>&1 | tail -4` — expected PASS.

```bash
git add src/lib/seo.ts src/lib/topic-dates.ts src/__tests__/seo-schema.test.ts
git commit -m "feat: Article and BreadcrumbList schema builders with per-topic dates"
```

### Task 7: Wire schema into learn pages

**Files:**
- Modify: `src/app/[locale]/(content)/learn/[slug]/page.tsx`
- Modify: `src/app/[locale]/(content)/learn/page.tsx`

**Interfaces:**
- Consumes: `buildArticleSchema`, `buildBreadcrumbSchema` from `@/lib/seo`; `TOPIC_DATES` from `@/lib/topic-dates`; existing `getLocaleUrl` and `<StructuredData>`.
- Produces: every `/learn/[slug]` page emits WebPage + Article + BreadcrumbList JSON-LD; `/learn` hub emits WebPage + BreadcrumbList.

- [ ] **Step 1: Topic page — `learn/[slug]/page.tsx`**

Add imports:

```ts
import { buildPageMetadata, buildWebPageSchema, buildArticleSchema, buildBreadcrumbSchema, getLocaleUrl } from "@/lib/seo";
import { TOPIC_DATES } from "@/lib/topic-dates";
```

In the page component, after `webPageSchema`, build the two new nodes. Breadcrumb names come from existing messages (brand from `topBar.brand`, learn label from `learn.label` — `data.label` is already in scope):

```ts
  const messages = await import(`@/messages/${locale}.json`);
  const brand = messages.default.topBar?.brand ?? "Gospel";
  const dates = TOPIC_DATES[slug] ?? { published: "2026-07-12", modified: "2026-07-12" };
  const articleSchema = buildArticleSchema({
    locale,
    slug,
    title: topic.title,
    description: topic.metaDescription,
    datePublished: dates.published,
    dateModified: dates.modified,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: brand, url: getLocaleUrl(locale) },
    { name: data.label, url: getLocaleUrl(locale, "/learn") },
    { name: topic.title, url: getLocaleUrl(locale, `/learn/${slug}`) },
  ]);
```

Render alongside the existing node:

```tsx
      <StructuredData data={webPageSchema} />
      <StructuredData data={articleSchema} />
      <StructuredData data={breadcrumbSchema} />
```

- [ ] **Step 2: Hub page — `learn/page.tsx`**

Read the file first (it already renders a `<StructuredData data={webPageSchema} />` via the same pattern). Add imports for `buildBreadcrumbSchema`, `getLocaleUrl`, build:

```ts
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: brand, url: getLocaleUrl(locale) },
    { name: learnLabel, url: getLocaleUrl(locale, "/learn") },
  ]);
```

(`brand`/`learnLabel` — reuse however the file already accesses `topBar.brand` and `learn.label`; read before editing.) Render as a second `<StructuredData>`.

- [ ] **Step 3: Verify served output**

```bash
pnpm build && pnpm start &
sleep 5
curl -s http://localhost:3000/en/learn/who-is-jesus | grep -oE '"@type":"[^"]*"' | sort -u
```

Expected to include: `"Article"`, `"BreadcrumbList"`, `"WebPage"` (plus site-level `WebSite`/`Organization`/`ImageObject`). Kill the server.

- [ ] **Step 4: Gates + commit**

Run: `pnpm test && npx tsc --noEmit` — green.

```bash
git add "src/app/[locale]/(content)/learn/[slug]/page.tsx" "src/app/[locale]/(content)/learn/page.tsx"
git commit -m "feat: Article and BreadcrumbList JSON-LD on learn pages"
```

### Task 8: Content — `am-i-a-good-person` (EN + PT)

**Files:**
- Modify: `src/messages/en.json` (insert topic as FIRST element of `learn.topics`)
- Modify: `src/messages/pt.json` (same position)

**Interfaces:**
- Consumes: existing topic JSON shape (`slug`, `title`, `subtitle`, `metaDescription`, `sections[]` of `heading`/`body`/`scripture`/`scriptureRef`/optional `quiz{question,options[3],correct,reveal}`).
- Produces: topic renders at `/en/learn/am-i-a-good-person` and `/pt/learn/am-i-a-good-person`; sitemap picks it up automatically.

**Editorial contract (write full prose, Living Waters voice — direct, warm, no churchy jargon, second person; bodies 2-4 paragraphs each separated by `\n\n`):**

- Title EN: "Am I a Good Person?" / PT: "Sou uma Boa Pessoa?" (query form). Subtitle: the question everyone answers too quickly. metaDescription targets the query ("Am I a good person? Most people say yes — here's how to actually find out.").
- Section 1 — "Everyone thinks they're good": most people compare themselves to worse people, not to a fixed standard; grading on a curve. Scripture: Luke 18:19 ("No one is good but One, that is, God") NKJV / ARC. Quiz: what standard do most people measure themselves by? (other people / God's Law / their conscience alone — correct: other people).
- Section 2 — "The mirror of God's Law": the commandments as diagnostic mirror, not ladder; the Law shows the problem, it doesn't fix it. Scripture: Romans 3:20. Quiz: what is the Law's purpose? (to make us good / to show us our sin / to earn heaven — correct: show sin).
- Section 3 — "Take the test honestly": walk lying/stealing/hatred briefly (mirrors the app's test, don't spoil all eight); one broken command breaks the whole. Scripture: James 2:10. Quiz on James 2:10's point.
- Section 4 — "Good by whose standard?": courtroom — a good judge cannot ignore crime; God's goodness is the problem, not the escape. Scripture: Proverbs 17:15. Quiz: does God being good help the guilty? (correct: no — a good judge must judge).
- Section 5 — "Find out where you stand": invitation to take the site's test; honest self-examination; no salvation-assurance language. Scripture: 2 Corinthians 13:5. No quiz — the section IS the call to action (topic-nav's existing CTA button follows it).

- [ ] **Step 1: Draft EN topic JSON and insert as first element of `learn.topics` in `en.json`**
- [ ] **Step 2: Draft PT topic JSON (same slug, PT prose targeting "sou uma boa pessoa", ARC scripture) as first element in `pt.json`**
- [ ] **Step 3: Verify build + render**

Run: `pnpm test && pnpm build 2>&1 | tail -4` — the i18n validator + build prove structure. Then `pnpm dev`, load `/en/learn/am-i-a-good-person` and `/pt/learn/am-i-a-good-person`, confirm sections + quizzes render. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/pt.json
git commit -m "content: new learn topic — Am I a Good Person? (EN + PT)"
```

### Task 9: Content — `how-can-my-sins-be-forgiven` (EN + PT)

**Files:**
- Modify: `src/messages/en.json` (insert AFTER `why-the-cross`)
- Modify: `src/messages/pt.json` (same position)

**Interfaces:** same JSON shape as Task 8. Position matters: prev/next nav is the cross-link to `why-the-cross`.

**Editorial contract:**

- Title EN: "How Can My Sins Be Forgiven?" / PT: "Como Podem os Meus Pecados Ser Perdoados?". metaDescription targets the query.
- Section 1 — "Why being good now can't fix it": future obedience pays no past debt; a criminal who stops stealing still owes for what he stole. Scripture: Isaiah 64:6. Quiz.
- Section 2 — "The fine must be paid": courtroom fine analogy (LW classic): guilty, can't pay, someone steps in and pays it for you — the judge can legally let you go. Scripture: Romans 6:23. Quiz.
- Section 3 — "What happened at the cross": substitution — Christ paid in full; ties to the previous topic (`why-the-cross`) without naming URLs. Scripture: 1 Peter 3:18. Quiz.
- Section 4 — "Repentance and faith": forgiveness received, not earned — turn from sin AND trust the Savior; explicitly not a ritual, a prayer formula, or church attendance. Scripture: Acts 3:19. Quiz.
- Section 5 — "What now": confession to God, honest repentance; steer toward the test/reading; conditional framing, no assurance-from-reading. Scripture: 1 John 1:9. No quiz.

- [ ] **Step 1: Draft EN, insert after `why-the-cross`**
- [ ] **Step 2: Draft PT, same position**
- [ ] **Step 3: Verify** — `pnpm test && pnpm build`, dev-render both locales, prev/next nav shows `why-the-cross` ← → `what-is-repentance`.
- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/pt.json
git commit -m "content: new learn topic — How Can My Sins Be Forgiven? (EN + PT)"
```

### Task 10: Content — `does-god-exist` (EN + PT)

**Files:**
- Modify: `src/messages/en.json` (insert LAST in `learn.topics`)
- Modify: `src/messages/pt.json` (same position)

**Interfaces:** same JSON shape.

**Editorial contract:**

- Title EN: "Does God Exist?" / PT: "Deus Existe?". metaDescription targets the query.
- Section 1 — "The building has a builder": every made thing implies a maker; creation as evidence, not proof-by-syllogism. Scripture: Romans 1:20. Quiz.
- Section 2 — "Your conscience is evidence": the moral law within — everyone KNOWS right and wrong exists; where did the standard come from? Scripture: Romans 2:15. Quiz.
- Section 3 — "God stepped into history": Jesus as God making Himself known — not abstract theism but a person you can examine. Scripture: John 1:18. Quiz.
- Section 4 — "Why evidence isn't the real issue": LW candor — the debate is rarely intellectual; light exposes. Written without contempt for skeptics. Scripture: John 3:19-20. Quiz.
- Section 5 — "Test it honestly": seek honestly and see; steer to the test. Scripture: Jeremiah 29:13. No quiz.

- [ ] **Step 1: Draft EN, append as last topic**
- [ ] **Step 2: Draft PT, same position**
- [ ] **Step 3: Verify** — `pnpm test && pnpm build`, dev-render both locales.
- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/pt.json
git commit -m "content: new learn topic — Does God Exist? (EN + PT)"
```

### Task 11: Expand `what-happens-when-i-die` (EN + PT)

**Files:**
- Modify: `src/messages/en.json`, `src/messages/pt.json` (in place — slug unchanged)

**Interfaces:** same JSON shape. Slug MUST stay `what-happens-when-i-die` (already indexed).

**Editorial contract:**

- Retitle EN: "What Happens When You Die?" (query form; was first-person) / PT: "O Que Acontece Quando Morremos?". Rewrite metaDescription for the query.
- READ the existing 4 sections first; keep them (light touch-ups allowed for flow), then add 2-3 new sections so the total is 6-7. New sections to add:
  - "The courtroom after" — judgment as a real appointment, not a metaphor; connects to the site's verdict motif. Scripture: 2 Corinthians 5:10. Quiz.
  - "What death cannot touch" — for the one who has repented and trusted Christ, death's sting is gone; conditional framing throughout. Scripture: John 5:24. Quiz.
  - (Optional 7th if flow needs it) "Today is the day" — urgency without manipulation; the death counter's honest point. Scripture: 2 Corinthians 6:2. No quiz.
- Do not duplicate arguments the existing sections already make — read first, extend, don't repeat.

- [ ] **Step 1: Read the existing topic in both locales, plan the seam**
- [ ] **Step 2: Apply EN expansion + retitle**
- [ ] **Step 3: Apply PT expansion + retitle**
- [ ] **Step 4: Verify** — `pnpm test && pnpm build`, dev-render both locales.
- [ ] **Step 5: Commit**

```bash
git add src/messages/en.json src/messages/pt.json
git commit -m "content: expand What Happens When You Die? to 6-7 sections (EN + PT)"
```

### Task 12: Release 2 E2E validation

**Files:** none (screenshots to the session scratchpad, never the repo).

- [ ] **Step 1: Full gates** — `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` all green.
- [ ] **Step 2: Sitemap** — after `pnpm build`, `pnpm start`, then:

```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"        # expect 30
curl -s http://localhost:3000/sitemap.xml | grep -E "am-i-a-good-person|sins-be-forgiven|does-god-exist" | wc -l   # expect 6 (3 slugs × 2 locales)
```

- [ ] **Step 3: JSON-LD** — `curl -s http://localhost:3000/en/learn/am-i-a-good-person | grep -oE '"@type":"[^"]*"' | sort -u` includes `Article` and `BreadcrumbList`.
- [ ] **Step 4: Browser pass (Playwright)** — for each new topic in EN and PT: page renders all sections, one quiz answers correctly and reveals; learn hub lists 8 topics in the spec order; footer nav shows the new topics; prev/next on `how-can-my-sins-be-forgiven` points to `why-the-cross` / `what-is-repentance`. Spot-check the committed journey arc still works (localStorage record → homepage committed variant).
- [ ] **Step 5: Screenshot each new topic (EN) to the scratchpad; stop servers.**

### Task 13: Owner copy review gate → deploy → post-deploy

- [ ] **Step 1: Copy review (HARD GATE)** — present all new/changed EN + PT copy to the owner (theology + PT register). Apply corrections, re-run `pnpm test && pnpm build`, commit fixes as `copy: owner review pass on new learn topics`.
- [ ] **Step 2: Merge + push** (⚠️ production deploy — confirm with owner):

```bash
git checkout main && git pull --ff-only && git merge content-and-polish --no-edit && git push origin main
```

- [ ] **Step 3: Post-deploy** — verify live: `curl -s https://www.ifyoudiedtoday.com/sitemap.xml | grep -c "<loc>"` → 30; validator.schema.org on `https://www.ifyoudiedtoday.com/en/learn/am-i-a-good-person` shows Article + BreadcrumbList; GSC → Sitemaps → resubmit `https://www.ifyoudiedtoday.com/sitemap.xml` (owner or Claude-in-Chrome). PSI `/en/test` mobile — confirm LCP ≤ 3.0s (Release 1 outcome).
- [ ] **Step 4: Delete branch** — `git branch -d content-and-polish`.

---

## Self-review notes

- Spec coverage: Part C items 2-6 → Tasks 1-4 (item 1 dropped per Deviations); Part B → Tasks 6-7; Part A → Tasks 8-11; validation → Tasks 12-13; two-release structure → Tasks 5 and 13.
- The only permitted placeholder is `<derived>` in Task 6 Step 4, resolved by the git command in the same step.
- Type consistency: `migrateLegacyJourney` (T1) consumed by `use-journey` (T1); `buildArticleSchema`/`buildBreadcrumbSchema`/`TOPIC_DATES` (T6) consumed in T7; topic JSON shape identical across T8-T11.
- Content tasks (T8-T11) should be dispatched on the most capable model — they are prose-quality-bound, not mechanical.
