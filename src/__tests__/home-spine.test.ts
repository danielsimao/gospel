import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * One axis down the homepage.
 *
 * The page spoke two dialects: the hero and all five journey stages centre
 * themselves under an eyebrow flanked by two short rules, while the bands
 * below used next-steps' left-aligned BandHeader — so the axis jumped from
 * centre to left halfway down, and the score band wore a left header over
 * centred numerals. These pin the single dialect, and the order that ends the
 * page on a verse rather than a widget.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const spine = strip(read("src", "components", "home", "band-spine.tsx"));
const stage = strip(read("src", "components", "home", "stage-spine.tsx"));
const shell = strip(read("src", "components", "home-shell.tsx"));
// latest-post-card too: it kept the left BandHeader after the first migration
// and the axis jumped back at the very bottom of the page.
const BANDS = ["passed-band", "questions-band", "reading-band", "latest-post-card"] as const;

describe("every band sits on the same axis", () => {
  it("uses the centred spine, and nothing uses the left header", () => {
    for (const name of BANDS) {
      const band = strip(read("src", "components", "home", `${name}.tsx`));
      expect(band, `${name} does not use BandSpine`).toMatch(/<BandSpine/);
      expect(band, `${name} still uses the left BandHeader`).not.toMatch(/BandHeader/);
    }
  });

  it("centres the header the way the journey stages already do", () => {
    /*
     * Deliberately a copy of StageSpine's header rather than an import: that
     * component also owns a heading and a whatHappened paragraph no band has.
     * The copy is only safe if the two stay measurably identical, which is
     * what this asserts — same rule width, same type, same tracking.
     */
    expect(spine).toMatch(/justify-center/);
    for (const token of [
      "h-px w-6",
      "font-mono text-\\[9px\\] uppercase tracking-\\[3px\\]",
      "sm:text-\\[10px\\] sm:tracking-\\[4px\\]",
    ]) {
      const re = new RegExp(token);
      expect(spine, `band spine lost ${token}`).toMatch(re);
      expect(stage, `stage spine lost ${token} — the two have drifted`).toMatch(re);
    }
  });

  it("centres the bands' trailing links too", () => {
    /*
     * Found by looking rather than by mockup: "Todos os temas →" sat hard left
     * under a centred rule, which is the two dialects arguing inside one band.
     * The chips above it keep their left edge — a list of questions wants one —
     * but a lone link is part of the block's own axis.
     */
    const questions = strip(read("src", "components", "home", "questions-band.tsx"));
    const all = questions.slice(questions.indexOf("`/${locale}/learn`"));
    expect(all.slice(0, 300), "the all-topics link is not centred").toMatch(/mx-auto/);
    const blog = strip(read("src", "components", "home", "latest-post-card.tsx"));
    const allPosts = blog.slice(blog.indexOf("`/${locale}/blog`"));
    expect(allPosts.slice(0, 300), "the all-posts link is not centred").toMatch(/mx-auto/);
  });

  it("opens every band with a full-width seam", () => {
    /*
     * mt-24 and a 9px eyebrow were the only things separating one band from
     * the next — pauses, not boundaries. The seam is the section's top edge,
     * and it lives in BandSpine so every band gets the same one and none can
     * grow its own variant.
     */
    expect(spine, "the seam left BandSpine").toMatch(
      /h-px w-full bg-gradient-to-r from-transparent via-white\/\[0\.08\] to-transparent/,
    );
  });

  it("leaves next-steps alone", () => {
    // Those pages are left-aligned documents throughout; the left header is
    // right there, and this change has no business in them.
    for (const name of ["track-committed", "track-thinking"]) {
      const file = strip(read("src", "components", "next-steps", `${name}.tsx`));
      expect(file, `${name} lost its own header`).toMatch(/BandHeader/);
      /*
       * And barred from the homepage's dialect outright. The first version of
       * this only asserted BandHeader was still present, which a HALF-migrated
       * file passes — swapping the import while leaving the call sites, or the
       * reverse. Absence of BandSpine is the assertion that cannot be half
       * satisfied.
       */
      expect(file, `${name} was dragged into the homepage's dialect`).not.toMatch(/BandSpine/);
    }
  });
});

describe("the hero owns the first screen", () => {
  /*
   * The hero and the ask used to share the first viewport, which put the death
   * counter directly against the question — the exact adjacency METHOD.md's
   * "mortality is a stake, not a lever" warns about. The hero now claims one
   * full screen and everything from the stage block down starts after the fold.
   */
  it("gives the hero a viewport and the rest its own section", () => {
    const sections = shell.match(/<section\b[^>]*>/g) ?? [];
    // Two, exactly: the cue delegates to advanceSection, which moves to the
    // next SECTION boundary — the content section IS that boundary. A third
    // section would become a second tap stop nobody designed.
    expect(sections.length, "the homepage lost its two-section shape").toBe(2);
    expect(sections[0], "the hero no longer claims the first screen").toMatch(/min-h-svh/);
    // svh, not dvh: grace's sections carry the measured record of why — dvh
    // resizes the page under the reader's thumb as the URL bar collapses.
    expect(sections[0], "the hero resizes with the URL bar").not.toMatch(/dvh/);
    expect(sections[1], "the content section grew a viewport claim of its own").not.toMatch(
      /min-h-svh/,
    );
  });

  it("breaks the false bottom with the shared cue, pinned to the hero's foot", () => {
    // A section sized to the viewport exactly, with nothing intruding, reads
    // as the end of the page — grace and the verdict both measured it. Same
    // cue, not a re-invention: one definition is how the shape and the tap
    // stay in agreement everywhere it appears.
    expect(shell).toMatch(/import \{ ScrollCue \} from "@\/components\/shared\/scroll-cue"/);
    expect(shell).toMatch(/<ScrollCue className="mt-auto" \/>/);
    // mt-auto only pushes if the column stretches to the section's bottom edge.
    expect(shell).toMatch(/relative z-\[1\] flex w-full flex-1 flex-col items-center/);
    // The hero reserves the consent banner's height, or the cue sits exactly
    // behind the banner for first-visit readers — screenshotted at 390×844.
    const hero = (shell.match(/<section\b[^>]*>/g) ?? [])[0] ?? "";
    expect(hero, "the cue is behind the consent banner again").toContain("var(--consent-h,0px)");
  });

  it("puts every stage block and band after the fold", () => {
    const secondSectionAt = shell.indexOf("<section", shell.indexOf("<section") + 1);
    expect(secondSectionAt).toBeGreaterThan(-1);
    expect(
      shell.indexOf('data-slot="journey-stage"'),
      "a stage block is back on the hero's screen",
    ).toBeGreaterThan(secondSectionAt);
    expect(
      shell.indexOf("<PassedBand"),
      "a band is back on the hero's screen",
    ).toBeGreaterThan(secondSectionAt);
  });
});

describe("João 3:16 appears once per page", () => {
  it("is the footer's verse, and the homepage does not repeat it", () => {
    /*
     * A ClosingVerse band shipped here and was removed the same day: the
     * footer has carried the identical João 3:16 site-wide all along, so the
     * homepage showed the same verse twice, a few hundred pixels apart. The
     * footer's is the older claim and reaches every page — the band was the
     * duplicate. This guard is what the missing grep would have been.
     */
    expect(shell).not.toMatch(/ClosingVerse|closingVerse/);
    const footer = strip(read("src", "components", "shared", "footer.tsx"));
    expect(footer).toMatch(/\{messages\.scripture\}/);
  });

  it("keeps the band order that ends on the reading plan", () => {
    const order = ["<PassedBand", "<QuestionsBand", "<ReadingBand", "<LatestPostCard"]
      .map((tag) => [tag, shell.indexOf(tag)] as const);
    for (const [tag, at] of order) expect(at, `${tag} is missing`).toBeGreaterThan(-1);
    const positions = order.map(([, at]) => at);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("gives each band room to read as its own section", () => {
    /*
     * mt-14 (56px) was the gap when every band was a plain hairline row —
     * once questions-band and reading-band grew bordered cards and photos,
     * 56px between one card's bottom edge and the next eyebrow read as
     * continuous rather than a break. mt-24 (96px), same value everywhere
     * so the rhythm stays one number, not three that could drift apart.
     */
    for (const name of ["questions-band", "reading-band", "latest-post-card"]) {
      const band = strip(read("src", "components", "home", `${name}.tsx`));
      expect(band, `${name} lost the inter-section gap`).toMatch(/\bmt-24\b/);
      expect(band, `${name} still carries the old 56px gap`).not.toMatch(/\bmt-14\b/);
    }
  });
});
