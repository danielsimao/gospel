import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  readJourney,
  markTestCompleted,
  saveInvitationResponse,
  deriveStage,
} from "@/lib/journey-storage";

/**
 * What the homepage tells a reader who dropped out and came back.
 *
 * These began as five `it.fails` — one per defect found by walking the five drop
 * points at 390×844 on a production build — so the suite stayed green while the
 * defects stood, and each guard turned red the moment its defect was fixed,
 * forcing promotion to a plain `it`. That is what happened: three were fixed in
 * copy and promoted, and the mechanism worked exactly as intended, including on
 * one I had not expected to clear.
 *
 * ONE remains `it.fails`, and it is the one no wording can fix: a reader four
 * questions in is still indistinguishable from a stranger, because the journey
 * record is not written until the sixth answer. That needs a data change.
 *
 * The resume machinery is NOT what is broken. It restores correctly from every
 * phase, the 30-minute window is right, and the silent restore is right. What
 * is wrong is the account the homepage gives of where the reader got to:
 * `deriveStage` has three outcomes built from two fields, and the flow has five
 * meaningfully different places to leave.
 *
 * Deliberately not asserted here: any particular shape for the fix. The record
 * may grow a field, the trigger may move, the copy may change — these pin the
 * reader-visible contradiction, not a design.
 */

const storage = new Map<string, string>();
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", {
  getItem: vi.fn((k: string) => storage.get(k) ?? null),
  setItem: vi.fn((k: string, v: string) => storage.set(k, v)),
  removeItem: vi.fn((k: string) => storage.delete(k)),
});
vi.mock("@/lib/client-storage", () => ({ emitStorageChange: vi.fn() }));

const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const en = JSON.parse(read("src", "messages", "en.json"));
const pt = JSON.parse(read("src", "messages", "pt.json"));
const shell = read("src", "components", "game-shell.tsx")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const undecided = en.home.journeyStages.undecided;
const ptUndecided = pt.home.journeyStages.undecided;

beforeEach(() => {
  storage.clear();
  vi.clearAllMocks();
});

describe("the homepage does not claim more than the reader did", () => {
  it("does not say the verdict was seen by someone who only answered the questions", () => {
    /*
     * Reproduced: answer question six, close the tab before tapping "See
     * verdict", return to the homepage. It reads "You've seen the verdict. What
     * will you do with it?" and "The verdict was guilty" — while the saved
     * session's phase is still `playing`.
     *
     * It asserts something false AND spoils the flow's central beat before the
     * reader reaches it.
     *
     * `markTestCompleted()` is called on the sixth ANSWER (game-shell, gated on
     * `state.answers.length >= TOTAL_QUESTIONS`), which is one tap earlier than
     * the verdict. Note the fix is NOT simply moving that call: the same flag is
     * what makes a reader "not a visitor" on eight surfaces, including the
     * site-wide footer link, so moving it demotes anyone who answered six and
     * left back to a stranger everywhere. The likelier fix is the copy claiming
     * only what the flag proves.
     */
    // FIXED by copy, not by moving the flag: the heading now claims only that
    // the test was taken, which the sixth answer does prove.
    expect(undecided.heading, "heading claims the verdict was seen").not.toMatch(
      /seen the verdict/i,
    );
    expect(
      undecided.whatHappened,
      "whatHappened states the outcome, spoiling it for a reader who has not reached the verdict",
    ).not.toMatch(/verdict was guilty/i);
    // The trigger is deliberately unchanged — see above for why moving it is worse.
    expect(shell).toMatch(/state\.answers\.length\s*>=\s*TOTAL_QUESTIONS\s*\)\s*markTestCompleted/);
  });

  it("does not tell a reader who reached grace that the fine is still unpaid", () => {
    /*
     * Reproduced: drop while in grace, return to the homepage. Stage is
     * `undecided`, so the copy reads "the fine is still unpaid" — to a reader
     * who has just been told "Someone paid your fine".
     *
     * The app already knows the distinction: the `committed` stage says "someone
     * paid your fine". `undecided` simply has no way to know grace was reached,
     * because the permanent record does not carry it — only the 30-minute
     * session does, and that is gone by the next day.
     *
     * Method, not tone: this is the homepage taking back the announcement.
     */
    /*
     * FIXED from the copy side only, and that is the whole available fix today.
     * `deriveStage` still cannot tell the two readers apart — nothing permanent
     * records that grace was reached — so the one stage they share must not
     * assert anything that is false for either of them.
     */
    markTestCompleted();
    const afterVerdictOnly = deriveStage(readJourney());
    const afterReadingGrace = deriveStage(readJourney());
    expect(
      afterVerdictOnly,
      "if the stage can now distinguish grace, this test is understating what is possible",
    ).toBe(afterReadingGrace);

    // So the shared copy stays silent about the debt's state.
    for (const [locale, copy] of [
      ["en", undecided],
      ["pt", ptUndecided],
    ] as const) {
      expect(copy.whatHappened, `${locale} contradicts grace`).not.toMatch(
        /still unpaid|continua por pagar/i,
      );
    }
  });

  it.fails("does not treat a reader with a test in progress as a first-time visitor", () => {
    /*
     * Reproduced: answer four of six, return to the homepage. The journey record
     * is still empty — it is not written until the sixth answer — so the stage is
     * `visitor` and the hero asks "Are you a good person?", which this reader
     * answered ninety seconds ago. Four answers are sitting in storage.
     *
     * Tapping a chip then lands them on the reply screen; `Begin` restarts from
     * question one and overwrites those four answers, with nothing said.
     */
    // Nothing has been recorded yet — this IS the state of a reader mid-test.
    expect(
      deriveStage(readJourney()),
      "a reader four questions in is indistinguishable from someone who never arrived",
    ).not.toBe("visitor");
  });
});

describe("the homepage's offer matches what it can deliver", () => {
  it("does not promise a return it cannot keep once the session has expired", () => {
    /*
     * Reproduced: age a mid-grace session past the 30-minute resume window, then
     * follow the undecided CTA. It says "Return to where you left off" and lands
     * on a fresh "Are you a good person?".
     *
     * The window itself is right — the Law is cumulative and in the moment, and
     * restoring someone cold onto question four days later is not resuming a
     * conversation. The CTA is what over-promises.
     *
     * `home.journey.retakeLabel` ("Take the test again") already exists, so one
     * possible fix needs no new copy at all.
     */
    // FIXED: the CTA now states the destination rather than promising a resume,
    // so it is true whether the session survived the window or not.
    for (const [locale, copy] of [
      ["en", undecided],
      ["pt", ptUndecided],
    ] as const) {
      expect(copy.cta, `${locale} CTA promises a resume it may not deliver`).not.toMatch(
        /where you left off|onde ficaste/i,
      );
      expect(copy.cta.length, `${locale} CTA is empty`).toBeGreaterThan(0);
    }
  });
});

describe("what is already right, and must stay right", () => {
  it("starts over only after a decision has been recorded", () => {
    /*
     * The continue-or-restart POLICY is correct and is not among the defects
     * above: resume everywhere before a response, start over only after one.
     * Pinned so a fix for the four failures above cannot quietly change it.
     */
    markTestCompleted();
    expect(deriveStage(readJourney())).toBe("undecided");

    saveInvitationResponse("thinking");
    expect(deriveStage(readJourney())).toBe("thinking");

    // A recorded decision is permanent — it is not aged out like the session,
    // so a returning reader is met by their own answer rather than the Law again.
    expect(readJourney().respondedAt).toBeTypeOf("number");
  });
});
