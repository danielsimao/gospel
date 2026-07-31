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
 * What a run of confession text is. The verdict screen colours `admitted`
 * and `denied` differently: the reader owns the first set and dodged the
 * second, and that difference is the whole reason three separate templates
 * exist. Rendering both in one colour would state the evaded commandments
 * with the same force as the confessed ones.
 */
export type ConfessionTone = "plain" | "admitted" | "denied";

export interface ConfessionSegment {
  text: string;
  tone: ConfessionTone;
}

interface Slot {
  text: string;
  tone: ConfessionTone;
}

/**
 * Splits a template on its `{placeholder}` slots and returns the pieces,
 * substituting each slot's text. Splitting the template BEFORE substitution
 * is what keeps this locale-safe: re-matching label text inside a finished
 * sentence would break on PT's articles, word order, and absent Oxford comma.
 */
function fillTemplate(
  template: string,
  slots: Record<string, Slot>,
): ConfessionSegment[] {
  const keys = Object.keys(slots);
  if (keys.length === 0) return [{ text: template, tone: "plain" }];

  // Keys are our own literals ("list" / "admitted" / "denied") — no escaping
  // needed. The capture group keeps the delimiters in the split output.
  const pattern = new RegExp(`(${keys.map((k) => `\\{${k}\\}`).join("|")})`, "g");

  const segments: ConfessionSegment[] = [];
  for (const part of template.split(pattern)) {
    if (!part) continue;
    const slotName = /^\{(.+)\}$/.exec(part)?.[1];
    const slot = slotName ? slots[slotName] : undefined;
    if (slot) {
      if (slot.text) segments.push({ text: slot.text, tone: slot.tone });
    } else {
      segments.push({ text: part, tone: "plain" });
    }
  }
  return segments;
}

function partitionLabels(answers: Answer[], messages: TestMessages) {
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

  return { honestLabels, justifyLabels };
}

/**
 * Builds the dynamic confession shown on the verdict screen, as tone-tagged
 * runs. Splits answers into honest (admissions) and justify (denials), maps
 * each to a verdict label via i18n, and assembles the sentence from templates.
 */
export function splitConfession(
  answers: Answer[],
  messages: TestMessages,
): ConfessionSegment[] {
  const { honestLabels, justifyLabels } = partitionLabels(answers, messages);
  const { separator, useOxfordComma = false } = messages.verdict;
  const join = (items: string[]) =>
    joinWithSeparator(items, separator, useOxfordComma);

  if (honestLabels.length === 0 && justifyLabels.length === 0) {
    return [{ text: messages.verdict.noneLabel, tone: "plain" }];
  }

  if (justifyLabels.length === 0) {
    return fillTemplate(messages.verdict.confessionAdmitted, {
      list: { text: join(honestLabels), tone: "admitted" },
    });
  }

  if (honestLabels.length === 0) {
    return fillTemplate(messages.verdict.confessionDenied, {
      list: { text: join(justifyLabels), tone: "denied" },
    });
  }

  return fillTemplate(messages.verdict.confessionBoth, {
    admitted: { text: join(honestLabels), tone: "admitted" },
    denied: { text: join(justifyLabels), tone: "denied" },
  });
}

/**
 * How the reader answered a single count.
 *
 * `admitted` is an honest answer — they owned it. `contested` is a
 * justification — they did not. The distinction is the same one
 * splitConfession draws, under the names a record uses for it, and it is the
 * reason the grace record can name a commandment at all: printing "a liar" flat
 * would state as fact something a justifying reader never said.
 */
export type Plea = "admitted" | "contested";

export interface RecordRow {
  /** The commandment key — "9th", "8th" — which orders and identifies the count. */
  commandment: string;
  /** The verdict label, e.g. "a liar". Committed vocabulary, reused verbatim
      rather than re-worded for the record: a second set of nouns for the same
      six charges would be a second vocabulary to keep in step. */
  label: string;
  plea: Plea;
}

/**
 * The reader's own test as a court record: one row per count, in the order they
 * were answered, each carrying how it was answered.
 *
 * This is a second rendering of what the verdict already computes — the same
 * answers, the same labels, the same admitted/denied split — laid out as rows
 * rather than assembled into a sentence. Nothing new is derived here, and
 * nothing is judged: the *finding* is not in this data, because the finding
 * does not depend on the pleas. A reader who contested all six is guilty on all
 * six, which is exactly what the verdict's "by your evasions" already says.
 *
 * Answers whose commandment has no label are skipped, matching partitionLabels
 * — an unlabelled count would otherwise print a blank row.
 */
export function buildRecord(
  answers: Answer[],
  /* Just the labels, not the whole TestMessages that splitConfession takes.
     This needs one map and saying so keeps grace from having to be handed the
     entire message tree to draw six rows. */
  verdictLabels: Record<string, string>,
): RecordRow[] {
  const rows: RecordRow[] = [];
  for (const answer of answers) {
    const label = verdictLabels[answer.commandment];
    if (!label) continue;
    rows.push({
      commandment: answer.commandment,
      label,
      plea: answer.answer === "honest" ? "admitted" : "contested",
    });
  }
  return rows;
}

/**
 * The same confession as a flat string. Delegates to splitConfession so the
 * two can never drift apart.
 */
export function buildConfession(
  answers: Answer[],
  messages: TestMessages,
): string {
  return splitConfession(answers, messages)
    .map((segment) => segment.text)
    .join("");
}
