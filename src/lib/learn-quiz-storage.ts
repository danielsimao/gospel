import { emitStorageChange } from "./client-storage";

const PREFIX = "learn-quiz-";

export function readQuizAnswer(topicSlug: string, sectionIndex: number): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${topicSlug}-${sectionIndex}`);
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeQuizAnswer(topicSlug: string, sectionIndex: number, optionIndex: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${topicSlug}-${sectionIndex}`, String(optionIndex));
    emitStorageChange();
  } catch {}
}

export function hasAnyQuizAnswers(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) return true;
    }
  } catch {}
  return false;
}

export function clearAllQuizAnswers(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    emitStorageChange();
    return true;
  } catch {}
  return false;
}
