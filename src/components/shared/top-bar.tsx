"use client";

import type { Locale } from "@/lib/i18n";

interface TopBarProps {
  locale: Locale;
  homeLabel: string;
}

export function TopBar({ locale, homeLabel }: TopBarProps) {
  const otherLocale = locale === "en" ? "pt" : "en";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#060404]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Home link */}
        <a
          href={`/${locale}`}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-white/40 transition-colors hover:text-white/65"
        >
          <span aria-hidden="true">&larr;</span>
          <span>{homeLabel}</span>
        </a>

        {/* Locale switcher */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {locale === "en" ? (
            <>
              <span className="font-bold text-white/50">EN</span>
              <span className="text-white/15">·</span>
              <a href={`/${otherLocale}`} className="text-white/30 transition-colors hover:text-white/55">PT</a>
            </>
          ) : (
            <>
              <a href={`/${otherLocale}`} className="text-white/30 transition-colors hover:text-white/55">EN</a>
              <span className="text-white/15">·</span>
              <span className="font-bold text-white/50">PT</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
