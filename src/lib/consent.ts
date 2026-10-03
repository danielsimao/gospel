const CONSENT_KEY = "analytics-consent";

export type ConsentState = "granted" | "denied" | "pending";

export function getConsent(): ConsentState {
  if (typeof window === "undefined") return "pending";
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
    return "pending";
  } catch {
    return "pending";
  }
}

export function setConsent(value: "granted" | "denied"): boolean {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    return true;
  } catch (error) {
    console.warn("[consent] Failed to persist consent choice:", error);
    return false;
  }
}

// Tracks an explicit accept/decline in this tab. Consulted alongside storage
// so private-mode browsers (where setConsent's write can fail) still count
// the click as an answer.
let answeredThisSession = false;

/** Subscribe to the banner's "consentchange" event. Returns an unsubscriber. */
export function subscribeToConsentAnswered(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    answeredThisSession = true;
    callback();
  };
  window.addEventListener("consentchange", handler);
  return () => window.removeEventListener("consentchange", handler);
}

/** True once consent is granted/denied in storage or answered this session. */
export function hasAnsweredConsent(): boolean {
  return answeredThisSession || getConsent() !== "pending";
}

/*
 * Whether the banner is being held back by a screen that asked it to wait.
 *
 * The test flow asks, from the first question until the reader leaves /test:
 * the banner sat under every beat of the Law and of grace for exactly the
 * readers meeting them for the first time, and after the content it was the
 * most clickable-looking thing on the screen. It is asked on the test's own
 * landing instead, and again on whatever page follows the test.
 *
 * Nothing is tracked in the meantime — PostHog only starts on an answer — so
 * holding the question back holds back analytics for those readers, not their
 * privacy. Module state, because the banner lives in the locale layout and the
 * test in a page beneath it, with no provider in common.
 */
let bannerDeferred = false;
const deferralListeners = new Set<() => void>();

export function setConsentBannerDeferred(deferred: boolean): void {
  if (bannerDeferred === deferred) return;
  bannerDeferred = deferred;
  for (const listener of deferralListeners) listener();
}

export function isConsentBannerDeferred(): boolean {
  return bannerDeferred;
}

export function subscribeToConsentDeferral(callback: () => void): () => void {
  deferralListeners.add(callback);
  return () => {
    deferralListeners.delete(callback);
  };
}
