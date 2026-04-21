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
