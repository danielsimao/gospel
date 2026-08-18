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
  "Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|" +
  "Song of Solomon|Isaiah|" +
  "Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|" +
  "Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|" +
  "Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|" +
  "Philemon|Hebrews|James|Peter|Jude|Revelation)";
/**
 * A reference plus every comma/semicolon continuation glued to it: "John
 * 3:16, 18" and "John 3:16; 4:5" are one match apiece, not one match that
 * silently drops its own tail. A continuation segment is either a bare verse
 * number (comma — same chapter as the segment before it) or a chapter:verse
 * pair (semicolon — a new chapter, same book), each optionally its own dash
 * range.
 */
const REFERENCE = new RegExp(
  `\\b${BOOKS}\\s+\\d+:\\d+(?:[-–](?:\\d+:)?\\d+)?` +
    `(?:[,;]\\s*(?:\\d+:)?\\d+(?:[-–](?:\\d+:)?\\d+)?)*`,
  "g",
);

// Psalm 119 is the longest chapter in the Bible at 176 verses. There is no
// per-book chapter-length table in this file, so a dash range that crosses a
// chapter boundary — "John 3:16-4:2" — rounds every verse it cannot count
// exactly (the rest of the starting chapter, and any whole chapter in
// between) up to this ceiling instead of guessing. Overcounts a cross-chapter
// range; never undercounts one.
const MAX_CHAPTER_VERSES = 176;

/** Verses a single chapter:verse segment spans, e.g. "John 3:16" (one),
    "John 1:1-18" (eighteen, same chapter), or "John 3:16-4:2" (pessimistic,
    see MAX_CHAPTER_VERSES — the dash's far side names a different chapter). */
function verseSpan(reference: string): number {
  const m = /(\d+):(\d+)(?:[-–](?:(\d+):)?(\d+))?$/.exec(reference);
  if (!m) return 1;
  const startVerse = Number(m[2]);
  if (!m[4]) return 1;
  const endVerse = Number(m[4]);
  if (!m[3]) return Math.max(1, endVerse - startVerse + 1);
  const startChapter = Number(m[1]);
  const endChapter = Number(m[3]);
  const spannedChapters = Math.max(0, endChapter - startChapter - 1);
  return (
    (MAX_CHAPTER_VERSES - startVerse + 1) + spannedChapters * MAX_CHAPTER_VERSES + endVerse
  );
}

/** Sums a whole reference, continuations included. Each comma/semicolon
    segment is handed to verseSpan on its own, with a bare verse number
    ("18" after a comma) rewritten against the chapter the segment before it
    was in — the continuation carries no book name to anchor a match on. */
function referenceSpan(reference: string): number {
  const segments = reference.split(/[,;]\s*/);
  let currentChapter = "";
  let total = 0;
  for (const segment of segments) {
    const hasChapter = segment.split(/[-–]/)[0].includes(":");
    if (hasChapter) {
      currentChapter = /(\d+):/.exec(segment)![1];
      total += verseSpan(segment);
    } else {
      total += verseSpan(`${currentChapter}:${segment}`);
    }
  }
  return total;
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

    const cited = [...references].reduce((n, r) => n + referenceSpan(r), 0);
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

  it("counts every reference in a comma or semicolon list, not just the first", () => {
    // "John 3:16, 18" and "John 3:16; 4:5" used to match only the leading
    // "John 3:16" — the trailing "18" / "4:5" carry no book name of their
    // own, so REFERENCE never saw them.
    expect([..."Isaiah 40:6, 8".matchAll(REFERENCE)].map((m) => m[0])).toEqual([
      "Isaiah 40:6, 8",
    ]);
    expect(referenceSpan("Isaiah 40:6, 8")).toBe(2);
    expect(referenceSpan("John 3:16; 4:5")).toBe(2);
    expect(referenceSpan("Psalm 23:1, 4-6")).toBe(4);
  });

  it("rounds a cross-chapter range up rather than reading it as one verse", () => {
    // "John 3:16-4:2" used to match verseSpan's same-chapter pattern, which
    // read the "2" after the second dash as a verse in chapter 3 and
    // reported a span of one.
    expect(verseSpan("John 3:16-4:2")).toBeGreaterThan(1);
    expect(verseSpan("John 3:16-4:2")).toBe(MAX_CHAPTER_VERSES - 16 + 1 + 2);
  });

  it("recognises Song of Solomon", () => {
    expect("Song of Solomon 2:1").toMatch(REFERENCE);
  });
});

describe("the Portuguese reading links", () => {
  it("send a reader in Portugal to the Portugal edition", () => {
    /*
     * The site quotes Almeida Corrigida Fiel, which YouVersion does not carry
     * -- verified 2026-08-11, 17 Portuguese versions listed and no ACF -- so
     * outbound links fall back to Almeida Revista e Corrigida. That fallback
     * is forced and fine. What was not fine: it pointed at version 212, the
     * BRAZILIAN ARC (Sociedade Bíblica do Brasil), on a tu-form site written
     * for readers in Portugal. The Portugal edition is 215.
     */
    const pt = readFileSync(join(ROOT, "src", "messages", "pt.json"), "utf8");
    expect(pt, "a reading link points at the Brazilian ARC again").not.toMatch(
      /bible\.com\/bible\/212\//,
    );
    expect([...pt.matchAll(/bible\.com\/bible\/(\d+)\//g)].map((m) => m[1]))
      .toEqual(Array(9).fill("215"));
  });

  it("keeps English on the translation it quotes", () => {
    // English is the simple case: it quotes NKJV and links to NKJV (114).
    const en = readFileSync(join(ROOT, "src", "messages", "en.json"), "utf8");
    expect([...en.matchAll(/bible\.com\/bible\/(\d+)\//g)].map((m) => m[1]))
      .toEqual(Array(9).fill("114"));
  });
});

describe("the Portuguese scripture is quoted, not respelled", () => {
  it("keeps ACF's own orthography in quoted text", () => {
    /*
     * Owner ruling 2026-08-11: ACF stays, Brazilian orthography and all. It is
     * Sociedade Bíblica Trinitariana do Brasil's edition, and its spelling is
     * the price of a 1,100-verse allowance that needs nobody's permission.
     *
     * This exists because "unigênito" looks like a typo on a European
     * Portuguese site and a well-meaning pass would fix it -- which would
     * misquote the translation the footer credits. The app's own prose stays
     * European; quoted scripture is not ours to spell.
     */
    const pt = readFileSync(join(ROOT, "src", "messages", "pt.json"), "utf8");
    expect(pt, "ACF's unigênito was respelled to the European form").not.toMatch(
      /unigénito/,
    );
    expect(pt, "the ACF spelling vanished from quoted scripture").toMatch(/unigênito/);
  });
});
