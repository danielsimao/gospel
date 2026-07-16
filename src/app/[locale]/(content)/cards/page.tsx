import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import { PrintCardsButton } from "@/components/cards/print-cards-button";
import type { Metadata } from "next";

// Street-evangelism cards: a print-ready sheet of business-card tracts,
// each carrying the site's core question and a QR code into the test.
// Living Waters is tract culture — this is the physical→digital bridge,
// offered to committed users as equipment, not kept as owner tooling.
// Scans land with utm_source=tract, so PostHog shows street fruit.

type Props = { params: Promise<{ locale: string }> };

interface CardsMessages {
  title: string;
  subtitle: string;
  instructions: string;
  printButton: string;
  metaDescription: string;
}

const CARD_URL_BASE = "https://www.ifyoudiedtoday.com";

async function getCardsData(locale: Locale): Promise<{ cards: CardsMessages; question: string }> {
  const messages = await import(`@/messages/${locale}.json`);
  return {
    cards: messages.default.cards as CardsMessages,
    question: messages.default.landing.title as string,
  };
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const { cards } = await getCardsData(locale);
  const messages = await import(`@/messages/${locale}.json`);
  const brand = messages.default.topBar.brand;

  return buildPageMetadata({
    locale,
    path: "/cards",
    title: `${cards.title} | ${brand}`,
    description: cards.metaDescription,
    robots: { index: false, follow: true },
  });
}

export default async function CardsPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const { cards, question } = await getCardsData(locale);

  const testUrl = `${CARD_URL_BASE}/${locale}/test?utm_source=tract&utm_medium=print&utm_campaign=street-card`;
  // Build-time QR (SVG string) — the page stays fully static.
  const qrSvg = await QRCode.toString(testUrl, {
    type: "svg",
    margin: 0,
    color: { dark: "#060404", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return (
    <div className="relative z-[1] mx-auto max-w-lg px-4 py-16 sm:px-8 print:max-w-none print:p-0">
      <div className="print:hidden">
        <h1
          className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
          style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
        >
          {cards.title}
        </h1>
        <p className="mt-3 text-sm text-white/60">{cards.subtitle}</p>
        <p className="mt-6 text-[13px] leading-relaxed text-white/50">{cards.instructions}</p>
        <div className="mt-8">
          <PrintCardsButton label={cards.printButton} />
        </div>
      </div>

      {/* The sheet: 8 cards per A4 (2×4), standard 85×55mm business cards.
          On screen: a preview of one column. In print: the full grid. */}
      <div className="mt-12 grid grid-cols-1 justify-items-center gap-6 print:mt-0 print:grid-cols-2 print:gap-[6mm] print:p-[10mm]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
            className={`flex h-[55mm] w-[85mm] items-stretch justify-between overflow-hidden rounded-lg border border-white/15 bg-[#060404] p-[5mm] print:rounded-none print:border-[0.3mm] print:border-dashed print:border-black/40 ${
              i > 0 ? "hidden print:flex" : "flex"
            }`}
          >
            <div className="flex min-w-0 flex-col justify-between pr-[4mm]">
              <div>
                <p className="font-mono text-[7pt] uppercase tracking-[0.18em] text-[#D4A843]">
                  ifyoudiedtoday.com
                </p>
                <p className="mt-[3mm] text-[13pt] font-bold leading-tight text-white">
                  {question}
                </p>
              </div>
              <p className="font-mono text-[6.5pt] uppercase tracking-[0.14em] text-white/50">
                {locale === "pt" ? "A Lei de Deus. Seis perguntas. Um veredicto." : "God's Law. Six questions. One verdict."}
              </p>
            </div>
            <div
              className="h-[26mm] w-[26mm] shrink-0 self-center rounded-sm bg-white p-[1.5mm]"
              // Build-time-generated QR for this locale's test URL — safe.
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
