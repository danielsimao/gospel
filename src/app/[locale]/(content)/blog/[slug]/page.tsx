import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { BlogPostPage } from "@/components/blog/blog-post-page";
import { StructuredData } from "@/components/structured-data";
import {
  buildPageMetadata,
  buildWebPageSchema,
  buildArticleSchema,
  buildBreadcrumbSchema,
  getLocaleUrl,
  getAbsoluteUrl,
} from "@/lib/seo";
import {
  getPublishedPosts,
  getPost,
  getPostContent,
  getPostLocales,
  getPostDateModified,
} from "@/content/blog/posts";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const post of getPublishedPosts()) {
    for (const locale of getPostLocales(post)) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};

  const post = getPost(slug);
  const content = post && getPostContent(post, locale);
  if (!post || !content) return {};

  const messages = await import(`@/messages/${locale}.json`);
  const brand = messages.default.topBar.brand;

  return buildPageMetadata({
    locale,
    path: `/blog/${slug}`,
    // metaTitle where the headline plus the brand overran the result page —
    // the Don't Die post's Portuguese title was 85 characters, so Google cut
    // it mid-clause and the brand never showed at all.
    title: `${content.metaTitle ?? content.title} | ${brand}`,
    description: content.metaDescription,
    availableLocales: getPostLocales(post),
    // This route has opengraph-image.tsx beside it, and an explicit
    // openGraph.images would replace it rather than defer to it.
    hasOwnOgImage: true,
    article: {
      publishedTime: post.datePublished,
      modifiedTime: getPostDateModified(post),
    },
  });
}

export default async function BlogPostRoute({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const post = getPost(slug);
  const content = post && getPostContent(post, locale as Locale);
  if (!post || !content) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const blog = messages.default.blog;
  if (!blog) {
    throw new Error(`[blog] Missing "blog" key in ${locale}.json`);
  }

  const share = messages.default.share;
  if (!share) {
    throw new Error(`[share] Missing "share" key in ${locale}.json`);
  }

  const topBarBrand = messages.default.topBar?.brand ?? "Gospel";
  const webPageSchema = buildWebPageSchema({
    locale,
    path: `/blog/${slug}`,
    title: content.title,
    description: content.metaDescription,
  });
  const articleSchema = buildArticleSchema({
    locale,
    slug,
    title: content.title,
    description: content.metaDescription,
    datePublished: post.datePublished,
    dateModified: getPostDateModified(post),
    basePath: "/blog",
    // The og-card URL is hash-suffixed (metadata file inside a route group),
    // so the schema points at the story route — a stable, crawlable PNG.
    image: getAbsoluteUrl(`/${locale}/blog/${slug}/story`),
    type: "BlogPosting",
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: topBarBrand, url: getLocaleUrl(locale) },
    { name: blog.label, url: getLocaleUrl(locale, "/blog") },
    { name: content.title, url: getLocaleUrl(locale, `/blog/${slug}`) },
  ]);

  return (
    <>
      <StructuredData data={webPageSchema} />
      <StructuredData data={articleSchema} />
      <StructuredData data={breadcrumbSchema} />
      <BlogPostPage
        slug={slug}
        content={content}
        datePublished={post.datePublished}
        locale={locale as Locale}
        messages={blog}
        shareMessages={share}
      />
    </>
  );
}
