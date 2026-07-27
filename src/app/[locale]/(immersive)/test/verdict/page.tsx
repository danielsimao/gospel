import { notFound } from "next/navigation";
import { isValidLocale, getMessages, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { VerdictScreen } from "@/components/verdict-screen";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

// Mid-flow state, not a landing page. Indexing it would drop searchers onto a
// guarded route with no session, which immediately bounces them to /test.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function VerdictPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);

  return (
    <VerdictScreen
      messages={messages.verdict}
      testMessages={messages.test}
      locale={locale as Locale}
    />
  );
}
