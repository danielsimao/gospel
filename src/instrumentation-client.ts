import * as Sentry from "@sentry/nextjs";
import { getConsent } from "@/lib/consent";
import { initPostHog } from "@/lib/posthog";

// Error tracking is not consent-gated (legitimate interest, no cross-site
// tracking); analytics is.
// Session replay is PostHog's job (one rrweb recorder, not two) — no
// Sentry replayIntegration, so no replay sample rates here.
// Tracing is off (errors only): __SENTRY_TRACING__ is defined false at
// build time, and this runtime filter guarantees it even if the define
// is ever lost. This site makes almost no client fetches — tracing was
// pure overhead on every page.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: (defaultIntegrations) =>
    defaultIntegrations.filter((integration) => integration.name !== "BrowserTracing"),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

try {
  if (typeof window !== "undefined" && getConsent() === "granted") {
    void initPostHog();
  }
} catch (error) {
  console.warn("[instrumentation-client] Failed to initialize:", error);
}
