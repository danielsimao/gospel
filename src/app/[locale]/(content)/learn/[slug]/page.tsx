import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { TopicPage } from "@/components/learn/topic-page";
import { StructuredData } from "@/components/structured-data";
import {
  buildPageMetadata,
  buildWebPageSchema,
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  getLocaleUrl,
} from "@/lib/seo";
import { TOPIC_DATES } from "@/lib/topic-dates";
import { RELATED_TOPICS } from "@/lib/related-topics";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

interface TopicData {
  slug: string;
  title: string;
  subtitle: string;
  metaDescription: string;
  sections: Array<{ heading: string; body: string; scripture: string; scriptureRef: string }>;
  faq?: Array<{ question: string; answer: string }>;
}

interface LearnData {
  label: string;
  ctaHeading: string;
  ctaButton: string;
  completedCtaHeading?: string;
  completedCtaButton?: string;
  allTopicsLabel?: string;
  nextLabel: string;
  relatedLabel: string;
  feedback: { question: string; yes: string; no: string; thanks: string; followup: string };
  prevLabel: string;
  topics: TopicData[];
}

async function getLearnData(locale: Locale): Promise<LearnData> {
  const messages = await import(`@/messages/${locale}.json`);
  const data = messages.default.learn;
  if (!data) throw new Error(`[learn] Missing "learn" key in ${locale}.json`);
  return data as LearnData;
}

export async function generateStaticParams() {
  const messages = await import(`@/messages/en.json`);
  const topics = messages.default.learn?.topics ?? [];
  const params: Array<{ locale: string; slug: string }> = [];
  for (const loc of SUPPORTED_LOCALES) {
    for (const topic of topics) {
      params.push({ locale: loc, slug: topic.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};

  const data = await getLearnData(locale as Locale);
  const topic = data.topics.find((t) => t.slug === slug);
  if (!topic) return {};

  const messages = await import(`@/messages/${locale}.json`);
  const brand = messages.default.topBar.brand;

  return buildPageMetadata({
    locale,
    path: `/learn/${slug}`,
    title: `${topic.title} | ${brand}`,
    description: topic.metaDescription,
  });
}

export default async function LearnTopicPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const data = await getLearnData(locale as Locale);
  const topicIndex = data.topics.findIndex((t) => t.slug === slug);
  if (topicIndex === -1) notFound();

  const topic = data.topics[topicIndex];
  const webPageSchema = buildWebPageSchema({
    locale,
    path: `/learn/${slug}`,
    title: topic.title,
    description: topic.metaDescription,
  });
  const prevIndex = topicIndex > 0 ? topicIndex - 1 : data.topics.length - 1;
  const nextIndex = topicIndex < data.topics.length - 1 ? topicIndex + 1 : 0;
  const prevTopic = { slug: data.topics[prevIndex].slug, title: data.topics[prevIndex].title };
  const nextTopic = { slug: data.topics[nextIndex].slug, title: data.topics[nextIndex].title };

  const relatedTopics = (RELATED_TOPICS[slug] ?? [])
    .map((relatedSlug) => data.topics.find((t) => t.slug === relatedSlug))
    .filter((t): t is TopicData => Boolean(t))
    .map((t) => ({ slug: t.slug, title: t.title, subtitle: t.subtitle }));

  const messages = await import(`@/messages/${locale}.json`);
  const brand = messages.default.topBar?.brand ?? "Gospel";
  const dates = TOPIC_DATES[slug] ?? { published: "2026-07-12", modified: "2026-07-12" };
  const articleSchema = buildArticleSchema({
    locale,
    slug,
    title: topic.title,
    description: topic.metaDescription,
    datePublished: dates.published,
    dateModified: dates.modified,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: brand, url: getLocaleUrl(locale) },
    { name: data.label, url: getLocaleUrl(locale, "/learn") },
    { name: topic.title, url: getLocaleUrl(locale, `/learn/${slug}`) },
  ]);
  const faqSchema = topic.faq?.length ? buildFaqSchema({ locale, slug, faq: topic.faq }) : null;

  return (
    <>
      <StructuredData data={webPageSchema} />
      <StructuredData data={articleSchema} />
      <StructuredData data={breadcrumbSchema} />
      {faqSchema && <StructuredData data={faqSchema} />}
      <TopicPage
        topic={topic}
        locale={locale}
        label={data.label}
        ctaHeading={data.ctaHeading}
        ctaButton={data.ctaButton}
        completedCtaHeading={data.completedCtaHeading}
        completedCtaButton={data.completedCtaButton}
        allTopicsLabel={data.allTopicsLabel}
        prevLabel={data.prevLabel}
        nextLabel={data.nextLabel}
        prevTopic={prevTopic}
        nextTopic={nextTopic}
        relatedTopics={relatedTopics}
        relatedLabel={data.relatedLabel}
        feedbackMessages={data.feedback}
        faq={topic.faq ?? []}
      />
    </>
  );
}
