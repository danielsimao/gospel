import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { HomeShell } from "@/components/home-shell";
import type { HomeMessages } from "@/lib/types";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

interface ShareMessages {
  prompt: string;
  whatsappMessage: string;
  telegramMessage: string;
  linkCopied: string;
}

interface HomeData {
  hero: {
    label: string;
    suffix: string;
    perSecond: string;
    perMinute: string;
    perHour: string;
    perDay: string;
  };
  counter: { label: string; liveBadge: string };
  home: HomeMessages;
  share: ShareMessages;
  meta: { title: string; description: string };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

async function getHomeData(locale: Locale): Promise<HomeData> {
  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;
  return {
    hero: data.eternity.hero,
    counter: data.eternity.counter,
    home: data.home,
    share: data.share,
    meta: data.eternity.meta,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const data = await getHomeData(locale as Locale);

  return {
    title: data.meta.title,
    description: data.meta.description,
    openGraph: {
      title: data.meta.title,
      description: data.meta.description,
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const data = await getHomeData(locale as Locale);

  return (
    <HomeShell
      hero={data.hero}
      home={data.home}
      share={data.share}
      locale={locale as Locale}
    />
  );
}
