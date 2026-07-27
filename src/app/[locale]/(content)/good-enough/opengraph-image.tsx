import { ImageResponse } from "next/og";
import { loadOgFonts, OG_BACKGROUND, OG_GOLD, OG_VIGNETTE, type OgFont } from "@/lib/og";
import { CEILING_MIN_PCT, CEILING_MAX_PCT, GOAL_PCT } from "@/lib/good-enough";

export const alt = "Good enough? — fill the bar and you're in";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

/*
 * The share card draws the mechanic rather than describing it: a bar stopped
 * well below a line it never reaches. Somebody scrolling past should be able to
 * see the argument without reading a word of it — which is the same test the
 * page itself has to pass.
 *
 * The proportions are the real ones (34 against 92), so the card cannot promise
 * a closer call than the page delivers.
 */
const COPY = {
  en: { title: "Good enough?", subtitle: "Fill the bar and you're in.", goal: "REQUIRED" },
  pt: { title: "Suficientemente bom?", subtitle: "Enche a barra e entras.", goal: "NECESSÁRIO" },
} as const;

const TRACK_H = 300;
/*
 * Imported, never hand-copied. These were transcribed as literals and went
 * stale the moment the ceiling became a rolled band — the card was drawing a
 * stopping point the page could no longer produce. A share card that overstates
 * how close the bar gets is the one dishonesty this page cannot afford, so it
 * derives from the same constants the bar does and shows the middle of the
 * band, which is what a typical play looks like.
 */
const CEILING_PCT = (CEILING_MIN_PCT + CEILING_MAX_PCT) / 2;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === "pt" ? "pt" : "en";
  const copy = COPY[lang];

  let fonts: OgFont[];
  try {
    fonts = await loadOgFonts();
  } catch (error) {
    console.error("[opengraph-image] Font files not found:", error);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: OG_BACKGROUND,
            color: "white",
            fontSize: "48px",
          }}
        >
          {copy.title}
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "72px",
          background: OG_BACKGROUND,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: OG_VIGNETTE, display: "flex" }} />

        {/* The bar, at true proportions */}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "96px",
            height: `${TRACK_H}px`,
            border: "2px solid rgba(255,255,255,0.14)",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${(CEILING_PCT / 100) * TRACK_H}px`,
              background: "rgba(239,68,68,0.75)",
              borderRadius: "0 0 8px 8px",
              display: "flex",
            }}
          />
          {/* The hard stop */}
          <div
            style={{
              position: "absolute",
              left: "-8px",
              right: "-8px",
              bottom: `${(CEILING_PCT / 100) * TRACK_H}px`,
              height: "5px",
              background: "rgba(255,255,255,0.34)",
              borderRadius: "3px",
              display: "flex",
            }}
          />
          {/* The line */}
          <div
            style={{
              position: "absolute",
              left: "-22px",
              right: "-22px",
              bottom: `${(GOAL_PCT / 100) * TRACK_H}px`,
              height: "3px",
              background: OG_GOLD,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "-22px",
              bottom: `${(GOAL_PCT / 100) * TRACK_H + 14}px`,
              fontFamily: "GeistMono",
              fontSize: "16px",
              letterSpacing: "4px",
              color: OG_GOLD,
              display: "flex",
            }}
          >
            {copy.goal}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            position: "relative",
            maxWidth: "620px",
          }}
        >
          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "14px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: OG_GOLD,
            }}
          >
            GOSPEL
          </div>
          <div
            style={{
              fontFamily: "Geist",
              fontSize: "68px",
              fontWeight: 600,
              color: "white",
              lineHeight: 1.05,
            }}
          >
            {copy.title}
          </div>
          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "20px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "1px",
            }}
          >
            {copy.subtitle}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
