import { ImageResponse } from "next/og";
import { loadOgFonts, type OgFont } from "@/lib/og";

export const alt = "If You Died Today — Are You a Good Person?";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const COPY = {
  en: {
    title: "Are You a Good Person?",
    subtitle: "God's Law. Six questions. One verdict.",
  },
  pt: {
    title: "Tu és uma boa pessoa?",
    subtitle: "A Lei de Deus. Seis perguntas. Um veredicto.",
  },
} as const;

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
    // Fallback: render without custom fonts
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#060404", color: "white", fontSize: "48px" }}>
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#060404",
          position: "relative",
        }}
      >
        {/* Radial gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 0%, #060404 75%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            position: "relative",
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "14px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: "rgba(212, 168, 67, 0.7)",
            }}
          >
            GOSPEL
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily: "Geist",
              fontSize: "64px",
              fontWeight: 600,
              color: "white",
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: 1.1,
            }}
          >
            {copy.title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.5)",
              letterSpacing: "1px",
              textAlign: "center",
            }}
          >
            {copy.subtitle}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
