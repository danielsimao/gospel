"use client";

import Link from "next/link";
import { BandHeader } from "@/components/next-steps/band-header";
import { BandRow, BandRows } from "@/components/home/band-row";
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
 */
export function LatestPostCard({ locale, eyebrow, allLabel, post }: LatestPostCardProps) {
  // The SSR/client Date.now() skew only matters at the exact 60-day boundary,
  // where React reconciles the (silent, non-visual) difference; an effect
  // would flash the card in before hiding it. See JSDoc above.
  // eslint-disable-next-line react-hooks/purity -- intentional, see comment above.
  const ageDays = (Date.now() - new Date(`${post.datePublished}T00:00:00Z`).getTime()) / 86_400_000;
  if (ageDays > MAX_AGE_DAYS) return null;

  const href = post.localeAvailable ? `/${locale}/blog/${post.slug}` : `/en/blog/${post.slug}`;

  return (
    <div className="mt-12 w-full max-w-md text-left sm:max-w-2xl">
      {/* Shares the band header idiom with the two above it. Gold tone keeps it
          distinct: the questions and the plan are the path, the blog is not. */}
      <BandHeader label={eyebrow} tone="gold" />
      <BandRows>
        <BandRow
          href={href}
          label={post.title}
          description={post.hook}
          onClick={() => trackHomeBlogCardClicked(post.slug)}
          tone="gold"
        />
      </BandRows>
      {/* One post is all this band can show, and the reader has no way of
          knowing there are eleven more behind it. A door says so without
          quoting a number that would need translating. */}
      <Link
        href={`/${locale}/blog`}
        className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[1.6px] text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
      >
        {allLabel}{" "}
        &rarr;
      </Link>
    </div>
  );
}
