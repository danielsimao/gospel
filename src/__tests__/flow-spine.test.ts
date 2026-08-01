import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FLOW_STAGES, furthestStageIndex, stageOfPhase } from "@/lib/flow-stages";
import type { GamePhase } from "@/lib/types";

/**
 * The spine: one band that names where the reader is, and a walk back into the
 * test that reads testimony without reopening it.
 *
 * furthestStageIndex is a pure function and gets real tests. The rest are
 * source assertions in the idiom of stage-css.test.ts — the guarantees live in
 * JSX and in a popstate handler, and vitest runs in `environment: "node"`.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const shell = strip(read("src", "components", "game-shell.tsx"));
const card = strip(read("src", "components", "question-card.tsx"));
const band = strip(read("src", "components", "flow-band.tsx"));

const base = {
  phase: "invitation" as GamePhase,
  invitationReached: false,
  graceReached: false,
  completedAt: null as number | null,
};

describe("how far along the spine the reader has been", () => {
  it("never retracts a stage once reached", () => {
    // The whole reason this reads the journey flags instead of the live phase.
    // A reader who walks back to the verdict from the decision still has both
    // later stages behind them, and the band has to keep them lit — that is
    // what makes forward navigation work without a second mechanism.
    const walkedBack = {
      phase: "verdict" as GamePhase,
      invitationReached: true,
      graceReached: true,
      completedAt: 1,
    };
    expect(furthestStageIndex(walkedBack)).toBe(FLOW_STAGES.indexOf("decision"));
  });

  it("renders nothing before the test has begun", () => {
    expect(furthestStageIndex({ ...base, phase: "landing" })).toBe(-1);
  });

  it("reaches each stage from the flag that proves it", () => {
    expect(furthestStageIndex({ ...base, phase: "playing" })).toBe(0);
    expect(furthestStageIndex({ ...base, phase: "verdict" })).toBe(1);
    expect(furthestStageIndex({ ...base, graceReached: true })).toBe(2);
    expect(
      furthestStageIndex({ ...base, graceReached: true, invitationReached: true }),
    ).toBe(3);
  });

  it("treats a finished test as having reached the verdict even mid-phase", () => {
    // completedAt is set when the sixth answer lands, which is the same commit
    // the verdict arrives in.
    expect(furthestStageIndex({ ...base, phase: "playing", completedAt: 1 })).toBe(1);
  });

  it("maps every phase to a stage, or to the threshold", () => {
    const phases: GamePhase[] = ["landing", "playing", "verdict", "grace", "invitation"];
    expect(phases.map(stageOfPhase)).toEqual([
      null,
      "test",
      "verdict",
      "paid",
      "decision",
    ]);
  });
});

describe("the band never says more than it should", () => {
  it("draws unreached stages as an unnamed mark", () => {
    // Naming a stage the reader has not reached pre-announces the ask. The
    // journey may have a visible shape; the next step has no name until it
    // arrives.
    expect(band).toMatch(/if \(!reached\)/);
    expect(band).toMatch(/rounded-full bg-white\/\[0\.14\]/);
    const unreached = band.slice(band.indexOf("if (!reached)"), band.indexOf("if (isCurrent)"));
    expect(unreached).not.toMatch(/labels\[stage\]/);
  });

  it("keeps the current stage inert", () => {
    expect(band).toMatch(/aria-current="step"/);
    const current = band.slice(band.indexOf("if (isCurrent)"), band.indexOf("return (\n          <span key={stage}"));
    expect(current).not.toMatch(/onNavigate|<button/);
  });

  it("says what the test node actually opens", () => {
    // The word promises the test; what opens is the reader's own answers.
    expect(band).toMatch(/aria-label=\{stage === "test" \? flow\.review : undefined\}/);
  });
});

describe("where the band is withheld", () => {
  it("stays off the questions, the threshold, and the first-run verdict", () => {
    expect(shell).toMatch(/state\.phase !== "landing"/);
    expect(shell).toMatch(/state\.phase !== "playing"/);
    // The verdict lands alone the first time. It gains the band only once the
    // reader has been further and walked back.
    expect(shell).toMatch(
      /!\(state\.phase === "verdict" && furthestStageIndex\(state\) <= 1\)/,
    );
  });

  it("stays off the decision once an answer is recorded", () => {
    // "A recorded response closes the book" — the reducer's rule, applied to
    // the chrome as well.
    expect(shell).toMatch(
      /!\(state\.phase === "invitation" && state\.invitationResponse\)/,
    );
  });
});

describe("the walk back into the test cannot write", () => {
  it("refuses to record an answer in review", () => {
    expect(card).toMatch(/if \(review \|\| answered\) return;/);
  });

  it("suppresses the retraction, which never survived Next live either", () => {
    expect(card).toMatch(/answered === "justify" && !review/);
  });

  it("reads the recorded answer instead of live state", () => {
    expect(card).toMatch(/const answered = review \? review\.answer : state\.currentAnswer;/);
    expect(card).toMatch(/const showFollowUp = review \? true : state\.showFollowUp;/);
  });

  it("is view state, never a phase", () => {
    // No new GamePhase, and nothing persisted: a refresh mid-walk lands the
    // reader back where they actually are.
    expect(shell).toMatch(/useState<\{ index: number; from: GamePhase \} \| null>\(null\)/);
    expect(shell).not.toMatch(/type: "REVIEW|phase: "review"/);
  });
});

describe("the two-step jump", () => {
  it("dispatches the legal chain rather than growing a new action", () => {
    // Each reducer back-move guards on the phase it leaves, and those guards
    // are the method's rules in code. The jump respects them in order.
    const jump = shell.slice(
      shell.indexOf('backward && target === "verdict" && phase === "invitation"'),
    );
    expect(jump).toMatch(/BACK_TO_GRACE[\s\S]{0,120}BACK_TO_VERDICT/);
  });

  it("stays inert once a response is recorded", () => {
    const jump = shell.slice(
      shell.indexOf('backward && target === "verdict" && phase === "invitation"'),
      shell.indexOf('forward && target === "invitation" && phase === "verdict"'),
    );
    expect(jump).toMatch(/if \(stateRef\.current\.invitationResponse\) return;/);
  });

  it("works forward too, for a reader who changed their mind", () => {
    const fwd = shell.slice(
      shell.indexOf('forward && target === "invitation" && phase === "verdict"'),
    );
    expect(fwd).toMatch(/SHOW_GRACE[\s\S]{0,120}SHOW_INVITATION/);
  });
});
