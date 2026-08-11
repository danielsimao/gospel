import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Reading links open in the same tab.
 *
 * Every link that sends a reader to Scripture used to carry target="_blank".
 * Nothing recorded that as a decision — no comment, no test — and it is the
 * thing that broke the way back: a new tab leaves the reader to find their
 * way home, the Back button does nothing, and on a phone the original tab is
 * buried behind whatever else is open. The reader's one job is the chapter,
 * and the journey they were on is what they return to afterwards.
 *
 * This was very nearly solved the expensive way. A design to render all 145
 * verses of the plan in-page — new route handler, hand-transcribed text in two
 * translations, licensing diligence — was written and reviewed before someone
 * pointed out that the hazard it existed to fix was four attributes.
 *
 * The plan's own "mark as read" is what makes same-tab matter here: a reader
 * who cannot get back cannot mark the day, and the streak silently stalls.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

const SURFACES = [
  ["the committed track's Read door", ["src", "components", "next-steps", "track-committed.tsx"]],
  ["the thinking track's John 3 link", ["src", "components", "next-steps", "track-thinking.tsx"]],
  ["a reading-plan day card", ["src", "components", "reading-plan", "day-card.tsx"]],
  ["the plan's continue-reading door", ["src", "components", "reading-plan", "reading-plan.tsx"]],
] as const;

describe("scripture links keep the way back", () => {
  it("never opens a reading link in a new tab", () => {
    for (const [name, path] of SURFACES) {
      expect(read(...path), `${name} opens in a new tab again`).not.toMatch(
        /target="_blank"/,
      );
    }
  });

  it("still sends the reader somewhere", () => {
    // The guard above passes trivially if a link is deleted rather than
    // retargeted, so pin that each surface still carries an outbound door.
    for (const [name, path] of SURFACES) {
      expect(read(...path), `${name} lost its outbound link entirely`).toMatch(
        /href=\{?(messages\.\w+|readHref|`[^`]*`)/,
      );
    }
  });
});
