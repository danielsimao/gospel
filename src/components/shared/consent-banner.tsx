"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  hasAnsweredConsent,
  setConsent,
  subscribeToConsentAnswered,
} from "@/lib/consent";
import { initPostHog } from "@/lib/posthog";
import { EASE_OUT_STRONG } from "@/lib/motion";

const COPY = {
  en: {
    message: "We use anonymous analytics to improve this experience.",
    accept: "Accept",
    decline: "Decline",
  },
  pt: {
    message: "Usamos análises anónimas para melhorar esta experiência.",
    accept: "Aceitar",
    decline: "Recusar",
  },
} as const;

export function ConsentBanner() {
  // Hidden on the server render (stable hydration), shown post-hydration while
  // consent is pending. hasAnsweredConsent counts an explicit accept/decline
  // this session, so the banner still dismisses when storage writes fail
  // (private mode).
  const visible = useSyncExternalStore(
    subscribeToConsentAnswered,
    () => !hasAnsweredConsent(),
    () => false,
  );

  const lang = typeof document !== "undefined" && document.documentElement.lang.startsWith("pt") ? "pt" : "en";
  const copy = COPY[lang];

  /*
   * The banner is `fixed`, so it occupies no space in the layout — and the test
   * screen anchors its two answer buttons to the bottom of the viewport. Both
   * were told the bottom edge was theirs.
   *
   * Measured on the branch, 390x844, first visit: the banner spanned 786-844
   * and the buttons 768-812, so it covered 26 of their 44 pixels and half of
   * both labels. Not a phone-portrait case either — at 844x390 the overlap was
   * 17px, and it recurs at any size where something is anchored low.
   *
   * So the banner publishes its own height and the screens that anchor to the
   * bottom reserve it. Published rather than hard-coded because it is not one
   * number: the message wraps to a second line on a narrow phone, and the
   * Portuguese copy is longer than the English.
   */
  // A ref callback rather than an effect: the thing to react to is the banner
  // element existing, which is exactly when React calls this. Keyed off
  // `visible` instead, the effect would list a dependency it never reads.
  const measureBanner = useCallback((el: HTMLElement | null) => {
    if (!el) return;

    const publish = () => {
      document.documentElement.style.setProperty(
        "--consent-h",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The reserve outlives the banner if this component goes away while still
  // showing — worth two lines, since what leaks is 58px of dead space at the
  // bottom of every screen that reserves it.
  useEffect(() => {
    return () => {
      // Braces, not a concise body: removeProperty returns the old value, and
      // an effect cleanup that returns a string does not typecheck.
      document.documentElement.style.removeProperty("--consent-h");
    };
  }, []);

  function handleAccept() {
    setConsent("granted");
    void initPostHog();
    window.dispatchEvent(new Event("consentchange"));
  }

  function handleDecline() {
    setConsent("denied");
    window.dispatchEvent(new Event("consentchange"));
  }

  return (
    /* Released on exit-complete, not on the state change: clearing it the
       moment Accept is tapped would drop the reserve while the banner is still
       sliding down, so the buttons would jump up into a banner still covering
       them. */
    <AnimatePresence
      onExitComplete={() => document.documentElement.style.removeProperty("--consent-h")}
    >
      {visible && (
        <m.section
          ref={measureBanner}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%", opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
          /* A labelled <section> is a region landmark: fixed chrome sits
             outside <main> and <footer>, so without one its text is content
             belonging to no landmark. Labelled by the message it already shows
             rather than a new string. */
          aria-label={copy.message}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#060404]/95 backdrop-blur-sm"
        >
      {/* Bottom padding clears the home indicator. At a flat py-3 the Accept
          button ended 12px above the edge, inside the 34px iOS reserves for the
          swipe-up gesture — an accept/decline pair sitting inside the gesture
          that leaves the app. The banner is the only fixed-bottom element in
          the codebase, so this is the only place the inset was ever needed. */}
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-8">
        <p className="font-mono text-[11px] text-white/60">
          {copy.message}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="font-mono text-[11px] text-white/60 transition-colors hover:text-white/80"
          >
            {copy.decline}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded bg-white/10 px-3 py-1 font-mono text-[11px] text-white/70 transition-colors hover:bg-white/15 hover:text-white/90"
          >
            {copy.accept}
          </button>
        </div>
      </div>
        </m.section>
      )}
    </AnimatePresence>
  );
}
