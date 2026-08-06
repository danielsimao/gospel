import Link from "next/link";
import { BandHeader } from "@/components/next-steps/band-header";
import type { Locale } from "@/lib/i18n";

interface PassedBandProps {
  locale: Locale;
  messages: {
    eyebrow: string;
    /** The sentence when the live count is available. Carries `{n}`. */
    tookWithCount: string;
    /** The same sentence with no number — the count is a garnish, not a
        dependency, and the band must read whole when PostHog is unreachable. */
    took: string;
    passed: string;
    whoCta: string;
    testCta: string;
  };
  /** Distinct readers who reached the verdict, or null when unavailable. */
  count: number | null;
}

/*
 * The score so far: everyone failed, and one passed.
 *
 * The doctrine first, because it is what licenses the joke. The test is the
 * Law, and exactly one person in history kept the Law — which is not a quip
 * but the load-bearing fact of the gospel: he could pay the fine because he
 * owed nothing (grace's third movement says it as "lived the life you
 * couldn't"). So "1 passed" is literally true, and the band's whole job is to
 * make a reader ask WHO — a question the site can answer.
 *
 * Two doors out, deliberately unequal. "Find out who" is the primary — the
 * reader this band hooks is the one who wants the answer — and the test is the
 * quiet second, for the reader who hears "nobody passed" as a challenge.
 * Both end at the same place; the test just takes the long way round.
 *
 * The number is a floor and may be absent. Consent-gating hides every reader
 * who declined the banner, so the real count is always higher — and when
 * PostHog is unreachable the sentence simply drops the number rather than the
 * band dropping out. Nothing here may ever block or shift the homepage.
 */
export function PassedBand({ locale, messages, count }: PassedBandProps) {
  const formatted =
    count === null ? null : new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-US").format(count);

  return (
    <div className="mt-12 w-full max-w-md text-left sm:max-w-2xl">
      <BandHeader label={messages.eyebrow} tone="dim" />

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-[15px] leading-relaxed text-white/60 sm:text-base">
          {formatted === null
            ? messages.took
            : messages.tookWithCount.replace("{n}", formatted)}
        </p>

        {/* The one. Gold, and the largest thing in the band — the entire hook
            is this line, and the question it leaves behind. */}
        <p
          className="mt-2 text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#D4A843] sm:text-[32px]"
          style={{ textShadow: "0 0 60px rgba(212,168,67,0.25)" }}
        >
          {messages.passed}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href={`/${locale}/learn/who-is-jesus`}
            className="font-mono text-[11px] uppercase tracking-[1.6px] text-[#D4A843]/90 transition-colors hover:text-[#D4A843]"
          >
            {messages.whoCta} &rarr;
          </Link>
          <Link
            href={`/${locale}/test`}
            className="text-[13px] text-white/50 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/70"
          >
            {messages.testCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
