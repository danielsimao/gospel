import { describe, it, expect } from "vitest";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

/**
 * Mechanical guards on the two locale files.
 *
 * This is the layer that does not need a person. It cannot judge whether the
 * Portuguese reads well — only a Portuguese reader can — but it can hold the
 * things that break silently and that nobody would catch by eye across 1,100
 * strings: a lost placeholder, a string left in English, a verb addressing the
 * reader in the wrong person, a translation that is really a truncation.
 *
 * Everything here is deliberately calibrated against the files as they stand,
 * so a failure means something changed rather than that the rule is too tight.
 */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Flattens to dotted paths, with array indices, so every leaf is addressable. */
function flatten(value: Json, prefix = ""): Array<[string, Json]> {
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => flatten(v, `${prefix}[${i}]`));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      flatten(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [[prefix, value]];
}

const EN = Object.fromEntries(flatten(en as Json));
const PT = Object.fromEntries(flatten(pt as Json));

const strings = (o: Record<string, Json>) =>
  Object.entries(o).filter((e): e is [string, string] => typeof e[1] === "string");

describe("locale key parity", () => {
  it("has exactly the same leaves in both files", () => {
    const enKeys = Object.keys(EN).sort();
    const ptKeys = Object.keys(PT).sort();
    expect(enKeys.filter((k) => !(k in PT))).toEqual([]);
    expect(ptKeys.filter((k) => !(k in EN))).toEqual([]);
  });
});

describe("placeholders", () => {
  const of = (s: string) => [...s.matchAll(/\{[a-zA-Z]+\}/g)].map((m) => m[0]).sort();

  it("survive translation, in both directions", () => {
    // The failure this exists for: if pt's confessionAdmitted lost its {list},
    // the verdict would render "És — pela tua própria confissão." with the
    // reader's own sins missing from their confession, and every other test in
    // this suite would still pass.
    const mismatched: string[] = [];
    for (const [key, value] of strings(EN)) {
      const other = PT[key];
      if (typeof other !== "string") continue;
      const a = of(value).join(",");
      const b = of(other).join(",");
      if (a !== b) mismatched.push(`${key} — en:[${a}] pt:[${b}]`);
    }
    expect(mismatched).toEqual([]);
  });
});

describe("untranslated strings", () => {
  // Values that are legitimately identical: URLs, route slugs, and proper nouns
  // that are the same word in both languages.
  const SHARED = /(?:Url|url|slug)$|^blog\.(label|indexTitle)$|^footer\.(blogLink|needGodLink)$/;

  it("has no English left in the Portuguese file", () => {
    const identical = strings(EN)
      .filter(([key, value]) => PT[key] === value && value.length > 2)
      .map(([key]) => key)
      .filter((key) => !SHARED.test(key));
    expect(identical).toEqual([]);
  });
});

describe("Portuguese address form", () => {
  /*
   * The app speaks to the reader as `tu` throughout — "És um mentiroso", "pela
   * tua própria confissão", "Alguma vez tiraste algo". Third-person forms are
   * correct and common elsewhere in the copy, because much of it is about Jesus
   * rather than to the reader ("pagou", "ressuscitou", "morreu"), so a blanket
   * rule would be useless.
   *
   * The check is therefore scoped: only strings the app says *to the reader
   * about their own action*, against a curated map of the forms that clash.
   * Add to either list when a new reader-addressed key appears.
   */
  const READER_ADDRESSED = [
    "test.answeredBadge",
    "test.justifiedBadge",
    "test.changeAnswerLabel",
    "test.verdict.confessionAdmitted",
    "test.verdict.confessionDenied",
    "test.verdict.confessionBoth",
  ];

  const THIRD_PERSON: Record<string, string> = {
    Admitiu: "Admitiste",
    Negou: "Negaste",
    Mentiu: "Mentiste",
    Roubou: "Roubaste",
    Confessou: "Confessaste",
    Respondeu: "Respondeste",
    Escolheu: "Escolheste",
  };

  it("addresses the reader as tu, never as ele", () => {
    const wrong: string[] = [];
    for (const key of READER_ADDRESSED) {
      const value = PT[key];
      if (typeof value !== "string") continue;
      for (const [third, second] of Object.entries(THIRD_PERSON)) {
        if (new RegExp(`\\b${third}\\b`).test(value)) {
          wrong.push(`${key}: "${value}" — ${third} is third person, want ${second}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it("keeps every reader-addressed key present, so the list above cannot rot", () => {
    for (const key of READER_ADDRESSED) {
      expect(typeof PT[key], `${key} missing from pt.json`).toBe("string");
      expect(typeof EN[key], `${key} missing from en.json`).toBe("string");
    }
  });
});

describe("translation length", () => {
  /*
   * Portuguese runs a little longer than English on average — the measured
   * median here is 1.03 and the 99th percentile 1.43. A ratio far outside that
   * is almost never a stylistic choice; it is a truncated translation or a
   * paragraph pasted twice. The bounds are deliberately loose so only genuine
   * outliers trip them.
   */
  const MIN = 0.45;
  const MAX = 2.0;
  const FLOOR = 25; // short labels swing wildly and mean nothing

  it("stays within plausible bounds for every substantial string", () => {
    const outliers: string[] = [];
    for (const [key, value] of strings(EN)) {
      const other = PT[key];
      if (typeof other !== "string" || value.length < FLOOR) continue;
      const ratio = other.length / value.length;
      if (ratio < MIN || ratio > MAX) {
        outliers.push(`${key} — ratio ${ratio.toFixed(2)} (${value.length} → ${other.length})`);
      }
    }
    expect(outliers).toEqual([]);
  });
});

describe("no empty copy", () => {
  it("has no blank or whitespace-only strings in either locale", () => {
    const blank = [...strings(EN), ...strings(PT)]
      .filter(([, v]) => v.trim() === "")
      .map(([k]) => k);
    expect(blank).toEqual([]);
  });
});
