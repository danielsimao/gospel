import Link from "next/link";
import type { ReactNode } from "react";

interface BandRowProps {
  href: string;
  label: string;
  description: string;
  /**
   * Optional. An icon earns its column when it tells two sibling rows apart;
   * on a band holding one row it is a decoration in the leftmost 28px, and the
   * title reads better starting where the band header does.
   */
  icon?: ReactNode;
  onClick?: () => void;
  /** Gold marks the blog row, the one offer here that is not part of the path. */
  tone?: "dim" | "gold";
}

/**
 * One row of a homepage content band.
 *
 * Extracted because the two bands below the hero had drifted into different
 * shapes: "Also here" was open rows inset by 4px against full-width hairlines,
 * while the blog teaser was a rounded card with 20px padding. Stacked directly
 * on top of each other at the same width, their left edges missed by 16px and
 * neither read as belonging to the other — two chapter breaks, two container
 * idioms, and two different top margins.
 *
 * One row component, so they cannot drift again. Same argument as StageSpine
 * on the journey stages: guaranteed by construction rather than by two files
 * agreeing to look alike.
 */
export function BandRow({
  href,
  label,
  description,
  icon,
  onClick,
  tone = "dim",
}: BandRowProps) {
  const hover =
    tone === "gold"
      ? "hover:bg-[#D4A843]/[0.03]"
      : "hover:bg-white/[0.015]";
  const iconColor = tone === "gold" ? "text-[#D4A843]/60" : "text-white/40";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex min-h-[60px] items-start gap-3 border-t border-white/[0.06] px-3 py-3.5 transition-colors first:border-t-0 ${hover}`}
    >
      {icon && (
        <span aria-hidden="true" className={`mt-0.5 shrink-0 ${iconColor}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white/85 transition-colors group-hover:text-white">
          {label}
        </span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-white/55">
          {description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-white/30 transition-transform group-hover:translate-x-1"
      >
        &rarr;
      </span>
    </Link>
  );
}

/** The hairline-bounded container both bands share. */
export function BandRows({ children }: { children: ReactNode }) {
  return <div className="border-y border-white/[0.06]">{children}</div>;
}
