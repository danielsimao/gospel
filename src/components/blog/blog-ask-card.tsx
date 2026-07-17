"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { X, MirrorRound, Scale, Compass } from "lucide-react";
import { useJourney } from "@/lib/use-journey";
import { hasAnsweredConsent, subscribeToConsentAnswered } from "@/lib/consent";
import { trackBlogCtaClicked, trackBlogCardDismissed } from "@/lib/blog-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { JourneyStage } from "@/lib/journey-storage";

interface BlogAskCardProps {
  slug: string;
  locale: string;
  messages: {
    visitorQuestion: string;
    visitorCta: string;
    undecidedQuestion: string;
    undecidedCta: string;
    thinkingQuestion: string;
    thinkingCta: string;
    dismissLabel: string;
  };
}

/** Small settle delay so the card doesn't fight the page's own entrance. */
const APPEAR_DELAY_MS = 3000;

const DISMISS_KEY_PREFIX = "blog-ask-dismissed-";

/**
 * Floating ask card for cold blog readers. Fully decoupled from scroll:
 * appears once shortly after load and stays until the reader dismisses it
 * (×) or clicks through — nothing about scrolling shows or hides it.
 * Dismiss is per-post — an accidental tap never kills the channel for good.
 * Shows only for visitor/undecided/thinking stages and only after the consent
 * banner is answered (both are bottom-fixed — never stack). `?preview=<stage>`
 * forces a stage so any journey state can be demoed.
 */
export function BlogAskCard({ slug, locale, messages }: BlogAskCardProps) {
  const { stage: journeyStage, ready } = useJourney();
  const consentAnswered = useSyncExternalStore(
    subscribeToConsentAnswered,
    hasAnsweredConsent,
    () => false,
  );
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [previewStage, setPreviewStage] = useState<JourneyStage | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShown(true), APPEAR_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Per-post dismissal + owner preview override, both client-only state.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        if (localStorage.getItem(DISMISS_KEY_PREFIX + slug) === "1") setDismissed(true);
      } catch {
        // Storage unavailable (private mode) — card stays dismissable per visit.
      }
      const preview = new URLSearchParams(window.location.search).get("preview");
      if (preview === "visitor" || preview === "undecided" || preview === "thinking") {
        setPreviewStage(preview);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [slug]);

  const stage = previewStage ?? journeyStage;

  // Stage → ask map. Committed users have nothing left to convert; dismissed
  // users said no and are not pursued (Living Waters — the door stays open,
  // quietly). Undecided and thinking users are the fence-sitters this card
  // exists for.
  const ask =
    stage === "visitor"
      ? {
          question: messages.visitorQuestion,
          cta: messages.visitorCta,
          href: `/${locale}/test`,
          Emblem: MirrorRound,
        }
      : stage === "undecided"
        ? {
            question: messages.undecidedQuestion,
            cta: messages.undecidedCta,
            href: `/${locale}/test`,
            Emblem: Scale,
          }
        : stage === "thinking"
          ? {
              question: messages.thinkingQuestion,
              cta: messages.thinkingCta,
              href: `/${locale}/next-steps`,
              Emblem: Compass,
            }
          : null;

  function dismiss() {
    setDismissed(true);
    trackBlogCardDismissed(slug, stage);
    try {
      localStorage.setItem(DISMISS_KEY_PREFIX + slug, "1");
    } catch {
      // Private mode — session-only dismissal is fine.
    }
  }

  const visible =
    (ready || previewStage !== null) &&
    ask !== null &&
    consentAnswered &&
    shown &&
    !dismissed;

  return (
    <AnimatePresence>
      {visible && ask && (
        <m.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8, transition: { duration: 0.15, ease: "easeIn" } }}
          transition={{ duration: 0.4, ease: EASE_OUT_STRONG }}
          className="fixed inset-x-3 bottom-3 z-40 rounded-xl border border-white/[0.10] bg-[#0a0806]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[320px]"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label={messages.dismissLabel}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-3 pr-7">
            <ask.Emblem
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-[#D4A843]/80"
              strokeWidth={1.6}
            />
            <p className="text-sm font-semibold leading-snug text-white/85">{ask.question}</p>
          </div>

          <Link
            href={ask.href}
            onClick={() => trackBlogCtaClicked(slug, "card", stage)}
            className="mt-3 block rounded-lg bg-[#D4A843] px-4 py-2 text-center text-[13px] font-semibold text-[#060404] transition-colors hover:bg-[#e0b854]"
          >
            {ask.cta}
          </Link>
        </m.aside>
      )}
    </AnimatePresence>
  );
}
