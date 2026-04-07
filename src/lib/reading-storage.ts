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

export function markDayRead(day: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = readProgress();
    current[String(day)] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return true;
  } catch (error) {
    console.warn("[reading-storage] Failed to write progress:", error);
    return false;
  }
}

export function getCompletedCount(progress: ReadingProgress, totalDays: number): number {
  let count = 0;
  for (let i = 1; i <= totalDays; i++) {
    if (progress[String(i)]) count++;
  }
  return count;
}
