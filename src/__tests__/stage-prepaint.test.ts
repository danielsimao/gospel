import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  deriveStage,
  readJourney,
  markTestCompleted,
  saveInvitationResponse,
  JOURNEY_STAGES,
  STORAGE_KEY,
  LEGACY_TEST_COMPLETED_KEY,
  CURRENT_VERSION,
  type JourneyStage,
} from "@/lib/journey-storage";
import { STAGE_PREPAINT_SCRIPT } from "@/lib/stage-prepaint-script";

// Mock localStorage (same pattern as journey-storage.test.ts)
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

/**
 * Runs the pre-paint script the way a browser would and returns the attribute
 * it set, or null if it set none.
 *
 * The script is a string because it has to execute before any bundle loads, so
 * nothing in the toolchain looks inside it: TypeScript does not type it, Biome
 * does not lint it, and a syntax error in it is a browser parse error that its
 * own try/catch cannot reach. Evaluating it here is the only thing that does.
 */
function stamp(storageImpl: Partial<typeof localStorageMock> = localStorageMock): string | null {
  let attribute: string | null = null;
  const fakeDocument = {
    documentElement: {
      setAttribute(name: string, value: string) {
        if (name === "data-journey-stage") attribute = value;
      },
    },
  };
  new Function("localStorage", "document", STAGE_PREPAINT_SCRIPT)(storageImpl, fakeDocument);
  return attribute;
}

/**
 * What the CSS in globals.css will actually reveal for a stamped attribute.
 *
 * Deliberately STRICTER than the stylesheet, and the difference matters.
 *
 * The CSS now enumerates its take-back rules, so an unrecognised attribute
 * value falls back to the visitor block rather than hiding everything —
 * confirmed in a browser. This helper still reports "nothing" for such a value,
 * because the script is not supposed to produce one: the enumerated CSS is the
 * safety net, not the contract. Reporting "visitor" here would make the parity
 * assertions below pass on a script that stamps garbage, which is the bug this
 * file was written after.
 */
function visibleStage(stamped: string | null): JourneyStage | "nothing" {
  if (stamped === null) return "visitor";
  return JOURNEY_STAGES.includes(stamped as JourneyStage)
    ? (stamped as JourneyStage)
    : "nothing";
}

const DAY = 86_400_000;

describe("stage pre-paint script", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it("parses as JavaScript", () => {
    // The only check in the whole toolchain that looks inside the string.
    expect(() => new Function("localStorage", "document", STAGE_PREPAINT_SCRIPT)).not.toThrow();
  });

  describe("agrees with deriveStage", () => {
    /*
     * The same record shapes journey-storage.test.ts covers, plus the ones that
     * only matter once a value reaches an HTML attribute. The script reads raw
     * storage while deriveStage reads the output of readJourney, which
     * sanitises first — so every divergence between them lives in this table.
     */
    const cases: Array<{ name: string; raw: string | null }> = [
      { name: "nothing stored", raw: null },
      { name: "an empty string", raw: "" },
      { name: "corrupt JSON", raw: "{oops" },
      { name: "a JSON literal that is not an object", raw: "5" },
      { name: "null", raw: "null" },
      { name: "an array", raw: "[]" },
      {
        name: "a record from a newer version",
        raw: JSON.stringify({ version: CURRENT_VERSION + 1, invitationResponse: "committed" }),
      },
      {
        name: "a completed test with no response",
        raw: JSON.stringify({ version: CURRENT_VERSION, testCompletedAt: Date.now() - DAY }),
      },
      {
        name: "a committed response",
        raw: JSON.stringify({
          version: CURRENT_VERSION,
          testCompletedAt: Date.now() - DAY,
          invitationResponse: "committed",
          respondedAt: Date.now(),
        }),
      },
      {
        name: "a thinking response",
        raw: JSON.stringify({
          version: CURRENT_VERSION,
          testCompletedAt: Date.now() - DAY,
          invitationResponse: "thinking",
          respondedAt: Date.now(),
        }),
      },
      {
        name: "a dismissed response",
        raw: JSON.stringify({
          version: CURRENT_VERSION,
          testCompletedAt: Date.now() - DAY,
          invitationResponse: "dismissed",
          respondedAt: Date.now(),
        }),
      },
      {
        // The record journey-storage.test.ts already stores to prove readJourney
        // discards it. Before validation was added to the script, this stamped
        // data-journey-stage="prayed" and the homepage rendered no CTA at all.
        name: "an invitationResponse outside the three valid values",
        raw: JSON.stringify({
          version: CURRENT_VERSION,
          testCompletedAt: Date.now() - DAY,
          invitationResponse: "prayed",
          respondedAt: Date.now(),
        }),
      },
      {
        name: "a non-string invitationResponse",
        raw: JSON.stringify({
          version: CURRENT_VERSION,
          testCompletedAt: Date.now() - DAY,
          invitationResponse: true,
        }),
      },
      {
        name: "an object invitationResponse",
        raw: JSON.stringify({
          version: CURRENT_VERSION,
          testCompletedAt: Date.now() - DAY,
          invitationResponse: { a: 1 },
        }),
      },
      {
        name: "a testCompletedAt that is not a number",
        raw: JSON.stringify({ version: CURRENT_VERSION, testCompletedAt: "123" }),
      },
      {
        name: "a version that is a string",
        raw: JSON.stringify({ version: "1", invitationResponse: "committed" }),
      },
    ];

    for (const { name, raw } of cases) {
      it(`shows what deriveStage would choose, given ${name}`, () => {
        if (raw !== null) storage.set(STORAGE_KEY, raw);
        expect(visibleStage(stamp())).toBe(deriveStage(readJourney()));
      });
    }

    it("never stamps a value outside the five stages, for any record in the table", () => {
      // The invariant the table exists to protect. The CSS would now fall such a
      // value back to the visitor block, so this is about the script's contract
      // rather than about what a reader would see.
      for (const { raw } of cases) {
        storage.clear();
        if (raw !== null) storage.set(STORAGE_KEY, raw);
        expect(visibleStage(stamp())).not.toBe("nothing");
      }
    });
  });

  it("reads records written by the app rather than hand-built literals", () => {
    // Catches a CURRENT_VERSION bump or a STORAGE_KEY rename, which a fixture
    // written out by hand would silently keep passing.
    markTestCompleted();
    expect(stamp()).toBe("undecided");

    saveInvitationResponse("thinking");
    expect(stamp()).toBe("thinking");

    saveInvitationResponse("committed");
    expect(stamp()).toBe("committed");
  });

  it("honours the legacy test_completed flag before it has been migrated", () => {
    // migrateLegacyJourney runs in useJourney's effect, i.e. after this script.
    // Without this branch the longest-absent readers are stamped "visitor" and
    // get the full stage swap at hydration.
    storage.set(LEGACY_TEST_COMPLETED_KEY, "1");
    expect(stamp()).toBe("undecided");
  });

  it("prefers a real record over the legacy flag", () => {
    storage.set(LEGACY_TEST_COMPLETED_KEY, "1");
    storage.set(
      STORAGE_KEY,
      JSON.stringify({
        version: CURRENT_VERSION,
        testCompletedAt: Date.now() - DAY,
        invitationResponse: "committed",
        respondedAt: Date.now(),
      }),
    );
    expect(stamp()).toBe("committed");
  });

  it("stamps nothing when storage cannot be read", () => {
    // Blocked by policy, or a partitioned context. No attribute means the CSS
    // default applies, which is the visitor block.
    const throwing = {
      getItem: vi.fn(() => {
        throw new Error("SecurityError");
      }),
    };
    expect(stamp(throwing)).toBeNull();
    expect(visibleStage(null)).toBe("visitor");
  });

  it("has a case for every stage the JourneyStage union declares", () => {
    // Typed as a total record, so adding a sixth stage fails to compile here
    // until this file, the markup and the CSS have all been updated.
    const reachable: Record<JourneyStage, string | null> = {
      visitor: null,
      undecided: JSON.stringify({ version: CURRENT_VERSION, testCompletedAt: Date.now() }),
      committed: JSON.stringify({
        version: CURRENT_VERSION,
        testCompletedAt: Date.now(),
        invitationResponse: "committed",
        respondedAt: Date.now(),
      }),
      thinking: JSON.stringify({
        version: CURRENT_VERSION,
        testCompletedAt: Date.now(),
        invitationResponse: "thinking",
        respondedAt: Date.now(),
      }),
      dismissed: JSON.stringify({
        version: CURRENT_VERSION,
        testCompletedAt: Date.now(),
        invitationResponse: "dismissed",
        respondedAt: Date.now(),
      }),
    };

    for (const stage of JOURNEY_STAGES) {
      storage.clear();
      const raw = reachable[stage];
      if (raw !== null) storage.set(STORAGE_KEY, raw);
      expect(visibleStage(stamp())).toBe(stage);
    }
  });
});
