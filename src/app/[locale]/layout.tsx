import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { notFound } from "next/navigation";
import { isValidLocale, getMessages, type Locale } from "@/lib/i18n";
import { Providers } from "@/components/providers";
import { FooterWrapper } from "@/components/shared/footer-wrapper";
import { TopBarWrapper } from "@/components/shared/top-bar-wrapper";
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

  const allMessages = await import(`@/messages/${locale}.json`);
  const data = allMessages.default;
  const footerMessages = data.footer;
  const learnTopics = (data.learn?.topics ?? []).map((t: { slug: string; title: string }) => ({
    slug: t.slug,
    title: t.title,
  }));

  return (
    <html lang={locale} className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-black text-white min-h-dvh`}
      >
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", color: "white", background: "black" }}>
            <h1>Are You a Good Person? / Tu es uma boa pessoa?</h1>
            <p>This experience requires JavaScript. / Esta experiencia requer JavaScript.</p>
            <p>For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life. — John 3:16</p>
            <p>Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna. — Joao 3:16</p>
          </div>
        </noscript>
        <Providers>
          <TopBarWrapper locale={locale as Locale} homeLabel={footerMessages?.homeLink ?? "Home"} />
          {children}
          {footerMessages && (
            <FooterWrapper
              messages={footerMessages}
              learnTopics={learnTopics}
              locale={locale as Locale}
            />
          )}
        </Providers>
      </body>
    </html>
  );
}
