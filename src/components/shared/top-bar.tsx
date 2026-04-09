"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface TopBarProps {
  locale: Locale;
}

export function TopBar({ locale }: TopBarProps) {
  return (
    <div className="relative z-10 px-4 pt-4 sm:px-6 sm:pt-5">
      <Link
        href={`/${locale}`}
        className="text-[13px] font-bold tracking-tight text-white/70 transition-colors hover:text-white/65"
      >
        Are You Good?
      </Link>
    </div>
  );
}
