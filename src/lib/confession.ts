import type { Answer, TestMessages } from "./types";

/**
 * Joins a list of labels with commas and a final separator ("and" / "e").
 * EN (Oxford comma): ["liar", "thief", "adulterer"] + "and" → "liar, thief, and adulterer"
 * PT (no serial comma): ["mentiroso", "ladrao", "adultero"] + "e" → "mentiroso, ladrao e adultero"
 * 2 items: ["liar", "thief"] + "and" → "liar and thief"
 * 1 item: ["liar"] → "liar"
 */
function joinWithSeparator(
  items: string[],
  separator: string,
  useOxfordComma: boolean,
): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} ${separator} ${items[1]}`;
  const head = items.slice(0, -1).join(", ");
  const tail = items[items.length - 1];
  return useOxfordComma
    ? `${head}, ${separator} ${tail}`
    : `${head} ${separator} ${tail}`;
}

/**
 * Builds the dynamic confession prose shown on the verdict screen.
 * Splits answers into honest (admissions) and justify (denials), maps each
 * to a verdict label via i18n, and assembles the sentence from templates.
 */
export function buildConfession(
  answers: Answer[],
  messages: TestMessages,
): string {
  const honestLabels: string[] = [];
  const justifyLabels: string[] = [];

  for (const answer of answers) {
    const label = messages.verdictLabels[answer.commandment];
    if (!label) continue;
    if (answer.answer === "honest") {
      honestLabels.push(label);
    } else {
      justifyLabels.push(label);
    }
  }

  const { separator, useOxfordComma = false } = messages.verdict;

  if (honestLabels.length === 0 && justifyLabels.length === 0) {
    return messages.verdict.noneLabel;
  }

  if (honestLabels.length > 0 && justifyLabels.length === 0) {
    return messages.verdict.confessionAdmitted.replace(
      "{list}",
      joinWithSeparator(honestLabels, separator, useOxfordComma),
    );
  }

  if (honestLabels.length === 0 && justifyLabels.length > 0) {
    return messages.verdict.confessionDenied.replace(
      "{list}",
      joinWithSeparator(justifyLabels, separator, useOxfordComma),
    );
  }

  return messages.verdict.confessionBoth
    .replace(
      "{admitted}",
      joinWithSeparator(honestLabels, separator, useOxfordComma),
    )
    .replace(
      "{denied}",
      joinWithSeparator(justifyLabels, separator, useOxfordComma),
    );
}
