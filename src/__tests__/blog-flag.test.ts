import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The blog goes quiet, not away.
 *
 * The owner has no time to write, so the three entrances — header, footer,
 * homepage card — are switched off. The posts are a different question: four
 * are published and indexed, an unlinked page costs nothing to keep, and
 * removing them would forfeit that ranking in exchange for no saved work.
 *
 * So this file guards both halves, and the second half is the one that matters:
 * a later hand tidying "the blog is off, why is it still in the sitemap" would
 * undo something deliberate.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const topBar = strip(read("src", "components", "shared", "top-bar.tsx"));
const footer = strip(read("src", "components", "shared", "footer.tsx"));
const layout = strip(read("src", "app", "[locale]", "(content)", "layout.tsx"));
const home = strip(read("src", "app", "[locale]", "(content)", "page.tsx"));
const notFound = strip(read("src", "app", "[locale]", "not-found.tsx"));
const sitemap = strip(read("src", "app", "sitemap.ts"));
const blogIndex = strip(read("src", "app", "[locale]", "(content)", "blog", "page.tsx"));
const blogPost = strip(read("src", "app", "[locale]", "(content)", "blog", "[slug]", "page.tsx"));

describe("the flag itself", () => {
  const original = process.env.BLOG_ENABLED;
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    if (original === undefined) delete process.env.BLOG_ENABLED;
    else process.env.BLOG_ENABLED = original;
  });

  it("is off unless something explicitly turns it on", async () => {
    // Off by default is the point: nothing has to be set in Vercel for the
    // entrances to go, and the blog cannot come back by accident.
    delete process.env.BLOG_ENABLED;
    const { BLOG_ENABLED } = await import("@/lib/flags");
    expect(BLOG_ENABLED).toBe(false);
  });

  it("stays off for anything but the exact string", async () => {
    // "1", "yes" and "TRUE" are the values a future hand would reach for; each
    // silently doing nothing is worse than each working, so pin the contract.
    for (const value of ["1", "yes", "TRUE", "on", ""]) {
      vi.resetModules();
      process.env.BLOG_ENABLED = value;
      const { BLOG_ENABLED } = await import("@/lib/flags");
      expect(BLOG_ENABLED, `BLOG_ENABLED=${value} turned the blog on`).toBe(false);
    }
  });

  it("comes back with BLOG_ENABLED=true", async () => {
    process.env.BLOG_ENABLED = "true";
    const { BLOG_ENABLED } = await import("@/lib/flags");
    expect(BLOG_ENABLED).toBe(true);
  });

  it("is server-side, so it never ships to the browser", () => {
    /*
     * A NEXT_PUBLIC_ name would be inlined by literal text match at build time
     * and sent to every reader. Nothing here is secret, but nothing here needs
     * to travel — and the two client components read a prop, not the env.
     */
    const flags = strip(read("src", "lib", "flags.ts"));
    expect(flags).not.toMatch(/NEXT_PUBLIC_/);
    expect(topBar).not.toMatch(/process\.env/);
    expect(footer).not.toMatch(/process\.env/);
  });
});

describe("the entrances are gated, all three of them", () => {
  it("hides the header link", () => {
    expect(topBar).toMatch(/\{blogEnabled && \(/);
  });

  it("hides the footer link", () => {
    /*
     * The footer is why the header could not gate this before: it listed the
     * blog to everyone one screen below, so a hidden header link contradicted
     * the page's own footer. Both read the same flag now.
     */
    expect(footer).toMatch(/\{blogEnabled && \(/);
  });

  it("hides the homepage's latest-post card", () => {
    // Gated at the source rather than in the card: with no posts to hand, the
    // shell's existing `{latestPost && …}` renders nothing and needs no change.
    expect(home).toMatch(/BLOG_ENABLED \? getPublishedPosts\(\) : \[\]/);
  });

  it("passes the flag from the server to both, and to the 404's footer", () => {
    // not-found.tsx sits outside the (content) group and renders its own
    // footer — the one page a lost reader reaches must not be the one page
    // still advertising the blog.
    expect(layout).toMatch(/blogEnabled=\{BLOG_ENABLED\}[\s\S]*blogEnabled=\{BLOG_ENABLED\}/);
    expect(notFound).toMatch(/blogEnabled=\{BLOG_ENABLED\}/);
  });
});

describe("the posts stay standing", () => {
  it("keeps /blog and every post in the sitemap", () => {
    /*
     * Four posts are indexed. Dropping them from the sitemap forfeits that for
     * nothing — an unlinked page costs no maintenance — and coming back would
     * mean waiting on a re-crawl. If the flag ever reaches this file, someone
     * has confused "stop writing" with "delete the archive".
     */
    expect(sitemap).toMatch(/getLocaleUrl\(locale, "\/blog"\)/);
    expect(sitemap).toMatch(/getLocaleUrl\(locale, `\/blog\/\$\{post\.slug\}`\)/);
    expect(sitemap).not.toMatch(/BLOG_ENABLED/);
  });

  it("keeps the routes rendering, and indexable", () => {
    // No flag guard, and no noindex: a hidden entrance is not a removed page,
    // and telling Google to forget them is the same loss by another route.
    expect(blogIndex).not.toMatch(/BLOG_ENABLED/);
    expect(blogPost).not.toMatch(/BLOG_ENABLED/);
    expect(blogIndex).not.toMatch(/index:\s*false/);
    expect(blogPost).not.toMatch(/index:\s*false/);
  });
});
