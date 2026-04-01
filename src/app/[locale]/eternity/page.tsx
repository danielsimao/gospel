import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { EternityShell } from "@/components/eternity/eternity-shell";
import type { EternityMessages } from "@/components/eternity/eternity-shell";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

async function getEternityMessages(locale: Locale): Promise<EternityMessages> {
  const messages = await import(`@/messages/${locale}.json`);
  return messages.default.eternity as EternityMessages;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = await getEternityMessages(locale as Locale);

  return {
    title: messages.share.prompt,
    description: messages.hero.subtitle,
    openGraph: {
      title: messages.share.prompt,
      description: messages.hero.subtitle,
    },
  };
}

export default async function EternityPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await getEternityMessages(locale as Locale);

  return <EternityShell messages={messages} locale={locale as Locale} />;
}
