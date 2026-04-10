"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function FooterLocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const otherLocale = locale === "en" ? "pt" : "en";
  const otherLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  if (locale === "en") {
    return (
      <>
        <span className="font-bold text-white/70">EN</span>
        <span className="text-white/50">·</span>
        <Link href={otherLocalePath} prefetch={false} className="text-white/60 transition-colors hover:text-white/60">
          PT
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href={otherLocalePath} prefetch={false} className="text-white/60 transition-colors hover:text-white/60">
        EN
      </Link>
      <span className="text-white/50">·</span>
      <span className="font-bold text-white/70">PT</span>
    </>
  );
}
