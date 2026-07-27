import { notFound } from "next/navigation";
import { GameProvider } from "@/components/game-provider";
import { TestChrome } from "@/components/test/test-chrome";
import { isValidLocale, getMessages, type Locale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

/**
 * Holds the game reducer and the surrounding chrome above the phase segments.
 * Next.js preserves layouts across sibling-segment navigation, so state and
 * frame both survive /test → /test/verdict. With GameProvider in page.tsx it
 * would remount on every navigation and wipe the reducer — this layout is what
 * makes routes-per-phase possible at all.
 */
export default async function TestLayout({ params, children }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await getMessages(locale as Locale);

  return (
    <GameProvider>
      <TestChrome backLabel={messages.test.backLabel} locale={locale as Locale}>
        {children}
      </TestChrome>
    </GameProvider>
  );
}
