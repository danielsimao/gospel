import type { JourneyStagesMessages, Messages } from "./types";
import { TOTAL_QUESTIONS } from "./questions";

export const SUPPORTED_LOCALES = ["en", "pt"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export const JOURNEY_STAGE_LEAVES: string[][] = [
  ["undecided", "eyebrow"],
  ["undecided", "heading"],
  ["undecided", "cta"],
  ["committed", "heading"],
  ["committed", "subheading"],
  ["committed", "nextStepsCard", "label"],
  ["committed", "nextStepsCard", "description"],
  ["thinking", "eyebrow"],
  ["thinking", "reflection"],
  ["thinking", "commitLabel"],
  ["thinking", "retakeLabel"],
  ["thinking", "johnCard", "label"],
  ["thinking", "johnCard", "description"],
  ["thinking", "johnCard", "url"],
  ["thinking", "learnCard", "label"],
  ["thinking", "learnCard", "description"],
  ["dismissed", "line"],
  ["dismissed", "retakeCta"],
];

export function validateMessages(messages: unknown, locale: string): Messages {
  const m = messages as Messages;
  if (!m.landing?.title || !m.landing?.cta) {
    throw new Error(`[i18n] Missing landing content for locale "${locale}"`);
  }
  if (!Array.isArray(m.questions) || m.questions.length !== TOTAL_QUESTIONS) {
    throw new Error(
      `[i18n] Expected ${TOTAL_QUESTIONS} questions for locale "${locale}", got ${m.questions?.length ?? 0}`,
    );
  }
  if (!m.verdict?.title || !m.grace?.beatsHeading || !m.invitation?.heading || !m.share?.prompt || !m.meta?.title) {
    throw new Error(`[i18n] Missing required content sections for locale "${locale}"`);
  }
  if (!m.test?.caseLabel || !m.test?.verdictLabels || !m.test?.verdict?.prelude) {
    throw new Error(`[i18n] Missing required test content for locale "${locale}"`);
  }
  const stages = (m as Messages & { home?: { journeyStages?: JourneyStagesMessages } }).home
    ?.journeyStages as unknown;
  for (const path of JOURNEY_STAGE_LEAVES) {
    let node: unknown = stages;
    for (const key of path) {
      node = node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined;
    }
    if (typeof node !== "string" || node.length === 0) {
      throw new Error(
        `[i18n] Missing home.journeyStages.${path.join(".")} for locale "${locale}"`,
      );
    }
  }
  return m;
}

export async function getMessages(locale: Locale): Promise<Messages> {
  const messages = await import(`@/messages/${locale}.json`);
  return validateMessages(messages.default, locale);
}

export function getPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  // Parse all entries, not just the first, to find best match
  const entries = acceptLanguage.split(",");
  for (const entry of entries) {
    const lang = entry.split(";")[0]?.split("-")[0]?.trim().toLowerCase();
    if (lang && isValidLocale(lang)) return lang;
  }

  return DEFAULT_LOCALE;
}
