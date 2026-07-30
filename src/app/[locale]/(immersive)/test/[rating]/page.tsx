import { notFound } from "next/navigation";
import { isValidLocale, getMessages, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { GameShell } from "@/components/game-shell";
import { GameProvider } from "@/components/game-provider";
import { SELF_RATINGS, isSelfRating } from "@/lib/self-rating";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; rating: string }>;
};

/**
 * The test, entered with the homepage's answer already in hand.
 *
 * One prerendered page per answer per locale — six in all. The answer used to
 * be handed over in localStorage and dispatched from an effect, which meant the
 * first render never had it: the landing screen asked "Are you a good person?"
 * to a reader who had answered that question a second earlier, then played the
 * question's 200ms exit animation over the top. Three attempts to patch it
 * failed the same way, because the variant depended on state the first render
 * could not have.
 *
 * A route segment can be had by the first render, on the server and in the
 * browser both. There is no script, no CSS, no storage and nothing to keep in
 * sync — the reply is simply in the HTML.
 *
 * The cost is that the answer is visible in the URL. These pages are therefore
 * noindexed and canonical to /test, so they never surface in search, and
 * `/test` remains the entry every other link in the app points at.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    SELF_RATINGS.map((rating) => ({ locale, rating })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const messages = await getMessages(locale as Locale);

  return buildPageMetadata({
    locale,
    // Deliberately /test, not this page's own path: canonical and the language
    // alternates should point at the entry readers are meant to share.
    path: "/test",
    title: messages.meta.title,
    description: messages.meta.description,
    // The three seeded routes are the same page as /test with one field
    // pre-filled. Indexing them would offer a search result that asserts an
    // answer on the reader's behalf.
    robots: { index: false, follow: true },
  });
}

export default async function SeededGamePage({ params }: Props) {
  const { locale, rating } = await params;
  if (!isValidLocale(locale) || !isSelfRating(rating)) notFound();

  const messages = await getMessages(locale as Locale);

  // No WebPage schema here, unlike /test: structured data on a noindexed
  // duplicate is describing a page that is not meant to be found.
  return (
    <GameProvider initialSelfRating={rating}>
      <GameShell messages={messages} locale={locale as Locale} />
    </GameProvider>
  );
}
