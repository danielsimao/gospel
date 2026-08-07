import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * page-shell.tsx documents a split — narrow for the reading column (learn,
 * reading plan, next-steps), wide for legal/about prose — that the code
 * silently broke: learn-hub and topic-page both passed width="wide",
 * giving learn extra top padding (py-24/32 vs narrow's py-16/24) and a wider
 * column than its own sibling pages. Pinning both sides of the split so it
 * can't drift back without a test noticing.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const NARROW = [
  ["components", "learn", "learn-hub.tsx"],
  ["components", "learn", "topic-page.tsx"],
  ["app", "[locale]", "(content)", "reading-plan", "page.tsx"],
  ["app", "[locale]", "(content)", "next-steps", "client.tsx"],
];

const WIDE = [
  ["app", "[locale]", "(content)", "about", "page.tsx"],
  ["app", "[locale]", "(content)", "blog", "page.tsx"],
  ["app", "[locale]", "(content)", "privacy", "page.tsx"],
  ["app", "[locale]", "(content)", "terms", "page.tsx"],
  ["components", "blog", "blog-post-page.tsx"],
];

describe("PageShell's narrow/wide split", () => {
  it("keeps the reading column narrow: learn, reading plan, next-steps", () => {
    for (const parts of NARROW) {
      const src = strip(read("src", ...parts));
      expect(src, `${parts.join("/")} should not opt into width="wide"`).not.toMatch(
        /<PageShell width="wide"/,
      );
    }
  });

  it("keeps legal/about prose wide", () => {
    for (const parts of WIDE) {
      const src = strip(read("src", ...parts));
      expect(src, `${parts.join("/")} should declare width="wide"`).toMatch(
        /<PageShell width="wide"/,
      );
    }
  });
});
