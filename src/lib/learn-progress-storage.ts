import { emitStorageChange } from "./client-storage";

const PREFIX = "learn-topic-";

export function isTopicCompleted(slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${PREFIX}${slug}`) === "1";
  } catch {
    return false;
  }
}

export function markTopicCompleted(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${slug}`, "1");
    emitStorageChange();
  } catch {}
}

export function clearAllTopicProgress(): boolean {
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
