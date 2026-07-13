"use client";

import { useSyncExternalStore } from "react";
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
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%", opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#060404]/95 backdrop-blur-sm"
        >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-6 py-3 sm:px-8">
        <p className="font-mono text-[11px] text-white/50">
          {copy.message}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleDecline}
            className="font-mono text-[11px] text-white/40 transition-colors hover:text-white/60"
          >
            {copy.decline}
          </button>
          <button
            onClick={handleAccept}
            className="rounded bg-white/10 px-3 py-1 font-mono text-[11px] text-white/70 transition-colors hover:bg-white/15 hover:text-white/90"
          >
            {copy.accept}
          </button>
        </div>
      </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
