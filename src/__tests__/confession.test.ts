import { describe, it, expect } from "vitest";
import { buildConfession, splitConfession } from "@/lib/confession";
import en from "../messages/en.json";
import pt from "../messages/pt.json";
import type { Answer, TestMessages } from "@/lib/types";

const enTest = en.test as unknown as TestMessages;
const ptTest = pt.test as unknown as TestMessages;

function answer(commandment: string, kind: "honest" | "justify"): Answer {
  return { questionId: 1, answer: kind, commandment, scoreChange: -12, timeOnQuestion: 0 };
}

describe("buildConfession — EN grammar", () => {
  it("admitted-only joins with Oxford comma and correct articles", () => {
    const text = buildConfession(
      [answer("9th", "honest"), answer("8th", "honest"), answer("7th", "honest")],
      enTest,
    );
    expect(text).toContain("a liar, a thief, and an adulterer");
    // Never a bare-article vowel clash like "a adulterer" / "a idolater"
    expect(text).not.toMatch(/\ba (adulterer|idolater)\b/);
  });

  it("two admitted items join without a comma", () => {
    const text = buildConfession([answer("9th", "honest"), answer("1st", "honest")], enTest);
    expect(text).toContain("a liar and an idolater");
  });

  it("single admitted item stands alone", () => {
    const text = buildConfession([answer("7th", "honest")], enTest);
    expect(text).toContain("an adulterer");
    expect(text).not.toContain(",");
  });

  it("denied-only uses the evasions template", () => {
    const text = buildConfession([answer("8th", "justify")], enTest);
    expect(text).toBe(enTest.verdict.confessionDenied.replace("{list}", "a thief"));
  });

  it("mixed uses both clauses", () => {
    const text = buildConfession(
      [answer("9th", "honest"), answer("8th", "justify")],
      enTest,
    );
    expect(text).toContain("a liar");
    expect(text).toContain("a thief");
    expect(text).toBe(
      enTest.verdict.confessionBoth
        .replace("{admitted}", "a liar")
        .replace("{denied}", "a thief"),
    );
  });

  it("no answers falls back to noneLabel", () => {
    expect(buildConfession([], enTest)).toBe(enTest.verdict.noneLabel);
  });

  it("unknown commandment keys are skipped, not rendered as undefined", () => {
    const text = buildConfession([answer("99th", "honest"), answer("9th", "honest")], enTest);
    expect(text).not.toContain("undefined");
    expect(text).toContain(enTest.verdictLabels["9th"]);
  });
});

describe("buildConfession — PT grammar", () => {
  it("joins with 'e' and no serial comma", () => {
    const labels = ["9th", "8th", "7th"].map((c) => ptTest.verdictLabels[c]);
    const text = buildConfession(
      [answer("9th", "honest"), answer("8th", "honest"), answer("7th", "honest")],
      ptTest,
    );
    expect(text).toContain(`${labels[0]}, ${labels[1]} ${ptTest.verdict.separator} ${labels[2]}`);
    // PT (no Oxford comma): never ", e " before the final item
    expect(text).not.toContain(`, ${ptTest.verdict.separator} `);
  });

  it("every PT verdict label is a non-empty string for the 8 asked commandments", () => {
    for (const c of ["9th", "8th", "7th", "6th", "3rd", "10th", "1st", "5th"]) {
      expect(ptTest.verdictLabels[c], `label for ${c}`).toBeTruthy();
    }
  });
});

describe("splitConfession — tone tagging", () => {
  const toned = (segs: ReturnType<typeof splitConfession>, tone: string) =>
    segs.filter((s) => s.tone === tone).map((s) => s.text);

  it.each([["en", enTest], ["pt", ptTest]] as const)(
    "%s: segments rejoin to exactly the buildConfession string",
    (_locale, messages) => {
      const answers = [
        answer("9th", "honest"),
        answer("8th", "justify"),
        answer("7th", "honest"),
        answer("3rd", "justify"),
      ];
      const segs = splitConfession(answers, messages);
      expect(segs.map((s) => s.text).join("")).toBe(
        buildConfession(answers, messages),
      );
    },
  );

  it("mixed answers tag admitted and denied separately", () => {
    const segs = splitConfession(
      [answer("9th", "honest"), answer("8th", "justify")],
      enTest,
    );
    expect(toned(segs, "admitted")).toEqual(["a liar"]);
    expect(toned(segs, "denied")).toEqual(["a thief"]);
    // The connective prose must survive as plain text, not get swallowed
    expect(toned(segs, "plain").join("")).toContain("by your own admission");
    expect(toned(segs, "plain").join("")).toContain("by your evasions");
  });

  it("admitted-only produces no denied segment", () => {
    const segs = splitConfession(
      [answer("9th", "honest"), answer("7th", "honest")],
      enTest,
    );
    expect(toned(segs, "admitted")).toEqual(["a liar and an adulterer"]);
    expect(toned(segs, "denied")).toEqual([]);
  });

  it("denied-only tags its list as denied, never admitted", () => {
    const segs = splitConfession([answer("8th", "justify")], enTest);
    expect(toned(segs, "denied")).toEqual(["a thief"]);
    expect(toned(segs, "admitted")).toEqual([]);
  });

  it("no answers yields a single plain segment", () => {
    expect(splitConfession([], enTest)).toEqual([
      { text: enTest.verdict.noneLabel, tone: "plain" },
    ]);
  });

  it("never emits an empty segment", () => {
    const segs = splitConfession(
      [answer("9th", "honest"), answer("8th", "justify")],
      enTest,
    );
    expect(segs.every((s) => s.text.length > 0)).toBe(true);
  });

  it("PT keeps its articles inside the toned run, not the plain prose", () => {
    const segs = splitConfession(
      [answer("9th", "honest"), answer("8th", "justify")],
      ptTest,
    );
    expect(toned(segs, "admitted")).toEqual([ptTest.verdictLabels["9th"]]);
    expect(toned(segs, "denied")).toEqual([ptTest.verdictLabels["8th"]]);
  });
});
