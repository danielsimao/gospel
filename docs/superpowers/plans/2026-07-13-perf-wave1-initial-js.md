# Perf Wave 1 — Cut Initial JS (~377 KB gz → ~270 KB gz) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce initial client JS on every route by (1) lazy-loading posthog-js behind consent, (2) tree-shaking Sentry tracing + wiring `withSentryConfig`, (3) dropping redundant `@vercel/analytics`, (4) migrating framer-motion to `LazyMotion`/`m` — attacking the prod mobile LCP of 4.3s.

**Architecture:** `src/lib/posthog.ts` becomes the single posthog-js touchpoint (dynamic `import()`, cached client ref); the four analytics wrapper files and providers consume it instead of importing posthog-js directly. Sentry tracing is killed three ways (compile-time define, build-flag tree-shake, runtime integration filter) so the win survives bundler quirks. framer-motion's full `motion` component is replaced by `m` + one `LazyMotion features={domAnimation}` provider.

**Tech Stack:** Next.js 16.2.1 (Turbopack builds), @sentry/nextjs 10.45.0, posthog-js 1.363.x, framer-motion 12, pnpm 10.28, Vitest.

## Global Constraints

- This is a modified Next.js — consult `node_modules/next/dist/docs/` if any API is in doubt (AGENTS.md).
- Verified facts from recon (do not re-litigate):
  - Sentry only injects `__SENTRY_TRACING__=false` under **webpack** (`@sentry/nextjs/build/cjs/config/webpack.js:878`); the Turbopack path does not. Next 16 `compiler.define` exists (`node_modules/next/dist/server/config-shared.d.ts:1119`) and is the Turbopack-compatible replacement mechanism.
  - `browserTracingIntegration()` is pushed unconditionally unless `__SENTRY_TRACING__` is text-replaced false (`@sentry/nextjs/build/esm/client/index.js:120`), regardless of `tracesSampleRate`.
  - `captureRouterTransitionStart` is a safe no-op when tracing is absent (guarded by an unset handler) — the export in `instrumentation-client.ts` stays.
  - No component uses `drag`, `layout`, `layoutId`, motion values, or `useScroll` — `domAnimation` features are sufficient.
  - Sentry SDK ≥ Next 15.4.1 supports Turbopack builds — no warning expected on 16.2.1.
- Consent gating semantics must not change: PostHog inits only after `getConsent() === "granted"`; Sentry error capture is NOT consent-gated (deliberate — see comment in `instrumentation-client.ts`).
- Do not remove `@vercel/speed-insights` (it is how LCP improvement gets verified in Vercel's dashboard).
- Gate commands for every task: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build` — all green before commit.
- Commit messages end with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx`

---

### Task 0: Baseline bundle measurement

**Files:**
- Create: `/private/tmp/claude-501/-Users-danielsimao-Documents-repos-personal-gospel/c6fe4b64-88e9-42fb-95b5-def6e937e69a/scratchpad/bundle-baseline.txt` (scratch only, never committed)

**Interfaces:**
- Produces: a baseline number later tasks compare against.

- [ ] **Step 1: Build and record gzipped initial-JS total**

Run:
```bash
cd /Users/danielsimao/Documents/repos/personal/gospel && pnpm build
node -e '
const fs = require("fs"), zlib = require("zlib"), path = require("path");
const html = fs.readFileSync(".next/server/app/en.html", "utf8");
const srcs = [...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map(m => m[0]);
const uniq = [...new Set(srcs)];
let total = 0;
for (const s of uniq) {
  const p = path.join(".next", s.replace("/_next/", ""));
  if (!fs.existsSync(p)) continue;
  const gz = zlib.gzipSync(fs.readFileSync(p)).length;
  total += gz;
  console.log((gz/1024).toFixed(1).padStart(8), "KB gz ", s.split("/").pop());
}
console.log("TOTAL", (total/1024).toFixed(1), "KB gz across", uniq.length, "chunks");
' | tee /private/tmp/claude-501/-Users-danielsimao-Documents-repos-personal-gospel/c6fe4b64-88e9-42fb-95b5-def6e937e69a/scratchpad/bundle-baseline.txt
```
Expected: a per-chunk listing ending in a `TOTAL … KB gz` line (~370–390 KB). No commit — measurement only.

---

### Task 1: Lazy-load posthog-js behind consent

**Files:**
- Modify: `src/lib/posthog.ts` (full rewrite, ~55 lines)
- Modify: `src/lib/analytics.ts:1-9,81`
- Modify: `src/lib/learn-analytics.ts:1-9`
- Modify: `src/lib/eternity-analytics.ts:1-9`
- Modify: `src/lib/discipleship-analytics.ts:1-9`
- Modify: `src/components/providers.tsx`
- Modify: `src/instrumentation-client.ts:18`
- Modify: `src/components/shared/consent-banner.tsx:42`

**Interfaces:**
- Produces: `initPostHog(): Promise<PostHog | null>` (idempotent, caches in-flight promise), `capture(event: string, properties?: Record<string, unknown>): void` (safe no-op before init), `getDistinctId(): string | null`, `isPostHogInitialized(): boolean`. All from `@/lib/posthog`.
- After this task, `src/lib/posthog.ts` is the ONLY file with any `posthog-js` import, and that import is `import type` + dynamic `import()`.

- [ ] **Step 1: Rewrite `src/lib/posthog.ts`**

Replace the entire file with:

```ts
import type { PostHog } from "posthog-js";

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;

/**
 * Loads and initializes posthog-js on demand. The bundle only downloads
 * once consent is granted — static imports of posthog-js are forbidden
 * outside this file (they would put rrweb in the critical path).
 */
export function initPostHog(): Promise<PostHog | null> {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return Promise.resolve(null);
  }
  if (client) return Promise.resolve(client);
  if (loading) return loading;

  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
      });
      client = posthog;
      return client;
    })
    .catch((error) => {
      console.warn("[posthog] Failed to initialize:", error);
      loading = null;
      return null;
    });

  return loading;
}

export function isPostHogInitialized(): boolean {
  return client !== null;
}

/** Safe capture — silently drops events until PostHog is initialized. */
export function capture(event: string, properties?: Record<string, unknown>): void {
  try {
    client?.capture(event, properties);
  } catch {
    // Analytics must never break the app
  }
}

export function getDistinctId(): string | null {
  try {
    return client?.get_distinct_id?.() ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Point the four analytics wrappers at the shared capture**

In each of `src/lib/analytics.ts`, `src/lib/learn-analytics.ts`, `src/lib/eternity-analytics.ts`, `src/lib/discipleship-analytics.ts`:

Delete the top import and the local `safeCapture` definition:

```ts
import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app
  }
}
```

(learn-analytics and discipleship-analytics have a `console.warn` variant of the catch — delete those bodies identically.)

Replace with one line at the top of each file:

```ts
import { capture as safeCapture } from "@/lib/posthog";
```

All `safeCapture(...)` call sites stay untouched. Additionally in `src/lib/analytics.ts` only, inside `trackGameAbandoned`, the sendBeacon payload line

```ts
              distinct_id: posthog.get_distinct_id?.() || "anonymous",
```

becomes

```ts
              distinct_id: getDistinctId() || "anonymous",
```

and the import becomes:

```ts
import { capture as safeCapture, getDistinctId } from "@/lib/posthog";
```

- [ ] **Step 3: Update `src/components/providers.tsx` pageview tracker**

Remove the `import posthog from "posthog-js";` line and change the `@/lib/posthog` import to `import { initPostHog } from "@/lib/posthog";` (drop `isPostHogInitialized`). Replace the body of the `useEffect` in `PostHogPageviewTracker` with:

```tsx
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || typeof window === "undefined" || getConsent() !== "granted") {
      return;
    }

    let cancelled = false;

    // Ensure PostHog is loaded + initialized (idempotent — handles mid-session consent)
    initPostHog().then((ph) => {
      if (cancelled || !ph) return;

      const url = search ? `${window.location.origin}${pathname}?${search}` : `${window.location.origin}${pathname}`;

      if (lastTrackedUrlRef.current === url) {
        return;
      }

      lastTrackedUrlRef.current = url;

      try {
        ph.capture("$pageview", {
          $current_url: url,
          pathname,
        });
      } catch {
        // Analytics must never break the app
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, search]);
```

- [ ] **Step 4: Fire-and-forget the two remaining init call sites**

`src/instrumentation-client.ts:18`: `initPostHog();` → `void initPostHog();`
`src/components/shared/consent-banner.tsx:42`: `initPostHog();` → `void initPostHog();`

- [ ] **Step 5: Verify no stray static imports remain**

Run: `grep -rn 'from "posthog-js"' src/`
Expected: exactly one hit — `src/lib/posthog.ts:1:import type { PostHog } from "posthog-js";`

- [ ] **Step 6: Run the gates**

Run: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`
Expected: all green (74 tests pass).

- [ ] **Step 7: Verify posthog left the initial graph**

Run the measurement script from Task 0 Step 1 again. Expected: TOTAL drops by roughly 55–60 KB gz vs baseline, and no initial chunk contains rrweb:

```bash
for f in $(node -e '
const fs=require("fs");const html=fs.readFileSync(".next/server/app/en.html","utf8");
[...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map(m=>m[0]))].forEach(s=>console.log(".next"+s.replace("/_next","")));
'); do grep -l "rrweb" "$f" 2>/dev/null; done
```
Expected: no output (rrweb only in a lazy chunk).

- [ ] **Step 8: Runtime smoke test (dev)**

Start `pnpm dev`, open `http://localhost:3000/en` in a fresh browser profile (or after `localStorage.clear()`), check DevTools Network filtered to `posthog`:
- Before accepting consent: NO posthog-js chunk request.
- Click Accept on the consent banner: the posthog-js chunk loads.
(If no `NEXT_PUBLIC_POSTHOG_KEY` is set locally, instead verify via `pnpm build` output that posthog-js sits in an async chunk, and that clicking Accept throws no console error.)

- [ ] **Step 9: Commit**

```bash
git add src/lib/posthog.ts src/lib/analytics.ts src/lib/learn-analytics.ts src/lib/eternity-analytics.ts src/lib/discipleship-analytics.ts src/components/providers.tsx src/instrumentation-client.ts src/components/shared/consent-banner.tsx
git commit -m "perf: lazy-load posthog-js behind consent

posthog-js (incl. the rrweb replay recorder, ~58 KB gz) was statically
imported by five modules, shipping in the initial bundle of every page
before any consent. It now loads via dynamic import() only when
initPostHog() actually runs — i.e. after consent is granted. All capture
paths go through the cached client in src/lib/posthog.ts.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 2: Tree-shake Sentry tracing + wire withSentryConfig

**Files:**
- Modify: `next.config.ts`
- Modify: `src/instrumentation-client.ts:9-12`
- Modify: `sentry.server.config.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `next.config.ts` default export becomes `withSentryConfig(nextConfig, sentryBuildOptions)`. Error capture (`Sentry.captureException`, `onRequestError`, error boundaries) is unchanged.

- [ ] **Step 1: Rewrite `next.config.ts`**

```ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  compiler: {
    // Compile-time kill switches for Sentry's tracing/debug code paths.
    // Sentry's own excludeTracing define is webpack-only; this is the
    // Turbopack-compatible equivalent (see @sentry/nextjs config/webpack.js).
    define: {
      __SENTRY_TRACING__: "false",
      __SENTRY_DEBUG__: "false",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  disableLogger: true,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
  },
});
```

- [ ] **Step 2: Drop client tracing in `src/instrumentation-client.ts`**

Replace the `Sentry.init` block (currently lines 9–12):

```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

with:

```ts
// Tracing is off (errors only): __SENTRY_TRACING__ is defined false at
// build time, and this runtime filter guarantees it even if the define
// is ever lost. This site makes almost no client fetches — tracing was
// pure overhead on every page.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: (defaultIntegrations) =>
    defaultIntegrations.filter((integration) => integration.name !== "BrowserTracing"),
});
```

Keep the existing comment block above the init about consent/replay, the `onRouterTransitionStart` export (safe no-op without tracing — its handler is only registered by the tracing integration), and the PostHog init below.

- [ ] **Step 3: Drop server tracing in `sentry.server.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
```

(Removes `tracesSampleRate: 1.0` — server is SSG + a couple of tiny functions; errors still flow via `onRequestError`.)

- [ ] **Step 4: Run the gates**

Run: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`
Expected: all green. The build may print a Sentry warning about a missing auth token locally — acceptable (Vercel has `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` set). A warning about Turbopack version support must NOT appear (Next 16.2.1 > 15.4.1).

- [ ] **Step 5: Verify tracing left the client bundle**

Re-run the Task 0 measurement script. Expected: TOTAL drops further vs post-Task-1 (Sentry chunk shrinks; magnitude depends on how much Turbopack DCEs — record the number). Then confirm the integration is gone from the initial graph:

```bash
for f in $(node -e '
const fs=require("fs");const html=fs.readFileSync(".next/server/app/en.html","utf8");
[...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map(m=>m[0]))].forEach(s=>console.log(".next"+s.replace("/_next","")));
'); do grep -l "browserTracingIntegration\|BrowserTracing" "$f" 2>/dev/null; done
```
Expected: ideally no output. If a hit remains (Turbopack kept the code), that is a known acceptable fallback — the runtime filter still disables it; note it in the commit body and continue.

- [ ] **Step 6: Verify error capture still works (dev)**

`pnpm dev`, open `http://localhost:3000/en`, in the console run `Sentry.captureException?.(new Error("wave1-smoke"))` via the app (or temporarily trigger via DevTools: `window.dispatchEvent(new ErrorEvent("error", { error: new Error("wave1-smoke") }))`) and check the Network tab for a POST to the Sentry envelope endpoint returning 200. If `NEXT_PUBLIC_SENTRY_DSN` is not set locally, skip and note it — prod DSN is set on Vercel and error paths are unchanged.

- [ ] **Step 7: Commit**

```bash
git add next.config.ts src/instrumentation-client.ts sentry.server.config.ts
git commit -m "perf: kill Sentry tracing, wire withSentryConfig

browserTracingIntegration shipped and ran on every page (PerfObservers,
fetch/XHR instrumentation) for a site with almost no client fetches, and
the SDK shipped un-tree-shaken because next.config.ts never used
withSentryConfig. Tracing is now off three ways: compiler.define sets
__SENTRY_TRACING__=false (Turbopack-compatible; Sentry's own
excludeTracing define is webpack-only), bundleSizeOptimizations covers
any webpack path, and a runtime integrations filter guarantees it.
withSentryConfig also restores source-map upload on Vercel builds.
Error capture is unchanged.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 3: Drop redundant @vercel/analytics

**Files:**
- Modify: `src/components/providers.tsx`
- Modify: `package.json` (via pnpm)

**Interfaces:**
- Consumes: `providers.tsx` as left by Task 1.
- Produces: providers renders `<SpeedInsights />` but no `<Analytics />`.

- [ ] **Step 1: Remove the component**

In `src/components/providers.tsx` delete the import line

```tsx
import { Analytics } from "@vercel/analytics/next";
```

and the JSX line

```tsx
      <Analytics />
```

(`SpeedInsights` stays — it feeds the Vercel CWV dashboard used to verify this wave.)

- [ ] **Step 2: Remove the dependency**

Run: `pnpm remove @vercel/analytics`
Expected: package.json + pnpm-lock.yaml updated, install succeeds.

- [ ] **Step 3: Run the gates**

Run: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`
Expected: all green; `grep -rn "@vercel/analytics" src package.json` returns nothing.

- [ ] **Step 4: Commit**

```bash
git add src/components/providers.tsx package.json pnpm-lock.yaml
git commit -m "perf: drop @vercel/analytics — redundant with PostHog

Pageviews and product analytics are PostHog's job; Vercel Analytics
duplicated the beacons and added a script to every page. Speed Insights
stays for the Core Web Vitals dashboard.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 4: framer-motion → LazyMotion + m

**Files:**
- Modify: `src/components/providers.tsx`
- Modify (mechanical `motion` → `m` swap, 21 files):
  `src/components/eternity/rotating-facts.tsx`, `src/components/examination-ledger.tsx`, `src/components/follow-up.tsx`, `src/components/game-shell.tsx`, `src/components/grace-screen.tsx`, `src/components/home-shell.tsx`, `src/components/invitation-screen.tsx`, `src/components/landing.tsx`, `src/components/learn/section-quiz.tsx`, `src/components/learn/topic-page.tsx`, `src/components/learn/topic-section.tsx`, `src/components/next-steps/track-committed.tsx`, `src/components/next-steps/track-thinking.tsx`, `src/components/question-card.tsx`, `src/components/reading-plan/day-card.tsx`, `src/components/reading-plan/reading-plan.tsx`, `src/components/resume-dialog.tsx`, `src/components/share-buttons.tsx`, `src/components/shared/consent-banner.tsx`, `src/components/ui/confirm-dialog.tsx`, `src/components/verdict-screen.tsx`

**Interfaces:**
- Consumes: `providers.tsx` as left by Task 3.
- Produces: every animated component uses `m.*`; the feature set (`domAnimation`) is loaded once in `Providers`. `AnimatePresence` usage is unchanged.

Recon facts: no component uses `drag`, `layout`/`layoutId`, motion values, or scroll hooks — `domAnimation` (animations, variants, exit, tap/hover/focus gestures) covers everything. The only non-component imports are `AnimatePresence` (8 files) and `MotionConfig` (providers).

- [ ] **Step 1: Add LazyMotion to `src/components/providers.tsx`**

Change the framer import to:

```tsx
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
```

and wrap the tree (strict mode makes any leftover full-`motion` usage throw in dev — enforcement, not decoration):

```tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Suspense fallback={null}>
          <PostHogPageviewTracker />
        </Suspense>
        <SpeedInsights />
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
```

- [ ] **Step 2: Mechanical swap in the 21 component files**

For each file listed above:
- Import: `import { motion } from "framer-motion"` → `import { m } from "framer-motion"`; `import { motion, AnimatePresence } from "framer-motion"` → `import { m, AnimatePresence } from "framer-motion"`; `import { AnimatePresence, motion } from "framer-motion"` → `import { AnimatePresence, m } from "framer-motion"`.
- JSX: every `<motion.` → `<m.` and every `</motion.` → `</m.` (elements used in the codebase: `div`, `span`, `p`, `button`, `section`, `blockquote` — the pattern swap covers all).

A safe scripted pass (BSD sed on macOS):

```bash
cd /Users/danielsimao/Documents/repos/personal/gospel
for f in src/components/eternity/rotating-facts.tsx src/components/examination-ledger.tsx src/components/follow-up.tsx src/components/game-shell.tsx src/components/grace-screen.tsx src/components/home-shell.tsx src/components/invitation-screen.tsx src/components/landing.tsx src/components/learn/section-quiz.tsx src/components/learn/topic-page.tsx src/components/learn/topic-section.tsx src/components/next-steps/track-committed.tsx src/components/next-steps/track-thinking.tsx src/components/question-card.tsx src/components/reading-plan/day-card.tsx src/components/reading-plan/reading-plan.tsx src/components/resume-dialog.tsx src/components/share-buttons.tsx src/components/shared/consent-banner.tsx src/components/ui/confirm-dialog.tsx src/components/verdict-screen.tsx; do
  sed -i '' -e 's/import { motion } from "framer-motion"/import { m } from "framer-motion"/' \
            -e 's/import { motion, AnimatePresence } from "framer-motion"/import { m, AnimatePresence } from "framer-motion"/' \
            -e 's/import { AnimatePresence, motion } from "framer-motion"/import { AnimatePresence, m } from "framer-motion"/' \
            -e 's/<motion\./<m./g' \
            -e 's/<\/motion\./<\/m./g' "$f"
done
```

- [ ] **Step 3: Verify the swap is total**

Run: `grep -rn '\bmotion\.' src --include="*.tsx" | grep -v "framer"` and `grep -rn 'import { motion' src`
Expected: no hits from either.

- [ ] **Step 4: Run the gates**

Run: `pnpm lint && pnpm test && npx tsc --noEmit && pnpm build`
Expected: all green.

- [ ] **Step 5: Measure and feel-check**

Re-run the Task 0 measurement script — expected: TOTAL drops another ~15–18 KB gz (record the final number vs baseline).

Feel check on `pnpm dev` (strict mode crashes loudly if anything was missed, so a broad click-through IS the test):
- `/en` home: hero animates in, facts ticker crossfades.
- `/en/test`: landing → first question transition, answer chip pop, ledger stagger, verdict → grace → invitation flow.
- Consent banner (fresh profile): slides up, accepts with slide-down.
- `/en/learn`: card stagger; open a topic: sections animate; section quiz reveals.
- `/en/reading-plan`: expand a day, mark read → COMPLETED chip pops.
- No console errors anywhere (a LazyMotion strict violation throws).

- [ ] **Step 6: Commit**

```bash
git add src/components
git commit -m "perf: migrate framer-motion to LazyMotion + m

The full motion component pulls framer's entire feature tree (~39 KB gz)
into the initial bundle. All 21 animated components now use the m
component with a single LazyMotion features={domAnimation} provider —
same animations, roughly half the framer footprint. strict mode turns
any future full-motion import into a dev-time crash. No component uses
drag/layout/motion values, so domAnimation is sufficient.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GCuFmndcCWD1FAQbeLHCxx"
```

---

### Task 5: Ship + verify on production

**Files:** none (operational)

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Wait for Vercel deploy, confirm fresh build**

```bash
vercel ls gospel 2>/dev/null | head -5
```
Wait until the newest deployment is Ready (or poll the prod page). NOTE: env-var inlining requires a real commit build — this push is one, no empty-commit dance needed.

- [ ] **Step 3: Prod smoke**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.ifyoudiedtoday.com/en
```
Expected: 200. Then in a browser: consent banner appears on fresh profile, no posthog network request before Accept, one after; no console errors.

- [ ] **Step 4: Prod Lighthouse (mobile) — the actual success metric**

```bash
cd "$(mktemp -d)" && npx --yes lighthouse@latest https://www.ifyoudiedtoday.com/en --only-categories=performance --form-factor=mobile --screenEmulation.mobile --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=./lh.json 2>&1 | tail -3 && node -e "const r=require('./lh.json');console.log('perf',Math.round(r.categories.performance.score*100));const a=r.audits;console.log('LCP',a['largest-contentful-paint'].displayValue,'TBT',a['total-blocking-time'].displayValue,'CLS',a['cumulative-layout-shift'].displayValue);"
```
Baseline to beat: perf 84, LCP 4.3s. Expected: LCP meaningfully down (target < 3.5s), perf ≥ 90. Lighthouse variance is real — if the first run is ambiguous, run twice more and take the median.

---

## Execution order

Task 0 → 1 → 2 → 3 → 4 → 5, strictly serial (Tasks 1, 3, 4 all touch `providers.tsx`).
