import { emitStorageChange } from "./client-storage";
import type { InvitationResponse } from "./types";

/*
 * Exported because the homepage's pre-paint script has to read the same key,
 * the same legacy key and the same version without importing this module — it
 * runs before any bundle loads. See `buildStagePrepaintScript` in
 * lib/stage-prepaint-script.ts, which interpolates these three so a rename or
 * a version bump cannot leave a second, stale copy behind.
 */
export const STORAGE_KEY = "gospel-journey";
export const LEGACY_TEST_COMPLETED_KEY = "test_completed";

// Bump when JourneyRecord shape changes. Mismatched versions are
// silently discarded on read (same policy as test-session-storage).
export const CURRENT_VERSION = 1;

/** Every stage, in the order a reader passes through them. Exported so callers
    that must enumerate stages — the pre-paint script's tests, the CSS parity
    test — cannot fall out of step with the union above. */
export const JOURNEY_STAGES: readonly JourneyStage[] = [
  "visitor",
  "undecided",
  "committed",
  "thinking",
  "dismissed",
];

/** Every valid invitation response. Exported for the same reason. */
export const INVITATION_RESPONSES: readonly InvitationResponse[] = [
  "committed",
  "thinking",
  "dismissed",
];

export interface JourneyRecord {
  version: number;
  testCompletedAt: number | null;
  invitationResponse: InvitationResponse | null;
  respondedAt: number | null;
}

export type JourneyStage =
  | "visitor"
  | "undecided"
  | "committed"
  | "thinking"
  | "dismissed";

const EMPTY_RECORD: JourneyRecord = Object.freeze({
  version: CURRENT_VERSION,
  testCompletedAt: null,
  invitationResponse: null,
  respondedAt: null,
});

function isValidResponse(value: unknown): value is InvitationResponse {
  return INVITATION_RESPONSES.includes(value as InvitationResponse);
}

/**
 * One-time migration: fold the legacy bare "test_completed" flag into the
 * journey record, then delete the flag. Never overwrites an existing record.
 * Accepted edge: if the journey record exists but is corrupt, the legacy flag
 * is still deleted without folding (same discard policy as corrupt-record reads).
 * Called from useJourney's mount effect — never during render.
 */
export function migrateLegacyJourney(): void {
  if (typeof window === "undefined") return;
  try {
    const legacy = localStorage.getItem(LEGACY_TEST_COMPLETED_KEY);
    if (legacy === null) return;
    if (legacy === "1" && localStorage.getItem(STORAGE_KEY) === null) {
      const record: JourneyRecord = { ...EMPTY_RECORD, testCompletedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    }
    localStorage.removeItem(LEGACY_TEST_COMPLETED_KEY);
    emitStorageChange();
  } catch (error) {
    console.warn("[journey-storage] Failed to migrate legacy flag:", error);
  }
}

export function readJourney(): JourneyRecord {
  if (typeof window === "undefined") return { ...EMPTY_RECORD };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_RECORD };
    const parsed = JSON.parse(raw) as Partial<JourneyRecord>;
    if (parsed.version !== CURRENT_VERSION) return { ...EMPTY_RECORD };

    const testCompletedAt =
      typeof parsed.testCompletedAt === "number" ? parsed.testCompletedAt : null;
    const invitationResponse = isValidResponse(parsed.invitationResponse)
      ? parsed.invitationResponse
      : null;
    /*
     * The two were validated independently, so a record could carry a response
     * with no date — from the legacy migration, or a half-written record. The
     * homepage then read `daysSinceResponse ?? 0` and told the reader they had
     * decided "earlier today" about something they may have decided months ago.
     *
     * A response always happens at or after the test, so falling back to the
     * test's own date is the closest honest answer available. Only null when
     * there is genuinely no response.
     */
    const respondedAt =
      typeof parsed.respondedAt === "number"
        ? parsed.respondedAt
        : invitationResponse
          ? testCompletedAt
          : null;

    return { version: CURRENT_VERSION, testCompletedAt, invitationResponse, respondedAt };
  } catch (error) {
    console.warn("[journey-storage] Failed to read journey:", error);
    return { ...EMPTY_RECORD };
  }
}

function writeJourney(record: JourneyRecord): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    emitStorageChange();
  } catch (error) {
    console.warn("[journey-storage] Failed to write journey:", error);
  }
}

/** Idempotent: the first completion timestamp is kept. */
export function markTestCompleted(): void {
  const current = readJourney();
  if (current.testCompletedAt !== null) return;
  writeJourney({ ...current, testCompletedAt: Date.now() });
}

export function saveInvitationResponse(response: InvitationResponse): void {
  const current = readJourney();
  writeJourney({
    ...current,
    testCompletedAt: current.testCompletedAt ?? Date.now(),
    invitationResponse: response,
    respondedAt: Date.now(),
  });
}

export function resetJourney(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_TEST_COMPLETED_KEY);
    emitStorageChange();
  } catch (error) {
    console.warn("[journey-storage] Failed to reset journey:", error);
  }
}

export function deriveStage(record: JourneyRecord): JourneyStage {
  if (record.invitationResponse) return record.invitationResponse;
  if (record.testCompletedAt !== null) return "undecided";
  return "visitor";
}
