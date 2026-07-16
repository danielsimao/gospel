import { __iconNode as mirrorRound } from "lucide-react/dist/esm/icons/mirror-round.js";
import { __iconNode as scrollText } from "lucide-react/dist/esm/icons/scroll-text.js";
import { __iconNode as doorOpen } from "lucide-react/dist/esm/icons/door-open.js";
import { __iconNode as undo2 } from "lucide-react/dist/esm/icons/undo-2.js";
import { __iconNode as hourglass } from "lucide-react/dist/esm/icons/hourglass.js";
import { __iconNode as sunrise } from "lucide-react/dist/esm/icons/sunrise.js";
import { __iconNode as sprout } from "lucide-react/dist/esm/icons/sprout.js";
import { __iconNode as compass } from "lucide-react/dist/esm/icons/compass.js";
import { __iconNode as footprints } from "lucide-react/dist/esm/icons/footprints.js";
import { __iconNode as anchor } from "lucide-react/dist/esm/icons/anchor.js";
import { __iconNode as waves } from "lucide-react/dist/esm/icons/waves.js";
import { __iconNode as gift } from "lucide-react/dist/esm/icons/gift.js";

type IconNode = ReadonlyArray<[string, Record<string, string | number>]>;

/**
 * Satori (next/og) can't lay out inline <svg> children, so OG routes embed
 * emblems as data-URI <img> sources. This map mirrors TOPIC_EMBLEMS in
 * src/components/emblems.tsx — lucide icons via their raw icon-node data,
 * the two custom emblems via the same path data drawn there. A drift-guard
 * test keeps the two maps' keys in sync.
 */
const OG_EMBLEM_NODES: Record<string, IconNode> = {
  "am-i-a-good-person": mirrorRound,
  "what-is-sin": scrollText,
  "who-is-jesus": [
    // ShepherdStaff — see emblems.tsx
    ["path", { d: "M15.5 22 V7 a5 5 0 1 0 -10 0 v2" }],
    ["path", { d: "M5.5 22 h13", opacity: ".4" }],
  ],
  "why-the-cross": [
    // CrossOnHill — see emblems.tsx
    ["path", { d: "M10 20h4v-9h5V7h-5V2h-4v5H5v4h5z" }],
    ["path", { d: "M4 22.4q8 -4.4 16 0", opacity: ".45" }],
  ],
  "how-can-my-sins-be-forgiven": doorOpen,
  "what-is-repentance": undo2,
  "what-happens-when-i-die": hourglass,
  "does-god-exist": sunrise,
  "is-there-life-after-death": sprout,
  "what-is-the-meaning-of-life": compass,
  "why-are-you-afraid-to-die": footprints,
  "how-can-i-be-saved": anchor,
  "why-does-god-allow-suffering": waves,
  "what-is-the-gospel": gift,
};

/** Exported for the drift-guard test only. */
export const OG_EMBLEM_SLUGS = Object.keys(OG_EMBLEM_NODES);

function escapeAttr(value: string | number): string {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Returns the topic's emblem as an SVG data URI, or null for unknown slugs. */
export function getEmblemDataUri(
  slug: string,
  { size, strokeWidth, color }: { size: number; strokeWidth: number; color: string },
): string | null {
  const node = OG_EMBLEM_NODES[slug];
  if (!node) return null;

  const children = node
    .map(([tag, attrs]) => {
      const attrString = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
        .join(" ");
      return `<${tag} ${attrString}/>`;
    })
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 24 24" fill="none" stroke="${escapeAttr(color)}" ` +
    `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">` +
    `${children}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
