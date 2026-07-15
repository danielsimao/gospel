import { ImageResponse } from "next/og";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getPost, getPostContent, getPostLocales, getPublishedPosts } from "@/content/blog/posts";
import { loadOgFonts, OG_BACKGROUND, OG_GOLD, OG_VIGNETTE } from "@/lib/og";

// 1080×1920 Instagram Story graphic. Content stays inside IG's safe zones:
// ≥250px from the top (avatar/progress bar), ≥340px from the bottom
// (reply bar — and where the owner drags the link sticker), ≥60px sides.
const WIDTH = 1080;
const HEIGHT = 1920;

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const post of getPublishedPosts()) {
    for (const locale of getPostLocales(post)) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) {
    return new Response(null, { status: 404 });
  }

  const post = getPost(slug);
  const content = post && getPostContent(post, locale as Locale);
  if (!post || !content) {
    return new Response(null, { status: 404 });
  }

  const fonts = await loadOgFonts();
  const titleSize = content.title.length > 60 ? 64 : content.title.length > 40 ? 72 : 84;

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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "40px",
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
              color: OG_GOLD,
            }}
          >
            {locale === "pt" ? "SE MORRESSES HOJE" : "IF YOU DIED TODAY"}
          </div>

          <div
            style={{
              fontFamily: "Geist",
              fontSize: `${titleSize}px`,
              fontWeight: 600,
              color: "white",
              textAlign: "center",
              maxWidth: "920px",
              lineHeight: 1.15,
            }}
          >
            {content.title}
          </div>

          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "26px",
              color: "rgba(255, 255, 255, 0.5)",
              letterSpacing: "1px",
              textAlign: "center",
              maxWidth: "860px",
              lineHeight: 1.6,
            }}
          >
            {content.hook}
          </div>

          <div
            style={{
              width: "64px",
              height: "1px",
              background: "rgba(212, 168, 67, 0.4)",
              display: "flex",
            }}
          />

          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "22px",
              letterSpacing: "4px",
              color: "rgba(255, 255, 255, 0.4)",
              display: "flex",
            }}
          >
            ifyoudiedtoday.com
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
