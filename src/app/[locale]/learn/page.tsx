import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { LearnHub } from "@/components/learn/learn-hub";
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

  return {
    title: learn.label,
    description: learn.hubSubtitle,
  };
}

export default async function LearnPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const learn = messages.default.learn;

  if (!learn) {
    throw new Error(`[learn] Missing "learn" key in ${locale}.json`);
  }

  return (
    <LearnHub
      label={learn.label}
      subtitle={learn.hubSubtitle}
      topics={learn.topics}
      locale={locale as Locale}
    />
  );
}
