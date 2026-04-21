import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return;
  }

  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
    });
    initialized = true;
  } catch (error) {
    console.warn("[posthog] Failed to initialize:", error);
  }
}

export function isPostHogInitialized() {
  return initialized;
}
