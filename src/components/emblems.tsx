import {
  Anchor,
  Compass,
  DoorOpen,
  Footprints,
  Gift,
  Hourglass,
  MirrorRound,
  Scale,
  ScrollText,
  Sprout,
  Sunrise,
  Undo2,
  Waves,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

/**
 * Topic emblems: one symbol per gospel concept, all thin-line on the site's
 * gold. Sourced from Lucide (already a dependency) except two that no icon
 * set provides — drawn on the same 24-grid, 2px-stroke conventions.
 */

type EmblemProps = Pick<LucideProps, "className" | "strokeWidth" | "size" | "color" | "aria-hidden">;

/** Latin cross on the hill. Cross outline from Tabler Icons (MIT), ground arc ours. */
function CrossOnHill({ className, strokeWidth = 2, size = 24, color = "currentColor", ...rest }: EmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M10 20h4v-9h5V7h-5V2h-4v5H5v4h5z" />
      <path d="M4 22.4q8 -4.4 16 0" opacity=".45" />
    </svg>
  );
}

/** Shepherd's crook — no icon set has one. */
function ShepherdStaff({ className, strokeWidth = 2, size = 24, color = "currentColor", ...rest }: EmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M15.5 22 V7 a5 5 0 1 0 -10 0 v2" />
      <path d="M5.5 22 h13" opacity=".4" />
    </svg>
  );
}

export const TOPIC_EMBLEMS: Record<string, ComponentType<EmblemProps>> = {
  "am-i-a-good-person": MirrorRound,
  "what-is-sin": ScrollText,
  "who-is-jesus": ShepherdStaff,
  "why-the-cross": CrossOnHill,
  "how-can-my-sins-be-forgiven": DoorOpen,
  "what-is-repentance": Undo2,
  "what-happens-when-i-die": Hourglass,
  "does-god-exist": Sunrise,
  "is-there-life-after-death": Sprout,
  "what-is-the-meaning-of-life": Compass,
  "why-are-you-afraid-to-die": Footprints,
  "how-can-i-be-saved": Anchor,
  "why-does-god-allow-suffering": Waves,
  "what-is-the-gospel": Gift,
};

interface TopicEmblemProps extends EmblemProps {
  slug: string;
}

/** Renders the topic's emblem, or nothing for unknown slugs (new topics degrade gracefully). */
export function TopicEmblem({ slug, ...props }: TopicEmblemProps) {
  const Emblem = TOPIC_EMBLEMS[slug];
  if (!Emblem) return null;
  return <Emblem aria-hidden {...props} />;
}

/** The verdict's scales — re-exported so verdict surfaces share one source. */
export const VerdictEmblem = Scale;
