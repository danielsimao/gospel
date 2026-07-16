import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { loadOgFontsSafe, OG_BACKGROUND, OG_GOLD, OG_VIGNETTE } from "@/lib/og";
import { getEmblemDataUri } from "@/lib/emblem-og";

export const alt = "If You Died Today — Learn";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Like the blog OG route, this file lives under a route group so its public
// URL carries a hash suffix — only the auto-injected og:image meta tag knows
// the real URL; nothing else may link here.
export async function generateStaticParams() {
  const messages = await import(`@/messages/en.json`);
  const topics = messages.default.learn?.topics ?? [];
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of SUPPORTED_LOCALES) {
    for (const topic of topics) {
      params.push({ locale, slug: topic.slug });
    }
  }
  return params;
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const learn = messages.default.learn;
  const topic = learn?.topics?.find(
    (t: { slug: string }) => t.slug === slug,
  ) as { title: string; subtitle: string } | undefined;
  if (!topic) notFound();

  // Satori can't lay out inline <svg> children — the emblem arrives as a
  // data-URI <img> instead.
  const emblemSrc = getEmblemDataUri(slug, {
    size: 88,
    strokeWidth: 1.5,
    color: "rgba(212, 168, 67, 0.8)",
  });
  const fonts = await loadOgFontsSafe();
  const titleSize = topic.title.length > 40 ? 52 : 60;

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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            position: "relative",
            padding: "0 80px",
          }}
        >
          {emblemSrc && (
            <img src={emblemSrc} width={88} height={88} alt="" />
          )}

          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "14px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: OG_GOLD,
            }}
          >
            {`GOSPEL · ${learn.label}`}
          </div>

          <div
            style={{
              fontFamily: "Geist",
              fontSize: `${titleSize}px`,
              fontWeight: 600,
              color: "white",
              textAlign: "center",
              maxWidth: "1000px",
              lineHeight: 1.15,
            }}
          >
            {topic.title}
          </div>

          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "17px",
              color: "rgba(255, 255, 255, 0.5)",
              letterSpacing: "1px",
              textAlign: "center",
              maxWidth: "860px",
              lineHeight: 1.5,
            }}
          >
            {topic.subtitle}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "36px",
            fontFamily: "GeistMono",
            fontSize: "14px",
            letterSpacing: "3px",
            color: "rgba(255, 255, 255, 0.35)",
            display: "flex",
          }}
        >
          ifyoudiedtoday.com
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts ? { fonts } : {}),
    },
  );
}
