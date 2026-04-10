import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { LearnHub } from "@/components/learn/learn-hub";
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
  const learn = messages.default.learn;
  if (!learn) return {};

  const brand = messages.default.meta.title.split(" | ")[0];

  return buildPageMetadata({
    locale,
    path: "/learn",
    title: `${learn.label} | ${brand}`,
    description: learn.hubSubtitle,
  });
}

export default async function LearnPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const learn = messages.default.learn;

  if (!learn) {
    throw new Error(`[learn] Missing "learn" key in ${locale}.json`);
  }

  const brand = messages.default.meta.title.split(" | ")[0];
  const title = `${learn.label} | ${brand}`;
  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/learn",
    title,
    description: learn.hubSubtitle,
  });

  return (
    <>
      <StructuredData data={webPageSchema} />
      <LearnHub
        label={learn.label}
        subtitle={learn.hubSubtitle}
        progressLabel={learn.progressLabel}
        allCompleteHeading={learn.allCompleteHeading}
        allCompleteTestCta={learn.allCompleteTestCta}
        allCompleteReadingCta={learn.allCompleteReadingCta}
        allCompleteShareCta={learn.allCompleteShareCta}
        resetLabel={learn.resetLabel}
        resetConfirmTitle={learn.resetConfirmTitle}
        resetConfirmBody={learn.resetConfirmBody}
        resetConfirmButton={learn.resetConfirmButton}
        resetCancelButton={learn.resetCancelButton}
        shareMessages={messages.default.share}
        topics={learn.topics}
        locale={locale as Locale}
      />
    </>
  );
}
