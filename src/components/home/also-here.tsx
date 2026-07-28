import type { ReactNode } from "react";
import { BandHeader } from "@/components/next-steps/band-header";
import { BandRow, BandRows } from "@/components/home/band-row";

export interface AlsoHereRow {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
}

/**
 * The homepage's quiet content band. Replaced the journey tracker, which
 * rendered Learn at opacity-60 and unclickable while the header linked /learn
 * on every page — the page showed a door as shut while the header held it open.
 *
 * Two rules this must keep:
 *
 *  1. Every row is a link, always. No upcoming state, no gating, no numbering,
 *     no rails. Those were the tracker, and re-adding any of them re-creates
 *     the defect.
 *  2. Progress is a subtitle, not a system. "Day 3 of 7" on a permanently
 *     pressable link is information; what made the tracker a dashboard was the
 *     gating and the implied sequence, and the sequence was invented — nothing
 *     stops a reader opening a Learn topic before taking the test.
 *
 * Renders identically on all five journey stages, including `dismissed`:
 * offering content for a reader's benefit is not the same act as asking them
 * to share for ours, which is why share was removed from that path and this is
 * not.
 */
export function AlsoHere({ label, rows }: { label: string; rows: AlsoHereRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-md text-left">
      <BandHeader label={label} tone="dim" />
      <BandRows>
        {rows.map((row) => (
          <BandRow
            key={row.href}
            href={row.href}
            label={row.label}
            description={row.description}
            icon={row.icon}
            onClick={row.onClick}
          />
        ))}
      </BandRows>
    </div>
  );
}
