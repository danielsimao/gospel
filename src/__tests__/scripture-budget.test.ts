import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * How much Scripture this site reproduces, against what the publisher allows.
 *
 * Thomas Nelson's gratis-use terms for the NKJV permit up to 500 verses in
 * total across the work, provided Scripture is under 25% of the total text and
 * does not amount to an entire book. The 500 is the one a growing site can
 * cross without anyone noticing: nobody writes a blog post thinking about a
 * cumulative verse budget.
 *
 * This counts the PESSIMISTIC figure on purpose. Every verse reference found
 * anywhere is treated as though its full text were reproduced, even though
 * most are bare citations — "(Isaiah 59:2)" reproduces nothing. Measured
 * properly, only about 38 verses are actually quoted. Counting the upper bound
 * means this test can never quietly under-report, and it trips well before a
 * real breach.
 *
 * If it fails: either the site has genuinely grown its Scripture content, in
 * which case count the real figure and consider requesting written permission
 * (HarperCollins publish a form; the turnaround is six to eight weeks), or the
 * ceiling below needs a deliberate, argued increase.
 */

const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

/** The seven passages the reading plan would render in-page at Phase 2. */
const READING_PLAN_VERSES = 145;

/**
 * Ceiling for reference-derived verses plus the reading plan. Deliberately
 * below Thomas Nelson's 500 so there is room to react rather than a wall to
 * hit, and above today's figure so ordinary editing does not trip it.
 */
const CEILING = 450;

const BOOKS =
  "(?:[1-3]\\s)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|" +
  "Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Isaiah|" +
  "Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|" +
  "Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|" +
  "Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|" +
  "Philemon|Hebrews|James|Peter|Jude|Revelation)";
const REFERENCE = new RegExp(`\\b${BOOKS}\\s+\\d+:\\d+(?:[-–]\\d+)?`, "g");

/** Verses a reference spans. "John 3:16" is one; "John 3:16-18" is three. */
function verseSpan(reference: string): number {
  const m = /(\d+):(\d+)(?:[-–](\d+))?$/.exec(reference);
  if (!m) return 1;
  const first = Number(m[2]);
  const last = m[3] ? Number(m[3]) : first;
  return Math.max(1, last - first + 1);
}

function englishSources(): string[] {
  const blogDir = join(ROOT, "src", "content", "blog");
  const blog = readdirSync(blogDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => read("src", "content", "blog", f));
  return [read("src", "messages", "en.json"), ...blog];
}

describe("the NKJV verse budget", () => {
  it("stays clear of the 500-verse gratis allowance", () => {
    const references = new Set<string>();
    for (const source of englishSources()) {
      for (const m of source.matchAll(REFERENCE)) references.add(m[0]);
    }

    const cited = [...references].reduce((n, r) => n + verseSpan(r), 0);
    const total = cited + READING_PLAN_VERSES;

    expect(
      total,
      `Scripture budget: ${cited} verses from ${references.size} references, plus ` +
        `${READING_PLAN_VERSES} for the reading plan, is ${total} against a ceiling of ` +
        `${CEILING} and a publisher limit of 500. See this file's header.`,
    ).toBeLessThanOrEqual(CEILING);
  });

  it("counts a verse range as its whole span, not as one verse", () => {
    // The bug this exists for: treating "John 1:1-18" as a single verse would
    // under-report the reading plan by more than a hundred verses on its own.
    expect(verseSpan("John 3:16")).toBe(1);
    expect(verseSpan("John 1:1-18")).toBe(18);
    expect(verseSpan("John 20:1–31")).toBe(31);
  });
});
