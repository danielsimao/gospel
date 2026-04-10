import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { ReadingPlan } from "@/components/reading-plan/reading-plan";
import { StructuredData } from "@/components/structured-data";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";
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

  return (
    <>
      <StructuredData data={webPageSchema} />
      <main className="min-h-dvh bg-[#060404] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
        <div className="relative z-[1]">
          <ReadingPlan messages={data.readingPlan} locale={locale as Locale} />
        </div>
      </main>
    </>
  );
}
