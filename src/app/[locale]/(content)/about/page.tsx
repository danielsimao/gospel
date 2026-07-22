import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { StructuredData } from "@/components/structured-data";
import { PageShell } from "@/components/shared/page-shell";
import { Button, ButtonArrow } from "@/components/ui/button";
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
  const about = messages.default.about;
  if (!about) return {};

  return buildPageMetadata({
    locale,
    path: "/about",
    title: about.heading,
    description: about.description,
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default.about;

  if (!data) {
    throw new Error(`[about] Missing "about" key in ${locale}.json`);
  }

  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/about",
    title: data.heading,
    description: data.description,
  });

  return (
    <>
      <StructuredData data={webPageSchema} />
      <PageShell width="wide">
        <h1 className="font-mono text-2xl font-medium tracking-tight text-white sm:text-3xl">
          {data.heading}
        </h1>

        <div className="mt-12 space-y-10">
          {data.sections.slice(0, 1).map(
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

          {/* Statement of faith — the full confession, not a paragraph */}
          <section>
            <h2 className="font-mono text-sm font-medium uppercase tracking-widest text-[#D4A843]/70">
              {data.beliefs.title}
            </h2>
            <p className="mt-3 text-sm italic leading-relaxed text-white/55">
              {data.beliefs.intro}
            </p>
            <div className="mt-6 space-y-5">
              {data.beliefs.items.map(
                (item: { title: string; body: string; ref: string }, i: number) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] tabular-nums text-[#D4A843]/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-sm font-semibold text-white/85">{item.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{item.body}</p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
                      {item.ref}
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>

          {data.sections.slice(1).map(
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

        {/* The turn — about us ends with a question about you */}
        <div className="mt-14 border-t border-white/[0.06] pt-10 text-center">
          <p className="mx-auto max-w-sm text-sm text-white/60">{data.cta.heading}</p>
          <Link href={`/${locale}/test`} className="mt-4 inline-block">
            <Button variant="gold" mist>
              {data.cta.button}
              <ButtonArrow />
            </Button>
          </Link>
        </div>

        {/* Translation attribution — required by the publishers now that
            per-verse version tags are gone from the quotes themselves */}
        {data.scriptureNote && (
          <p className="mt-10 text-center text-[11px] leading-relaxed text-white/35">
            {data.scriptureNote}
          </p>
        )}
      </PageShell>
    </>
  );
}
