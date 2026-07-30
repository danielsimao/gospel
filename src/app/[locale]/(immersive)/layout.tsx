import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

/**
 * The immersive group is `/test` and nothing else: no top bar, no footer,
 * nothing to navigate away to while the Law is being read.
 *
 * It used to mount the sticky deaths-since-you-arrived strip as well. That was
 * removed rather than restyled. The strip and the verdict screen were the same
 * beat — same copy shape ("since you opened this page" / "since you started"),
 * same live counter — and the verdict's is the one that lands, immediately after
 * GUILTY and followed by "the count does not skip anyone". globals.css already
 * retired the strip from the verdict onward for that reason, so the collision
 * was known; it was resolved by hiding one of them at the last moment instead of
 * not having it.
 *
 * It also argued against the site. At 1.8 deaths a second the strip showed a
 * single digit while the reader was on commandment one, against the homepage's
 * ninety thousand for the day — a small number makes mortality look rare. And a
 * live count beside "have you ever told a lie" is time pressure on a question
 * about conscience, which is the one place this app reached for urgency instead
 * of the Law.
 */
export default async function ImmersiveLayout({ params, children }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return <>{children}</>;
}
