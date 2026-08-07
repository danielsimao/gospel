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
const BANDS = ["passed-band", "questions-band", "reading-band"] as const;

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
