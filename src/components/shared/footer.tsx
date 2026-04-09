"use client";

import type { Locale } from "@/lib/i18n";

interface FooterMessages {
  exploreLabel: string;
  learnLabel: string;
  growLabel: string;
  homeLink: string;
  testLink: string;
  chatLink: string;
  readingPlanLink: string;
  nextStepsLink: string;
  churchLink: string;
  churchUrl: string;
  livingWatersLink: string;
  livingWatersUrl: string;
  needGodLink: string;
  needGodUrl: string;
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
  currentPath: string;
}

export function Footer({ messages, learnTopics, locale, currentPath }: FooterProps) {
  const otherLocale = locale === "en" ? "pt" : "en";
  const otherLocalePath = currentPath.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <footer className="relative z-[1] border-t border-white/[0.08] bg-[#060404]">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-20">
        {/* 3-column grid — stacks on mobile */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-12">
          {/* Explore */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {messages.exploreLabel}
            </h4>
            <nav className="flex flex-col gap-2.5">
              <a href={`/${locale}`} className="text-sm text-white/70 transition-colors hover:text-white/80">
                {messages.homeLink}
              </a>
              <a href={`/${locale}/test`} className="text-sm text-white/70 transition-colors hover:text-white/80">
                {messages.testLink}
              </a>
              <a href={`/${locale}/chat`} className="text-sm text-white/70 transition-colors hover:text-white/80">
                {messages.chatLink}
              </a>
            </nav>
          </div>

          {/* Learn */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {messages.learnLabel}
            </h4>
            <nav className="flex flex-col gap-2.5">
              {learnTopics.map((topic) => (
                <a
                  key={topic.slug}
                  href={`/${locale}/learn/${topic.slug}`}
                  className="text-sm text-white/70 transition-colors hover:text-white/80"
                >
                  {topic.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Grow */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">
              {messages.growLabel}
            </h4>
            <nav className="flex flex-col gap-2.5">
              <a href={`/${locale}/reading-plan`} className="text-sm text-white/70 transition-colors hover:text-white/80">
                {messages.readingPlanLink}
              </a>
              <a href={`/${locale}/next-steps`} className="text-sm text-white/70 transition-colors hover:text-white/80">
                {messages.nextStepsLink}
              </a>
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
        <div className="mt-14 h-px bg-white/[0.08]" />

        {/* Scripture */}
        <p className="mt-8 text-center text-xs italic leading-relaxed text-white/60">
          &ldquo;{messages.scripture}&rdquo;
        </p>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-[#D4A843]/70">
          {messages.scriptureRef}
        </p>

        {/* Bottom row */}
        <div className="mt-8 flex items-center justify-between">
          <span className="font-mono text-[11px] text-white/50">gospel</span>
          <div className="flex items-center gap-2.5 font-mono text-[11px]">
            {locale === "en" ? (
              <>
                <span className="font-bold text-white/70">EN</span>
                <span className="text-white/50">·</span>
                <a href={otherLocalePath} className="text-white/60 transition-colors hover:text-white/60">PT</a>
              </>
            ) : (
              <>
                <a href={otherLocalePath} className="text-white/60 transition-colors hover:text-white/60">EN</a>
                <span className="text-white/50">·</span>
                <span className="font-bold text-white/70">PT</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
