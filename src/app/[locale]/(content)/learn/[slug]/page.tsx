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
import { LEARN_BANDS } from "@/lib/learn-bands";
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
  feedback: { question: string; yes: string; no: string; thanks: string; followup: string };
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
  // Prev/next follow the hub's band display order (01–14), not the raw
  // messages-array order — the tail must agree with the hub about what
  // comes next. No wraparound: the arc has a start and an end, and the
  // last stop's "next" is the parting CTA, not topic 01 again. Unbanded
  // topics (drift guard) append at the end, mirroring the hub.
  const displayOrder = LEARN_BANDS.flatMap((b) => b.slugs);
  const orderedTopics = [
    ...displayOrder
      .map((s) => data.topics.find((t) => t.slug === s))
      .filter((t): t is TopicData => Boolean(t)),
    ...data.topics.filter((t) => !displayOrder.includes(t.slug)),
  ];
  const orderIndex = orderedTopics.findIndex((t) => t.slug === slug);
  const next = orderIndex < orderedTopics.length - 1 ? orderedTopics[orderIndex + 1] : null;
  const nextTopic = next
    ? { slug: next.slug, title: next.title, subtitle: next.subtitle, number: orderIndex + 2 }
    : null;

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
        nextLabel={data.nextLabel}
        nextTopic={nextTopic}
        feedbackMessages={data.feedback}
        faq={topic.faq ?? []}
      />
    </>
  );
}
