import { notFound } from "next/navigation";
import { isValidLocale, getMessages, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { GameProvider } from "@/components/game-provider";
import { GameShell } from "@/components/game-shell";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function GamePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await getMessages(locale as Locale);

  return (
    <GameProvider>
      <GameShell messages={messages} locale={locale as Locale} />
    </GameProvider>
  );
}
