import Link from "next/link";
import { Check } from "lucide-react";

interface TopicCoverCardProps {
  slug: string;
  href: string;
  title: string;
  subtitle: string;
  /** Display position, 1-based. Omitted where the card isn't part of a numbered arc. */
  number?: number;
  isDone?: boolean;
  /** Translated "Quiz" caption. Omitted where the card doesn't carry the cost line. */
  quizTag?: string;
  onClick?: () => void;
  /** True only for the card(s) visible above the fold on the hub's first
   * row — 14 covers is too many to ship eager, but the hub's own LCP
   * candidate needs to skip the lazy-load delay the other 12+ correctly
   * carry. Defaults to lazy. */
  priority?: boolean;
}

/**
 * One cover, framed as a card: the unit every place on the site that lists
 * learn topics now shares — the hub's band grids, a topic page's "Next up",
 * and its "Keep digging" row. Same photograph, same scrim, same seated
 * title `topic-cover.tsx` already established for the topic page itself;
 * this is that idiom at card scale rather than full-bleed.
 *
 * The subtitle is never hover-only here — a card this small has no room for
 * a second disambiguator, and near-duplicate questions ("What Happens When
 * You Die?" / "Is There Life After Death?") need it visible by default.
 */
export function TopicCoverCard({ slug, href, title, subtitle, number, isDone, quizTag, onClick, priority = false }: TopicCoverCardProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08] transition-[border-color,transform] duration-300 ease-[var(--ease-out-strong)] hover:-translate-y-0.5 hover:border-white/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <picture>
        <source srcSet={`/graphics/covers/${slug}.avif`} type="image/avif" />
        <img
          src={`/graphics/covers/${slug}.webp`}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-[var(--ease-out-strong)] group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
        />
      </picture>
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#060404] from-[15%] via-[#060404]/55 via-[48%] to-transparent"
      />
      {number !== undefined && (
        <span
          className="absolute left-3 top-2.5 font-mono text-[10px] tabular-nums text-[#D4A843]/80"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
        >
          {String(number).padStart(2, "0")}
        </span>
      )}
      {isDone && (
        <span className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-[#D4A843]/20 text-[#D4A843]">
          <Check className="h-2.5 w-2.5" strokeWidth={1.5} aria-hidden />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
        <span
          className="block text-[15.5px] font-bold leading-[1.2] tracking-[-0.01em] text-[#D4A843] sm:text-[17px]"
          style={{ textShadow: "0 0 20px rgba(212,168,67,0.4), 0 2px 10px rgba(0,0,0,0.7)" }}
        >
          {title}
        </span>
        <span className="mt-1 block text-[11.5px] leading-snug text-white/60">{subtitle}</span>
        {quizTag && (
          <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-[1.5px] text-white/40">
            {quizTag}
          </span>
        )}
      </span>
    </Link>
  );
}
