import { QuestionConfig } from "./types";

// Six questions — the canonical Living Waters four (lie, steal, lust,
// blasphemy) plus murder-as-hate and idolatry. Covet (10th) and honor-
// parents (5th) were cut 2026-07-14: the two softest admissions diluted
// the strongest, and every extra step before the verdict costs readers.
// Honest drains sum to exactly 100 (all-honest ends at 0), preserved
// through the trim.
export const QUESTION_CONFIGS: QuestionConfig[] = [
  { id: 1, commandment: "9th", honestDrain: 17, justifyDrain: 7 },
  { id: 2, commandment: "8th", honestDrain: 17, justifyDrain: 7 },
  { id: 3, commandment: "7th", honestDrain: 17, justifyDrain: 8 },
  { id: 4, commandment: "6th", honestDrain: 17, justifyDrain: 8 },
  { id: 5, commandment: "3rd", honestDrain: 16, justifyDrain: 9 },
  { id: 7, commandment: "1st", honestDrain: 16, justifyDrain: 10 },
];

export const TOTAL_QUESTIONS = QUESTION_CONFIGS.length;
export const INITIAL_SCORE = 100;
