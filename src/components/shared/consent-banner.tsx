"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
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

/*
 * The banner's curves. On entry, declared once and spent twice: framer moves
 * the banner with ENTER and CSS moves the reserve on the same timing — content
 * rising to meet a banner has to travel on the banner's own curve, or it
 * arrives somewhere the banner is not. On exit the two part ways on purpose:
 * see RESERVE_EXIT.
 */
const ENTER = { duration: 0.3, ease: EASE_OUT_STRONG };
// framer's "easeIn" written out, which is also CSS `ease-in`. Named by its
// numbers so the CSS twin below can be generated rather than transcribed.
const EXIT = { duration: 0.15, ease: [0.42, 0, 1, 1] as const };
/*
 * The reserve's own exit. The banner leaves fast — a dismissal should feel
 * dismissed — but content following it down at 150ms reads as the page
 * shifting under the reader. So the reserve settles on a longer ease-in-out
 * instead: barely moving while the banner is still in flight, then gliding
 * the rest of the way once it has gone. Safe in exactly one direction — the
 * reserve may lag the banner (a briefly empty band at the bottom edge), it
 * must never lead it (content arriving under a banner that has not left), so
 * this curve has to stay behind EXIT's at every point.
 */
const RESERVE_EXIT = { duration: 0.5, ease: [0.45, 0, 0.55, 1] as const };
// Slack on top of RESERVE_EXIT - EXIT before the cleanup timer fires, so it
// runs after the reserve's transitionend rather than racing it.
const CLEANUP_SLACK_MS = 100;

const cssTiming = (motion: { duration: number; ease: readonly number[] }) =>
  `${Math.round(motion.duration * 1000)}ms cubic-bezier(${motion.ease.join(",")})`;

/*
 * Whether `--consent-h` can be transitioned at all: an unregistered custom
 * property animates in no engine, and `@property` ships with
 * `CSS.registerProperty` in every one of them (Chrome 85, Safari 16.4, Firefox
 * 128). Where it is missing the reserve still snaps, so it must snap at the old
 * moment — after the banner has left, not while it is leaving — or the screens
 * anchored to the bottom edge jump up into a banner still covering them.
 */
const RESERVE_TRAVELS = typeof CSS !== "undefined" && "registerProperty" in CSS;

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
   *
   * And the reserve TRAVELS, on the curve the banner is travelling on — see the
   * @property block in globals.css. Opening and closing it in one frame moved
   * the page under the reader: measured at 390x844 on the home hero, Accept
   * dropped the rate cards 29px and the scroll cue 60px in a single frame, and
   * the same jump ran in reverse when the banner first appeared.
   */
  // Raised by the answer, which is the moment the reserve starts closing. A
  // resize landing after that must not re-publish a height and re-open the space
  // behind a banner already on its way out.
  const releasedRef = useRef(false);
  // The reserve's cleanup runs on a timer that outlives the banner itself
  // (see onExitComplete below) — held here so an unmount inside that window
  // (locale switch, route change, strict-mode's double-invoke in dev) can
  // cancel it, rather than let it fire later against whatever banner instance
  // happens to be mounted by then.
  const cleanupTimerRef = useRef<number | null>(null);
  // A ref callback rather than an effect: the thing to react to is the banner
  // element existing, which is exactly when React calls this. Keyed off
  // `visible` instead, the effect would list a dependency it never reads.
  const measureBanner = useCallback((el: HTMLElement | null) => {
    if (!el) return;

    const publish = () => {
      if (releasedRef.current) return;
      document.documentElement.style.setProperty(
        "--consent-h",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };

    // Set with the first height, not after it: the transition's timing is read
    // from the style the change lands in, so both in one commit is what makes
    // the opening reserve travel instead of appear. The banner is still off
    // screen sliding up at this point, so the content rises to meet it.
    document.documentElement.style.setProperty("--consent-h-timing", cssTiming(ENTER));
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
      // The cleanup timer below outlives the banner by design (RESERVE_EXIT
      // runs longer than EXIT) — if this component unmounts before it fires,
      // cancel it here. Left running, it would later call removeProperty on
      // whatever banner happened to be mounted at that moment, deleting a
      // height and timing that instance was still relying on.
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      // Braces, not a concise body: removeProperty returns the old value, and
      // an effect cleanup that returns a string does not typecheck.
      document.documentElement.style.removeProperty("--consent-h");
      document.documentElement.style.removeProperty("--consent-h-timing");
    };
  }, []);

  function answer(value: "granted" | "denied") {
    // The reserve starts closing here, as the banner starts leaving — not when
    // it has left. It closes on RESERVE_EXIT, deliberately behind the banner
    // the whole way, so the content settles into the vacated space instead of
    // dropping with the banner — and is never under a banner that has not yet
    // moved off, which is what releasing it early used to cost. Where the
    // property cannot be transitioned this does nothing and onExitComplete
    // below drops it after the banner has gone, which is the old, jumping
    // behaviour intact.
    releasedRef.current = true;
    if (RESERVE_TRAVELS) {
      document.documentElement.style.setProperty("--consent-h-timing", cssTiming(RESERVE_EXIT));
      document.documentElement.style.setProperty("--consent-h", "0px");
    }

    setConsent(value);
    if (value === "granted") void initPostHog();
    window.dispatchEvent(new Event("consentchange"));
  }

  return (
    /* The inline properties come off once both journeys are over: the banner's,
       which AnimatePresence reports here, and — where it travels — the
       reserve's longer one, which outlives the banner by RESERVE_EXIT minus
       EXIT. By the time cleanup runs the reserve is at 0px, so it changes
       nothing on screen — it is the tidy-up, and the release itself where a
       length cannot be transitioned. What it must not become again is the
       release for everyone: clearing it outright the moment Accept is tapped
       is a jump, and retiming a still-travelling transition to 0s is the same
       jump 150ms later. */
    <AnimatePresence
      onExitComplete={() => {
        const cleanup = () => {
          cleanupTimerRef.current = null;
          document.documentElement.style.removeProperty("--consent-h");
          document.documentElement.style.removeProperty("--consent-h-timing");
        };
        if (RESERVE_TRAVELS) {
          cleanupTimerRef.current = window.setTimeout(cleanup, (RESERVE_EXIT.duration - EXIT.duration) * 1000 + CLEANUP_SLACK_MS);
        } else {
          cleanup();
        }
      }}
    >
      {visible && (
        <m.section
          ref={measureBanner}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%", opacity: 0, transition: EXIT }}
          transition={ENTER}
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
            onClick={() => answer("denied")}
            className="font-mono text-[11px] text-white/60 transition-colors hover:text-white/80"
          >
            {copy.decline}
          </button>
          <button
            type="button"
            onClick={() => answer("granted")}
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
