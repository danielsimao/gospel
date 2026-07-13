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
