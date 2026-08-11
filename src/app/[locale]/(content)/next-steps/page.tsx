import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { NextStepsClient } from "./client";
import { StructuredData } from "@/components/structured-data";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

function getNextStepsDescription(locale: string): string {
  return locale === "pt"
    ? "Passos seguintes para leitura, oração e reflexão depois do teste."
    : "Next steps for reading, prayer, and reflection after the test.";
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;
  if (!data.nextSteps) return {};

  return buildPageMetadata({
    locale,
    path: "/next-steps",
    title: data.nextSteps.metaTitle,
    description: getNextStepsDescription(locale),
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function NextStepsPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;

  if (!data.nextSteps) {
    throw new Error(`[next-steps] Missing "nextSteps" key in ${locale}.json`);
  }

  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/next-steps",
    title: data.nextSteps.metaTitle,
    description: getNextStepsDescription(locale),
  });

  /* The plan's days, whole — which day the reader is on comes from
     localStorage, so only the client can pick. Same shape the homepage
     resolves for its band; the ticket labels ride along. */
  const readingDays = (data.readingPlan?.days ?? []).map(
    (d: { title: string; passage: string; passageUrl: string; keyVerse: string; keyVerseRef: string }) => ({
      title: d.title,
      passage: d.passage,
      passageUrl: d.passageUrl,
      keyVerse: d.keyVerse,
      keyVerseRef: d.keyVerseRef,
    }),
  );

  return (
    <>
      <StructuredData data={webPageSchema} />
      <NextStepsClient
        nextStepsMessages={data.nextSteps}
        shareMessages={data.share}
        locale={locale as Locale}
        readingDays={readingDays}
        readingLabels={{
          dayProgress: data.readingPlan.dayProgress,
          complete: data.home.journey.reading.descComplete,
          /* The Read door's label and its finished-plan fallback. Both come
             from readingPlan, beside the days they describe, so the card
             cannot name one passage and open another. */
          readDay: data.readingPlan.readDayLabel,
          continueLabel: data.readingPlan.continueReadingLabel,
          continueUrl: data.readingPlan.continueReadingLink,
        }}
      />
    </>
  );
}
