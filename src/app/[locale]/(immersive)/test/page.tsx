import { notFound } from "next/navigation";
import { isValidLocale, getMessages, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { GameProvider } from "@/components/game-provider";
import { GameShell } from "@/components/game-shell";
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

  const messages = await getMessages(locale as Locale);

  return buildPageMetadata({
    locale,
    path: "/test",
    title: messages.meta.title,
    description: messages.meta.description,
  });
}

export default async function GamePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await getMessages(locale as Locale);
  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/test",
    title: messages.meta.title,
    description: messages.meta.description,
  });

  return (
    <>
      <StructuredData data={webPageSchema} />
      <GameProvider>
        <GameShell messages={messages} locale={locale as Locale} />
      </GameProvider>
    </>
  );
}
