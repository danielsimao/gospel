export type GamePhase =
  | "landing"
  | "playing"
  | "verdict"
  | "grace"
  | "invitation";

export type AnswerType = "honest" | "justify";

export type InvitationResponse = "committed" | "thinking" | "dismissed";

/**
 * The reader's own answer to "Are you a good person?", asked before the Law
 * rather than derived from it.
 *
 * Testimony, never a measurement: nothing in the reducer's scoring path may
 * read this. It does not change the drains, the question count, or the
 * verdict — the verdict is what the six answers prove. All it does is let the
 * verdict quote the reader back to themselves.
 *
 * All three answers take the same six questions. A reader who taps "no" has
 * not earned a shorter Law: "grace to the humble" means humbled *by* the Law
 * (Rom 3:20, Gal 3:24), and "I'm not perfect" is usually social modesty, not
 * conviction. Shortening the Law on a self-report is the shortcut this method
 * exists to prevent.
 */
export type SelfRating = "yes" | "mostly" | "no";

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
   * How many grace beats the reader has opened. Persisted because a refresh in
   * grace used to restore the phase but reset every beat to one —
   * real progress silently lost. Cannot be derived from graceReached, which is
   * true the instant grace is entered and would reveal every beat at once to a
   * first-time reader.
   */
  graceBeatsRevealed: number;
  invitationReached: boolean;
  invitationResponse: InvitationResponse | null;
  questionStartedAt: number | null;
  /** See SelfRating. Null when the reader reached the test without answering. */
  selfRating: SelfRating | null;
}

/**
 * A session as it is handed to the reducer: everything persisted, minus the
 * storage version, which is the storage layer's business alone.
 *
 * Declared once and re-used as the base of `SavedSession`. It was previously a
 * structural clone written out by hand in the action type and transcribed
 * field-by-field at each call site — which is how `graceBeatsRevealed` came to
 * be silently defaulted at both, resetting the reader's grace beats on every
 * refresh. One shape means an added field reaches every consumer or fails the
 * build.
 */
export interface ResumeSessionPayload {
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
  graceBeatsRevealed: number;
  invitationReached: boolean;
  invitationResponse: InvitationResponse | null;
  selfRating: SelfRating | null;
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
  /** Null clears it, which is how "change my answer" returns to the question. */
  | { type: "SET_SELF_RATING"; rating: SelfRating | null }
  | { type: "UNDO_ANSWER" }
  | { type: "BACK_TO_VERDICT" }
  | { type: "BACK_TO_GRACE" }
  | {
      type: "RESUME_SESSION";
      /**
       * The saved record itself, minus the storage version. It used to be a
       * structural clone transcribed by hand at each call site, which is how
       * graceBeatsRevealed came to be silently defaulted at both of them —
       * every field added to SavedSession recreated the same class of bug.
       * Declared in test-session-storage to keep the two from ever drifting.
       */
      session: ResumeSessionPayload;
    };

export interface JourneyMessages {
  test: {
    label: string;
    descComplete: string;
    descActive: string;
  };
  reading: {
    label: string;
    /** Shown by the reading band once all seven days are read. */
    descComplete: string;
  };
  share: { label: string; descActive: string; descUpcoming: string };
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
    whatHappened: string;
    cta: string;
  };
  committed: {
    eyebrow: string;
    title: string;
    whatHappened: string;
    /** The conditional promise — kept verbatim, rendered as the house blockquote. */
    heading: string;
    nextStepsCard: { label: string; description: string };
  };
  thinking: {
    eyebrow: string;
    heading: string;
    whatHappened: string;
    reflection: string;
    commitLabel: string;
    retakeLabel: string;
  };
  dismissed: {
    eyebrow: string;
    title: string;
    whatHappened: string;
    retakeCta: string;
  };
}

export interface HomeMessages {
  /** The stake, under the counter. No longer the heading — see home-shell. */
  provocativeQuestion: string;
  mortalityStat: string;
  ctaButton: string;
  secondaryLink: string;
  /** The visitor h1, and the question the chips answer. */
  selfRatingQuestion: string;
  selfRating: { yes: string; mostly: string; no: string };
  /** What a tap costs: question count and rough duration. */
  testPreview: string;
  /** The instruction under the step bar: the tap IS the answer to question 1. */
  testHint: string;
  blogCard: { eyebrow: string };
  /** The face-off band: N failed against the 1 who passed. The red side
      always shows a number — the modelled estimate stands in when neither
      counter can answer — and wears `liveBadge` with the pulse. */
  passedBand: {
    eyebrow: string;
    liveBadge: string;
    failedCaption: string;
    passedCaption: string;
    /** Under the verdict bar, with `{n}` for the live count. */
    barCaption: string;
    /** The ledger's last line — the one row that needs no analytics. Its place
        and its "2,000 years ago", which is the whole point of the format: the
        rows above it are counted in minutes. The verdicts on every row reuse
        failedCaption and passedCaption above. */
    ledgerPlace: string;
    ledgerWhen: string;
    whoCta: string;
    testCta: string;
  };
  /** Header for the band of learn topics shown as their own questions. */
  questionsLabel: string;
  facts: string[];
  journey: JourneyMessages;
  journeyStages: JourneyStagesMessages;
}

export interface TestMessages {
  /**
   * /test's own search title and snippet. Separate from `meta`, which the
   * homepage uses: both pages shipped the identical pair, so the site's two
   * strongest URLs competed for the same query with the same words.
   */
  metaTitle: string;
  metaDescription: string;
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
    selfRatingLabel: string;
    /** Two words for one instruction, because a thumb and a pointer are given
        different ones — a pointer has nothing to aim at on a screen whose
        target is the screen. Both are shown by breakpoint, not by sniffing. */
    advanceHintTouch: string;
    advanceHintPointer: string;
    /** One line per answer. A Record, so adding a SelfRating fails the build
        rather than silently rendering nothing at the verdict. */
    selfRatingMirror: Record<SelfRating, string>;
  };
}

export interface Messages {
  landing: {
    title: string;
    /** The reply screen's one button, shared by all three answers. The moment
        this differs per answer, three answers become three products. */
    cta: string;
    label: string;
    subtitle: string;
    selfRating: { yes: string; mostly: string; no: string };
    /**
     * What each answer is told before the Law begins.
     *
     * A Record, so adding a SelfRating fails the build rather than dropping a
     * reader into the questions with no reply. Three different presses because
     * the three answers get three different things wrong: a claim, a
     * comparison, and a word nobody has defined yet.
     */
    reply: Record<SelfRating, { heading: string; body: string }>;
    changeAnswer: string;
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
  verdict: { title: string };
  grace: {
    scripture: string;
    scriptureRef: string;
    continueLabel: string;
    label: string;
    beatsHeading: string;
    /** `label` is the rung: the one line that stays on screen while another
        beat is open, so the whole argument's shape is always readable. It is a
        compression of its own headline, never a separate claim. */
    beats: Array<{ label: string; headline: string; subtitle: string }>;
    tapContinue: string;
    rereadVerdict: string;
    /* The court record shown after the argument. Chrome only — every charge in
       it comes from `verdictLabels`, so the six nouns are not restated here and
       cannot drift from the confession sentence that uses the same set. */
    record: {
      eyebrow: string;
      /** Column headings. Visually hidden: the record reads as a document, but
          it is tabular data and a screen reader is owed the structure. */
      count: string;
      charge: string;
      plea: string;
      /** The two pleas, in the reader's own voice — what they did with each
          count, never what the court concluded about it. */
      admitted: string;
      contested: string;
      /** The finding, which does not depend on the pleas. */
      finding: string;
      guilty: string;
      ability: string;
      none: string;
      paid: string;
    };
  };
  invitation: {
    eyebrow: string;
    heading: string;
    urgencyLine: string;
    rereadGrace: string;
    committedEncouragement: string;
    thinkingEncouragement: string;
    dismissedEncouragement: string;
    responses: Record<InvitationResponse, string>;
    learnMoreLabel: string;
  };
  /**
   * The homepage block. It was absent for a long time, which left HomeMessages
   * — the largest copy interface here — unreachable from the root type: the
   * validator had to cast through `unknown` to reach it and the page assigned
   * it from an `any`, so none of the homepage copy was ever type-checked.
   */
  home: HomeMessages;
  share: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  /** Required for the same reason as readingPlan: it is the committed
      reader's only route on, and next-steps' own page throws without it. The
      optional marker bought nothing but an English fallback rendered over a
      Portuguese button. */
  nextSteps: { ctaCommitted: string; ctaThinking: string; metaTitle: string; dismissedReturn: string };
  /** Required because reading-plan's own page throws when it is absent, and an
      optional marker here left the two contracts disagreeing about the same
      key. Only the heading is modelled; the plan's page owns the rest. */
  readingPlan: { heading: string };
  meta: { title: string; description: string };
}
