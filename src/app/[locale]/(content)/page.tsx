import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { HomeShell } from "@/components/home-shell";
import { StructuredData } from "@/components/structured-data";
import { buildPageMetadata, buildWebPageSchema } from "@/lib/seo";
import { getPublishedPosts, getPostContent, getPostLocales } from "@/content/blog/posts";
import { BLOG_ENABLED } from "@/lib/flags";
import { fetchRecentVerdicts, fetchTestTakerCount } from "@/lib/test-stats";
import type { HomeMessages } from "@/lib/types";
import type { Metadata } from "next";

/*
 * The score band's number goes stale without this.
 *
 * fetchTestTakerCount carries `next: { revalidate: 3600 }` on its fetch, which
 * is the whole revalidation story only while there IS a fetch. With no
 * POSTHOG_PERSONAL_API_KEY it returns before reaching it, nothing registers a
 * revalidation dependency, and the page is baked at build time — so the
 * day-granular estimate, which is supposed to climb daily, freezes at whatever
 * day the deploy happened. Verified against a production build: both locales
 * prerendered while logging the missing-key fallback.
 *
 * Declaring it here covers both paths with the same hour.
 */
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

interface HomeData {
  hero: {
    label: string;
    suffix: string;
    perSecond: string;
    perMinute: string;
    perHour: string;
    perDay: string;
  };
  home: HomeMessages;
  /** Question 1 is asked and completed on the homepage. */
  questions: Array<{
    text: string;
    honestLabel: string;
    justifyLabel: string;
    followUp: string;
    honestFollowUp: string;
  }>;
  test: {
    verdictLabels: Record<string, string>;
    answeredBadge: string;
    justifiedBadge: string;
  };
  meta: { title: string; description: string };
  topicSlugs: string[];
  /** Slug, title and standfirst for every learn topic; the questions band
      resolves its own and reuses the subtitle as its cards' hover-reveal. */
  topics: Array<{ slug: string; title: string; subtitle?: string }>;
  /**
   * All seven reading days. Passed whole rather than pre-selected: which day a
   * reader is on comes from localStorage, so only the client can pick.
   */
  readingDays: Array<{
    title: string;
    passage: string;
    passageUrl: string;
    keyVerse: string;
    keyVerseRef: string;
  }>;
  readingLabels: { dayProgress: string; continueLabel: string; complete: string };
  allTopicsLabel: string;
  allPostsLabel: string;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

async function getHomeData(locale: Locale): Promise<HomeData> {
  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default;
  const topics = (data.learn?.topics ?? []).map(
    (t: { slug: string; title: string; subtitle?: string }) => ({
      slug: t.slug,
      title: t.title,
      subtitle: t.subtitle,
    }),
  );
  const topicSlugs = topics.map((t: { slug: string }) => t.slug);
  const readingDays = (data.readingPlan?.days ?? []).map(
    (d: { title: string; passage: string; passageUrl: string; keyVerse: string; keyVerseRef: string }) => ({
      title: d.title,
      passage: d.passage,
      passageUrl: d.passageUrl,
      keyVerse: d.keyVerse,
      keyVerseRef: d.keyVerseRef,
    }),
  );
  return {
    hero: data.eternity.hero,
    home: data.home,
    questions: data.questions,
    test: data.test,
    meta: data.meta,
    topicSlugs,
    topics,
    readingDays,
    readingLabels: {
      dayProgress: data.readingPlan.dayProgress,
      continueLabel: data.readingPlan.continueLabel,
      complete: data.home.journey.reading.descComplete,
    },
    allTopicsLabel: data.learn.allTopicsLabel,
    allPostsLabel: data.blog.allPostsLabel,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const data = await getHomeData(locale as Locale);

  return buildPageMetadata({
    locale,
    title: data.meta.title,
    description: data.meta.description,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const data = await getHomeData(locale as Locale);
  const webPageSchema = buildWebPageSchema({
    locale,
    title: data.meta.title,
    description: data.meta.description,
  });

  /* The homepage's latest-post card is one of the blog's three entrances, and
     it goes quiet with the other two. The posts themselves stay live and
     indexed — see lib/flags.ts. */
  /* Two reads of the same project, so they go together rather than in series —
     the ledger must never add its round trip to the homepage's time to first
     byte. Neither can reject: both answer with a documented empty value when
     PostHog cannot be reached. */
  const [testTakerCount, recentVerdicts] = await Promise.all([
    fetchTestTakerCount(),
    fetchRecentVerdicts(),
  ]);

  const posts = BLOG_ENABLED ? getPublishedPosts() : [];
  const latest = posts[0] ?? null;
  const latestContent = latest
    ? (getPostContent(latest, locale as Locale) ?? getPostContent(latest, "en"))
    : null;
  const latestPost =
    latest && latestContent
      ? {
          slug: latest.slug,
          title: latestContent.title,
          hook: latestContent.hook,
          datePublished: latest.datePublished,
          localeAvailable: getPostLocales(latest).includes(locale as Locale),
        }
      : null;

  return (
    <>
      <StructuredData data={webPageSchema} />
      <HomeShell
        hero={data.hero}
        home={data.home}
        locale={locale as Locale}
        topicSlugs={data.topicSlugs}
        topics={data.topics}
        readingDays={data.readingDays}
        readingLabels={data.readingLabels}
        allTopicsLabel={data.allTopicsLabel}
        allPostsLabel={data.allPostsLabel}
        testTakerCount={testTakerCount}
        recentVerdicts={recentVerdicts}
        latestPost={latestPost}
      />
    </>
  );
}
