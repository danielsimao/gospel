import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The reading plan's day ticket.
 *
 * The band inverted its hierarchy around the verse — untrimmed, in the house
 * gold blockquote — under a mono eyebrow that says where the reader is and
 * what it costs in one glance. The dots became the step bar the rest of the
 * page speaks. These pin the pieces that carry that design, and the two-role
 * comparison whose finished state must keep falling out on its own.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const band = strip(read("src", "components", "home", "reading-band.tsx"));
const en = JSON.parse(read("src", "messages", "en.json"));
const pt = JSON.parse(read("src", "messages", "pt.json"));

describe("the reading ticket", () => {
  it("is one gold-framed door that lifts like every other pressable surface", () => {
    expect(band).toMatch(/reading-plan/);
    expect(band).toMatch(/border-\[#D4A843\]\/\[0\.16\]/);
    expect(band).toMatch(/hover:-translate-y-0\.5/);
    expect(band).toMatch(/motion-reduce:transition-none/);
  });

  it("says where the reader is in one templated mono line", () => {
    // "Day {n} of {total}" — template-driven so the band never hardcodes
    // English, and both locales must keep both placeholders.
    expect(band).toMatch(/dayProgress\s*[\s\S]{0,20}\.replace\("\{n\}"/);
    expect(band).toMatch(/\.replace\("\{total\}"/);
    for (const [locale, rp] of [
      ["en", en.readingPlan],
      ["pt", pt.readingPlan],
    ] as const) {
      expect(rp.dayProgress, `${locale} lost the day progress template`).toContain("{n}");
      expect(rp.dayProgress, `${locale} lost the total placeholder`).toContain("{total}");
      expect(rp.continueLabel, `${locale} lost the continue label`).toBeTruthy();
    }
  });

  it("gives the verse the house blockquote, untrimmed, with its reference", () => {
    // The verse is the best line in the card; trimming it at 96 characters
    // was the row's compromise, not the ticket's.
    expect(band).not.toMatch(/trimVerse|VERSE_LIMIT/);
    expect(band).toMatch(/border-l border-\[#D4A843\]\/35/);
    expect(band).toMatch(/\{day\.keyVerse\}/);
    expect(band).toMatch(/\{day\.keyVerseRef\}/);
  });

  it("speaks the step bar, and the finished state still falls out on its own", () => {
    /*
     * Two roles, not three branches: `i < completed` reads solid gold,
     * `i === completed` is today, breathing on the LIVE pulse. With all seven
     * read, no index matches `i === completed`, so the pulse retires and the
     * bar reads solid without a finished branch — the dots' old one-comparison
     * argument, carried into the two-role bar.
     */
    expect(band).toMatch(/days\.map\(\(_, i\) => \(/);
    expect(band).toMatch(/i < completed/);
    expect(band).toMatch(/i === completed/);
    expect(band).toMatch(/animate-pulse motion-reduce:animate-none/);
    expect(band, "a finished branch crept in").not.toMatch(/finished \?[^:]*bg-/);
  });

  it("borrows no emblem and no signage face", () => {
    // The medallion went with the row; the ticket's identity is the verse.
    // TopicEmblem is per-topic and this is the plan itself; font-score is
    // scoped to surfaces that declare (home-passed.test.ts pins the same).
    expect(band).not.toMatch(/TopicEmblem|BookOpen/);
    expect(band).not.toMatch(/font-score/);
  });
});
