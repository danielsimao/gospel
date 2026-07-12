"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TrackCommitted } from "@/components/next-steps/track-committed";
import { TrackThinking } from "@/components/next-steps/track-thinking";
import { PageShell } from "@/components/shared/page-shell";
import { trackNextStepsViewed } from "@/lib/discipleship-analytics";
import { useJourney } from "@/lib/use-journey";
import type { Locale } from "@/lib/i18n";

interface NextStepsClientProps {
  nextStepsMessages: {
    trackA: Parameters<typeof TrackCommitted>[0]["messages"];
    trackB: Parameters<typeof TrackThinking>[0]["messages"];
  };
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

export function NextStepsClient({ nextStepsMessages, shareMessages, locale }: NextStepsClientProps) {
  const { stage, ready } = useJourney();
  const router = useRouter();

  const track = stage === "committed" ? "committed" : stage === "thinking" ? "thinking" : null;

  const viewTracked = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!track) {
      // No recorded response — the page has nothing honest to say. Go home.
      router.replace(`/${locale}`);
      return;
    }
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackNextStepsViewed(track, locale);
  }, [ready, track, locale, router]);

  if (!ready || !track) return null;

  return (
    <PageShell>
      {track === "committed" ? (
        <TrackCommitted messages={nextStepsMessages.trackA} shareMessages={shareMessages} locale={locale} />
      ) : (
        <TrackThinking messages={nextStepsMessages.trackB} locale={locale} />
      )}
    </PageShell>
  );
}
