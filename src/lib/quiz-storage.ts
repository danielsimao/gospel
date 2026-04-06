import type { AnswerType } from "./types";

const STORAGE_KEY = "gospel-quiz-answers";

/**
 * Mini quiz question index → /test question ID mapping.
 * Mini quiz Q0 = "lied?" → test Q1, Q1 = "stolen?" → test Q2, Q2 = "blasphemy?" → test Q5
 */
const MINI_QUIZ_TO_TEST_ID = [1, 2, 5] as const;

const VALID_ANSWER_TYPES = new Set<string>(["honest", "justify"]);

export type StoredAnswers = Record<string, AnswerType>;

export function readQuizAnswers(): StoredAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const result: StoredAnswers = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (VALID_ANSWER_TYPES.has(value as string)) {
        result[key] = value as AnswerType;
      }
    }
    return result;
  } catch (error) {
    console.warn("[quiz-storage] Failed to read quiz answers:", error);
    return {};
  }
}

export function writeQuizAnswer(miniQuizIndex: number, answer: "yes" | "no"): void {
  const testId = MINI_QUIZ_TO_TEST_ID[miniQuizIndex];
  if (testId === undefined) {
    console.warn(`[quiz-storage] No test ID mapping for mini quiz index ${miniQuizIndex}`);
    return;
  }
  if (typeof window === "undefined") return;
  try {
    const current = readQuizAnswers();
    current[String(testId)] = answer === "yes" ? "honest" : "justify";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (error) {
    console.warn("[quiz-storage] Failed to write quiz answer:", error);
  }
}
