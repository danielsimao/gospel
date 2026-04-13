import { notFound } from "next/navigation";
import { Footer } from "@/components/shared/footer";
import { TopBar } from "@/components/shared/top-bar";
import { isValidLocale, type Locale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export default async function ContentLayout({ params, children }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const allMessages = await import(`@/messages/${locale}.json`);
  const data = allMessages.default;
  const footerMessages = data.footer;
  const learnTopics = (data.learn?.topics ?? []).map((topic: { slug: string; title: string }) => ({
    slug: topic.slug,
    title: topic.title,
  }));

  return (
    <>
      <TopBar
        locale={locale as Locale}
        learnLabel={data.learn?.label ?? "Learn"}
        messages={data.topBar}
      />
      {children}
      {footerMessages && (
        <Footer
          messages={footerMessages}
          learnTopics={learnTopics}
          locale={locale as Locale}
        />
      )}
    </>
  );
}
