import { notFound } from "next/navigation";
import { isValidLocale, getMessages, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { ChatShell } from "@/components/chat/chat-shell";
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
  const messages = await getMessages(locale);
  if (!messages.chat) return {};

  return buildPageMetadata({
    locale,
    path: "/chat",
    title: messages.chat.meta.title,
    description: messages.chat.meta.description,
  });
}

export default async function ChatPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = await getMessages(locale as Locale);

  if (!messages.chat) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-white/40">Chat not available for this locale.</p>
      </div>
    );
  }

  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/chat",
    title: messages.chat.meta.title,
    description: messages.chat.meta.description,
  });

  return (
    <>
      <StructuredData data={webPageSchema} />
      <ChatShell messages={messages} chatMessages={messages.chat} locale={locale as Locale} />
    </>
  );
}
