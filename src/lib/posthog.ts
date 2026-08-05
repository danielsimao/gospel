import type { PostHog } from "posthog-js";

/**
 * Set to "true" in localStorage, by hand, in whichever browser the owner tests
 * in. Marks that browser's events `is_internal` so PostHog can filter them.
 * Nothing in the UI writes it — a flag anyone could set by accident is worse
 * than no flag.
 */
const INTERNAL_FLAG_KEY = "gospel:internal";

/**
 * The project token, under either of the two names it can arrive as.
 *
 * The PostHog Vercel integration provisions one variable per framework and the
 * Next.js one it writes is `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. This app was
 * built against `NEXT_PUBLIC_POSTHOG_KEY`, so on a project configured purely by
 * the integration the key is absent, the guard below short-circuits, and
 * analytics are silently off — no error, no missing-config warning, just no
 * events. That is exactly what happened moving to a new Vercel account.
 *
 * Read here rather than copying the value into a second variable on Vercel: a
 * hand-copied token is not the one the integration rotates, so it goes stale
 * eventually and fails the same silent way.
 *
 * Both names are written out in full because Next inlines `NEXT_PUBLIC_*` by
 * matching the literal text at build time — `process.env[name]` would compile to
 * undefined. The legacy name wins when both exist, so an environment that sets it
 * deliberately keeps working.
 */
export const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;

/*
 * Production only, and this is not a nicety.
 *
 * Every branch preview Vercel builds carries the same project token
 * as production, so walking a flow on a preview to check a design wrote real
 * events into the real project — indistinguishable from a reader's, because
 * nothing marked them. Over a day of testing that is most of the dataset.
 *
 * NEXT_PUBLIC_VERCEL_ENV is "production", "preview" or "development" and is
 * inlined at build time by Vercel. Absent locally, which is the point: a dev
 * server has no env and never initialises.
 */
function isAnalyticsEnvironment(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

/**
 * Loads and initializes posthog-js on demand. The bundle only downloads
 * once consent is granted — static imports of posthog-js are forbidden
 * outside this file (they would put rrweb in the critical path).
 */
export function initPostHog(): Promise<PostHog | null> {
  if (
    typeof window === "undefined" ||
    !POSTHOG_KEY ||
    !isAnalyticsEnvironment()
  ) {
    return Promise.resolve(null);
  }
  if (client) return Promise.resolve(client);
  if (loading) return loading;

  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY as string, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
      });

      /*
       * Marked rather than excluded, so owner traffic can be filtered out of an
       * insight instead of having to be deleted out of the project. Set as a
       * person property because that is what PostHog's own internal-user filter
       * reads; it survives across sessions on the same browser.
       *
       * The flag is a localStorage key the owner sets by hand once, in the
       * browser they test in. Deliberately not an env var: it has to travel
       * with the person, not with the deployment, and production is exactly
       * where their testing is indistinguishable from anyone else's.
       */
      try {
        if (window.localStorage.getItem(INTERNAL_FLAG_KEY) === "true") {
          posthog.setPersonProperties({ is_internal: true });
        }
      } catch {
        // Private mode. An unmarked internal session is a bad statistic, not a
        // broken app.
      }

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
