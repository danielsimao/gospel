"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "./top-bar";
import type { Locale } from "@/lib/i18n";

interface TopBarWrapperProps {
  locale: Locale;
}

/** Pages that have their own navigation (death counter + back link). */
const HIDDEN_PATTERNS = [
  /^\/[a-z]{2}$/, // home: /en, /pt
  /^\/[a-z]{2}\/test$/, // test: /en/test, /pt/test
];

export function TopBarWrapper({ locale }: TopBarWrapperProps) {
  const pathname = usePathname();
  const hidden = HIDDEN_PATTERNS.some((p) => p.test(pathname));

  if (hidden) return null;
  return <TopBar locale={locale} />;
}
