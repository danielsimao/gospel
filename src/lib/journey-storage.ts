import { emitStorageChange } from "./client-storage";
import type { InvitationResponse } from "./types";

const STORAGE_KEY = "gospel-journey";
const LEGACY_TEST_COMPLETED_KEY = "test_completed";

// Bump when JourneyRecord shape changes. Mismatched versions are
// silently discarded on read (same policy as test-session-storage).
const CURRENT_VERSION = 1;

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

const EMPTY_RECORD: JourneyRecord = {
  version: CURRENT_VERSION,
  testCompletedAt: null,
  invitationResponse: null,
  respondedAt: null,
};

function isValidResponse(value: unknown): value is InvitationResponse {
  return value === "committed" || value === "thinking" || value === "dismissed";
}

/**
 * One-time migration: fold the legacy bare "test_completed" flag into the
 * journey record, then delete the flag. Never overwrites an existing record.
 */
function migrateLegacyFlag(): void {
  const legacy = localStorage.getItem(LEGACY_TEST_COMPLETED_KEY);
  if (legacy === null) return;
  if (legacy === "1" && localStorage.getItem(STORAGE_KEY) === null) {
    const record: JourneyRecord = { ...EMPTY_RECORD, testCompletedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }
  localStorage.removeItem(LEGACY_TEST_COMPLETED_KEY);
}

export function readJourney(): JourneyRecord {
  if (typeof window === "undefined") return EMPTY_RECORD;
  try {
    migrateLegacyFlag();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RECORD;
    const parsed = JSON.parse(raw) as Partial<JourneyRecord>;
    if (parsed.version !== CURRENT_VERSION) return EMPTY_RECORD;
    return {
      version: CURRENT_VERSION,
      testCompletedAt:
        typeof parsed.testCompletedAt === "number" ? parsed.testCompletedAt : null,
      invitationResponse: isValidResponse(parsed.invitationResponse)
        ? parsed.invitationResponse
        : null,
      respondedAt: typeof parsed.respondedAt === "number" ? parsed.respondedAt : null,
    };
  } catch (error) {
    console.warn("[journey-storage] Failed to read journey:", error);
    return EMPTY_RECORD;
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
