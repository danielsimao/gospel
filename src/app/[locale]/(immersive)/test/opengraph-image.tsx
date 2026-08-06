import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadOgFontsSafe } from "@/lib/og";

export const alt = "Are you a good person? Six questions from God's Law.";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * /test's own share card — the most-shared URL on the site, and until now the
 * only major one without a plate of its own.
 *
 * It is the door: a narrow gap of pale light in a dark stone room, the light
 * held to the right third so the whole left of the frame is empty for the
 * headline. Measured on the source image, that left field sits at p99 = 2 out
 * of 255 — effectively pure black, which is why white type at this size holds
 * without a scrim.
 *
 * The image is the one hopeful shape in the flow's whole visual language, and
 * that placement is deliberate: this card is the invitation, not the verdict.
 * The Law is inside; what a stranger meets in a feed is a way out.
 */
const COPY = {
  en: {
    eyebrow: "THE TEST",
    title: "Are you a good person?",
    subtitle: "God's Law. Six questions. One verdict.",
  },
  pt: {
    eyebrow: "O TESTE",
    title: "És uma boa pessoa?",
    subtitle: "A Lei de Deus. Seis perguntas. Um veredicto.",
  },
} as const;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = COPY[locale === "pt" ? "pt" : "en"];
  const fonts = await loadOgFontsSafe();

  /*
   * Read from disk and inlined as a data URI rather than fetched by URL.
   * Satori resolves <img src> over the network, which at build time means a
   * request to a host that may not be serving yet — the plate would silently
   * render without its background. The file is on disk beside the code that
   * needs it, so it is read from there.
   *
   * A missing file is not a broken card: the layout is black-on-black by
   * design and reads perfectly well with no image at all.
   */
  let doorSrc: string | null = null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", "graphics", "door.jpg"));
    doorSrc = `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch (error) {
    console.error("[test/opengraph-image] door.jpg not found:", error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#060404",
          position: "relative",
        }}
      >
        {doorSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doorSrc}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, objectFit: "cover" }}
          />
        )}

        {/* The type sits in the frame's own empty half — no scrim, because the
            source image is already black there and a scrim would only dull the
            one lit thing in the picture. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "22px",
            paddingLeft: "72px",
            paddingRight: "560px",
            height: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "15px",
              letterSpacing: "6px",
              color: "rgba(212, 168, 67, 0.75)",
            }}
          >
            {copy.eyebrow}
          </div>
          <div
            style={{
              fontFamily: "Geist",
              fontSize: "62px",
              fontWeight: 600,
              color: "white",
              lineHeight: 1.08,
            }}
          >
            {copy.title}
          </div>
          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "17px",
              color: "rgba(255, 255, 255, 0.55)",
              letterSpacing: "1px",
            }}
          >
            {copy.subtitle}
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts ? { fonts } : {}) },
  );
}
