import Link from "next/link";
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
  churchUrl: string;
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
}

interface LearnTopic {
  slug: string;
  title: string;
}

interface FooterProps {
  messages: FooterMessages;
  learnTopics: LearnTopic[];
  locale: Locale;
}

export function Footer({ messages, learnTopics, locale }: FooterProps) {
  return (
    <footer className="print-hide relative z-[1] border-t border-white/[0.08] bg-[#060404]">
      <div className="mx-auto max-w-2xl px-6 py-12 sm:px-8 sm:py-14">
        {/* 3-column grid — stacks on mobile */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
          {/* Explore */}
          <div>
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {messages.exploreLabel}
            </h2>
            <nav aria-label={messages.exploreLabel} className="flex flex-col gap-2.5">
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
              <Link
                href={`/${locale}/blog`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.blogLink}
              </Link>
            </nav>
          </div>

          {/* Learn */}
          <div>
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {messages.learnLabel}
            </h2>
            <nav aria-label={messages.learnLabel} className="flex flex-col gap-2.5">
              {/* First few only — 14 stacked links dwarfed the other columns
                  (and made the mobile footer a scroll wall). Hub links them all. */}
              {learnTopics.slice(0, 5).map((topic) => (
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
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {messages.growLabel}
            </h2>
            <nav aria-label={messages.growLabel} className="flex flex-col gap-2.5">
              <Link
                href={`/${locale}/reading-plan`}
                prefetch={false}
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.readingPlanLink}
              </Link>
              <FooterNextStepsLink locale={locale} label={messages.nextStepsLink} />
              <a
                href={messages.churchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 transition-colors hover:text-white/80"
              >
                {messages.churchLink}
              </a>
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
        <div className="mt-10 h-px bg-white/[0.08]" />

        {/* Legal row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link
            href={`/${locale}/privacy`}
            prefetch={false}
            className="font-mono text-[11px] text-white/55 transition-colors hover:text-white/60"
          >
            {messages.privacyLink}
          </Link>
          <span className="text-white/20">&middot;</span>
          <Link
            href={`/${locale}/terms`}
            prefetch={false}
            className="font-mono text-[11px] text-white/55 transition-colors hover:text-white/60"
          >
            {messages.termsLink}
          </Link>
          <span className="text-white/20">&middot;</span>
          <a
            href={messages.needHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-white/55 transition-colors hover:text-white/60"
          >
            {messages.needHelpLink}
          </a>
        </div>

        {/* Scripture */}
        <p className="mt-6 text-center text-xs italic leading-relaxed text-white/60">
          &ldquo;{messages.scripture}&rdquo;
        </p>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
          {messages.scriptureRef}
        </p>

        {/* Bottom row */}
        <div className="mt-6 flex items-center justify-between">
          <span className="font-mono text-[11px] text-white/50">ifyoudiedtoday.com</span>
          <div className="flex items-center gap-2.5 font-mono text-[11px]">
            <FooterLocaleSwitch locale={locale} />
          </div>
        </div>
      </div>
    </footer>
  );
}
