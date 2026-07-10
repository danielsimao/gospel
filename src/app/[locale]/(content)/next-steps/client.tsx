"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrackCommitted } from "@/components/next-steps/track-committed";
import { TrackThinking } from "@/components/next-steps/track-thinking";
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

  useEffect(() => {
    if (!ready) return;
    if (!track) {
      // No recorded response — the page has nothing honest to say. Go home.
      router.replace(`/${locale}`);
      return;
    }
    trackNextStepsViewed(track, locale);
  }, [ready, track, locale, router]);

  if (!ready || !track) return null;

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
      <div className="relative z-[1]">
        {track === "committed" ? (
          <TrackCommitted messages={nextStepsMessages.trackA} shareMessages={shareMessages} locale={locale} />
        ) : (
          <TrackThinking messages={nextStepsMessages.trackB} locale={locale} />
        )}
      </div>
    </main>
  );
}
