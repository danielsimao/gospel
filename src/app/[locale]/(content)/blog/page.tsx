import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { PageShell } from "@/components/shared/page-shell";
import { StructuredData } from "@/components/structured-data";
import {
  buildPageMetadata,
  buildWebPageSchema,
  buildBreadcrumbSchema,
  getLocaleUrl,
} from "@/lib/seo";
import { getPublishedPosts, getPostContent } from "@/content/blog/posts";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const messages = await import(`@/messages/${locale}.json`);
  const blog = messages.default.blog;
  if (!blog) return {};

  const brand = messages.default.topBar.brand;

  return buildPageMetadata({
    locale,
    path: "/blog",
    title: `${blog.indexTitle} | ${brand}`,
    description: blog.indexSubtitle,
  });
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await import(`@/messages/${locale}.json`);
  const blog = messages.default.blog;
  if (!blog) {
    throw new Error(`[blog] Missing "blog" key in ${locale}.json`);
  }

  const brand = messages.default.topBar.brand;
  const topBarBrand = messages.default.topBar?.brand ?? "Gospel";
  const posts = getPublishedPosts();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  const webPageSchema = buildWebPageSchema({
    locale,
    path: "/blog",
    title: `${blog.indexTitle} | ${brand}`,
    description: blog.indexSubtitle,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: topBarBrand, url: getLocaleUrl(locale) },
    { name: blog.label, url: getLocaleUrl(locale, "/blog") },
  ]);

  return (
    <>
      <StructuredData data={webPageSchema} />
      <StructuredData data={breadcrumbSchema} />
      <PageShell width="wide">
        {/* No eyebrow: label and indexTitle are both "Blog" — the eyebrow
            duplicated the h1 directly above it. */}
        <h1
          className="text-3xl font-bold tracking-tight text-[#D4A843] sm:text-4xl"
          style={{ textShadow: "0 0 60px rgba(212,168,67,0.2)" }}
        >
          {blog.indexTitle}
        </h1>
        <p className="mt-3 text-sm text-white/60">{blog.indexSubtitle}</p>

        <div className="mt-12">
          {posts.length === 0 && <p className="text-sm text-white/50">{blog.emptyState}</p>}

          {posts.map((post) => {
            const localizedContent = getPostContent(post, locale as Locale);
            const content = localizedContent ?? post.locales.en;
            // Untranslated posts link cross-locale to their English page.
            const href = localizedContent
              ? `/${locale}/blog/${post.slug}`
              : `/en/blog/${post.slug}`;

            return (
              <Link
                key={post.slug}
                href={href}
                className="group mt-8 block border-t border-white/[0.06] pt-8 first:mt-0 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[2.5px] text-white/40">
                    {dateFormatter.format(new Date(`${post.datePublished}T00:00:00Z`))}
                  </span>
                  {!localizedContent && (
                    <span className="rounded border border-white/[0.1] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[1.5px] text-white/40">
                      {blog.englishOnlyTag}
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-bold text-white/90 transition-colors group-hover:text-[#D4A843] sm:text-2xl">
                  {content.title}
                </h2>
                <p className="mt-2 text-[15px] leading-[1.7] text-white/50">{content.hook}</p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[2px] text-[#D4A843]/60 transition-colors group-hover:text-[#D4A843]/90">
                  {blog.readMore} →
                </p>
              </Link>
            );
          })}
        </div>
      </PageShell>
    </>
  );
}
