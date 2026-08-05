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
 * Every test here is `it.fails`: each one describes a defect found by walking
 * the five drop points at 390×844 on a production build, and each one is
 * expected to fail until that defect is fixed. When a fix lands, `it.fails`
 * itself starts failing — which is the point. The suite stays green today and
 * cannot quietly forget these once someone does the work; the fixer is forced
 * to promote the test to a plain `it`.
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
const shell = read("src", "components", "game-shell.tsx")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const undecided = en.home.journeyStages.undecided;

beforeEach(() => {
  storage.clear();
  vi.clearAllMocks();
});

describe("the homepage does not claim more than the reader did", () => {
  it.fails("does not say the verdict was seen by someone who only answered the questions", () => {
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
    const gatedOnAnswerCount = /state\.answers\.length\s*>=\s*TOTAL_QUESTIONS\s*\)\s*markTestCompleted/.test(shell);
    const copyClaimsTheVerdictWasSeen = /seen the verdict/i.test(undecided.heading);
    expect(
      gatedOnAnswerCount && copyClaimsTheVerdictWasSeen,
      "the flag is set by the sixth answer, but the copy claims the verdict was seen",
    ).toBe(false);
  });

  it.fails("does not tell a reader who reached grace that the fine is still unpaid", () => {
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
    markTestCompleted();
    const afterVerdictOnly = deriveStage(readJourney());

    // The best record the app can write today for someone who read all of grace
    // and left without answering — identical, because nothing records grace.
    const afterReadingGrace = deriveStage(readJourney());

    expect(
      afterVerdictOnly === afterReadingGrace && /still unpaid/i.test(undecided.whatHappened),
      "grace-reached and verdict-only derive the same stage, and that stage says the fine is unpaid",
    ).toBe(false);
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
  it.fails("does not promise a return it cannot keep once the session has expired", () => {
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
    expect(
      /return to where you left off/i.test(undecided.cta),
      "the CTA promises a resume that the resume window may already have discarded",
    ).toBe(false);
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
