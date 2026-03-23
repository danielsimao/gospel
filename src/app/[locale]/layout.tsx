import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { notFound } from "next/navigation";
import { isValidLocale, getMessages } from "@/lib/i18n";
import { Providers } from "@/components/providers";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = await getMessages(locale);

  return {
    title: messages.meta.title,
    description: messages.meta.description,
    openGraph: {
      title: messages.meta.title,
      description: messages.meta.description,
      images: [`/og-image-${locale}.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.title,
      description: messages.meta.description,
      images: [`/og-image-${locale}.png`],
    },
  };
}

export default async function LocaleLayout({ params, children }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <html lang={locale} className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-black text-white min-h-dvh`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
