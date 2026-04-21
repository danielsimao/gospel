import { getConsent } from "@/lib/consent";
import { initPostHog } from "@/lib/posthog";

try {
  if (typeof window !== "undefined" && getConsent() === "granted") {
    initPostHog();
  }
} catch (error) {
  console.warn("[instrumentation-client] Failed to initialize:", error);
}
