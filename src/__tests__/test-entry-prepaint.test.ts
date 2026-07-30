import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SELF_RATINGS, STORAGE_KEY, takeSelfRating } from "@/lib/self-rating-storage";
import { TEST_ENTRY_PREPAINT_SCRIPT } from "@/lib/test-entry-prepaint-script";

// Mock localStorage (same pattern as journey-storage.test.ts)
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
};

vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", localStorageMock);

/**
 * Runs the pre-paint script the way a browser would, returning the attribute it
 * set — or null for none — and whether it consumed the key.
 *
 * The script is a string, so nothing in the toolchain looks inside it:
 * TypeScript does not type it, Biome does not lint it, and a syntax error in it
 * is a browser parse error its own try/catch cannot reach.
 */
function stamp(storageImpl: Partial<typeof localStorageMock> = localStorageMock) {
  let attribute: string | null = null;
  const fakeDocument = {
    documentElement: {
      setAttribute(name: string, value: string) {
        if (name === "data-test-entry") attribute = value;
      },
    },
  };
  new Function("localStorage", "document", TEST_ENTRY_PREPAINT_SCRIPT)(
    storageImpl,
    fakeDocument,
  );
  return attribute;
}

const ROOT = join(import.meta.dirname, "..", "..");
const css = readFileSync(join(ROOT, "src", "app", "globals.css"), "utf8");
const gameShell = readFileSync(join(ROOT, "src", "components", "game-shell.tsx"), "utf8");
const landing = readFileSync(join(ROOT, "src", "components", "landing.tsx"), "utf8");

describe("test entry pre-paint script", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it("parses as JavaScript", () => {
    // The only check in the whole toolchain that looks inside the string.
    expect(() => new Function("localStorage", "document", TEST_ENTRY_PREPAINT_SCRIPT)).not.toThrow();
  });

  for (const rating of SELF_RATINGS) {
    it(`flags the reply when the reader answered "${rating}"`, () => {
      storage.set(STORAGE_KEY, rating);
      expect(stamp()).toBe("reply");
    });
  }

  it("stamps nothing for a cold visitor, so the question shows at once", () => {
    expect(stamp()).toBeNull();
  });

  it("stamps nothing for a value outside the three answers", () => {
    // Validated rather than truthiness-checked. An unrecognised value means the
    // layout effect will find nothing to seed, so the question is what the
    // reader needs — hiding it would leave them looking at a blank screen.
    for (const junk of ["", "maybe", "YES", "0", "null", "[object Object]"]) {
      storage.clear();
      storage.set(STORAGE_KEY, junk);
      expect(stamp(), `"${junk}" should not flag the reply`).toBeNull();
    }
  });

  it("stamps nothing when storage cannot be read", () => {
    // Blocked by policy, or a partitioned context. No attribute means the CSS
    // default applies, which is the question.
    const throwing = {
      getItem: vi.fn(() => {
        throw new Error("SecurityError");
      }),
    };
    expect(stamp(throwing)).toBeNull();
  });

  it("does not consume the key, which takeSelfRating must still find", () => {
    /*
     * The one way this script could break the feature outright. takeSelfRating
     * clears the key as part of reading it — that is what stops a stale claim
     * being quoted at the verdict days later. If the script consumed it first,
     * the layout effect would find nothing, no reply would ever render, and the
     * reader would sit looking at a permanently hidden question.
     */
    storage.set(STORAGE_KEY, "yes");
    stamp();
    expect(storage.get(STORAGE_KEY)).toBe("yes");
    expect(takeSelfRating()).toBe("yes");
    expect(storage.has(STORAGE_KEY)).toBe(false);
  });

  it("has a rule hiding the question, and markup for it to match", () => {
    // Structural, not a cascade test: vitest runs in node and globals.css opens
    // with `@import "tailwindcss"`, so the real cascade does not exist here.
    expect(css).toMatch(/html\[data-test-entry="reply"\]\s+\[data-slot="landing-question"\]/);
    expect(landing).toContain('data-slot="landing-question"');
  });

  it("hides with visibility, so the reserved height does not collapse", () => {
    // display:none would trade the wrong content for a layout shift: the box in
    // landing.tsx measures its height from this element.
    const rule = css.slice(css.indexOf('html[data-test-entry="reply"]'));
    expect(rule.slice(0, 160)).toMatch(/visibility:\s*hidden/);
    expect(rule.slice(0, 160)).not.toMatch(/display:\s*none/);
  });

  it("clears the flag where the question is wanted back, not at hydration", () => {
    /*
     * "Change my answer" is the only path that brings the question back, so that
     * handler is where the flag must go. Clearing it when the rating is seeded
     * instead was measured to expose the question for 210ms — React does not
     * render the reply until a frame after the effect runs, and the question is
     * visible in between. That is the flicker this file exists to prevent.
     */
    expect(landing).toMatch(
      /handleChange[\s\S]{0,600}delete document\.documentElement\.dataset\.testEntry/,
    );
    // game-shell only drops it on the way off the route.
    expect(gameShell).toMatch(
      /return \(\) => \{\s*delete document\.documentElement\.dataset\.testEntry;/,
    );
  });
});
