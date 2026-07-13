import type { Locale } from "@/lib/i18n";

export interface BlogPostContent {
  title: string;
  /** Subtitle on the page; also the tagline on the OG/story cards. */
  hook: string;
  metaDescription: string;
  sections: Array<{
    heading?: string;
    body: string;
    scripture?: string;
    scriptureRef?: string;
  }>;
  /**
   * The Living Waters pivot that ends every post: the story was about them —
   * this is about you. Required: a post without the turn is commentary.
   */
  personalTurn: {
    /** 1–2 sentences that swing the story onto the reader. */
    setup: string;
    /** The unresolved personal question, rendered large. Must end in "?". */
    question: string;
  };
  sources?: Array<{ label: string; url: string }>;
}

export interface BlogPost {
  slug: string;
  /** ISO date (YYYY-MM-DD). */
  datePublished: string;
  /** ISO date; defaults to datePublished when omitted. */
  dateModified?: string;
  /** Draft posts are excluded from the index, sitemap, and static params. */
  draft?: boolean;
  /** English is required; a post is only routable in locales it declares. */
  locales: { en: BlogPostContent } & Partial<Record<Exclude<Locale, "en">, BlogPostContent>>;
}
