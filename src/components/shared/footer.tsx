import Link from "next/link";
import { FactCrawl, FactList } from "./fact-crawl";
import { FooterLocaleSwitch } from "./footer-locale-switch";
import { FooterNextStepsLink } from "./footer-next-steps-link";
import type { Locale } from "@/lib/i18n";

interface FooterMessages {
  exploreLabel: string;
  learnLabel: string;
  allTopicsLabel: string;
  growLabel: string;
  homeLink: string;
  testLink: string;
  aboutLink: string;
  blogLink: string;
  readingPlanLink: string;
  nextStepsLink: string;
  churchLink: string;
  cardsLink: string;
  livingWatersLink: string;
  livingWatersUrl: string;
  needGodLink: string;
  needGodUrl: string;
  privacyLink: string;
  termsLink: string;
  needHelpLink: string;
  needHelpUrl: string;
  scripture: string;
  scriptureRef: string;
  scriptureNotice: string;
}

interface LearnTopic {
  slug: string;
  title: string;
}

interface FooterProps {
  messages: FooterMessages;
  learnTopics: LearnTopic[];
  locale: Locale;
  /** The mortality facts. Empty on any locale that has none, which renders
      nothing and leaves the footer its plain hairline. */
  facts?: string[];
  /** `BLOG_ENABLED`, resolved on the server — see lib/flags.ts. */
  blogEnabled: boolean;
}

export function Footer({ messages, learnTopics, locale, facts = [], blogEnabled }: FooterProps) {
  const hasCrawl = facts.length > 0;
  return (
    /* The top rule is the crawl's when there is one: the footer has always
       drawn a hairline here, and the crawl is that hairline with the facts
       moving along it. Two would have stacked a band on a band. */
    <footer
      className={`print-hide relative z-[1] overflow-hidden bg-[#060404] ${hasCrawl ? "" : "border-t border-white/[0.08]"}`}
    >
      {/* The world, from height — behind the one line every page ends on
          regardless of topic: "For God so loved the world..." Bottom-anchored
          so it sits near the verse whether the footer above it is tall (home,
          with the fact crawl and full link grid) or short (a legal page). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[320px] opacity-[0.14]"
        style={{
          maskImage: "linear-gradient(to top, black 35%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 35%, transparent 100%)",
        }}
      >
        <picture>
          <source srcSet="/graphics/world.avif" type="image/avif" />
          <img
            src="/graphics/world.webp"
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-bottom"
          />
        </picture>
      </div>
      <FactCrawl facts={facts} />
      <FactList facts={facts} />
      <div className="relative z-[1] mx-auto max-w-2xl px-6 py-10 sm:px-8 sm:py-12">
        {/* 3-column grid — stacks on mobile */}
        {/* Two columns on a phone, not one.
              Stacked, the three columns were 457px of the footer's 792 —
              measured at 390x844 — and the reader had to scroll a screenful of
              links to reach the legal row. Side by side they are 354px, at the
              cost of two link titles wrapping to a second line, which is what
              footer columns do everywhere. Grow sits alone on the second row;
              three into two does not divide, and a half-width last row reads as
              a column rather than a mistake. */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10">
          {/* Explore */}
          <div>
            <h2
              id="footer-explore"
              className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70"
            >
              {messages.exploreLabel}
            </h2>
            {/* Labelled by its own heading rather than a new aria-label string:
                three unlabelled <nav>s made the landmarks indistinguishable, and
                pointing at the heading invents no copy for either locale. */}
            <nav aria-labelledby="footer-explore" className="flex flex-col gap-2.5">
              <Link
                href={`/${locale}`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.homeLink}
              </Link>
              <Link
                href={`/${locale}/test`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.testLink}
              </Link>
              <Link
                href={`/${locale}/about`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.aboutLink}
              </Link>
              {/* The footer used to be the reason the header could not hide
                  this — one screen below, it offered what the header withheld.
                  Both are gated by the same build-time flag now, so they still
                  agree. See lib/flags.ts. */}
              {blogEnabled && (
                <Link
                  href={`/${locale}/blog`}
                  prefetch={false}
                  className="text-sm text-white/70 transition-colors hover:text-white/80"
                >
                  {messages.blogLink}
                </Link>
              )}
            </nav>
          </div>

          {/* Learn */}
          <div>
            <h2
              id="footer-learn"
              className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70"
            >
              {messages.learnLabel}
            </h2>
            {/* Labelled by its own heading rather than a new aria-label string:
                three unlabelled <nav>s made the landmarks indistinguishable, and
                pointing at the heading invents no copy for either locale. */}
            <nav aria-labelledby="footer-learn" className="flex flex-col gap-2.5">
              {/* Three, not five, and originally fourteen. Measured at 390x844
                  the footer stood 884px — 1.05 viewports, and 44% of a homepage
                  whose own content is 1111px. This column was the tallest thing
                  in it at 190px. The hub links all fourteen; a footer that
                  reprints the sitemap is a wall the reader has to scroll past to
                  reach the legal row. */}
              {learnTopics.slice(0, 3).map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/${locale}/learn/${topic.slug}`}
                  prefetch={false}
                  className="text-sm text-white/70 transition-colors hover:text-white/80"
                >
                  {topic.title}
                </Link>
              ))}
              <Link
                href={`/${locale}/learn`}
                prefetch={false}
                className="text-sm text-[#D4A843]/70 transition-colors hover:text-[#D4A843]/90"
              >
                {messages.allTopicsLabel} &rarr;
              </Link>
            </nav>
          </div>

          {/* Grow */}
          <div>
            <h2
              id="footer-grow"
              className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70"
            >
              {messages.growLabel}
            </h2>
            {/* Labelled by its own heading rather than a new aria-label string:
                three unlabelled <nav>s made the landmarks indistinguishable, and
                pointing at the heading invents no copy for either locale. */}
            <nav aria-labelledby="footer-grow" className="flex flex-col gap-2.5">
              <Link
                href={`/${locale}/reading-plan`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.readingPlanLink}
              </Link>
              <FooterNextStepsLink locale={locale} label={messages.nextStepsLink} />
              <Link
                href={`/${locale}/find-a-church`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.churchLink}
              </Link>
              {/* The committed track was the only internal link to /cards. It
                  is noindex and off the sitemap, so this is reachability, not
                  SEO — without a link the page exists only for people who
                  guess the URL. Here rather than on a new believer's first
                  day. */}
              <Link
                href={`/${locale}/cards`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.cardsLink}
              </Link>
              <a
                href={messages.livingWatersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 transition-colors hover:text-white/65"
              >
                {messages.livingWatersLink}
              </a>
              <a
                href={messages.needGodUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 transition-colors hover:text-white/65"
              >
                {messages.needGodLink}
              </a>
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 h-px bg-white/[0.08]" />

        {/* Legal row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link
            href={`/${locale}/privacy`}
            prefetch={false}
            className="font-mono text-[11px] text-white/60 transition-colors hover:text-white/80"
          >
            {messages.privacyLink}
          </Link>
          <span className="text-white/60">&middot;</span>
          <Link
            href={`/${locale}/terms`}
            prefetch={false}
            className="font-mono text-[11px] text-white/60 transition-colors hover:text-white/80"
          >
            {messages.termsLink}
          </Link>
          <span className="text-white/60">&middot;</span>
          <a
            href={messages.needHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-white/60 transition-colors hover:text-white/80"
          >
            {messages.needHelpLink}
          </a>
        </div>

        {/* Scripture */}
        <p className="mt-5 text-center text-xs italic leading-relaxed text-white/60">
          &ldquo;{messages.scripture}&rdquo;
        </p>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
          {messages.scriptureRef}
        </p>
        {/* The credit both publishers require, and which this site owed from
            the day it started quoting them. English is Thomas Nelson's exact
            wording for the NKJV; Portuguese is Sociedade Bíblica Trinitariana
            do Brasil's wording for the ACF text. Neither is ours to reword. */}
        <p className="mx-auto mt-3 max-w-prose text-center text-[11px] leading-relaxed text-white/35">
          {messages.scriptureNotice}
        </p>

        {/* Bottom row */}
        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-[11px] text-white/60">ifyoudiedtoday.com</span>
          <div className="flex items-center gap-2.5 font-mono text-[11px]">
            <FooterLocaleSwitch locale={locale} />
          </div>
        </div>
      </div>
    </footer>
  );
}
