import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readJourney,
  markTestCompleted,
  saveInvitationResponse,
  resetJourney,
  deriveStage,
  type JourneyRecord,
} from "@/lib/journey-storage";

// Mock localStorage (same pattern as test-session-storage.test.ts)
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
};

vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", localStorageMock);

vi.mock("@/lib/client-storage", () => ({
  emitStorageChange: vi.fn(),
}));

describe("journey-storage", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  describe("readJourney", () => {
    it("returns an empty record when nothing is stored", () => {
      const record = readJourney();
      expect(record.testCompletedAt).toBeNull();
      expect(record.invitationResponse).toBeNull();
      expect(record.respondedAt).toBeNull();
    });

    it("returns an empty record for corrupted JSON", () => {
      storage.set("gospel-journey", "not json{{{");
      expect(readJourney().testCompletedAt).toBeNull();
    });

    it("returns an empty record for a version mismatch", () => {
      storage.set(
        "gospel-journey",
        JSON.stringify({ version: 999, testCompletedAt: 123 }),
      );
      expect(readJourney().testCompletedAt).toBeNull();
    });

    it("discards an invalid invitationResponse value", () => {
      storage.set(
        "gospel-journey",
        JSON.stringify({
          version: 1,
          testCompletedAt: 123,
          invitationResponse: "prayed",
          respondedAt: 456,
        }),
      );
      expect(readJourney().invitationResponse).toBeNull();
    });
  });

  describe("legacy test_completed migration", () => {
    it("folds a legacy flag into a new record and deletes the flag", () => {
      storage.set("test_completed", "1");
      const record = readJourney();
      expect(record.testCompletedAt).not.toBeNull();
      expect(storage.has("test_completed")).toBe(false);
    });

    it("does not overwrite an existing record, but still deletes the flag", () => {
      saveInvitationResponse("committed");
      storage.set("test_completed", "1");
      const record = readJourney();
      expect(record.invitationResponse).toBe("committed");
      expect(storage.has("test_completed")).toBe(false);
    });

    it("ignores a legacy flag that is not '1'", () => {
      storage.set("test_completed", "0");
      expect(readJourney().testCompletedAt).toBeNull();
      expect(storage.has("test_completed")).toBe(false);
    });
  });

  describe("markTestCompleted", () => {
    it("stamps testCompletedAt", () => {
      markTestCompleted();
      expect(readJourney().testCompletedAt).toBeTypeOf("number");
    });

    it("is idempotent — keeps the first timestamp", () => {
      markTestCompleted();
      const first = readJourney().testCompletedAt;
      markTestCompleted();
      expect(readJourney().testCompletedAt).toBe(first);
    });
  });

  describe("saveInvitationResponse", () => {
    it("stores the response and respondedAt", () => {
      markTestCompleted();
      saveInvitationResponse("thinking");
      const record = readJourney();
      expect(record.invitationResponse).toBe("thinking");
      expect(record.respondedAt).toBeTypeOf("number");
    });

    it("backfills testCompletedAt when missing", () => {
      saveInvitationResponse("committed");
      expect(readJourney().testCompletedAt).toBeTypeOf("number");
    });

    it("overwrites a previous response (thinking → committed)", () => {
      saveInvitationResponse("thinking");
      saveInvitationResponse("committed");
      expect(readJourney().invitationResponse).toBe("committed");
    });
  });

  describe("resetJourney", () => {
    it("clears the record", () => {
      saveInvitationResponse("dismissed");
      resetJourney();
      expect(readJourney().invitationResponse).toBeNull();
      expect(readJourney().testCompletedAt).toBeNull();
    });
  });

  describe("deriveStage", () => {
    const base: JourneyRecord = {
      version: 1,
      testCompletedAt: null,
      invitationResponse: null,
      respondedAt: null,
    };

    it("visitor when nothing happened", () => {
      expect(deriveStage(base)).toBe("visitor");
    });

    it("undecided when test done but no response", () => {
      expect(deriveStage({ ...base, testCompletedAt: 123 })).toBe("undecided");
    });

    it("committed / thinking / dismissed follow the response", () => {
      expect(
        deriveStage({ ...base, testCompletedAt: 1, invitationResponse: "committed", respondedAt: 2 }),
      ).toBe("committed");
      expect(
        deriveStage({ ...base, testCompletedAt: 1, invitationResponse: "thinking", respondedAt: 2 }),
      ).toBe("thinking");
      expect(
        deriveStage({ ...base, testCompletedAt: 1, invitationResponse: "dismissed", respondedAt: 2 }),
      ).toBe("dismissed");
    });

    it("response wins even without testCompletedAt (defensive)", () => {
      expect(deriveStage({ ...base, invitationResponse: "committed" })).toBe("committed");
    });
  });
});
