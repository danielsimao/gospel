export type GamePhase =
  | "landing"
  | "playing"
  | "verdict"
  | "grace"
  | "invitation";

export type AnswerType = "honest" | "justify";

export type InvitationResponse = "prayed" | "thinking" | "dismissed";

export interface QuestionConfig {
  id: number;
  commandment: string;
  honestDrain: number;
  justifyDrain: number;
}

export interface Answer {
  questionId: number;
  answer: AnswerType;
  commandment: string;
  scoreChange: number;
  timeOnQuestion: number;
}

export interface GameState {
  phase: GamePhase;
  currentQuestion: number;
  score: number;
  answers: Answer[];
  startedAt: number;
  completedAt: number | null;
  graceReached: boolean;
  invitationResponse: InvitationResponse | null;
  questionStartedAt: number | null;
}

export type GameAction =
  | { type: "START_GAME" }
  | { type: "ANSWER_QUESTION"; answer: AnswerType }
  | { type: "ADVANCE_AFTER_FOLLOWUP" }
  | { type: "SHOW_VERDICT" }
  | { type: "SHOW_GRACE" }
  | { type: "SHOW_INVITATION" }
  | { type: "SET_INVITATION_RESPONSE"; response: InvitationResponse };

export interface JourneyMessages {
  test: {
    label: string;
    descComplete: string;
    descActive: string;
  };
  reading: {
    label: string;
    descComplete: string;
    descActiveStart: string;
    descActiveProgress: string;
    descUpcoming: string;
  };
  learn: {
    label: string;
    descComplete: string;
    descActiveStart: string;
    descActiveProgress: string;
    descUpcoming: string;
  };
  share: {
    label: string;
    descActive: string;
    descUpcoming: string;
  };
  retakeLabel: string;
}

export interface HomeMessages {
  provocativeQuestion: string;
  ctaButton: string;
  secondaryLink: string;
  returningQuestion: string;
  readingPlanCta: string;
  learnCta: string;
  retakeCta: string;
  sharePrompt: string;
  facts: string[];
  journey: JourneyMessages;
}

export interface TestMessages {
  caseLabel: string;
  guiltLabel: string;
  counterLabel: string;
  liveBadge: string;
  answeredBadge: string;
  justifiedBadge: string;
  nextLabel: string;
  seeVerdictLabel: string;
  commandmentLabel: string;
  backLabel: string;
  verdictLabels: Record<string, string>;
  verdict: {
    prelude: string;
    deathLineTemplate: string;
    bridgeButton: string;
    confessionAdmitted: string;
    confessionDenied: string;
    confessionBoth: string;
    separator: string;
    useOxfordComma?: boolean;
    noneLabel: string;
  };
}

export interface Messages {
  landing: { title: string; cta: string; label: string; subtitle: string };
  test: TestMessages;
  questions: Array<{
    id: number;
    text: string;
    commandment: string;
    honestLabel: string;
    justifyLabel: string;
    followUp: string;
    honestFollowUp: string;
  }>;
  verdict: { title: string; subtitle: string };
  grace: {
    scripture: string;
    scriptureRef: string;
    continueLabel: string;
    label: string;
    beatsHeading: string;
    beats: Array<{ headline: string; subtitle: string }>;
    tapContinue: string;
  };
  invitation: {
    heading: string;
    prayedEncouragement: string;
    thinkingEncouragement: string;
    dismissedEncouragement?: string;
    responses: Record<InvitationResponse, string>;
    resources: Array<{ name: string; url: string }>;
    learnMoreLabel: string;
  };
  share: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  nextSteps?: { cta: string; dismissedReturn: string };
  meta: { title: string; description: string };
}
