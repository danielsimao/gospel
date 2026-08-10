import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * "You are here", in the top bar.
 *
 * Structural assertions, in the idiom of blog-flag.test.ts: vitest runs in
 * `environment: "node"`, so there is no router here to select a segment and no
 * layout to compute a colour from. What can be pinned is the contract — where
 * the answer comes from, and that it reaches a screen reader and not only an
 * eye.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
/** Both files explain themselves in prose that names the very tokens asserted
    here, so every assertion reads the code with comments stripped. */
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const topBar = strip(read("src", "components", "shared", "top-bar.tsx"));
const immersive = strip(read("src", "app", "[locale]", "(immersive)", "layout.tsx"));

describe("the top bar marks the page the reader is on", () => {
  it("reads the segment off the router tree, not the URL", () => {
    /*
     * `usePathname` is the obvious reach and it is wrong here. proxy.ts REWRITES
     * a bare `/` to `/{locale}`, so the server renders the locale path while the
     * browser's pathname stays `/` — the hydration mismatch Next's own
     * usePathname docs warn about for rewritten routes. It would also mean
     * matching a locale-prefixed string by hand.
     *
     * The segment comes from the tree the server sent, so both renders agree,
     * and it is the question being asked anyway: which section, one level below
     * the layout that mounts this bar.
     */
    expect(topBar).toMatch(/useSelectedLayoutSegment\(\)/);
    expect(topBar, "the top bar matches on the pathname again").not.toMatch(/usePathname/);
  });

  it("names the current page to a screen reader, not just to an eye", () => {
    // A weight and a colour say nothing to anyone not looking at them, and
    // aria-current is the standard for this — no new string in either locale.
    const marked = topBar.match(/aria-current=\{segment === "[a-z]+" \? "page" : undefined\}/g) ?? [];
    expect(marked.length, "a nav link lost its aria-current").toBe(2);
    expect(topBar).toMatch(/aria-current=\{segment === "learn"/);
    expect(topBar).toMatch(/aria-current=\{segment === "blog"/);
  });

  it("marks it in the vocabulary the locale switch already uses", () => {
    // Brighter and bolder than its neighbours — footer-locale-switch.tsx does
    // the same thing for the same reason. The rest state and its hover are
    // untouched, so only the current item changed.
    expect(topBar).toMatch(/current \? "font-semibold text-white" : "text-white\/60 hover:text-white\/85"/);
  });

  it("keeps the current page a link", () => {
    /*
     * The bar's own docblock: a nav link is a door, and the door to the page you
     * are on is how a reader gets back to the top of it. The locale switch drops
     * its current side to a <span> because there is nowhere to go; here there is.
     */
    const nav = topBar.slice(topBar.indexOf("<nav"), topBar.indexOf("</nav>"));
    expect(nav.match(/<Link/g)?.length, "a nav link became a span").toBe(3);
  });

  it("never marks the test, because the test screen has no top bar", () => {
    /*
     * `navLinkClass(false)` on the Test link is a statement, not an oversight:
     * /test is the immersive group, which mounts nothing around its children
     * deliberately — "no top bar, no footer, nothing to navigate away to while
     * the Law is being read". A `segment === "test"` comparison there would be
     * dead code that reads as a live rule.
     */
    expect(topBar).toMatch(/className=\{navLinkClass\(false\)\}/);
    expect(immersive, "the immersive group mounts a top bar now").not.toMatch(/TopBar/);
  });
});
