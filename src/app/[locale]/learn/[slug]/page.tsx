import { notFound } from "next/navigation";
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { TopicPage } from "@/components/learn/topic-page";
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
}

interface LearnData {
  label: string;
  ctaHeading: string;
  ctaButton: string;
  nextLabel: string;
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

  return {
    title: topic.title,
    description: topic.metaDescription,
    openGraph: {
      title: topic.title,
      description: topic.metaDescription,
    },
  };
}

export default async function LearnTopicPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const data = await getLearnData(locale as Locale);
  const topicIndex = data.topics.findIndex((t) => t.slug === slug);
  if (topicIndex === -1) notFound();

  const topic = data.topics[topicIndex];
  const prevTopic = topicIndex > 0 ? { slug: data.topics[topicIndex - 1].slug, title: data.topics[topicIndex - 1].title } : null;
  const nextTopic = topicIndex < data.topics.length - 1 ? { slug: data.topics[topicIndex + 1].slug, title: data.topics[topicIndex + 1].title } : null;

  return (
    <TopicPage
      topic={topic}
      locale={locale}
      label={data.label}
      ctaHeading={data.ctaHeading}
      ctaButton={data.ctaButton}
      prevLabel={data.prevLabel}
      nextLabel={data.nextLabel}
      prevTopic={prevTopic}
      nextTopic={nextTopic}
    />
  );
}
