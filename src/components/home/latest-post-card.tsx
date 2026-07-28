"use client";

import { Newspaper } from "lucide-react";
import { BandHeader } from "@/components/next-steps/band-header";
import { BandRow, BandRows } from "@/components/home/band-row";
import { trackHomeBlogCardClicked } from "@/lib/eternity-analytics";

const MAX_AGE_DAYS = 60;

interface LatestPostCardProps {
  locale: string;
  eyebrow: string;
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
export function LatestPostCard({ locale, eyebrow, post }: LatestPostCardProps) {
  // The SSR/client Date.now() skew only matters at the exact 60-day boundary,
  // where React reconciles the (silent, non-visual) difference; an effect
  // would flash the card in before hiding it. See JSDoc above.
  // eslint-disable-next-line react-hooks/purity -- intentional, see comment above.
  const ageDays = (Date.now() - new Date(`${post.datePublished}T00:00:00Z`).getTime()) / 86_400_000;
  if (ageDays > MAX_AGE_DAYS) return null;

  const href = post.localeAvailable ? `/${locale}/blog/${post.slug}` : `/en/blog/${post.slug}`;

  return (
    <div className="mt-12 w-full max-w-md text-left">
      {/* Shares the AlsoHere band's header idiom rather than its old
          divider + centred eyebrow. The two now sit directly above one
          another, and two different chapter-break treatments stacked read as
          a mistake. Gold tone keeps it distinct from the band's dim one.
          The same argument carried down to the row itself: this was a rounded
          card at p-5 above open rows at px-1, so the two bands' left edges
          missed by 16px and neither looked like it belonged to the other. */}
      <BandHeader label={eyebrow} tone="gold" />
      <BandRows>
        <BandRow
          href={href}
          label={post.title}
          description={post.hook}
          onClick={() => trackHomeBlogCardClicked(post.slug)}
          tone="gold"
          icon={<Newspaper className="size-4" aria-hidden="true" />}
        />
      </BandRows>
    </div>
  );
}
