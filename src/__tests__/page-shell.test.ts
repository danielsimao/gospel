import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * page-shell.tsx documents a three-way split: narrow for the reading column
 * (topic pages, reading plan, next-steps) — prose read top to bottom, so it
 * stays letter-width even on a wide desktop; grid for the learn hub's card
 * layout — same vertical rhythm as narrow, but wide enough that a 2-up grid
 * isn't squeezed to ~226px cards on desktop (the original bug this test
 * caught: learn-hub and topic-page both passed width="wide", giving the hub
 * a column *and* a legal-prose vertical rhythm it never asked for); wide for
 * legal/about prose, its own larger vertical rhythm. Pinning all three so
 * the split can't drift back without a test noticing.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const NARROW = [
  ["components", "learn", "topic-page.tsx"],
  ["app", "[locale]", "(content)", "reading-plan", "page.tsx"],
  ["app", "[locale]", "(content)", "next-steps", "client.tsx"],
];

const GRID = [["components", "learn", "learn-hub.tsx"]];

const WIDE = [
  ["app", "[locale]", "(content)", "about", "page.tsx"],
  ["app", "[locale]", "(content)", "blog", "page.tsx"],
  ["app", "[locale]", "(content)", "privacy", "page.tsx"],
  ["app", "[locale]", "(content)", "terms", "page.tsx"],
  ["components", "blog", "blog-post-page.tsx"],
];

describe("PageShell's narrow/grid/wide split", () => {
  it("keeps the reading column narrow: topic pages, reading plan, next-steps", () => {
    for (const parts of NARROW) {
      const src = strip(read("src", ...parts));
      expect(src, `${parts.join("/")} should not opt into width="wide" or "grid"`).not.toMatch(
        /<PageShell width="(wide|grid)"/,
      );
    }
  });

  it("gives the learn hub's card grid room to breathe on desktop", () => {
    for (const parts of GRID) {
      const src = strip(read("src", ...parts));
      expect(src, `${parts.join("/")} should declare width="grid"`).toMatch(
        /<PageShell width="grid"/,
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
