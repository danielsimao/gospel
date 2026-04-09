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
  } catch {}
}
