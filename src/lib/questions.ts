import { QuestionConfig } from "./types";

export const QUESTION_CONFIGS: QuestionConfig[] = [
  { id: 1, commandment: "9th", honestDrain: 12, justifyDrain: 5 },
  { id: 2, commandment: "8th", honestDrain: 12, justifyDrain: 5 },
  { id: 3, commandment: "7th", honestDrain: 13, justifyDrain: 6 },
  { id: 4, commandment: "6th", honestDrain: 13, justifyDrain: 6 },
  { id: 5, commandment: "3rd", honestDrain: 12, justifyDrain: 7 },
  { id: 6, commandment: "10th", honestDrain: 13, justifyDrain: 7 },
  { id: 7, commandment: "1st", honestDrain: 13, justifyDrain: 8 },
  { id: 8, commandment: "5th", honestDrain: 12, justifyDrain: 8 },
];

export const TOTAL_QUESTIONS = QUESTION_CONFIGS.length;
export const INITIAL_SCORE = 100;
