"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface TopBarProps {
  locale: Locale;
  homeLabel: string;
  currentPath: string;
}

export function TopBar({ locale, homeLabel, currentPath }: TopBarProps) {
  const otherLocale = locale === "en" ? "pt" : "en";
  const otherLocalePath = currentPath.replace(
    new RegExp(`^/${locale}(?=/|$)`),
    `/${otherLocale}`,
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#060404]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Site wordmark */}
        <Link
          href={`/${locale}`}
          className="text-[13px] font-bold tracking-tight text-white/50 transition-colors hover:text-white/75"
        >
          Are You Good?
        </Link>

        {/* Locale switcher */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {locale === "en" ? (
            <>
              <span className="font-bold text-white/50">EN</span>
              <span className="text-white/15">·</span>
              <Link href={otherLocalePath} className="text-white/30 transition-colors hover:text-white/55">PT</Link>
            </>
          ) : (
            <>
              <Link href={otherLocalePath} className="text-white/30 transition-colors hover:text-white/55">EN</Link>
              <span className="text-white/15">·</span>
              <span className="font-bold text-white/50">PT</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
