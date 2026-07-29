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
 */
export function TopBar({ locale, learnLabel, blogLabel, messages }: TopBarProps) {
  return (
    <div className="print-hide relative z-10 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
      {/*
       * A scrim, not a bar. The homepage bleeds the globe off the top-right
       * corner and the nav sits directly on top of it, where dotted landmass
       * and the sphere's lit limb pass behind 13px links. A solid band would
       * read as chrome the rest of the site does not have; a gradient that
       * fades out before the content starts just gives the type a ground.
       *
       * Extends past this element's own box on purpose: the links sit inside
       * the padding, so the fade has to start above them and finish below.
       * Invisible on pages with nothing behind it, which is every page but
       * this one.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-2 -bottom-8 -z-10 bg-gradient-to-b from-[#060404] via-[#060404]/80 to-transparent"
      />
      <Link
        href={`/${locale}`}
        className="text-[13px] font-bold tracking-tight text-white/70 transition-colors hover:text-white/65"
      >
        {messages.brand}
      </Link>
      <nav className="flex items-center gap-4 text-[13px] font-medium tracking-tight">
        <Link
          href={`/${locale}/test`}
          onClick={() => trackTopBarTestClicked()}
          className="text-white/60 transition-colors hover:text-white/70"
        >
          {messages.testLabel}
        </Link>
        <Link
          href={`/${locale}/learn`}
          onClick={() => trackTopBarLearnClicked()}
          className="text-white/60 transition-colors hover:text-white/70"
        >
          {learnLabel}
        </Link>
        <Link
          href={`/${locale}/blog`}
          onClick={() => trackTopBarBlogClicked()}
          className="text-white/60 transition-colors hover:text-white/70"
        >
          {blogLabel}
        </Link>
      </nav>
    </div>
  );
}
