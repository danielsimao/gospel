import type { Messages } from "./types";
import { TOTAL_QUESTIONS } from "./questions";

export const SUPPORTED_LOCALES = ["en", "pt"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

function validateMessages(messages: unknown, locale: string): Messages {
  const m = messages as Messages;
  if (!m.landing?.title || !m.landing?.cta) {
    throw new Error(`[i18n] Missing landing content for locale "${locale}"`);
  }
  if (!Array.isArray(m.questions) || m.questions.length !== TOTAL_QUESTIONS) {
    throw new Error(
      `[i18n] Expected ${TOTAL_QUESTIONS} questions for locale "${locale}", got ${m.questions?.length ?? 0}`,
    );
  }
  if (!m.verdict?.title || !m.grace?.heading || !m.invitation?.prayer || !m.share?.prompt || !m.meta?.title) {
    throw new Error(`[i18n] Missing required content sections for locale "${locale}"`);
  }
  if (!m.test?.caseLabel || !m.test?.verdictLabels || !m.test?.verdict?.prelude) {
    throw new Error(`[i18n] Missing required test content for locale "${locale}"`);
  }
  if (m.chat) {
    if (!m.chat.landing?.title || !m.chat.landing?.cta) {
      throw new Error(`[i18n] Missing chat landing content for locale "${locale}"`);
    }
    const requiredPrompts = ["intro", "commandments", "conviction", "grace"];
    for (const stage of requiredPrompts) {
      if (!m.chat.systemPrompts?.[stage as keyof typeof m.chat.systemPrompts]) {
        throw new Error(`[i18n] Missing chat system prompt "${stage}" for locale "${locale}"`);
      }
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
