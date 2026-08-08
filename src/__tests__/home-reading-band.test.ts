import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The day ticket, and the band that frames it.
 *
 * The ticket's interior — eyebrow, title, verse, step bar — lives in ONE
 * component (shared/day-ticket) consumed by the homepage band and the
 * committed track's Read card, because two hand-kept presentations of the
 * same plan is how the old band-row bands drifted apart. These pin the
 * shared body's design, the band's frame, and that both surfaces actually
 * consume the shared piece rather than a lookalike.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const ticket = strip(read("src", "components", "shared", "day-ticket.tsx"));
const band = strip(read("src", "components", "home", "reading-band.tsx"));
const track = strip(read("src", "components", "next-steps", "track-committed.tsx"));
const en = JSON.parse(read("src", "messages", "en.json"));
const pt = JSON.parse(read("src", "messages", "pt.json"));

describe("the shared day ticket body", () => {
  it("is consumed by both surfaces, not imitated", () => {
    for (const [name, src] of [
      ["the homepage band", band],
      ["the committed track", track],
    ] as const) {
      expect(src, `${name} lost the shared body`).toMatch(
        /import \{ DayTicketBody(, type ReadingDay)? \} from "@\/components\/shared\/day-ticket"/,
      );
      expect(src, `${name} does not render the shared body`).toMatch(/<DayTicketBody/);
    }
  });

  it("says where the reader is in one templated mono line", () => {
    // "Day {n} of {total}" — template-driven so the ticket never hardcodes
    // English, and both locales must keep both placeholders.
    expect(ticket).toMatch(/dayProgress\s*[\s\S]{0,20}\.replace\("\{n\}"/);
    expect(ticket).toMatch(/\.replace\("\{total\}"/);
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
    // was the old row's compromise, not the ticket's.
    expect(ticket).not.toMatch(/trimVerse|VERSE_LIMIT/);
    expect(ticket).toMatch(/border-l border-\[#D4A843\]\/35/);
    expect(ticket).toMatch(/\{day\.keyVerse\}/);
    expect(ticket).toMatch(/\{day\.keyVerseRef\}/);
  });

  it("speaks the step bar, and the finished state still falls out on its own", () => {
    /*
     * Two roles, not three branches: `i < completed` reads solid gold,
     * `i === completed` is today, breathing on the LIVE pulse. With all seven
     * read, no index matches `i === completed`, so the pulse retires and the
     * bar reads solid without a finished branch.
     */
    expect(ticket).toMatch(/days\.map\(\(_, i\) => \(/);
    expect(ticket).toMatch(/i < completed/);
    expect(ticket).toMatch(/i === completed/);
    expect(ticket).toMatch(/animate-pulse motion-reduce:animate-none/);
    expect(ticket, "a finished branch crept in").not.toMatch(/finished \?[^:]*bg-/);
  });

  it("borrows no emblem and no signage face", () => {
    // TopicEmblem is per-topic and this is the plan itself; font-score is
    // scoped to surfaces that declare (home-passed.test.ts pins the same).
    expect(ticket).not.toMatch(/TopicEmblem|BookOpen/);
    expect(ticket).not.toMatch(/font-score/);
  });
});

describe("the homepage band's frame", () => {
  it("is one gold-framed door that lifts like every other pressable surface", () => {
    expect(band).toMatch(/reading-plan/);
    expect(band).toMatch(/border-\[#D4A843\]\/\[0\.16\]/);
    expect(band).toMatch(/hover:-translate-y-0\.5/);
    expect(band).toMatch(/motion-reduce:transition-none/);
  });

  it("retires the continue line with the plan, and only the line", () => {
    // The card still opens the plan for a re-read; only the door line goes.
    expect(band).toMatch(/\{!finished \? \(/);
    expect(band).toMatch(/\{continueLabel\}/);
  });
});
