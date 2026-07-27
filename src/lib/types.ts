export type GamePhase =
  | "landing"
  | "playing"
  | "verdict"
  | "grace"
  | "invitation";

export type AnswerType = "honest" | "justify";

export type InvitationResponse = "committed" | "thinking" | "dismissed";

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
  currentAnswer: AnswerType | null;
  showFollowUp: boolean;
  startedAt: number;
  completedAt: number | null;
  graceReached: boolean;
  /**
   * How many grace beats the reader has opened. Persisted because a refresh on
   * /test/grace used to restore the phase but reset all eight beats to one —
   * real progress silently lost. Cannot be derived from graceReached, which is
   * true the instant grace is entered and would reveal every beat at once to a
   * first-time reader.
   */
  graceBeatsRevealed: number;
  invitationReached: boolean;
  invitationResponse: InvitationResponse | null;
  questionStartedAt: number | null;
}

export type GameAction =
  | { type: "START_GAME" }
  | { type: "ANSWER_QUESTION"; answer: AnswerType }
  | { type: "SHOW_FOLLOWUP" }
  | { type: "ADVANCE_AFTER_FOLLOWUP" }
  | { type: "SHOW_VERDICT" }
  | { type: "SHOW_GRACE" }
  | { type: "REVEAL_GRACE_BEAT"; count: number }
  | { type: "SHOW_INVITATION" }
  | { type: "SET_INVITATION_RESPONSE"; response: InvitationResponse }
  | { type: "UNDO_ANSWER" }
  | { type: "BACK_TO_VERDICT" }
  | { type: "BACK_TO_GRACE" }
  | {
      type: "RESUME_SESSION";
      session: {
        phase: GamePhase;
        currentQuestion: number;
        score: number;
        answers: Answer[];
        currentAnswer: AnswerType | null;
        showFollowUp: boolean;
        startedAt: number;
        completedAt: number | null;
        questionStartedAt: number | null;
        savedAt: number;
        graceReached: boolean;
        // Required, not optional. Every RESUME_SESSION payload is hand-copied
        // field by field at two call sites; as an optional it silently
        // defaulted to 0 at both, which reset the reader's grace beats on
        // every refresh. Required makes an omission a compile error.
        graceBeatsRevealed: number;
        invitationReached: boolean;
        invitationResponse: InvitationResponse | null;
      };
    };

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

export interface JourneyStagesMessages {
  since: {
    today: string;
    yesterday: string;
    daysAgo: string;
    weeksAgo: string;
  };
  /*
   * Every stage carries the same spine: eyebrow → one h1 → whatHappened →
   * one primary action. `whatHappened` is the progression — told in the app's
   * courtroom language rather than charted in a widget — so it is required on
   * every post-test stage. `visitor` has none because nothing has happened yet.
   */
  undecided: {
    eyebrow: string;
    heading: string;
    /** @deprecated superseded by whatHappened, which carries the elapsed time too. */
    sinceLine: string;
    whatHappened: string;
    cta: string;
  };
  committed: {
    eyebrow: string;
    title: string;
    whatHappened: string;
    /** The conditional promise — kept verbatim, rendered as the house blockquote. */
    heading: string;
    subheading: string;
    nextStepsCard: { label: string; description: string };
  };
  thinking: {
    eyebrow: string;
    heading: string;
    whatHappened: string;
    /** @deprecated superseded by whatHappened. */
    sinceLine: string;
    reflection: string;
    johnCard: { label: string; description: string; url: string };
    learnCard: { label: string; description: string };
    commitLabel: string;
    retakeLabel: string;
  };
  dismissed: {
    eyebrow: string;
    title: string;
    whatHappened: string;
    /** @deprecated split into title + whatHappened. */
    line: string;
    retakeCta: string;
  };
}

export interface HomeMessages {
  provocativeQuestion: string;
  mortalityStat: string;
  ctaButton: string;
  secondaryLink: string;
  blogCard: { eyebrow: string };
  alsoHere: {
    label: string;
    readingDescription: string;
    learnDescription: string;
  };
  facts: string[];
  journey: JourneyMessages;
  journeyStages: JourneyStagesMessages;
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
  changeAnswerLabel: string;
  verdictLabels: Record<string, string>;
  verdict: {
    prelude: string;
    scripture: string;
    scriptureRef: string;
    deathLineTemplate: string;
    deathLineImplication: string;
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
  resumeDialog: {
    title: string;
    continueLabel: string;
    startOverLabel: string;
  };
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
    rereadVerdict: string;
  };
  invitation: {
    eyebrow: string;
    heading: string;
    urgencyLine: string;
    rereadGrace: string;
    committedEncouragement: string;
    thinkingEncouragement: string;
    dismissedEncouragement?: string;
    responses: Record<InvitationResponse, string>;
    learnMoreLabel: string;
  };
  share: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  nextSteps?: { cta: string; dismissedReturn: string };
  meta: { title: string; description: string };
}
