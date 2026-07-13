"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { useJourney } from "@/lib/use-journey";
import { hasAnsweredConsent, subscribeToConsentAnswered } from "@/lib/consent";
import { trackBlogCtaClicked } from "@/lib/blog-analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";

interface BlogStickyBarProps {
  slug: string;
  locale: string;
  messages: {
    visitorQuestion: string;
    visitorCta: string;
    undecidedQuestion: string;
    undecidedCta: string;
    thinkingQuestion: string;
    thinkingCta: string;
  };
}

/**
 * Bottom bar carrying the site's core question for cold blog readers.
 * Shows only for visitor/undecided/thinking-stage users, only after the
 * consent banner is answered (both are bottom-fixed — never stack), only
 * past 40% scroll, and hides while the personal-turn block is on screen
 * (one ask per viewport).
 */
export function BlogStickyBar({ slug, locale, messages }: BlogStickyBarProps) {
  const { stage, ready } = useJourney();
  const consentAnswered = useSyncExternalStore(
    subscribeToConsentAnswered,
    hasAnsweredConsent,
    () => false,
  );
  const [scrolledEnough, setScrolledEnough] = useState(false);
  const [turnVisible, setTurnVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setScrolledEnough(scrollable > 0 && window.scrollY / scrollable >= 0.4);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const turn = document.getElementById("personal-turn");
    if (!turn) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTurnVisible(entry.isIntersecting),
      { rootMargin: "0px 0px 10% 0px" },
    );
    observer.observe(turn);
    return () => observer.disconnect();
  }, []);

  // Stage → ask map. Committed users have nothing left to convert; dismissed
  // users said no and are not pursued (Living Waters — the door stays open,
  // quietly). Undecided and thinking users are the fence-sitters this bar
  // exists for.
  const ask =
    stage === "visitor"
      ? { question: messages.visitorQuestion, cta: messages.visitorCta, href: `/${locale}/test` }
      : stage === "undecided"
        ? { question: messages.undecidedQuestion, cta: messages.undecidedCta, href: `/${locale}/test` }
        : stage === "thinking"
          ? { question: messages.thinkingQuestion, cta: messages.thinkingCta, href: `/${locale}/next-steps` }
          : null;

  const visible = ready && ask !== null && consentAnswered && scrolledEnough && !turnVisible;

  return (
    <AnimatePresence>
      {visible && ask && (
        <m.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%", opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#060404]/95 backdrop-blur-sm"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm font-semibold text-white/85">{ask.question}</p>
            <Link
              href={ask.href}
              onClick={() => trackBlogCtaClicked(slug, "sticky", stage)}
              className="shrink-0 rounded-lg bg-[#D4A843] px-4 py-2 text-[13px] font-semibold text-[#060404] transition-colors hover:bg-[#e0b854]"
            >
              {ask.cta}
            </Link>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
