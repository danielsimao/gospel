import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { isValidLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { loadOgFontsSafe, loadScoreFontSafe, OG_BACKGROUND, OG_VIGNETTE } from "@/lib/og";

// 1080×1920 Instagram Story graphic for sharing the journey itself —
// offered on the committed track. First-person testimony framing; the
// verdict word carries the test's stamped aesthetic. Static per locale
// (journey state lives in localStorage, so nothing user-specific can be
// rendered server-side — the first person voice IS the personalization).
// Content stays inside IG's safe zones: ≥250px top, ≥340px bottom, ≥60px sides.
//
// The fingerprint under the verdict is PROMPTS.md §3 serving the surface it
// was written for — "Where it goes: the verdict's OG/share image … testimony,
// identity, the record." It sat staged for months while this card shipped
// bare. The record is the reader's own, so their mark sits beneath the stamp.
//
// GUILTY wears the score face (Big Shoulders, the signage the verdict screen
// itself declares in), boxed and tilted a hair — a stamp pressed onto the
// record, not a heading typeset over it.
const WIDTH = 1080;
const HEIGHT = 1920;

const COPY = {
  en: {
    eyebrow: "IF YOU DIED TODAY",
    line1: "I took the test.",
    verdict: "GUILTY.",
    line2: "Then I heard the rest.",
    cta: "Would you pass?",
  },
  pt: {
    eyebrow: "SE MORRESSES HOJE",
    line1: "Fiz o teste.",
    verdict: "CULPADO.",
    line2: "Depois ouvi o resto.",
    cta: "Passavas?",
  },
} as const;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    return new Response(null, { status: 404 });
  }

  const copy = COPY[locale];
  const [fonts, scoreFont] = await Promise.all([loadOgFontsSafe(), loadScoreFontSafe()]);

  /*
   * Read from disk, never fetched: satori resolves <img src> over the
   * network, which at prerender means a request to a host that may not be
   * serving yet — the /test plate learned this first (graphics.test.ts pins
   * it there). JPEG because satori does not decode the site's AVIF/WebP
   * pair; the .jpg exists for this card alone.
   */
  let printSrc: string | null = null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", "graphics", "fingerprint.jpg"));
    printSrc = `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch (error) {
    console.error("[testimony/story] fingerprint.jpg not found:", error);
  }

  const allFonts = [...(fonts ?? []), ...(scoreFont ? [scoreFont] : [])];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: OG_BACKGROUND,
          position: "relative",
        }}
      >
        {/* The reader's own mark, under everything — the record this card
            testifies about. Dim enough that type never fights it. */}
        {printSrc && (
          <img
            alt=""
            src={printSrc}
            width={860}
            height={860}
            style={{
              position: "absolute",
              top: "440px",
              left: "110px",
              opacity: 0.16,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: OG_VIGNETTE,
            display: "flex",
          }}
        />
        {/* Red glow behind the verdict */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 45%, rgba(239,68,68,0.16) 0%, transparent 55%)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "44px",
            position: "relative",
            padding: "250px 80px 340px",
            height: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "22px",
              letterSpacing: "10px",
              textTransform: "uppercase",
              color: "rgba(212, 168, 67, 0.7)",
            }}
          >
            {copy.eyebrow}
          </div>

          <div
            style={{
              fontFamily: "Geist",
              fontSize: "72px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.95)",
              textAlign: "center",
            }}
          >
            {copy.line1}
          </div>

          {/* The stamp: the score face, boxed on all four sides and tilted a
              hair — pressed onto the record over the reader's own mark, the
              way a verdict actually lands on a page. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: "6px solid rgba(239, 68, 68, 0.45)",
              borderRadius: "10px",
              padding: "18px 64px 26px",
              transform: "rotate(-2.5deg)",
              marginTop: "12px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontFamily: scoreFont ? "BigShoulders" : "Geist",
                fontSize: "210px",
                fontWeight: 600,
                letterSpacing: "8px",
                color: "#ef4444",
              }}
            >
              {copy.verdict}
            </div>
          </div>

          <div
            style={{
              fontFamily: "Geist",
              fontSize: "64px",
              fontWeight: 600,
              color: "rgba(212, 168, 67, 0.92)",
              textAlign: "center",
            }}
          >
            {copy.line2}
          </div>

          <div
            style={{
              width: "64px",
              height: "1px",
              background: "rgba(212, 168, 67, 0.4)",
              display: "flex",
              marginTop: "24px",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                fontFamily: "GeistMono",
                fontSize: "30px",
                letterSpacing: "2px",
                color: "rgba(255, 255, 255, 0.65)",
              }}
            >
              {copy.cta}
            </div>
            <div
              style={{
                fontFamily: "GeistMono",
                fontSize: "22px",
                letterSpacing: "4px",
                color: "rgba(255, 255, 255, 0.4)",
              }}
            >
              ifyoudiedtoday.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      ...(allFonts.length ? { fonts: allFonts } : {}),
    },
  );
}
