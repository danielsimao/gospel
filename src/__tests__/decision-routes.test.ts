import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { INVITATION_RESPONSES } from "@/lib/journey-storage";

/**
 * Where each answer to the decision sends the reader.
 *
 * This file exists because I got the routing wrong and nearly shipped a test
 * that locked the mistake in. The original predicate — `!== "dismissed"` — was
 * read as a category error handing an undecided reader a discipleship task
 * list, and changed so that "thinking" went to the reading plan instead.
 *
 * It was not an error. `/next-steps` picks a track (next-steps/client.tsx),
 * and TrackThinking is written for precisely that reader: "That's honest. Here
 * are some things worth thinking about", three reflection questions, and John
 * 3 — chosen because it is a conversation with a man who had questions. The
 * comment that justified the old predicate is about *dismissed*, which is
 * correctly excluded, and it was never about "thinking".
 *
 * So the assertions below pin the behaviour that was already right, and the
 * one that matters most is the negative: "thinking" must keep its track. A
 * test written against the wrong reading of a predicate is worse than no test,
 * because it makes the correct behaviour look like the regression.
 *
 * These are source assertions in the idiom of bottom-inset.test.ts — the
 * destinations live inside JSX and vitest runs in `environment: "node"`, so
 * there is no way to observe them as behaviour here.
 */
const ROOT = join(import.meta.dirname, "..", "..");
const invitation = readFileSync(
  join(ROOT, "src", "components", "invitation-screen.tsx"),
  "utf8",
);
const nextStepsClient = readFileSync(
  join(ROOT, "src", "app", "[locale]", "(content)", "next-steps", "client.tsx"),
  "utf8",
);

/** Comments in both files narrate the mistake and quote the predicates, so every
    assertion reads the code with comments stripped — otherwise a deleted
    implementation passes on the strength of the prose explaining it. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const invitationCode = code(invitation);
const trackCode = code(nextStepsClient);

/** What each answer is owed. Two have a track at /next-steps; the third does
    not, and that is the distinction the decision screen is drawing. */
const HAS_NEXT_STEPS_TRACK: Record<(typeof INVITATION_RESPONSES)[number], boolean> = {
  committed: true,
  thinking: true,
  dismissed: false,
};

describe("what each decision answer is offered", () => {
  it("covers exactly the responses the reducer knows", () => {
    // A fourth response fails to typecheck against the table above, so someone
    // has to decide where it goes rather than inheriting a default.
    expect([...INVITATION_RESPONSES].sort()).toEqual(Object.keys(HAS_NEXT_STEPS_TRACK).sort());
  });

  it("keeps a track at next-steps for every answer that has one", () => {
    for (const [response, hasTrack] of Object.entries(HAS_NEXT_STEPS_TRACK)) {
      if (!hasTrack) continue;
      expect(trackCode, `next-steps has no branch for "${response}"`).toContain(`"${response}"`);
    }
  });

  it("sends both tracked answers to next-steps, not just the committed one", () => {
    // The assertion that would have failed on my version. "thinking" losing
    // its track is silent: the reader gets a plausible screen written for
    // somebody else.
    expect(invitationCode).toMatch(/invitationResponse !== "dismissed" && onwardReady/);
    expect(invitationCode.match(/next-steps/g) ?? []).toHaveLength(1);
  });

  it("offers the reading plan to the dismissed answer alone, and conditionally", () => {
    // "Changed your mind? The reading plan is waiting" — a door for someone who
    // has none at next-steps, worded so it does not assume they walked through.
    expect(invitationCode).toMatch(
      /invitationResponse === "dismissed" && messages\.nextSteps\.dismissedReturn/,
    );
    expect(invitationCode.match(/reading-plan/g) ?? []).toHaveLength(1);
  });

  it("holds the way on only for a profession of faith", () => {
    // The two-second hold is for someone who just said they would repent and
    // trust. A reader still deciding has professed nothing, so there is no beat
    // to protect — they are released without waiting, and the timer sits behind
    // the committed check rather than in front of it.
    expect(invitationCode).toMatch(
      /invitationResponse !== "committed"\)\s*\{\s*setOnwardReady\(true\);/,
    );
    expect(invitationCode).toMatch(/setTimeout\(\(\) => setOnwardReady\(true\), COMMITTED_HOLD_MS\)/);
  });
});
