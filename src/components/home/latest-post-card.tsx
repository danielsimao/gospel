"use client";

import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
import { trackHomeBlogCardClicked } from "@/lib/eternity-analytics";

const MAX_AGE_DAYS = 60;

interface LatestPostCardProps {
  locale: string;
  eyebrow: string;
  /** "All posts" — the door to the other eleven, which one row cannot show. */
  allLabel: string;
  post: {
    slug: string;
    title: string;
    hook: string;
    datePublished: string;
    /** False when the post has no content in this locale — link goes to /en. */
    localeAvailable: boolean;
  };
}

/**
 * Single latest-post teaser at the bottom of the homepage. Self-hides when
 * the newest post is older than 60 days — a visible stale blog on the front
 * door reads as abandonment; the footer link keeps the blog reachable.
 * Client-side age check on purpose: a build-time check freezes at deploy.
 *
 * An editorial teaser, not a list row. It wore BandRow while two bands shared
 * that shape; with the questions band gone to cover cards this was the last
 * consumer, and a one-row list container around a single teaser was the
 * borrowed-idiom problem the reading band already solved for itself. Now it is
 * the page's one piece of editorial furniture: dated headline over its hook,
 * inside a gold-tinged frame — gold because the blog is the one offer here
 * that is not part of the path.
 */
export function LatestPostCard({ locale, eyebrow, allLabel, post }: LatestPostCardProps) {
  // The SSR/client Date.now() skew only matters at the exact 60-day boundary,
  // where React reconciles the (silent, non-visual) difference; an effect
  // would flash the card in before hiding it. See JSDoc above.
  // eslint-disable-next-line react-hooks/purity -- intentional, see comment above.
  const ageDays = (Date.now() - new Date(`${post.datePublished}T00:00:00Z`).getTime()) / 86_400_000;
  if (ageDays > MAX_AGE_DAYS) return null;

  const href = post.localeAvailable ? `/${locale}/blog/${post.slug}` : `/en/blog/${post.slug}`;
  /* The date the mono eyebrow states. UTC-anchored like the age check above,
     so the printed day never disagrees with the day the post says it is. */
  const dateLine = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${post.datePublished}T00:00:00Z`));

  return (
    <div className="mt-24 w-full max-w-md text-left sm:max-w-2xl">
      <BandSpine label={eyebrow} tone="gold" />
      <Link
        href={href}
        onClick={() => trackHomeBlogCardClicked(post.slug)}
        className="group block rounded-2xl border border-[#D4A843]/[0.14] bg-[#D4A843]/[0.02] p-5 transition-colors hover:border-[#D4A843]/30 hover:bg-[#D4A843]/[0.04] sm:p-6"
      >
        <span className="block font-mono text-[9px] uppercase tracking-[2.5px] text-[#D4A843]/60">
          {dateLine}
        </span>
        <span className="mt-2.5 block text-balance text-lg font-bold leading-snug tracking-tight text-white/90 transition-colors group-hover:text-white sm:text-xl">
          {post.title}
        </span>
        <span className="mt-2 block max-w-[52ch] text-[13px] leading-relaxed text-white/55">
          {post.hook}
        </span>
        <span
          aria-hidden="true"
          className="mt-4 block text-[13px] text-[#D4A843]/70 transition-transform group-hover:translate-x-1"
        >
          &rarr;
        </span>
      </Link>
      {/* One post is all this band can show, and the reader has no way of
          knowing there are eleven more behind it. A door says so without
          quoting a number that would need translating. Centred with the
          header, like every trailing band link on this page. */}
      <Link
        href={`/${locale}/blog`}
        className="mx-auto mt-4 block w-fit font-mono text-[10px] uppercase tracking-[1.6px] text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
      >
        {allLabel}{" "}
        &rarr;
      </Link>
    </div>
  );
}
