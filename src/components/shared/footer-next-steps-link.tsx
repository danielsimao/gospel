"use client";

import Link from "next/link";
import { useJourney } from "@/lib/use-journey";
import type { Locale } from "@/lib/i18n";

interface FooterNextStepsLinkProps {
  locale: Locale;
  label: string;
}

/**
 * The next-steps page only has something honest to say to committed/thinking
 * users (it redirects everyone else home). Render the footer link only for
 * them — a link that silently bounces is a dead click.
 */
export function FooterNextStepsLink({ locale, label }: FooterNextStepsLinkProps) {
  const { stage, ready } = useJourney();

  if (!ready || (stage !== "committed" && stage !== "thinking")) return null;

  return (
    <Link
      href={`/${locale}/next-steps`}
      prefetch={false}
      className="text-sm text-white/70 transition-colors hover:text-white/80"
    >
      {label}
    </Link>
  );
}
