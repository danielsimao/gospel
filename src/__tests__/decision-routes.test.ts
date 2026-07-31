import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { INVITATION_RESPONSES } from "@/lib/journey-storage";

/**
 * Where each answer to the decision sends the reader.
 *
 * This exists because the routing was wrong once and wrong silently. The
 * destination was chosen by `invitationResponse !== "dismissed"`, which handed
 * a reader who answered "I want to think about it" the discipleship task list
 * built for someone who had just professed faith. Nothing crashed, nothing
 * logged, and the screen looked entirely reasonable — the app simply treated an
 * undecided reader as decided, which `docs/METHOD.md` counts as method damage
 * rather than a bug.
 *
 * The destinations live inside JSX, so `environment: "node"` cannot observe
 * them as behaviour. These are source assertions in the same idiom as
 * bottom-inset.test.ts and stage-css.test.ts, and the load-bearing one is
 * negative: the predicate that caused the bug must not come back. A positive
 * assertion about markup shape would break on the next restyle and teach
 * everyone to delete it.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const source = readFileSync(join(ROOT, "src", "components", "invitation-screen.tsx"), "utf8");

/** Comments in that file describe the bug and quote the old predicate, so every
    assertion reads the code with comments stripped — otherwise a deleted
    implementation passes on the strength of the comment explaining it. */
const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/** What each answer is owed. Committed gets the steps; neither undecided answer
    does, because there is no "now" yet for someone still deciding. */
const ONWARD: Record<(typeof INVITATION_RESPONSES)[number], "next-steps" | "reading-plan"> = {
  committed: "next-steps",
  thinking: "reading-plan",
  dismissed: "reading-plan",
};

describe("what each decision answer is offered", () => {
  it("keeps the three answers the reducer knows", () => {
    // If a fourth is added, ONWARD above fails to typecheck and someone has to
    // decide where it goes rather than inheriting a default.
    expect([...INVITATION_RESPONSES].sort()).toEqual(Object.keys(ONWARD).sort());
  });

  it("never reintroduces the predicate that misrouted the undecided", () => {
    expect(code).not.toMatch(/!==\s*["']dismissed["']/);
  });

  it("offers next-steps to the committed answer alone", () => {
    // One link, and it is inside a branch keyed on `committed`.
    expect(code.match(/next-steps/g) ?? []).toHaveLength(1);
    expect(code).toMatch(/\{committed && onwardReady && \(/);
  });

  it("offers the reading plan to both undecided answers", () => {
    expect(code.match(/reading-plan/g) ?? []).toHaveLength(1);
    expect(code).toMatch(/\{!committed && \(/);
  });

  it("keeps learn-more on the dismissed answer only", () => {
    // Committed and thinking each already carry exactly one route on; a second
    // door there competes with the primary action on the quietest screen in
    // the flow.
    expect(code).toMatch(/invitationResponse === "dismissed" && invitation\.learnMoreLabel/);
  });
});
