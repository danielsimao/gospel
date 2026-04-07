"use client";

import { useEffect } from "react";
import { TrackPrayed } from "@/components/next-steps/track-prayed";
import { TrackThinking } from "@/components/next-steps/track-thinking";
import { trackNextStepsViewed } from "@/lib/discipleship-analytics";
import type { Locale } from "@/lib/i18n";

interface NextStepsClientProps {
  track: "prayed" | "thinking";
  nextStepsMessages: {
    trackA: Parameters<typeof TrackPrayed>[0]["messages"];
    trackB: Parameters<typeof TrackThinking>[0]["messages"];
  };
  shareMessages: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  locale: Locale;
}

export function NextStepsClient({ track, nextStepsMessages, shareMessages, locale }: NextStepsClientProps) {
  useEffect(() => {
    trackNextStepsViewed(track, locale);
  }, [track, locale]);

  return (
    <main className="min-h-dvh bg-[#060404] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />
      <div className="relative z-[1]">
        {track === "prayed" ? (
          <TrackPrayed messages={nextStepsMessages.trackA} shareMessages={shareMessages} locale={locale} />
        ) : (
          <TrackThinking messages={nextStepsMessages.trackB} locale={locale} />
        )}
      </div>
    </main>
  );
}
