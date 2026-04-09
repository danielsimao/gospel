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
  } catch {}
}
