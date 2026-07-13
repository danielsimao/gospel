"use client";

import { useEffect, useRef } from "react";
import { trackBlogPostViewed, trackBlogScrollDepth } from "@/lib/blog-analytics";

const QUARTILES = [25, 50, 75, 100] as const;

/** Fires blog_post_viewed on mount and blog_scroll_depth once per quartile. */
export function BlogViewTracker({ slug, locale }: { slug: string; locale: string }) {
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    trackBlogPostViewed(slug, locale);

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
      for (const q of QUARTILES) {
        if (pct >= q && !fired.current.has(q)) {
          fired.current.add(q);
          trackBlogScrollDepth(slug, q);
        }
      }
      if (fired.current.size === QUARTILES.length) {
        window.removeEventListener("scroll", onScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug, locale]);

  return null;
}
