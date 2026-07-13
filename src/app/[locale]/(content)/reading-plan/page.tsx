import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { ReadingPlan } from "@/components/reading-plan/reading-plan";
import { StructuredData } from "@/components/structured-data";
import { PageShell } from "@/components/shared/page-shell";
import { buildPageMetadata, buildWebPageSchema, buildHowToSchema } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const messages = await import(`@/messages/${locale}.json`);
  const readingPlan = messages.default.readingPlan;
  if (!readingPlan) return {};

  return buildPageMetadata({
    locale,
    path: "/reading-plan",
    title: readingPlan.heading,
    description: readingPlan.subtitle,
  });
}

export default async function ReadingPlanPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;

  if (!data.readingPlan) {
    throw new Error(`[reading-plan] Missing "readingPlan" key in ${locale}.json`);
  }

  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/reading-plan",
    title: data.readingPlan.heading,
    description: data.readingPlan.subtitle,
  });

  const howToSchema = buildHowToSchema({
    locale,
    name: data.readingPlan.heading,
    description: data.readingPlan.subtitle,
    days: data.readingPlan.days.map((day: { title: string; reflection: string }) => ({
      title: day.title,
      reflection: day.reflection,
    })),
  });

  return (
    <>
      <StructuredData data={webPageSchema} />
      <StructuredData data={howToSchema} />
      <PageShell>
        <ReadingPlan messages={data.readingPlan} locale={locale as Locale} />
      </PageShell>
    </>
  );
}
