import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { NextStepsClient } from "../../next-steps/client";
import { StructuredData } from "@/components/structured-data";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ track?: string }>;
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
    title: data.nextSteps.cta,
    description: getNextStepsDescription(locale),
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function NextStepsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const { track } = await searchParams;

  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;

  if (!data.nextSteps) {
    throw new Error(`[next-steps] Missing "nextSteps" key in ${locale}.json`);
  }

  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/next-steps",
    title: data.nextSteps.cta,
    description: getNextStepsDescription(locale),
  });

  return (
    <>
      <StructuredData data={webPageSchema} />
      <NextStepsClient
        track={track === "thinking" ? "thinking" : "prayed"}
        nextStepsMessages={data.nextSteps}
        shareMessages={data.share}
        locale={locale as Locale}
      />
    </>
  );
}
