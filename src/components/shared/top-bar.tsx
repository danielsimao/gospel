"use client";

import Link from "next/link";
import {
  trackTopBarLearnClicked,
  trackTopBarTestClicked,
  trackTopBarBlogClicked,
} from "@/lib/eternity-analytics";
import type { Locale } from "@/lib/i18n";

interface TopBarMessages {
  brand: string;
  testLabel: string;
  readingLabel: string;
}

interface TopBarProps {
  locale: Locale;
  learnLabel: string;
  blogLabel: string;
  /** `BLOG_ENABLED`, resolved on the server. See the note below on why this is
      not the stage gating that was deleted from here. */
  blogEnabled: boolean;
  messages: TopBarMessages;
}

/**
 * The same three links for everyone, on every page.
 *
 * This used to vary by journey stage: the test link disappeared once a reader
 * had decided, the blog was hidden from anyone who had not, and a reader who
 * declined the invitation was left with a single-item nav. Three things were
 * wrong with that.
 *
 * It contradicted the copy. `dismissed.title` says "The door stays open" and
 * offers "Take the test again" — while the navigation removed the way back for
 * exactly that reader. A nav link is a door, not a nudge.
 *
 * It contradicted the footer, which lists Take the Test, Blog and the reading
 * plan to everyone at every stage. The header hid what the page's own footer
 * offered one screen below. That is the defect the journey tracker was deleted
 * for this session, with the roles reversed — see the rule kept in
 * `home/also-here.tsx`: every row is a link, always.
 *
 * And it moved. Stage comes from localStorage, so the nav rendered one set of
 * links on the server and swapped to another after hydration — measured going
 * from "Test · Learn" to "Reading · Blog · Learn" on the same page load. The
 * same reader on a second device, or in a private window, got a different nav
 * again, so there was no stable arrangement to learn.
 *
 * Reading Plan stays out of the header deliberately rather than by gating: it
 * is discipleship, and it is already offered to everyone by the footer and by
 * the homepage's content band, so nothing is hidden by leaving it here.
 *
 * Still a client component, but only for the click tracking — the markup no
 * longer depends on anything the browser knows, so it renders identically on
 * the server and never changes after hydration.
 *
 * `blogEnabled` is not that gating returning. It is a build-time flag, the same
 * for every reader on every device, resolved on the server and passed in — so
 * the nav is still one stable arrangement to learn, and still renders the same
 * before and after hydration. The three defects above were all consequences of
 * varying by reader, and none of them apply to a surface that is simply not
 * part of the site this month. See lib/flags.ts.
 */
export function TopBar({ locale, learnLabel, blogLabel, blogEnabled, messages }: TopBarProps) {
  return (
    <header className="print-hide relative z-10 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
      {/*
       * Two glass islands, not a band. The full-width scrim that used to live
       * here protected 13px links from the homepage globe by dimming the whole
       * viewport width — including the sphere's upper limb where no text sits.
       * These capsules put the ground exactly under the text and nowhere else:
       * between them the globe runs untouched to the edge, and behind them it
       * is blurred rather than erased, so the sphere still reads through the
       * glass. On every other page they sit on plain dark ground and read as
       * quiet hairline chips.
       */}
      <Link
        href={`/${locale}`}
        className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#060404]/40 p-[5px] text-[13px] font-bold tracking-tight text-white/70 backdrop-blur-[10px] transition-colors hover:text-white/85 sm:pr-3"
      >
        {/*
         * The brand mark — the same two Big Shoulders "?" glyph paths as
         * src/app/icon.svg, inlined so the header needs no extra request. If
         * the icon ever changes, this changes with it. Below sm the wordmark
         * drops to sr-only and the mark carries the brand alone; "If You Died
         * Today" at 13px never fit a phone header comfortably.
         */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="shrink-0"
        >
          <rect width="64" height="64" rx="14" fill="#060404" />
          <path
            fill="#ef4444"
            d="M28.15 42.74L27.99 39.42Q27.84 37.07 28.13 35.28Q28.42 33.50 29.58 31.99Q30.74 30.48 33.14 28.97L34.31 28.26Q35.11 27.79 35.50 26.98Q35.88 26.16 35.99 25.14Q36.10 24.13 36.10 23.08L36.10 16.33Q36.10 14.75 35.02 13.92Q33.94 13.09 31.88 13.09Q29.97 13.09 28.93 13.92Q27.90 14.75 27.81 16.33Q27.68 18.24 27.67 20.30Q27.65 22.37 27.75 24.06L19.21 24.06Q19.15 22.62 19.11 21.68Q19.08 20.73 19.08 19.89Q19.08 19.04 19.15 17.90Q19.52 11.52 22.41 8.76Q25.31 6.00 31.82 6.00Q38.81 6.00 41.85 8.77Q44.89 11.55 44.89 17.90Q44.89 18.85 44.90 19.73Q44.92 20.61 44.92 21.44Q44.92 22.28 44.92 23.08Q44.89 26.44 44.28 28.47Q43.68 30.51 42.74 31.63Q41.80 32.76 40.75 33.33Q39.71 33.90 38.78 34.36L37.21 35.13Q35.82 35.81 35.55 37.00Q35.27 38.18 35.08 39.42L34.84 42.74L28.15 42.74Z"
          />
          <path fill="#ef4444" d="M26.14 58.20L26.14 50.40L36.87 50.40L36.87 58.20L26.14 58.20Z" />
        </svg>
        <span className="sr-only sm:not-sr-only">{messages.brand}</span>
      </Link>
      {/* Labelled so it stays distinguishable from the prev/next nav on topic
          pages. Uses the brand string, which is already translated. */}
      <nav
        aria-label={messages.brand}
        className="flex items-center gap-3.5 rounded-full border border-white/[0.08] bg-[#060404]/40 px-3.5 py-2 text-[13px] font-medium tracking-tight backdrop-blur-[10px] sm:gap-4 sm:px-4"
      >
        <Link
          href={`/${locale}/test`}
          onClick={() => trackTopBarTestClicked()}
          className="text-white/60 transition-colors hover:text-white/85"
        >
          {messages.testLabel}
        </Link>
        <Link
          href={`/${locale}/learn`}
          onClick={() => trackTopBarLearnClicked()}
          className="text-white/60 transition-colors hover:text-white/85"
        >
          {learnLabel}
        </Link>
        {blogEnabled && (
          <Link
            href={`/${locale}/blog`}
            onClick={() => trackTopBarBlogClicked()}
            className="text-white/60 transition-colors hover:text-white/85"
          >
            {blogLabel}
          </Link>
        )}
      </nav>
    </header>
  );
}
