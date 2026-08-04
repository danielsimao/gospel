import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildRecord } from "@/lib/confession";
import type { Answer } from "@/lib/types";

/**
 * The court record grace shows after the argument.
 *
 * Unlike most of this suite these are real behavioural tests, because
 * buildRecord is a pure function — the thing worth pinning is what it does with
 * the reader's answers, not how the JSX around it is written.
 *
 * The case that shaped the design is a reader who justified all six. A record
 * that printed "Count I — a liar" flat would state as established fact
 * something they never said, which docs/METHOD.md forbids in as many words:
 * "Evasions are recorded, not dismissed." So the record carries a plea, and the
 * finding does not depend on it.
 */
const LABELS: Record<string, string> = {
  "9th": "a liar",
  "8th": "a thief",
  "7th": "an adulterer",
  "6th": "a murderer at heart",
  "3rd": "a blasphemer",
  "1st": "an idolater",
};

const COMMANDMENTS = ["9th", "8th", "7th", "6th", "3rd", "1st"];

function answers(kinds: Array<"honest" | "justify">): Answer[] {
  return kinds.map((answer, i) => ({
    questionId: i + 1,
    answer,
    commandment: COMMANDMENTS[i]!,
    scoreChange: -10,
    timeOnQuestion: 1000,
  }));
}

const ALL = (kind: "honest" | "justify") => answers(new Array(6).fill(kind));

describe("buildRecord", () => {
  it("marks an honest answer admitted and a justification contested", () => {
    expect(buildRecord(ALL("honest"), LABELS).map((r) => r.plea)).toEqual(
      new Array(6).fill("admitted"),
    );
    expect(buildRecord(ALL("justify"), LABELS).map((r) => r.plea)).toEqual(
      new Array(6).fill("contested"),
    );
  });

  it("still names every count when the reader contested all six", () => {
    // The evasion does not erase the charge — it changes what the reader said
    // about it. "You are a liar, a thief… — by your evasions" is the sentence
    // the verdict already builds from the same answers.
    const rows = buildRecord(ALL("justify"), LABELS);
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.label)).toEqual([
      "a liar",
      "a thief",
      "an adulterer",
      "a murderer at heart",
      "a blasphemer",
      "an idolater",
    ]);
  });

  it("keeps each count with its own plea when the answers are mixed", () => {
    const rows = buildRecord(
      answers(["honest", "justify", "honest", "justify", "justify", "honest"]),
      LABELS,
    );
    expect(rows.map((r) => `${r.commandment}:${r.plea}`)).toEqual([
      "9th:admitted",
      "8th:contested",
      "7th:admitted",
      "6th:contested",
      "3rd:contested",
      "1st:admitted",
    ]);
  });

  it("keeps the order the reader answered in", () => {
    const rows = buildRecord(ALL("honest"), LABELS);
    expect(rows.map((r) => r.commandment)).toEqual(COMMANDMENTS);
  });

  it("skips a count it has no charge for rather than printing a blank row", () => {
    // Matches partitionLabels. A commandment with no label in this locale would
    // otherwise render an empty line in the middle of a court record.
    const rows = buildRecord(ALL("honest"), { "9th": "a liar" });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe("a liar");
  });

  it("reads the charges from the same map the verdict's confession uses", () => {
    // Not a second vocabulary. If the record ever grew its own nouns —
    // "Falsehood", "Theft" — they would drift from the confession sentence, and
    // the six labels are committed vocabulary.
    const en = JSON.parse(
      readFileSync(join(import.meta.dirname, "..", "messages", "en.json"), "utf8"),
    );
    const rows = buildRecord(ALL("honest"), en.test.verdictLabels);
    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.label).toBe(en.test.verdictLabels[row.commandment]);
    }
  });
});

describe("what the record refuses to show", () => {
  const record = readFileSync(
    join(import.meta.dirname, "..", "components", "grace-record.tsx"),
    "utf8",
  );
  const code = record.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("never renders the score", () => {
    // Six honest answers drain 100 to 0; six justifications drain 49, leaving
    // 51. Printing that turns a conviction into a grade and invites the reader
    // to compare themselves with someone worse — which is the instinct the six
    // questions exist to close, and why the self-rating is testimony and never
    // a measurement.
    expect(code).not.toMatch(/\bscore\b/i);
    expect(code).not.toMatch(/INITIAL_SCORE|scoreChange/);
  });

  it("gives the record a real table so the structure survives without sight", () => {
    expect(code).toContain("<table");
    expect(code).toContain('scope="col"');
    expect(code).toContain('scope="row"');
  });

  it("hides the stamp from assistive technology and says it in text instead", () => {
    // The stamp is a rotated graphic repeating the line beneath it. Announced,
    // it would arrive twice and out of reading order.
    expect(code).toMatch(/aria-hidden="true"[\s\S]{0,400}messages\.paid/);
    expect(code).toMatch(/className="sr-only">\{messages\.paid\}/);
  });
});
