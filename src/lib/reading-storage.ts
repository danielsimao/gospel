import { emitStorageChange } from "./client-storage";

const STORAGE_KEY = "gospel-reading-progress";

export type ReadingProgress = Record<string, boolean>;

export function readProgress(): ReadingProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const result: ReadingProgress = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === true) result[key] = true;
    }
    return result;
  } catch (error) {
    console.warn("[reading-storage] Failed to read progress:", error);
    return {};
  }
}

/**
 * Marks a day read, refusing any write that would leave a gap.
 *
 * Three consumers treat the completed COUNT as an index into the plan:
 * `day-ticket` picks the day with `days[completed]`, renders "Day
 * {completed + 1} of N", and fills its step bar at `i < completed`. Every one
 * of those is correct only while progress is contiguous.
 *
 * It always has been — but by accident, not by rule. The reading plan renders
 * its mark-read button on the current day alone, so there is exactly one
 * reachable write and it cannot skip. That is a property of one component's
 * JSX, and the next surface to offer "mark as read" would silently break all
 * three consumers by marking a day out of turn.
 *
 * So the rule lives here instead, where every writer inherits it. Marking a
 * day that is already read succeeds and changes nothing.
 */
export function markDayRead(day: number): boolean {
  if (typeof window === "undefined") return false;
  if (!Number.isInteger(day) || day < 1) return false;
  try {
    const current = readProgress();
    for (let previous = 1; previous < day; previous++) {
      if (!current[String(previous)]) return false;
    }
    if (current[String(day)]) return true;
    current[String(day)] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    emitStorageChange();
    return true;
  } catch (error) {
    console.warn("[reading-storage] Failed to write progress:", error);
    return false;
  }
}

/**
 * The day the reader is on: the lowest day not yet read, or `totalDays + 1`
 * once the plan is finished.
 *
 * The reading plan derived this inline while `day-ticket` derived the same
 * thing from the completed count. Two definitions of one idea agree only while
 * progress is contiguous, which is exactly what `markDayRead` now guarantees —
 * so this is the single place that answers the question.
 */
export function firstUnreadDay(progress: ReadingProgress, totalDays: number): number {
  for (let day = 1; day <= totalDays; day++) {
    if (!progress[String(day)]) return day;
  }
  return totalDays + 1;
}

export function getCompletedCount(progress: ReadingProgress, totalDays: number): number {
  let count = 0;
  for (let i = 1; i <= totalDays; i++) {
    if (progress[String(i)]) count++;
  }
  return count;
}

export function clearReadingProgress(): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(STORAGE_KEY);
    emitStorageChange();
    return true;
  } catch (error) {
    console.warn("[reading-storage] Failed to clear progress:", error);
    return false;
  }
}
