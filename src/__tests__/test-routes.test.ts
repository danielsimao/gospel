import { describe, it, expect } from "vitest";
import { furthestPhase, isBeyond, routeForPhase } from "@/lib/test-routes";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import type { Answer, GameState } from "@/lib/types";

function answer(i: number): Answer {
  return {
    questionId: i,
    answer: "honest",
    commandment: "9th",
    scoreChange: -12,
    timeOnQuestion: 0,
  };
}

function state(over: Partial<GameState> = {}): GameState {
  return {
    phase: "landing",
    currentQuestion: 0,
    score: 100,
    answers: [],
    currentAnswer: null,
    showFollowUp: false,
    startedAt: 0,
    completedAt: null,
    questionStartedAt: null,
    graceReached: false,
    invitationReached: false,
    invitationResponse: null,
    ...over,
  } as GameState;
}

const allAnswers = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => answer(i));

describe("furthestPhase", () => {
  it("a fresh state has reached nothing", () => {
    expect(furthestPhase(state())).toBe("landing");
  });

  it("a part-answered test is still playing", () => {
    expect(furthestPhase(state({ answers: [answer(0)] }))).toBe("playing");
  });

  it("an answer awaiting confirmation counts as playing", () => {
    expect(furthestPhase(state({ currentAnswer: "justify" }))).toBe("playing");
  });

  it("every question answered reaches the verdict", () => {
    expect(furthestPhase(state({ answers: allAnswers }))).toBe("verdict");
  });

  it("graceReached outranks a complete answer set", () => {
    expect(furthestPhase(state({ answers: allAnswers, graceReached: true }))).toBe("grace");
  });

  it("invitationReached is the furthest", () => {
    expect(
      furthestPhase(state({ answers: allAnswers, graceReached: true, invitationReached: true })),
    ).toBe("invitation");
  });

  it("ignores the stored phase entirely — the answers are the truth", () => {
    // A saved session claiming "invitation" with no answers must not unlock it.
    expect(furthestPhase(state({ phase: "invitation" }))).toBe("landing");
  });
});

describe("isBeyond", () => {
  it("refuses a jump of two or more phases", () => {
    expect(isBeyond("invitation", "verdict")).toBe(true);
    expect(isBeyond("invitation", "landing")).toBe(true);
    expect(isBeyond("grace", "landing")).toBe(true);
  });

  it("allows exactly one step forward, because reaching a phase is what records it", () => {
    // The decision screen sets invitationReached on mount. Refusing it until
    // that flag exists would make it permanently unreachable.
    expect(isBeyond("grace", "verdict")).toBe(false);
    expect(isBeyond("invitation", "grace")).toBe(false);
  });

  it("allows going back to a phase already reached", () => {
    expect(isBeyond("verdict", "invitation")).toBe(false);
    expect(isBeyond("verdict", "verdict")).toBe(false);
  });
});

describe("routeForPhase", () => {
  it("gives each post-verdict phase its own URL", () => {
    expect(routeForPhase("verdict", "en")).toBe("/en/test/verdict");
    expect(routeForPhase("grace", "pt")).toBe("/pt/test/grace");
    expect(routeForPhase("invitation", "en")).toBe("/en/test/decision");
  });

  it("keeps landing and questions on one route — questions are one-way", () => {
    expect(routeForPhase("landing", "en")).toBe("/en/test");
    expect(routeForPhase("playing", "en")).toBe("/en/test");
  });
});
