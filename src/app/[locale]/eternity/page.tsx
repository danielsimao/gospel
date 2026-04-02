import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { EternityShell } from "@/components/eternity/eternity-shell";
import type { EternityMessages } from "@/components/eternity/eternity-shell";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

interface EternityJson extends EternityMessages {
  meta: { title: string; description: string };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

async function getEternityData(locale: Locale): Promise<EternityJson> {
  const messages = await import(`@/messages/${locale}.json`);
  return messages.default.eternity as EternityJson;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const data = await getEternityData(locale as Locale);

  return {
    title: data.meta.title,
    description: data.meta.description,
    openGraph: {
      title: data.meta.title,
      description: data.meta.description,
    },
  };
}

export default async function EternityPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const data = await getEternityData(locale as Locale);

  return <EternityShell messages={data} locale={locale as Locale} />;
}
