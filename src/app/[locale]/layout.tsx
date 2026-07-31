import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { notFound } from "next/navigation";
import { isValidLocale, getMessages } from "@/lib/i18n";
import { Providers } from "@/components/providers";
import { ConsentBanner } from "@/components/shared/consent-banner";
import { StructuredData } from "@/components/structured-data";
import { buildSiteSchema } from "@/lib/seo";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#060404",
};

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
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.title,
      description: messages.meta.description,
    },
  };
}

export default async function LocaleLayout({ params, children }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const siteSchema = buildSiteSchema();

  return (
    /* suppressHydrationWarning because the pre-paint script in <head> sets
       data-journey-stage on this element before React hydrates — that is the
       whole point of it, and it is the documented way to avoid a flash of the
       wrong homepage block. Without this, React compares an attribute the
       server never rendered and logs a hydration error on every page load.
       Two costs: the noise, and that a real hydration bug would hide inside
       it. Scoped to <html> itself, so it silences nothing below. */
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-black text-white min-h-dvh`}
      >
        {/* No-JS visitors get the actual argument, not just a verse — this
            may be someone's only contact with the gospel. Static, bilingual.

            Two structural constraints, both SEO rather than ministry:

            The opening line is a <p><strong>, not an <h1>. This block renders
            on all 54 pages, so an <h1> here made the same string the first
            heading of every page on the site — including the topic and post
            pages whose own <h1> is the thing they rank for. Googlebot renders
            JavaScript and so drops <noscript> from the rendered DOM, but the
            first indexing pass, Bing, and the AI crawlers read raw HTML, and
            those are exactly the readers this block exists for.

            Each half declares its own lang. <html lang> is the page's locale,
            so without these the Portuguese half is served to crawlers as
            English on /en/* and the English half as Portuguese on /pt/*.

            The wording is untouched: the fine/multa question is a method call
            (docs/METHOD.md ruled `dívida` for grace on 2026-07-31, and left
            the rest unswept deliberately), and it is the owner's. */}
        <noscript>
          <div style={{ padding: "2rem", maxWidth: "42rem", margin: "0 auto", color: "white", background: "black", lineHeight: 1.7 }}>
            <p>
              <strong>Are You a Good Person? / Tu és uma boa pessoa?</strong>
            </p>
            <div lang="en">
              <p>
                Most people think they are. But measured against God&apos;s Law — have you ever lied,
                stolen anything, hated anyone, used God&apos;s name carelessly? — every one of us stands
                guilty. That is the bad news, and it is worth taking seriously: no one is promised
                tomorrow.
              </p>
              <p>
                The good news: God did not leave you there. Jesus Christ — God in the flesh — lived
                the life you couldn&apos;t, died on the cross to pay the fine you owed, and rose from
                the dead. Those who repent and put their trust in Him pass from death to life. Not
                because they earned it — because He paid it.
              </p>
              <p>For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life. — John 3:16</p>
            </div>
            <hr />
            <div lang="pt">
              <p>
                A maioria das pessoas acha que sim. Mas à luz da Lei de Deus — alguma vez mentiste,
                tiraste algo, odiaste alguém, usaste o nome de Deus em vão? — todos nós somos
                culpados. Essa é a má notícia, e vale a pena levá-la a sério: ninguém tem o amanhã
                prometido.
              </p>
              <p>
                A boa notícia: Deus não te deixou aí. Jesus Cristo — Deus em carne — viveu a vida que
                tu não conseguiste viver, morreu na cruz para pagar a multa que devias, e ressuscitou.
                Quem se arrepende e confia n&apos;Ele passa da morte para a vida. Não por merecer —
                porque Ele pagou.
              </p>
              <p>Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna. — João 3:16</p>
            </div>
            <p>This experience works best with JavaScript enabled. / Esta experiência funciona melhor com JavaScript activado.</p>
          </div>
        </noscript>
        <StructuredData data={siteSchema} />
        <Providers>
          {children}
          <ConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
