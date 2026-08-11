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
      /<button[\s\S]*?setAcknowledged\(i \+ 1\)/,
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

describe("reachability after the cuts", () => {
  const footer = strip(read("src", "components", "shared", "footer.tsx"));

  it("keeps /cards reachable now that the track no longer links it", () => {
    // /cards is noindex and absent from the sitemap, so this is not an SEO
    // question -- without an internal link the page is reachable only by
    // typing the URL.
    expect(footer, "/cards has no internal link anywhere").toMatch(/\/cards/);
    expect(footer).toMatch(/messages\.cardsLink/);
  });

  it("keeps needGod in the footer after removing it from the track", () => {
    expect(footer, "the needGod link left the footer too").toMatch(/needGodUrl/);
  });

  it("has no locale keys left orphaned by the cuts", () => {
    for (const [name, msgs] of [["en", en], ["pt", pt]] as const) {
      const a = msgs.nextSteps.trackA;
      const b = msgs.nextSteps.trackB;
      expect(a.streetLinkLabel, `${name} trackA.streetLinkLabel is orphaned`).toBeUndefined();
      expect(b.talkLabel, `${name} trackB.talkLabel is orphaned`).toBeUndefined();
      expect(b.talkLink, `${name} trackB.talkLink is orphaned`).toBeUndefined();
      expect(b.talkUrl, `${name} trackB.talkUrl is orphaned`).toBeUndefined();
      expect(b.readingPlanLabel, `${name} trackB.readingPlanLabel is orphaned`).toBeUndefined();
      expect(b.bands.deeper, `${name} trackB.bands.deeper is orphaned`).toBeUndefined();
      expect(msgs.footer.cardsLink, `${name} footer.cardsLink is missing`).toBeTruthy();
    }
  });
});

describe("the transition into next steps", () => {
  const invitation = strip(read("src", "components", "invitation-screen.tsx"));

  it("lets the door respond to the commitment, over the length of the hold", () => {
    // The door has sat behind this screen at 35% since it shipped and has
    // never responded to anything. Nothing announces the change -- the seam's
    // gold resolution does not announce itself either.
    expect(invitation, "the door does not react to the answer").toMatch(
      /committed \? "scale-\[1\.04\] opacity-\[0\.5\]" : "opacity-\[0\.35\]"/,
    );
    expect(invitation, "the door's change is not the length of the hold").toMatch(
      /duration-\[2000ms\]/,
    );
  });

  it("respects reduced motion on the door", () => {
    expect(invitation).toMatch(/motion-reduce:transition-none/);
  });

  it("carries the light into the arrival", () => {
    expect(committed, "the committed opener lost its dawn").toMatch(/data-dawn/);
  });
});

describe("the reflection chain cannot be driven out of turn", () => {
  it("guards the handler rather than trusting CSS and tabindex", () => {
    /*
     * Found in review: aria-disabled announces a state, it does not enforce
     * one. A done item had no pointer-events-none at all, so clicking the
     * first question after reaching the third rewound the chain; and pointer
     * hit-testing is not consulted by .click(), voice control, or activation
     * from the accessibility tree, so a pending item could be jumped to.
     */
    expect(thinking, "the click handler trusts CSS to keep it unreachable").toMatch(
      /if \(state !== "armed"\) return;/,
    );
  });
});
