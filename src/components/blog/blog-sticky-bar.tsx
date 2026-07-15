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

/** Scroll must be idle this long before the bar may appear — a reader
 *  mid-fling never sees it; someone who pauses to read does. */
const SCROLL_IDLE_MS = 450;

/**
 * Bottom bar carrying the site's core question for cold blog readers.
 * Shows only for visitor/undecided/thinking-stage users, only after the
 * consent banner is answered (both are bottom-fixed — never stack), and
 * hides while the personal-turn block is on screen (one ask per viewport).
 * Appearance is deliberately calm: passing 40% scroll only ARMS the bar
 * (latched — scrolling back up doesn't re-hide it); it actually slides in
 * only once scrolling pauses, so it never flashes past a moving reader.
 */
export function BlogStickyBar({ slug, locale, messages }: BlogStickyBarProps) {
  const { stage, ready } = useJourney();
  const consentAnswered = useSyncExternalStore(
    subscribeToConsentAnswered,
    hasAnsweredConsent,
    () => false,
  );
  const [shown, setShown] = useState(false);
  const [turnSeen, setTurnSeen] = useState(false);

  useEffect(() => {
    let armed = false; // latched once 40% is crossed — never disarms
    let idleTimer: ReturnType<typeof setTimeout>;

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // Arm halfway to the personal-turn block (capped at 40% of the page).
      // Below-turn chrome (references, share, footer) inflates the page, so
      // a plain 40%-of-scroll threshold can sit a flash away from the
      // turn-yield point on mobile — content distance is the honest measure.
      const turn = document.getElementById("personal-turn");
      const turnEntryY = turn
        ? turn.getBoundingClientRect().top + window.scrollY - window.innerHeight
        : Infinity;
      const armPoint = Math.min(scrollable * 0.4, turnEntryY * 0.5);
      if (scrollable > 0 && window.scrollY >= armPoint) {
        armed = true;
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Both latches: once the bar has appeared it stays through further
        // scrolling — appearing mid-motion (or blinking per scroll step) is
        // exactly the aggression this timer exists to avoid.
        if (armed) setShown(true);
      }, SCROLL_IDLE_MS);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const turn = document.getElementById("personal-turn");
    if (!turn) return;
    // The bar exists only until the reader meets the personal turn. Once the
    // turn block has been on screen — read slowly into or flung past — the
    // bar retires for good: a fast scroller pausing at the bottom would
    // otherwise get the bar stacked on top of the page's own endgame asks.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setTurnSeen(true);
    });
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

  const visible = ready && ask !== null && consentAnswered && shown && !turnSeen;

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
