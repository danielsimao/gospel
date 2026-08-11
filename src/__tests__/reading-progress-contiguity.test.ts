import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  markDayRead,
  readProgress,
  getCompletedCount,
  firstUnreadDay,
  clearReadingProgress,
} from "@/lib/reading-storage";

/**
 * Reading progress must have no gaps, and that has to be the storage's rule.
 *
 * Three separate consumers read a completed COUNT and treat it as an index:
 * day-ticket picks the day with `days[completed]`, renders "Day {completed+1}
 * of 7", and fills the step bar at `i < completed`. All three are only correct
 * while progress is contiguous.
 *
 * Today it always is, but by accident rather than by rule: the reading plan
 * renders its mark-read button on the current day alone, so there is exactly
 * one reachable write and it can never skip. That is a property of one
 * component's JSX, not of the data, and the next surface to offer "mark as
 * read" -- the in-page reader on /next-steps -- would quietly break every
 * consumer above by marking a day out of turn.
 *
 * So the invariant moves into the storage layer, where it can be relied on.
 */
// Mocked the way every other storage test in this repo does it: the suite runs
// in the node environment, so window and localStorage have to be stubbed.
const storage = new Map<string, string>();
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
});
vi.mock("@/lib/client-storage", () => ({ emitStorageChange: vi.fn() }));

describe("reading progress contiguity", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it("accepts days in order", () => {
    expect(markDayRead(1)).toBe(true);
    expect(markDayRead(2)).toBe(true);
    expect(markDayRead(3)).toBe(true);
    expect(getCompletedCount(readProgress(), 7)).toBe(3);
  });

  it("refuses a write that would leave a gap", () => {
    // The failure this exists for: day 3 marked while 1 and 2 are unread makes
    // the count 1, so every consumer shows day 2 -- a day the reader has not
    // reached and has not read.
    expect(markDayRead(3), "a gap-creating write was accepted").toBe(false);
    expect(readProgress(), "a refused write still touched storage").toEqual({});

    expect(markDayRead(1)).toBe(true);
    expect(markDayRead(3), "day 3 was accepted while day 2 is unread").toBe(false);
    expect(getCompletedCount(readProgress(), 7)).toBe(1);
  });

  it("is idempotent on a day already read", () => {
    markDayRead(1);
    expect(markDayRead(1), "re-marking a read day should be a no-op success").toBe(true);
    expect(getCompletedCount(readProgress(), 7)).toBe(1);
  });

  it("rejects days that are not positive integers", () => {
    for (const bad of [0, -1, 1.5, NaN]) {
      expect(markDayRead(bad), `${bad} was accepted as a day`).toBe(false);
    }
    expect(readProgress()).toEqual({});
  });

  it("keeps the count and the first unread day in step", () => {
    // This is the equality every consumer leans on: the completed count IS the
    // index of the day you are on. It holds only because of the rule above.
    for (let day = 1; day <= 7; day++) {
      const count = getCompletedCount(readProgress(), 7);
      expect(firstUnreadDay(readProgress(), 7)).toBe(count + 1);
      markDayRead(day);
    }
    expect(getCompletedCount(readProgress(), 7)).toBe(7);
    expect(firstUnreadDay(readProgress(), 7), "a finished plan has no unread day").toBe(8);
  });

  it("clears back to an empty, still-contiguous state", () => {
    markDayRead(1);
    markDayRead(2);
    clearReadingProgress();
    expect(readProgress()).toEqual({});
    expect(firstUnreadDay(readProgress(), 7)).toBe(1);
  });
});
