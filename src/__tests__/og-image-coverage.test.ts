import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Open Graph images are wired two ways in this app and the two can silently
 * cancel each other, so the wiring is pinned here rather than left to whoever
 * adds the next route.
 *
 * An `opengraph-image` file covers the segment it sits in and no segment
 * below it, which is why every page under `(content)` and `(immersive)` once
 * shipped `twitter:card=summary_large_image` with nothing in it. The fallback
 * lives in `buildPageMetadata` instead — and an explicit `openGraph.images`
 * replaces a colocated file rather than yielding to it, so the two routes that
 * own a card have to say `hasOwnOgImage: true` or lose it.
 */
const APP_DIR = join(process.cwd(), "src/app");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(APP_DIR);
const ownCardRoutes = files
  .filter((path) => path.endsWith("/opengraph-image.tsx"))
  .map((path) => path.replace("/opengraph-image.tsx", ""));

describe("open graph image coverage", () => {
  it("finds the colocated cards", () => {
    // The `[locale]` one serves the 404 page, which renders at that segment.
    expect(ownCardRoutes.length).toBeGreaterThanOrEqual(3);
  });

  it("every route with its own card opts out of the generic one", () => {
    for (const route of ownCardRoutes) {
      const page = join(route, "page.tsx");
      if (!files.includes(page)) continue;
      const source = readFileSync(page, "utf8");
      expect(source, `${page} has an opengraph-image beside it`).toContain(
        "hasOwnOgImage: true",
      );
    }
  });

  it("nothing opts out without a card to fall back on", () => {
    const pages = files.filter((path) => path.endsWith("/page.tsx"));
    for (const page of pages) {
      if (!readFileSync(page, "utf8").includes("hasOwnOgImage: true")) continue;
      const sibling = page.replace("/page.tsx", "/opengraph-image.tsx");
      expect(files, `${page} opts out but has no opengraph-image beside it`).toContain(sibling);
    }
  });

  it("every page that builds metadata reaches buildPageMetadata", () => {
    // A page writing its own Metadata object would skip the fallback, the
    // canonical and the hreflang set in one go.
    const pages = files.filter((path) => path.endsWith("/page.tsx"));
    for (const page of pages) {
      const source = readFileSync(page, "utf8");
      if (!source.includes("generateMetadata")) continue;
      expect(source, `${page} builds metadata by hand`).toContain("buildPageMetadata");
    }
  });
});
