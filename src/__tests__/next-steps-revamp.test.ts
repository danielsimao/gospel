import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * What came off the two tracks, and must not drift back on.
 *
 * The page was a menu -- seven destinations on the committed track, five on
 * the thinking one -- and every cut here was argued for in
 * docs/superpowers/specs/2026-08-10-next-steps-revamp-design.md. These pin the
 * cuts themselves, because a removed row is exactly the kind of thing a later
 * change restores without noticing.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const committed = strip(read("src", "components", "next-steps", "track-committed.tsx"));
const thinking = strip(read("src", "components", "next-steps", "track-thinking.tsx"));
const en = JSON.parse(read("src", "messages", "en.json"));
const pt = JSON.parse(read("src", "messages", "pt.json"));

describe("the committed track", () => {
  it("no longer sends a new believer to print evangelism cards", () => {
    // Street evangelism on day one is the 'as you grow' of as-you-grow. The
    // route survives; the footer carries it (see the footer test below).
    expect(committed, "the print-cards row came back").not.toMatch(/\/cards/);
    expect(committed).not.toMatch(/streetLinkLabel/);
    expect(committed, "the cards analytics action came back").not.toMatch(/"cards"/);
  });

  it("opens on what God did, not on what the reader just did", () => {
    // The cut paragraph recapped the reader's own decision -- the same
    // restatement removed from grace's first beat on 2026-07-31.
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      const paras = msgs.nextSteps.trackA.whatHappened.split("\n\n");
      expect(paras, `${name} whatHappened should be two beats, not three`).toHaveLength(2);
      expect(
        paras[0],
        `${name} still opens by recapping the reader's decision`,
      ).not.toMatch(/you'?ve made the decision|fizeste a decisão|decidiste/i);
    }
  });

  it("keeps church, but below the day's work", () => {
    // Read, pray, fellowship is the method's own follow-up triad, so the row
    // survives. It just stops competing with the one thing to do today.
    expect(committed, "the church row was removed, not demoted").toMatch(/find-a-church/);
    const growBand = committed.indexOf("messages.bands.grow");
    const church = committed.indexOf("find-a-church");
    expect(growBand, "the grow band header is gone").toBeGreaterThan(-1);
    expect(church, "the church row is still above the grow band").toBeGreaterThan(growBand);
  });

  it("folds the share block behind a disclosure", () => {
    // It was roughly a third of the page, always open, while the reader was
    // being asked to read one chapter.
    expect(committed, "share is not behind a disclosure").toMatch(/aria-expanded=\{shareOpen\}/);
    expect(committed).toMatch(/aria-controls="next-steps-share"/);
  });
});

describe("the thinking track", () => {
  it("does not promise a chat that does not exist", () => {
    // needGod.net has no chat control on the page -- it invites questions by
    // form and by social message -- and it has no Portuguese, so a tu-form
    // reader was being handed an English site at the moment they were
    // promised a conversation. The footer keeps the link.
    expect(thinking, "the needGod row came back").not.toMatch(/needgod/i);
    expect(thinking, "the talk analytics action came back").not.toMatch(/"talk"/);
  });

  it("offers two destinations, not five", () => {
    // John 3 is the reading ask; a seven-day plan alongside it splits the ask.
    expect(thinking, "the reading-plan row came back").not.toMatch(/\/reading-plan/);
    expect(thinking, "a band header with nothing under it came back").not.toMatch(
      /bands\.deeper/,
    );
    expect(thinking, "learn is no longer offered").toMatch(/\/learn/);
  });

  it("keeps the mortality line at the end, after the offer", () => {
    // A stake, not a lever -- it must never sit between a question and its
    // answer (docs/METHOD.md).
    const learn = thinking.indexOf("/learn");
    const comeBack = thinking.indexOf("messages.comeBack");
    expect(comeBack, "the closing line vanished").toBeGreaterThan(-1);
    expect(comeBack, "the mortality line moved above the offer").toBeGreaterThan(learn);
  });
});

describe("the reflection chain", () => {
  it("arms one question at a time and never gates the page", () => {
    // The flow spent fifteen screens teaching one-thing-then-tap. A static
    // list of three breaks that cadence at the moment retention matters.
    expect(thinking, "the chain has no acknowledged cursor").toMatch(
      /const \[acknowledged, setAcknowledged\] = useState\(0\)/,
    );
    expect(thinking, "questions are not buttons, so they cannot be armed").toMatch(
      /<button[\s\S]*?onClick=\{\(\) => setAcknowledged\(i \+ 1\)\}/,
    );
    // Pending items stay readable to a screen reader -- dimmed, not hidden.
    expect(thinking).toMatch(/aria-disabled=\{state !== "armed"\}/);
    expect(thinking, "pending questions were removed from the DOM").not.toMatch(
      /state === "pending" && null/,
    );
  });

  it("carries a hint on the armed question, in both locales", () => {
    expect(thinking).toMatch(/messages\.reflectionHint/);
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      expect(msgs.nextSteps.trackB.reflectionHint, `${name} lost the hint`).toBeTruthy();
    }
  });
});
