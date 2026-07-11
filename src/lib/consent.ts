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
