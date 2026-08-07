import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HOME_QUESTIONS_MOBILE } from "@/lib/home-questions";

/**
 * The questions band's hybrid: a real cover where one shipped, the reading
 * band's medallion where one hasn't. One column, not a grid — a photo tile
 * and a text row have no shape in common, so nothing has to reconcile them.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const band = strip(read("src", "components", "home", "questions-band.tsx"));

describe("the questions band's hybrid rows", () => {
  it("branches on the same hasTopicCover every /learn page uses", () => {
    expect(band).toMatch(/import \{ hasTopicCover \} from "@\/components\/learn\/topic-cover"/);
    expect(band).toMatch(/hasTopicCover\(q\.slug\) \? \(/);
  });

  it("drops the two-column grid — mixed row heights don't share a shape", () => {
    expect(band).not.toMatch(/grid-cols-1/);
    expect(band).not.toMatch(/sm:grid-cols-2/);
    expect(band).toMatch(/flex flex-col gap-2/);
  });

  it("the photo row carries the covers' own asset pair and attributes", () => {
    expect(band).toMatch(/graphics\/covers\/\$\{q\.slug\}\.avif/);
    expect(band).toMatch(/graphics\/covers\/\$\{q\.slug\}\.webp/);
    expect(band).toMatch(/loading="lazy"/);
    expect(band).toMatch(/decoding="async"/);
    expect(band).toMatch(/aspect-\[2\.6\/1\]/);
  });

  it("the medallion row still resolves a real per-topic emblem", () => {
    expect(band).toMatch(/<TopicEmblem slug={q\.slug}/);
  });

  it("hides the same count on mobile regardless of row type", () => {
    // Two different display values (block for a photo tile, flex for a
    // medallion row) — both must gate on the same index so the mobile/desktop
    // cut stays one decision, not two that could drift apart.
    expect(band).toMatch(/hidden \? "hidden sm:block" : ""/);
    expect(band).toMatch(/hidden \? "hidden sm:flex" : ""/);
    expect(band.match(/const hidden = i >= HOME_QUESTIONS_MOBILE;/g)?.length).toBe(1);
  });
});

describe("HOME_QUESTIONS_MOBILE", () => {
  it("matches its own doc comment — the four covered by 'the first four'", () => {
    // home-questions.ts's comment claimed four before the constant agreed;
    // does-god-exist (a covered topic) sits at index 3 and needs the fourth
    // slot to reach a phone at all.
    // Deliberately unstripped: the claim under test lives inside the JSDoc
    // block that strip() exists to remove everywhere else.
    const src = read("src", "lib", "home-questions.ts");
    expect(src).toMatch(/the first four/);
    expect(src).toMatch(/are the only ones a phone shows/);
    expect(HOME_QUESTIONS_MOBILE).toBe(4);
  });
});
