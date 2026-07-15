import { ImageResponse } from "next/og";
import { isValidLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { loadOgFonts, OG_BACKGROUND, OG_VIGNETTE } from "@/lib/og";

// 1080×1920 Instagram Story graphic for sharing the journey itself —
// offered on the committed track. First-person testimony framing; the
// verdict word carries the test's stamped aesthetic. Static per locale
// (journey state lives in localStorage, so nothing user-specific can be
// rendered server-side — the first person voice IS the personalization).
// Content stays inside IG's safe zones: ≥250px top, ≥340px bottom, ≥60px sides.
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
  const fonts = await loadOgFonts();

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
            background: "radial-gradient(ellipse at 50% 45%, rgba(239,68,68,0.14) 0%, transparent 55%)",
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

          {/* Stamped verdict block — double hairlines, like the verdict screen */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderTop: "3px solid rgba(239, 68, 68, 0.35)",
              borderBottom: "3px solid rgba(239, 68, 68, 0.35)",
              padding: "36px 90px",
            }}
          >
            <div
              style={{
                fontFamily: "Geist",
                fontSize: "128px",
                fontWeight: 600,
                letterSpacing: "14px",
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
      fonts,
    },
  );
}
