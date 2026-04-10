"use client";

import Link from "next/link";
import { trackTopBarLearnClicked } from "@/lib/eternity-analytics";
import type { Locale } from "@/lib/i18n";

interface TopBarProps {
  locale: Locale;
  learnLabel: string;
}

export function TopBar({ locale, learnLabel }: TopBarProps) {
  return (
    <div className="relative z-10 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
      <Link
        href={`/${locale}`}
        className="text-[13px] font-bold tracking-tight text-white/70 transition-colors hover:text-white/65"
      >
        Are You Good?
      </Link>
      <Link
        href={`/${locale}/learn`}
        onClick={() => trackTopBarLearnClicked()}
        className="text-[13px] font-medium tracking-tight text-white/50 transition-colors hover:text-white/70"
      >
        {learnLabel}
      </Link>
    </div>
  );
}
