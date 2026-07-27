import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import { GoodEnoughScene } from "@/components/good-enough/good-enough-scene";
import type { GoodEnoughMessages } from "@/lib/types";
import type { Metadata } from "next";

// Romans 3:23 as an interaction rather than a diagram. Indexed and shareable —
// the one page here built to be found and forwarded. The CTA hands the reader to
// /test, which is where the Law stops being general and gets personal.
//
// In `(content)` rather than `(immersive)` deliberately: a cold arrival from a
// shared link needs TopBar and Footer to reach anything else.

type Props = { params: Promise<{ locale: string }> };

async function getData(locale: Locale): Promise<{ ge: GoodEnoughMessages; brand: string }> {
  const messages = await import(`@/messages/${locale}.json`);
  return {
    ge: messages.default.goodEnough as GoodEnoughMessages,
    brand: messages.default.topBar.brand as string,
  };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const { ge, brand } = await getData(locale as Locale);
  return buildPageMetadata({
    locale,
    path: "/good-enough",
    title: `${ge.title} | ${brand}`,
    description: ge.metaDescription,
    robots: { index: true, follow: true },
  });
}

export default async function GoodEnoughPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const { ge } = await getData(locale as Locale);

  return (
    <main className="relative z-[1] mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center px-6 py-14 sm:px-8 sm:py-16">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
        <span className="font-mono text-[9px] uppercase tracking-[3px] text-red-400/75">
          {ge.eyebrow}
        </span>
        <span aria-hidden="true" className="h-px w-6 bg-red-500/40" />
      </div>
      <h1 className="mt-5 text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
        {ge.title}
      </h1>
      <div className="mt-9 w-full">
        <GoodEnoughScene copy={ge} locale={locale as Locale} />
      </div>
    </main>
  );
}
