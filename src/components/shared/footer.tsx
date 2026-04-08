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
    <footer className="relative z-[1] border-t border-white/[0.04] bg-[#060404]">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        {/* 3-column grid — stacks on mobile */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {/* Explore */}
          <div>
            <h4 className="mb-3 font-mono text-[9px] uppercase tracking-[2.5px] text-[#D4A843]/50">
              {messages.exploreLabel}
            </h4>
            <nav className="flex flex-col gap-1.5">
              <a href={`/${locale}`} className="text-[13px] text-white/35 transition-colors hover:text-white/60">
                {messages.homeLink}
              </a>
              <a href={`/${locale}/test`} className="text-[13px] text-white/35 transition-colors hover:text-white/60">
                {messages.testLink}
              </a>
              <a href={`/${locale}/chat`} className="text-[13px] text-white/35 transition-colors hover:text-white/60">
                {messages.chatLink}
              </a>
            </nav>
          </div>

          {/* Learn */}
          <div>
            <h4 className="mb-3 font-mono text-[9px] uppercase tracking-[2.5px] text-[#D4A843]/50">
              {messages.learnLabel}
            </h4>
            <nav className="flex flex-col gap-1.5">
              {learnTopics.map((topic) => (
                <a
                  key={topic.slug}
                  href={`/${locale}/learn/${topic.slug}`}
                  className="text-[13px] text-white/35 transition-colors hover:text-white/60"
                >
                  {topic.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Grow */}
          <div>
            <h4 className="mb-3 font-mono text-[9px] uppercase tracking-[2.5px] text-[#D4A843]/50">
              {messages.growLabel}
            </h4>
            <nav className="flex flex-col gap-1.5">
              <a href={`/${locale}/reading-plan`} className="text-[13px] text-white/35 transition-colors hover:text-white/60">
                {messages.readingPlanLink}
              </a>
              <a href={`/${locale}/next-steps`} className="text-[13px] text-white/35 transition-colors hover:text-white/60">
                {messages.nextStepsLink}
              </a>
              <a
                href={messages.churchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/35 transition-colors hover:text-white/60"
              >
                {messages.churchLink}
              </a>
              <a
                href={messages.livingWatersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/25 transition-colors hover:text-white/45"
              >
                {messages.livingWatersLink}
              </a>
              <a
                href={messages.needGodUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/25 transition-colors hover:text-white/45"
              >
                {messages.needGodLink}
              </a>
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 h-px bg-white/[0.06]" />

        {/* Scripture */}
        <p className="mt-6 text-center text-[11px] italic leading-relaxed text-white/20">
          &ldquo;{messages.scripture}&rdquo;
        </p>
        <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-widest text-[#D4A843]/25">
          {messages.scriptureRef}
        </p>

        {/* Bottom row */}
        <div className="mt-6 flex items-center justify-between">
          <span className="font-mono text-[10px] text-white/15">gospel</span>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            {locale === "en" ? (
              <>
                <span className="font-bold text-white/40">EN</span>
                <span className="text-white/15">·</span>
                <a href={otherLocalePath} className="text-white/25 transition-colors hover:text-white/50">PT</a>
              </>
            ) : (
              <>
                <a href={otherLocalePath} className="text-white/25 transition-colors hover:text-white/50">EN</a>
                <span className="text-white/15">·</span>
                <span className="font-bold text-white/40">PT</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
