import { notFound } from "next/navigation";
import { isValidLocale, getMessages, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { GameShell } from "@/components/game-shell";
import { GameProvider } from "@/components/game-provider";
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
    title: messages.test.metaTitle,
    description: messages.test.metaDescription,
  });
}

export default async function GamePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await getMessages(locale as Locale);
  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/test",
    title: messages.test.metaTitle,
    description: messages.test.metaDescription,
  });

  return (
    <>
      <StructuredData data={webPageSchema} />
      {/* The provider lives in the page rather than a layout. It used to sit in
          `test/layout.tsx`, whose comment reasoned that a layout would keep the
          reducer from being remounted by "any future segment added under
          /test". That segment now exists — `[rating]` — and the reasoning
          inverts: a layout sits above that segment, so it can never see the
          param, and it deliberately does not remount when the param changes.
          Both are exactly what seeding from the route needs. */}
      <GameProvider>
        <GameShell messages={messages} locale={locale as Locale} />
      </GameProvider>
    </>
  );
}
