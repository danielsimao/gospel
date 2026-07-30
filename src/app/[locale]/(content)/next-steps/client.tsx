"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TrackCommitted } from "@/components/next-steps/track-committed";
import { TrackThinking } from "@/components/next-steps/track-thinking";
import { PageShell } from "@/components/shared/page-shell";
import { trackNextStepsViewed } from "@/lib/discipleship-analytics";
import { useJourney } from "@/lib/use-journey";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { STAGE_PREPAINT_SCRIPT } from "@/lib/stage-prepaint-script";
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
  const journey = useJourney();
  const { stage, ready } = journey;
  const router = useRouter();

  const track = stage === "committed" ? "committed" : stage === "thinking" ? "thinking" : null;

  const viewTracked = useRef(false);

  /*
   * Keeps the attribute the track CSS reads in step with the journey.
   *
   * The inline script below only runs on a full page load — React does not
   * execute <script> elements it inserts — so a client-side navigation here
   * (from the homepage, the footer, the invitation screen) would otherwise
   * arrive with whatever the last hard load stamped. Before paint, because on
   * that path this is the only thing choosing the track. Guarded on `ready` so
   * the first client render, which reports "visitor", cannot overwrite what the
   * script got right. Cleared on unmount so no other route carries it.
   */
  useIsomorphicLayoutEffect(() => {
    if (!journey.ready) return;
    document.documentElement.dataset.journeyStage = journey.stage;
    return () => {
      delete document.documentElement.dataset.journeyStage;
    };
  }, [journey.ready, journey.stage]);

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

  /*
   * Both tracks are rendered and CSS reveals one, chosen before the first paint.
   *
   * This used to branch on `track`, which comes from localStorage — so the
   * server could only render a placeholder, and the real track dropped in once
   * React hydrated. Measured on a throttled phone: 200ms of a page showing
   * nothing but the top bar and the footer. The placeholder held CLS at 0 (it
   * replaced an earlier version that returned null and shifted 0.956), but a
   * reader still watched an empty page fill in.
   *
   * Deliberately NOT the route-per-variant fix used for /test. That page puts
   * the reader's answer in the URL, which is fine for "am I a good person" and
   * is not fine here: /next-steps/committed in a URL bar or a browser history
   * states that this reader has professed faith, and this site is read in
   * places where that is not a safe thing to leave lying around. The homepage's
   * pattern discloses nothing — the stage lives in an attribute on <html>.
   */
  return (
    <>
      {/* Ahead of the tracks it governs, so the attribute is set before they
          are parsed. Shared with the homepage; see stage-prepaint-script. */}
      <script dangerouslySetInnerHTML={{ __html: STAGE_PREPAINT_SCRIPT }} />
      <PageShell>
        <div data-slot="next-steps-track" data-track="committed">
          <TrackCommitted messages={nextStepsMessages.trackA} shareMessages={shareMessages} locale={locale} />
        </div>
        <div data-slot="next-steps-track" data-track="thinking">
          <TrackThinking messages={nextStepsMessages.trackB} locale={locale} />
        </div>
      </PageShell>
    </>
  );
}
