import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
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

  const messages = await import(`@/messages/${locale}.json`);
  const terms = messages.default.terms;
  if (!terms) return {};

  return buildPageMetadata({
    locale,
    path: "/terms",
    title: terms.heading,
    description: terms.description,
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default.terms;

  if (!data) {
    throw new Error(`[terms] Missing "terms" key in ${locale}.json`);
  }

  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/terms",
    title: data.heading,
    description: data.description,
  });

  return (
    <>
      <StructuredData data={webPageSchema} />
      <main className="min-h-dvh bg-[#060404] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
        <div className="relative z-[1]">
          <div className="mx-auto max-w-2xl px-6 py-24 sm:px-8 sm:py-32">
            <h1 className="font-mono text-2xl font-medium tracking-tight text-white sm:text-3xl">
              {data.heading}
            </h1>
            <p className="mt-2 font-mono text-xs text-white/40">
              {data.lastUpdated}
            </p>

            <div className="mt-12 space-y-10">
              {data.sections.map(
                (section: { title: string; body: string }, i: number) => (
                  <section key={i}>
                    <h2 className="font-mono text-sm font-medium uppercase tracking-widest text-[#D4A843]/70">
                      {section.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">
                      {section.body}
                    </p>
                  </section>
                ),
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
