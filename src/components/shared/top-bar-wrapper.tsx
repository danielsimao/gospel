"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./top-bar";
import type { Locale } from "@/lib/i18n";

interface TopBarWrapperProps {
  locale: Locale;
  homeLabel: string;
}

export function TopBarWrapper({ locale, homeLabel }: TopBarWrapperProps) {
  const pathname = usePathname();

  return (
    <>
      <TopBar locale={locale} homeLabel={homeLabel} currentPath={pathname} />
      {/* Spacer to push content below the fixed bar */}
      <div className="h-10" />
    </>
  );
}
