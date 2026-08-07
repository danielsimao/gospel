"use client";

import Link from "next/link";
import { BandSpine } from "@/components/home/band-spine";
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
    <div className="mt-24 w-full max-w-md text-left sm:max-w-2xl">
      {/* The centred spine every band above it wears — this card kept the old
          left BandHeader after the others migrated, so the page's axis jumped
          back to the left on its very last section. Gold tone stays: the
          questions and the plan are the path, the blog is not. */}
      <BandSpine label={eyebrow} tone="gold" />
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
      {/* Centred like the questions band's all-topics door: a lone trailing
          link is part of the block's own axis, not the list's left edge. */}
      <Link
        href={`/${locale}/blog`}
        className="mx-auto mt-3 block w-fit font-mono text-[10px] uppercase tracking-[1.6px] text-[#D4A843]/80 transition-colors hover:text-[#D4A843]"
      >
        {allLabel}{" "}
        &rarr;
      </Link>
    </div>
  );
}
