"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";
import type { Locale } from "@/lib/i18n";

interface FooterWrapperProps {
  messages: Parameters<typeof Footer>[0]["messages"];
  learnTopics: Array<{ slug: string; title: string }>;
  locale: Locale;
}

export function FooterWrapper({ messages, learnTopics, locale }: FooterWrapperProps) {
  const pathname = usePathname();
  return (
    <Footer
      messages={messages}
      learnTopics={learnTopics}
      locale={locale}
      currentPath={pathname}
    />
  );
}
