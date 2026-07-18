"use client";

import Link from "next/link";
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
    <div className="mt-16 w-full max-w-md sm:mt-20">
      {/* Own quiet band — divider + centered eyebrow declare a chapter break
          so the card reads as "meanwhile, from the blog", not an appendix
          bolted under the invitation CTA. */}
      <div aria-hidden="true" className="h-px bg-white/[0.08]" />
      <div className="mt-8 flex items-center justify-center gap-2">
        <span aria-hidden="true" className="h-px w-6 bg-[#D4A843]/40" />
        <p className="font-mono text-[10px] uppercase tracking-[2.5px] text-[#D4A843]/70">{eyebrow}</p>
        <span aria-hidden="true" className="h-px w-6 bg-[#D4A843]/40" />
      </div>
      <Link
        href={href}
        onClick={() => trackHomeBlogCardClicked(post.slug)}
        className="group mt-4 block rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 transition-all hover:border-[#D4A843]/25 hover:bg-[#D4A843]/[0.03]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white/85 group-hover:text-white/95">{post.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/55">{post.hook}</p>
          </div>
          <span aria-hidden="true" className="mt-0.5 text-white/40 transition-transform group-hover:translate-x-1">
            →
          </span>
        </div>
      </Link>
    </div>
  );
}
