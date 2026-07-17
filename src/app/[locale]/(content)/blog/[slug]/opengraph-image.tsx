import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getPost, getPostContent, getPostLocales, getPublishedPosts } from "@/content/blog/posts";
import { loadOgFontsSafe, OG_BACKGROUND, OG_GOLD, OG_VIGNETTE } from "@/lib/og";

export const alt = "If You Died Today — Blog";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// This route's public URL carries a hash suffix (metadata files under a route
// group get one — see Next's getMetadataRouteSuffix). Only the auto-injected
// og:image meta tag knows the real URL, so nothing else may link here; the
// BlogPosting schema uses the /story route instead.
export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const post of getPublishedPosts()) {
    for (const locale of getPostLocales(post)) {
      params.push({ locale, slug: post.slug });
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

  const post = getPost(slug);
  const content = post && getPostContent(post, locale as Locale);
  if (!post || !content) notFound();

  const fonts = await loadOgFontsSafe();
  const titleSize = content.title.length > 60 ? 44 : content.title.length > 40 ? 52 : 60;

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
          <div
            style={{
              fontFamily: "GeistMono",
              fontSize: "14px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: OG_GOLD,
            }}
          >
            GOSPEL · BLOG
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
            {content.title}
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
            {content.hook}
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
