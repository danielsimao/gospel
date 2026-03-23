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

export interface Messages {
  landing: { title: string; cta: string };
  questions: Array<{
    id: number;
    text: string;
    commandment: string;
    honestLabel: string;
    justifyLabel: string;
    followUp: string;
  }>;
  verdict: { title: string; subtitle: string };
  grace: { heading: string; body: string; scripture: string; scriptureRef: string; continueLabel: string };
  invitation: {
    heading: string;
    prayer: string;
    responses: {
      prayed: string;
      thinking: string;
      dismissed: string;
    };
    resources: Array<{ name: string; url: string }>;
  };
  share: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
  meta: { title: string; description: string };
}
