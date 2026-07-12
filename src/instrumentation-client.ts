import * as Sentry from "@sentry/nextjs";
import { getConsent } from "@/lib/consent";
import { initPostHog } from "@/lib/posthog";

// Error tracking is not consent-gated (legitimate interest, no cross-site
// tracking); analytics is.
// Session replay is PostHog's job (one rrweb recorder, not two) — no
// Sentry replayIntegration, so no replay sample rates here.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

try {
  if (typeof window !== "undefined" && getConsent() === "granted") {
    initPostHog();
  }
} catch (error) {
  console.warn("[instrumentation-client] Failed to initialize:", error);
}
