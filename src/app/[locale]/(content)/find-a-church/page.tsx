import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { StructuredData } from "@/components/structured-data";
import {
  buildPageMetadata,
  buildWebPageSchema,
  buildBreadcrumbSchema,
  getLocaleUrl,
} from "@/lib/seo";
import type { Metadata } from "next";

// On-site guidance for finding a biblically-sound church. We do NOT recommend
// a specific church or directory — the Living Waters way is to frame by the
// gospel a church preaches, never by its denomination. The page lists the
// gospel marks to look for plus one irenic, non-tribal line.

type Props = { params: Promise<{ locale: string }> };

interface FindChurchMessages {
  title: string;
  metaDescription: string;
  intro: string;
  marksHeading: string;
  marks: Array<{ mark: string; detail: string }>;
  filterLine: string;
  nudge: string;
  closing: string;
}

async function getData(locale: Locale): Promise<{ fc: FindChurchMessages; brand: string }> {
  const messages = await import(`@/messages/${locale}.json`);
  return {
    fc: messages.default.findChurch as FindChurchMessages,
    brand: messages.default.topBar.brand as string,
  };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const { fc, brand } = await getData(locale);
  return buildPageMetadata({
    locale,
    path: "/find-a-church",
    title: `${fc.title} | ${brand}`,
    description: fc.metaDescription,
    robots: { index: true, follow: true },
  });
}

export default async function FindChurchPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const { fc, brand } = await getData(locale as Locale);

  // The only content page that shipped no page-level JSON-LD: it inherited the
  // site's WebSite/Organization graph from the locale layout and stopped there,
  // so its own URL was described by nothing.
  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/find-a-church",
    title: `${fc.title} | ${brand}`,
    description: fc.metaDescription,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: brand, url: getLocaleUrl(locale) },
    { name: fc.title, url: getLocaleUrl(locale, "/find-a-church") },
  ]);

  return (
    <main className="relative z-[1] mx-auto max-w-2xl px-6 py-16 sm:px-8">
      <StructuredData data={webPageSchema} />
      <StructuredData data={breadcrumbSchema} />
      <h1
        className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
        style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
      >
        {fc.title}
      </h1>

      <p className="mt-6 text-[15px] leading-[1.85] text-white/70">{fc.intro}</p>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-[2px] text-white/60">
        {fc.marksHeading}
      </h2>
      <ul className="mt-5 space-y-5">
        {fc.marks.map((m) => (
          <li key={m.mark} className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/[0.02] p-5">
            <p className="text-[15px] font-semibold text-[#D4A843]">{m.mark}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{m.detail}</p>
          </li>
        ))}
      </ul>

      {/* Irenic, non-tribal line — the gospel is the filter, not the label. */}
      <blockquote className="mt-10 border-l border-[#D4A843]/30 pl-5 text-[15px] italic leading-[1.85] text-white/70">
        {fc.filterLine}
      </blockquote>

      <p className="mt-8 text-[15px] leading-[1.85] text-white/70">{fc.nudge}</p>
      <p className="mt-6 text-[15px] leading-[1.85] text-white/70">{fc.closing}</p>
    </main>
  );
}
