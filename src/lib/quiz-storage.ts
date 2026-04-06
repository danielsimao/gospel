const STORAGE_KEY = "gospel-quiz-answers";

/**
 * Mini quiz question index → /test question ID mapping.
 * Mini quiz Q0 = "lied?" → test Q1, Q1 = "stolen?" → test Q2, Q2 = "blasphemy?" → test Q5
 */
const MINI_QUIZ_TO_TEST_ID = [1, 2, 5] as const;

export type StoredAnswers = Record<string, "yes" | "no" | "honest" | "justify">;

export function readQuizAnswers(): StoredAnswers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredAnswers;
  } catch {
    return {};
  }
}

export function writeQuizAnswer(miniQuizIndex: number, answer: "yes" | "no"): void {
  const testId = MINI_QUIZ_TO_TEST_ID[miniQuizIndex];
  if (testId === undefined) return;
  try {
    const current = readQuizAnswers();
    current[String(testId)] = answer === "yes" ? "honest" : "justify";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // localStorage unavailable (SSR, private browsing) — silently skip
  }
}
