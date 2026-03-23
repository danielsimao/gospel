# Verdict — The Impossible Standard Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web app that presents the gospel through an interactive "impossible standard" game based on Ray Comfort's Way of the Master method, with i18n (English NKJV + Portuguese ACF), PostHog analytics, Sentry error tracking, and WhatsApp/Telegram sharing.

**Architecture:** Single-page Next.js App Router app with `[locale]` dynamic route. Client-side state machine (`useReducer`) drives phase transitions. All content externalized in JSON message files per locale. Minimalist typography-driven design — black backgrounds, bold white text, gold accent for the grace moment. No database, no auth.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS, shadcn/ui, Framer Motion, PostHog, Sentry, Vercel Web Analytics, Geist fonts

**Spec:** `docs/superpowers/specs/2026-03-23-verdict-game-design.md`

---

## File Structure

```
gospel/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx              # Server component — loads messages, renders GameShell
│   │   └── layout.tsx            # Root layout — Geist fonts, metadata, providers
│   └── layout.tsx                # Root layout (html/body only)
├── middleware.ts                  # Accept-Language → locale redirect
├── components/
│   ├── providers.tsx             # Client wrapper: PostHog + Sentry providers
│   ├── game-provider.tsx         # GameState context + useReducer
│   ├── game-shell.tsx            # Phase router — renders correct screen based on phase
│   ├── landing.tsx               # "Are you a good person?" CTA
│   ├── question-card.tsx         # Single question with honest/justify buttons
│   ├── follow-up.tsx             # Inline follow-up text for justify answers
│   ├── score-bar.tsx             # Animated score bar with color transitions
│   ├── verdict-screen.tsx        # "Guilty" text + crack overlay
│   ├── crack-overlay.tsx         # SVG crack animation
│   ├── grace-screen.tsx          # Light rays + gospel + score refill
│   ├── invitation-screen.tsx     # Prayer, response buttons, resources
│   └── share-buttons.tsx         # WhatsApp, Telegram, copy link, native share
├── lib/
│   ├── types.ts                  # GamePhase, GameState, Answer, etc.
│   ├── questions.ts              # Score drain values per question (locale-independent)
│   ├── game-reducer.ts           # State machine: actions and reducer
│   ├── analytics.ts              # PostHog event helpers
│   ├── i18n.ts                   # Supported locales, message loader, locale detection
│   └── utils.ts                  # cn() helper
├── messages/
│   ├── en.json                   # English content (NKJV)
│   └── pt.json                   # Portuguese content (ACF)
├── public/
│   ├── og-image-en.png           # English OG image (placeholder)
│   └── og-image-pt.png           # Portuguese OG image (placeholder)
├── sentry.client.config.ts
├── sentry.server.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                    # PostHog + Sentry keys (from vercel env pull)
```

---

## Task 1: Project Scaffolding & Config

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.gitignore`
- Create: `app/layout.tsx` (root html/body shell)

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/danielsimao/Documents/repos/gospel
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --turbopack --yes
```

Expected: Next.js project scaffolded with App Router, Tailwind, TypeScript.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install framer-motion posthog-js @sentry/nextjs @vercel/analytics geist
```

- [ ] **Step 3: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init -d
```

This sets up the `components/ui` directory, `lib/utils.ts` with `cn()`, and configures Tailwind.

- [ ] **Step 4: Add shadcn button component**

Run:
```bash
npx shadcn@latest add button
```

- [ ] **Step 5: Configure Geist fonts in root layout**

Edit `app/layout.tsx`:

```tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-black text-white min-h-dvh`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Update Tailwind config for dark theme defaults**

Ensure `tailwind.config.ts` has:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#D4A843",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 7: Update globals.css for dark minimalist base**

Replace `app/globals.css` with:
```css
@import "tailwindcss";

:root {
  --background: #000000;
  --foreground: #ffffff;
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 8: Verify dev server starts**

Run: `npm run dev`
Expected: App loads at http://localhost:3000 with black background.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, shadcn/ui, Geist fonts"
```

---

## Task 2: Types & Game Data

**Files:**
- Create: `lib/types.ts`
- Create: `lib/questions.ts`

- [ ] **Step 1: Create type definitions**

Create `lib/types.ts`:
```ts
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
  timeOnQuestion: number; // ms
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
```

- [ ] **Step 2: Create question config (locale-independent score data)**

Create `lib/questions.ts`:
```ts
import { QuestionConfig } from "./types";

export const QUESTION_CONFIGS: QuestionConfig[] = [
  { id: 1, commandment: "9th", honestDrain: 12, justifyDrain: 5 },
  { id: 2, commandment: "8th", honestDrain: 12, justifyDrain: 5 },
  { id: 3, commandment: "7th", honestDrain: 13, justifyDrain: 6 },
  { id: 4, commandment: "6th", honestDrain: 13, justifyDrain: 6 },
  { id: 5, commandment: "3rd", honestDrain: 12, justifyDrain: 7 },
  { id: 6, commandment: "10th", honestDrain: 13, justifyDrain: 7 },
  { id: 7, commandment: "1st", honestDrain: 13, justifyDrain: 8 },
  { id: 8, commandment: "5th", honestDrain: 12, justifyDrain: 8 },
];

export const TOTAL_QUESTIONS = QUESTION_CONFIGS.length;
export const INITIAL_SCORE = 100;
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts lib/questions.ts
git commit -m "feat: add game types and question score configuration"
```

---

## Task 3: i18n — Message Files & Loader

**Files:**
- Create: `messages/en.json`
- Create: `messages/pt.json`
- Create: `lib/i18n.ts`

- [ ] **Step 1: Create English message file**

Create `messages/en.json`:
```json
{
  "landing": {
    "title": "Are you a good person?",
    "cta": "Find out"
  },
  "questions": [
    {
      "id": 1,
      "text": "Have you ever told a lie — even a small one?",
      "commandment": "You shall not bear false witness",
      "honestLabel": "Yes, I have",
      "justifyLabel": "Not really",
      "followUp": "What about a 'white lie' to spare someone's feelings?"
    },
    {
      "id": 2,
      "text": "Have you ever taken something that wasn't yours — even something small?",
      "commandment": "You shall not steal",
      "honestLabel": "Yes, I have",
      "justifyLabel": "Nothing significant",
      "followUp": "Have you ever kept extra change, or downloaded something you didn't pay for?"
    },
    {
      "id": 3,
      "text": "Have you ever looked at someone with lust?",
      "commandment": "You shall not commit adultery",
      "honestLabel": "Yes, I have",
      "justifyLabel": "I don't think so",
      "followUp": "Jesus said, 'Whoever looks at a woman to lust for her has already committed adultery with her in his heart.' — Matthew 5:28 (NKJV)"
    },
    {
      "id": 4,
      "text": "Have you ever been so angry you wished someone harm?",
      "commandment": "You shall not murder",
      "honestLabel": "Yes, I have",
      "justifyLabel": "Never that far",
      "followUp": "Even a flash of hatred — Jesus said, 'Whoever is angry with his brother without a cause shall be in danger of the judgment.' — Matthew 5:22 (NKJV)"
    },
    {
      "id": 5,
      "text": "Have you ever used God's name as a curse word?",
      "commandment": "You shall not take the name of the LORD your God in vain",
      "honestLabel": "Yes, I have",
      "justifyLabel": "Not intentionally",
      "followUp": "Even 'OMG' as an exclamation — using the Creator's name carelessly?"
    },
    {
      "id": 6,
      "text": "Have you ever wanted something that belonged to someone else?",
      "commandment": "You shall not covet",
      "honestLabel": "Yes, I have",
      "justifyLabel": "That's just normal",
      "followUp": "A friend's lifestyle, someone's relationship, a coworker's promotion?"
    },
    {
      "id": 7,
      "text": "Have you ever put something — money, career, relationships — above God?",
      "commandment": "You shall have no other gods before Me",
      "honestLabel": "Yes, I have",
      "justifyLabel": "I don't think about it",
      "followUp": "If you've spent more time on your phone than thinking about your Creator..."
    },
    {
      "id": 8,
      "text": "Have you ever failed to honor your parents?",
      "commandment": "Honor your father and your mother",
      "honestLabel": "Yes, I have",
      "justifyLabel": "I've always tried",
      "followUp": "Even in your heart — resentment, dismissiveness, ingratitude?"
    }
  ],
  "verdict": {
    "title": "Guilty.",
    "subtitle": "By God's perfect standard, none of us are good enough."
  },
  "grace": {
    "heading": "But God, being rich in mercy...",
    "body": "Imagine you're in a courtroom, guilty of a serious crime. The fine is enormous — more than you could ever pay. But then someone steps in and pays your fine in full. The judge can legally let you go — justice has been served.\n\nThat's what God did for you.\n\nTwo thousand years ago, God came to earth in the person of Jesus Christ. He lived a perfect life — the only person who ever could. Then He willingly died on the cross, taking the punishment that we deserve.\n\nHe paid the fine so that God, the just Judge, could dismiss your case. Not because you earned it. Not because you deserved it. But because He loves you.\n\nThree days later, He rose from the dead, defeating death itself.",
    "scripture": "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.",
    "scriptureRef": "John 3:16 (NKJV)",
    "continueLabel": "Continue"
  },
  "invitation": {
    "heading": "What will you do with this?",
    "prayer": "God, I understand that I have broken Your Law and sinned against You. I am truly sorry. I believe that Jesus Christ died on the cross to pay the penalty for my sins and that He rose again. I turn from my sins and place my trust in Jesus Christ alone for my salvation. Thank You for Your mercy and forgiveness. In Jesus' name, Amen.",
    "responses": {
      "prayed": "I prayed this prayer",
      "thinking": "I want to think about it",
      "dismissed": "Not for me"
    },
    "resources": [
      { "name": "Learn more at Living Waters", "url": "https://livingwaters.com/" },
      { "name": "Read the Gospel of John", "url": "https://www.bible.com/bible/114/JHN.1.NKJV" },
      { "name": "Find a church near you", "url": "https://www.google.com/maps/search/church+near+me" }
    ]
  },
  "share": {
    "prompt": "Share this with someone",
    "whatsappMessage": "Are you a good person? Take this test and find out:",
    "telegramMessage": "Are you a good person? Take this test and find out:",
    "linkCopied": "Link copied!"
  },
  "meta": {
    "title": "Are You a Good Person? | Take the Test",
    "description": "Most people think they're good. Find out where you really stand."
  }
}
```

- [ ] **Step 2: Create Portuguese message file**

Create `messages/pt.json`:
```json
{
  "landing": {
    "title": "Tu es uma boa pessoa?",
    "cta": "Descobre"
  },
  "questions": [
    {
      "id": 1,
      "text": "Alguma vez mentiste — mesmo uma mentira pequena?",
      "commandment": "Nao diras falso testemunho",
      "honestLabel": "Sim, ja menti",
      "justifyLabel": "Nada de grave",
      "followUp": "E uma 'mentirinha' para nao magoar alguem?"
    },
    {
      "id": 2,
      "text": "Alguma vez tiraste algo que nao era teu — mesmo algo pequeno?",
      "commandment": "Nao furtaras",
      "honestLabel": "Sim, ja tirei",
      "justifyLabel": "Nada significativo",
      "followUp": "Alguma vez ficaste com troco a mais, ou fizeste download de algo sem pagar?"
    },
    {
      "id": 3,
      "text": "Alguma vez olhaste para alguem com desejo impuro?",
      "commandment": "Nao adulteraras",
      "honestLabel": "Sim, ja olhei",
      "justifyLabel": "Acho que nao",
      "followUp": "Jesus disse: 'qualquer que atentar numa mulher para a cobicar, ja em seu coracao cometeu adulterio com ela.' — Mateus 5:28 (ACF)"
    },
    {
      "id": 4,
      "text": "Alguma vez tiveste tanta raiva que desejaste mal a alguem?",
      "commandment": "Nao mataras",
      "honestLabel": "Sim, ja tive",
      "justifyLabel": "Nunca tanto assim",
      "followUp": "Mesmo um momento de odio — Jesus disse: 'qualquer que, sem motivo, se encolerizar contra seu irmao, estara sujeito a julgamento.' — Mateus 5:22 (ACF)"
    },
    {
      "id": 5,
      "text": "Alguma vez usaste o nome de Deus como palavrao?",
      "commandment": "Nao tomaras o nome do Senhor teu Deus em vao",
      "honestLabel": "Sim, ja usei",
      "justifyLabel": "Nao de proposito",
      "followUp": "Mesmo um 'Ai meu Deus' descuidado — usar o nome do Criador sem reverencia?"
    },
    {
      "id": 6,
      "text": "Alguma vez desejaste algo que pertencia a outra pessoa?",
      "commandment": "Nao cobiceras",
      "honestLabel": "Sim, ja desejei",
      "justifyLabel": "Isso e normal",
      "followUp": "O estilo de vida de um amigo, o relacionamento de alguem, a promocao de um colega?"
    },
    {
      "id": 7,
      "text": "Alguma vez colocaste algo — dinheiro, carreira, relacoes — acima de Deus?",
      "commandment": "Nao teras outros deuses diante de mim",
      "honestLabel": "Sim, ja coloquei",
      "justifyLabel": "Nao penso nisso",
      "followUp": "Se passaste mais tempo no telemovel do que a pensar no teu Criador..."
    },
    {
      "id": 8,
      "text": "Alguma vez falhaste em honrar os teus pais?",
      "commandment": "Honra o teu pai e a tua mae",
      "honestLabel": "Sim, ja falhei",
      "justifyLabel": "Sempre tentei",
      "followUp": "Mesmo no teu coracao — ressentimento, desprezo, ingratidao?"
    }
  ],
  "verdict": {
    "title": "Culpado.",
    "subtitle": "Pelo padrao perfeito de Deus, nenhum de nos e suficientemente bom."
  },
  "grace": {
    "heading": "Mas Deus, sendo rico em misericordia...",
    "body": "Imagina que estas num tribunal, culpado de um crime grave. A multa e enorme — mais do que alguma vez poderias pagar. Mas alguem se levanta e paga a tua multa por inteiro. O juiz pode legalmente deixar-te ir — a justica foi feita.\n\nFoi isso que Deus fez por ti.\n\nHa dois mil anos, Deus veio a terra na pessoa de Jesus Cristo. Ele viveu uma vida perfeita — a unica pessoa que alguma vez conseguiu. Depois, voluntariamente morreu na cruz, tomando sobre Si o castigo que nos mereciamos.\n\nEle pagou a multa para que Deus, o Juiz justo, pudesse absolver o teu caso. Nao porque o mereceste. Nao porque o ganhaste. Mas porque Ele te ama.\n\nTres dias depois, ressuscitou dos mortos, vencendo a propria morte.",
    "scripture": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.",
    "scriptureRef": "Joao 3:16 (ACF)",
    "continueLabel": "Continuar"
  },
  "invitation": {
    "heading": "O que vais fazer com isto?",
    "prayer": "Deus, eu entendo que quebrei a Tua Lei e pequei contra Ti. Estou verdadeiramente arrependido. Creio que Jesus Cristo morreu na cruz para pagar a pena pelos meus pecados e que ressuscitou. Eu abandono os meus pecados e coloco a minha confianca somente em Jesus Cristo para a minha salvacao. Obrigado pela Tua misericordia e perdao. Em nome de Jesus, Amen.",
    "responses": {
      "prayed": "Eu fiz esta oracao",
      "thinking": "Quero pensar sobre isto",
      "dismissed": "Nao e para mim"
    },
    "resources": [
      { "name": "Saber mais em Living Waters", "url": "https://livingwaters.com/" },
      { "name": "Ler o Evangelho de Joao", "url": "https://www.bible.com/bible/212/JHN.1.ACF" },
      { "name": "Encontrar uma igreja perto de ti", "url": "https://www.google.com/maps/search/igreja+perto+de+mim" }
    ]
  },
  "share": {
    "prompt": "Partilha com alguem",
    "whatsappMessage": "Tu es uma boa pessoa? Faz este teste e descobre:",
    "telegramMessage": "Tu es uma boa pessoa? Faz este teste e descobre:",
    "linkCopied": "Link copiado!"
  },
  "meta": {
    "title": "Tu es uma Boa Pessoa? | Faz o Teste",
    "description": "A maioria das pessoas pensa que e boa. Descobre onde realmente estas."
  }
}
```

- [ ] **Step 3: Create i18n utility**

Create `lib/i18n.ts`:
```ts
import type { Messages } from "./types";

export const SUPPORTED_LOCALES = ["en", "pt"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export async function getMessages(locale: Locale): Promise<Messages> {
  const messages = await import(`@/messages/${locale}.json`);
  return messages.default as Messages;
}

export function getPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
  if (preferred && isValidLocale(preferred)) return preferred;
  return DEFAULT_LOCALE;
}
```

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/pt.json lib/i18n.ts
git commit -m "feat: add i18n message files (EN/NKJV, PT/ACF) and locale utilities"
```

---

## Task 4: Game State Machine

**Files:**
- Create: `lib/game-reducer.ts`

- [ ] **Step 1: Write the game reducer**

Create `lib/game-reducer.ts`:
```ts
import { GameState, GameAction, AnswerType } from "./types";
import { QUESTION_CONFIGS, TOTAL_QUESTIONS, INITIAL_SCORE } from "./questions";

export const initialGameState: GameState = {
  phase: "landing",
  currentQuestion: 0,
  score: INITIAL_SCORE,
  answers: [],
  startedAt: 0,
  completedAt: null,
  graceReached: false,
  invitationResponse: null,
  questionStartedAt: null,
};

function calculateDrain(questionIndex: number, answer: AnswerType): number {
  const config = QUESTION_CONFIGS[questionIndex];
  if (!config) return 0;
  return answer === "honest" ? config.honestDrain : config.justifyDrain;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...initialGameState,
        phase: "playing",
        startedAt: Date.now(),
        questionStartedAt: Date.now(),
      };

    case "ANSWER_QUESTION": {
      const config = QUESTION_CONFIGS[state.currentQuestion];
      if (!config) return state;

      const drain = calculateDrain(state.currentQuestion, action.answer);
      const newScore = Math.max(0, state.score - drain);
      const timeOnQuestion = state.questionStartedAt
        ? Date.now() - state.questionStartedAt
        : 0;

      const newAnswer = {
        questionId: config.id,
        answer: action.answer,
        commandment: config.commandment,
        scoreChange: -drain,
        timeOnQuestion,
      };

      return {
        ...state,
        score: newScore,
        answers: [...state.answers, newAnswer],
      };
    }

    case "ADVANCE_AFTER_FOLLOWUP": {
      const nextQuestion = state.currentQuestion + 1;
      const isLastQuestion = nextQuestion >= TOTAL_QUESTIONS;

      if (isLastQuestion) {
        return {
          ...state,
          phase: "verdict",
          currentQuestion: nextQuestion,
          completedAt: Date.now(),
        };
      }

      return {
        ...state,
        currentQuestion: nextQuestion,
        questionStartedAt: Date.now(),
      };
    }

    case "SHOW_VERDICT":
      return {
        ...state,
        phase: "verdict",
        completedAt: state.completedAt ?? Date.now(),
      };

    case "SHOW_GRACE":
      return {
        ...state,
        phase: "grace",
        graceReached: true,
      };

    case "SHOW_INVITATION":
      return {
        ...state,
        phase: "invitation",
      };

    case "SET_INVITATION_RESPONSE":
      return {
        ...state,
        invitationResponse: action.response,
      };

    default:
      return state;
  }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No type errors (or only errors from placeholder stubs, which is expected).

- [ ] **Step 3: Commit**

```bash
git add lib/game-reducer.ts
git commit -m "feat: add game state machine reducer with phase transitions"
```

---

## Task 5: Analytics Helpers

**Files:**
- Create: `lib/analytics.ts`

- [ ] **Step 1: Create analytics event helpers**

Create `lib/analytics.ts`:
```ts
import posthog from "posthog-js";

export function trackGameStarted(locale: string) {
  posthog.capture("game_started", {
    locale,
    referral_source: document.referrer || "direct",
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    utm_source: new URLSearchParams(window.location.search).get("utm_source"),
    utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
    utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
  });
}

export function trackQuestionAnswered(
  questionId: number,
  commandment: string,
  answerType: "honest" | "justify",
  scoreAfter: number,
  timeOnQuestion: number,
) {
  posthog.capture("question_answered", {
    questionId,
    commandment,
    answer_type: answerType,
    score_after: scoreAfter,
    time_on_question_ms: timeOnQuestion,
  });
}

export function trackFollowupShown(questionId: number) {
  posthog.capture("question_followup_shown", { questionId });
}

export function trackGameAbandoned(
  lastQuestionId: number,
  scoreAtExit: number,
  totalTime: number,
  locale: string,
) {
  posthog.capture("game_abandoned", {
    last_question_id: lastQuestionId,
    score_at_exit: scoreAtExit,
    total_time_ms: totalTime,
    locale,
  });
}

export function trackVerdictReached(
  totalHonest: number,
  totalJustify: number,
  totalTime: number,
) {
  posthog.capture("verdict_reached", {
    total_honest: totalHonest,
    total_justify: totalJustify,
    total_time_ms: totalTime,
  });
}

export function trackGraceViewed(timeSpent: number) {
  posthog.capture("grace_viewed", {
    time_spent_ms: timeSpent,
  });
}

export function trackInvitationResponse(
  response: "prayed" | "thinking" | "dismissed",
  totalTime: number,
) {
  posthog.capture("invitation_response", {
    response,
    total_time_ms: totalTime,
  });
}

export function trackResourceClicked(name: string, url: string) {
  posthog.capture("resource_clicked", { resource_name: name, resource_url: url });
}

export function trackShared(
  method: "whatsapp" | "telegram" | "copy" | "native",
  locale: string,
) {
  posthog.capture("shared", { share_method: method, locale });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/analytics.ts
git commit -m "feat: add PostHog analytics event helpers"
```

---

## Task 6: Providers — PostHog, Sentry, Vercel Analytics

**Files:**
- Create: `components/providers.tsx`
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`

- [ ] **Step 1: Initialize Sentry**

Run:
```bash
npx @sentry/wizard@latest -i nextjs
```

Follow the prompts. This creates `sentry.client.config.ts`, `sentry.server.config.ts`, and updates `next.config.ts`.

If the wizard is not available or doesn't work, create the files manually:

Create `sentry.client.config.ts`:
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  beforeBreadcrumb(breadcrumb) {
    return breadcrumb;
  },
});
```

Create `sentry.server.config.ts`:
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

- [ ] **Step 2: Create client providers component**

Create `components/providers.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Analytics } from "@vercel/analytics/next";

function PostHogInit() {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // We handle this manually
        capture_pageleave: true,
        session_recording: {
          maskAllInputs: false,
          maskTextSelector: undefined,
        },
      });
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogInit />
      <Analytics />
      {children}
    </PostHogProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/providers.tsx sentry.client.config.ts sentry.server.config.ts
git commit -m "feat: add PostHog, Sentry, and Vercel Analytics providers"
```

---

## Task 7: i18n Routing — Locale Layout, Proxy, Page Shell

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/[locale]/layout.tsx`
- Create: `app/[locale]/page.tsx`
- Create: `app/proxy.ts`
- Create: `components/game-provider.tsx`
- Create: `components/game-shell.tsx`

- [ ] **Step 1: Update root layout to minimal shell**

Update `app/layout.tsx` to be a bare html/body wrapper without lang (locale layout sets it):
```tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

- [ ] **Step 2: Create locale layout**

Create `app/[locale]/layout.tsx`:
```tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { notFound } from "next/navigation";
import { isValidLocale, getMessages } from "@/lib/i18n";
import { Providers } from "@/components/providers";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = await getMessages(locale);

  return {
    title: messages.meta.title,
    description: messages.meta.description,
    openGraph: {
      title: messages.meta.title,
      description: messages.meta.description,
      images: [`/og-image-${locale}.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta.title,
      description: messages.meta.description,
      images: [`/og-image-${locale}.png`],
    },
  };
}

export default async function LocaleLayout({ params, children }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <html lang={locale} className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-black text-white min-h-dvh`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create locale page**

Create `app/[locale]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { isValidLocale, getMessages, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { GameProvider } from "@/components/game-provider";
import { GameShell } from "@/components/game-shell";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function GamePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await getMessages(locale as Locale);

  return (
    <GameProvider>
      <GameShell messages={messages} locale={locale as Locale} />
    </GameProvider>
  );
}
```

- [ ] **Step 4: Create middleware.ts for locale redirect**

Create `middleware.ts` at the **project root** (not inside `app/`):
```ts
import { NextRequest, NextResponse } from "next/server";
import { getPreferredLocale, SUPPORTED_LOCALES } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Only redirect the root path
  if (pathname !== "/") return NextResponse.next();

  const locale = getPreferredLocale(
    request.headers.get("accept-language"),
  );

  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

export const config = {
  matcher: ["/"],
};
```

- [ ] **Step 5: Create GameProvider (context + reducer)**

Create `components/game-provider.tsx`:
```tsx
"use client";

import { createContext, useContext, useReducer, type Dispatch } from "react";
import { gameReducer, initialGameState } from "@/lib/game-reducer";
import type { GameState, GameAction } from "@/lib/types";

const GameStateContext = createContext<GameState>(initialGameState);
const GameDispatchContext = createContext<Dispatch<GameAction>>(() => {});

export function useGameState() {
  return useContext(GameStateContext);
}

export function useGameDispatch() {
  return useContext(GameDispatchContext);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}
```

- [ ] **Step 6: Create placeholder screen components**

Create stub files so the project compiles. Each will be replaced in Tasks 8-13:

```bash
for comp in landing question-card follow-up score-bar verdict-screen crack-overlay grace-screen invitation-screen share-buttons; do
  echo '"use client";
export function '$(echo $comp | sed 's/-\(.\)/\U\1/g;s/^\(.\)/\U\1/')' (props: any) { return <div>{JSON.stringify(props)}</div>; }' > components/$comp.tsx
done
```

Alternatively, create each file manually with a simple placeholder export. These will be fully replaced in subsequent tasks.

- [ ] **Step 7: Create GameShell (phase router)**

Create `components/game-shell.tsx`:
```tsx
"use client";

import { useGameState } from "@/components/game-provider";
import { Landing } from "@/components/landing";
import { QuestionCard } from "@/components/question-card";
import { ScoreBar } from "@/components/score-bar";
import { VerdictScreen } from "@/components/verdict-screen";
import { GraceScreen } from "@/components/grace-screen";
import { InvitationScreen } from "@/components/invitation-screen";
import type { Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface GameShellProps {
  messages: Messages;
  locale: Locale;
}

export function GameShell({ messages, locale }: GameShellProps) {
  const state = useGameState();

  return (
    <main className="relative min-h-dvh flex flex-col">
      {state.phase === "playing" && <ScoreBar score={state.score} />}

      {state.phase === "landing" && (
        <Landing messages={messages.landing} locale={locale} />
      )}

      {state.phase === "playing" && (
        <QuestionCard
          question={messages.questions[state.currentQuestion]}
          questionIndex={state.currentQuestion}
          score={state.score}
          locale={locale}
        />
      )}

      {state.phase === "verdict" && (
        <VerdictScreen messages={messages.verdict} state={state} />
      )}

      {state.phase === "grace" && (
        <GraceScreen messages={messages.grace} />
      )}

      {state.phase === "invitation" && (
        <InvitationScreen
          messages={messages}
          locale={locale}
          state={state}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add app/ components/game-provider.tsx components/game-shell.tsx
git commit -m "feat: add i18n routing, locale layout, game provider, and shell"
```

---

## Task 8: Landing Screen

**Files:**
- Create: `components/landing.tsx`

- [ ] **Step 1: Build the landing component**

Create `components/landing.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { trackGameStarted } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

interface LandingProps {
  messages: { title: string; cta: string };
  locale: Locale;
}

export function Landing({ messages, locale }: LandingProps) {
  const dispatch = useGameDispatch();

  function handleStart() {
    trackGameStarted(locale);
    dispatch({ type: "START_GAME" });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
    >
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        {messages.title}
      </h1>

      <motion.button
        onClick={handleStart}
        whileTap={{ scale: 0.97 }}
        className="mt-12 rounded-full border border-white/20 px-8 py-4 text-lg font-medium transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px] min-w-[44px]"
      >
        {messages.cta}
      </motion.button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify landing renders**

Run: `npm run dev`, navigate to `http://localhost:3000/en`.
Expected: Black screen with "Are you a good person?" centered and "Find out" button.

- [ ] **Step 3: Commit**

```bash
git add components/landing.tsx
git commit -m "feat: add landing screen component"
```

---

## Task 9: Score Bar

**Files:**
- Create: `components/score-bar.tsx`

- [ ] **Step 1: Build the animated score bar**

Create `components/score-bar.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";

interface ScoreBarProps {
  score: number;
  isRefilling?: boolean;
}

function getBarColor(score: number): string {
  if (score > 60) return "#22c55e"; // green
  if (score > 35) return "#eab308"; // yellow
  if (score > 15) return "#f97316"; // orange
  return "#ef4444"; // red
}

export function ScoreBar({ score, isRefilling = false }: ScoreBarProps) {
  const color = isRefilling ? "#D4A843" : getBarColor(score);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-white/10">
      <motion.div
        className="h-full"
        style={{ backgroundColor: color }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-live="polite"
      />
      <span
        className="fixed top-3 right-4 font-mono text-sm tabular-nums"
        style={{ color }}
        aria-hidden="true"
      >
        {score}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/score-bar.tsx
git commit -m "feat: add animated score bar with color transitions"
```

---

## Task 10: Question Card & Follow-up

**Files:**
- Create: `components/question-card.tsx`
- Create: `components/follow-up.tsx`

- [ ] **Step 1: Build the follow-up component**

Create `components/follow-up.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";

interface FollowUpProps {
  text: string;
}

export function FollowUp({ text }: FollowUpProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-6 text-sm text-white/60 italic max-w-sm"
    >
      {text}
    </motion.p>
  );
}
```

- [ ] **Step 2: Build the question card component**

Create `components/question-card.tsx`:
```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { FollowUp } from "@/components/follow-up";
import {
  trackQuestionAnswered,
  trackFollowupShown,
} from "@/lib/analytics";
import { QUESTION_CONFIGS } from "@/lib/questions";
import type { AnswerType } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface QuestionCardProps {
  question: {
    id: number;
    text: string;
    commandment: string;
    honestLabel: string;
    justifyLabel: string;
    followUp: string;
  };
  questionIndex: number;
  score: number;
  locale: Locale;
}

export function QuestionCard({
  question,
  questionIndex,
  score,
  locale,
}: QuestionCardProps) {
  const dispatch = useGameDispatch();
  const [answered, setAnswered] = useState<AnswerType | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const advance = useCallback(() => {
    dispatch({ type: "ADVANCE_AFTER_FOLLOWUP" });
  }, [dispatch]);

  // Reset state when question changes
  useEffect(() => {
    setAnswered(null);
    setShowFollowUp(false);
  }, [questionIndex]);

  function handleAnswer(answer: AnswerType) {
    if (answered) return; // Prevent double-tap

    setAnswered(answer);
    dispatch({ type: "ANSWER_QUESTION", answer });

    const config = QUESTION_CONFIGS[questionIndex];
    const drain = answer === "honest" ? config.honestDrain : config.justifyDrain;
    const newScore = Math.max(0, score - drain);

    trackQuestionAnswered(
      question.id,
      question.commandment,
      answer,
      newScore,
      0, // timeOnQuestion is calculated in reducer
    );

    if (answer === "justify") {
      // Show follow-up after a short delay
      setTimeout(() => {
        setShowFollowUp(true);
        trackFollowupShown(question.id);
      }, 800);
      // Auto-advance after follow-up display
      setTimeout(() => {
        advance();
      }, 3500);
    } else {
      // Honest answer — advance after score animation
      setTimeout(() => {
        advance();
      }, 1200);
    }
  }

  // Visual mood based on question progress
  const bgOpacity = Math.max(0, 0.05 - questionIndex * 0.006);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: `rgba(255, 255, 255, ${bgOpacity})` }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <p className="text-xs uppercase tracking-widest text-white/30 mb-6">
            {question.commandment}
          </p>

          <h2 className="text-2xl font-semibold leading-snug sm:text-3xl max-w-lg">
            {question.text}
          </h2>

          {!answered && (
            <div className="mt-10 flex flex-col gap-3 w-full max-w-xs sm:flex-row sm:max-w-md sm:gap-4">
              <button
                onClick={() => handleAnswer("honest")}
                className="rounded-lg border border-white/20 px-6 py-4 text-base font-medium transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px] w-full"
              >
                {question.honestLabel}
              </button>
              <button
                onClick={() => handleAnswer("justify")}
                className="rounded-lg border border-white/10 px-6 py-4 text-base text-white/60 font-medium transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px] w-full"
              >
                {question.justifyLabel}
              </button>
            </div>
          )}

          {answered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10"
            >
              {showFollowUp && <FollowUp text={question.followUp} />}
              {!showFollowUp && answered === "honest" && (
                <p className="text-sm text-white/40">...</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: Verify game flow works**

Run: `npm run dev`, navigate to `/en`, click "Find out", answer questions.
Expected: Questions advance, score bar drains, follow-ups appear for justify answers.

- [ ] **Step 4: Commit**

```bash
git add components/question-card.tsx components/follow-up.tsx
git commit -m "feat: add question card with honest/justify paths and follow-ups"
```

---

## Task 11: Verdict Screen with Crack Effect

**Files:**
- Create: `components/verdict-screen.tsx`
- Create: `components/crack-overlay.tsx`

- [ ] **Step 1: Create the crack overlay SVG component**

Create `components/crack-overlay.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";

export function CrackOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-none fixed inset-0 z-40"
    >
      <svg
        viewBox="0 0 400 800"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Main crack from center */}
        <motion.path
          d="M200 400 L195 350 L205 300 L190 250 L210 200 L185 150 L200 100 L195 50 L200 0"
          stroke="white"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.path
          d="M200 400 L205 450 L195 500 L210 550 L190 600 L215 650 L200 700 L205 750 L200 800"
          stroke="white"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        />
        {/* Branches */}
        <motion.path
          d="M195 350 L150 320 L120 280"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        />
        <motion.path
          d="M205 300 L260 270 L290 230"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        />
        <motion.path
          d="M205 450 L250 480 L280 520"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        />
        <motion.path
          d="M195 500 L150 530 L110 570"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        />
        {/* Fine cracks */}
        <motion.path
          d="M150 320 L130 350 L100 360"
          stroke="white"
          strokeWidth="1"
          fill="none"
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
        <motion.path
          d="M260 270 L280 290 L310 285"
          stroke="white"
          strokeWidth="1"
          fill="none"
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.55 }}
        />
      </svg>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create verdict screen**

Create `components/verdict-screen.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { CrackOverlay } from "@/components/crack-overlay";
import { trackVerdictReached } from "@/lib/analytics";
import type { GameState } from "@/lib/types";

interface VerdictScreenProps {
  messages: { title: string; subtitle: string };
  state: GameState;
}

export function VerdictScreen({ messages, state }: VerdictScreenProps) {
  const dispatch = useGameDispatch();

  useEffect(() => {
    const totalHonest = state.answers.filter((a) => a.answer === "honest").length;
    const totalJustify = state.answers.filter((a) => a.answer === "justify").length;
    const totalTime = state.completedAt
      ? state.completedAt - state.startedAt
      : Date.now() - state.startedAt;

    trackVerdictReached(totalHonest, totalJustify, totalTime);

    // Auto-transition to grace after dramatic pause
    const timer = setTimeout(() => {
      dispatch({ type: "SHOW_GRACE" });
    }, 5000);

    return () => clearTimeout(timer);
  }, [dispatch, state]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <CrackOverlay />

      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="relative z-50 text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
      >
        {messages.title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.0 }}
        className="relative z-50 mt-6 text-lg text-white/60 max-w-md"
      >
        {messages.subtitle}
      </motion.p>
    </div>
  );
}
```

- [ ] **Step 3: Verify verdict screen**

Run: `npm run dev`, play through all questions.
Expected: Screen cracks animate, "Guilty." appears with weight, subtitle fades in.

- [ ] **Step 4: Commit**

```bash
git add components/verdict-screen.tsx components/crack-overlay.tsx
git commit -m "feat: add verdict screen with animated SVG crack overlay"
```

---

## Task 12: Grace Screen

**Files:**
- Create: `components/grace-screen.tsx`

- [ ] **Step 1: Build the grace screen with light rays and score refill**

Create `components/grace-screen.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { ScoreBar } from "@/components/score-bar";
import { trackGraceViewed } from "@/lib/analytics";

interface GraceScreenProps {
  messages: {
    heading: string;
    body: string;
    scripture: string;
    scriptureRef: string;
  };
}

export function GraceScreen({ messages }: GraceScreenProps) {
  const dispatch = useGameDispatch();
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      trackGraceViewed(Date.now() - startTime.current);
    };
  }, []);

  function handleContinue() {
    dispatch({ type: "SHOW_INVITATION" });
  }

  const paragraphs = messages.body.split("\n\n");

  return (
    <div className="relative flex flex-1 flex-col min-h-dvh">
      {/* Light rays background effect */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 3 }}
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 40%, transparent 0deg, rgba(212, 168, 67, 0.3) 15deg, transparent 30deg, transparent 60deg, rgba(212, 168, 67, 0.2) 75deg, transparent 90deg, transparent 150deg, rgba(212, 168, 67, 0.25) 165deg, transparent 180deg, transparent 240deg, rgba(212, 168, 67, 0.15) 255deg, transparent 270deg, transparent 330deg, rgba(212, 168, 67, 0.2) 345deg, transparent 360deg)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Score bar refilling */}
      <ScoreBar score={100} isRefilling />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-3xl font-bold text-gold sm:text-4xl"
        >
          {messages.heading}
        </motion.h2>

        <div className="mt-10 space-y-6 text-left">
          {paragraphs.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 + i * 0.4 }}
              className="text-base leading-relaxed text-white/80 sm:text-lg"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 + paragraphs.length * 0.4 + 0.5 }}
          className="mt-10 border-l-2 border-gold pl-4 text-left"
        >
          <p className="text-base italic text-white/70 sm:text-lg">
            &ldquo;{messages.scripture}&rdquo;
          </p>
          <p className="mt-2 text-sm text-white/40">{messages.scriptureRef}</p>
        </motion.blockquote>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 1.5 + paragraphs.length * 0.4 + 1.5,
          }}
          onClick={handleContinue}
          whileTap={{ scale: 0.97 }}
          className="mt-12 rounded-full border border-gold/40 px-8 py-4 text-lg font-medium text-gold transition-colors hover:bg-gold/5 active:bg-gold/10 min-h-[44px]"
        >
          {messages.continueLabel} &rarr;
        </motion.button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/grace-screen.tsx
git commit -m "feat: add grace screen with light rays, gospel message, score refill"
```

---

## Task 13: Invitation Screen & Share Buttons

**Files:**
- Create: `components/invitation-screen.tsx`
- Create: `components/share-buttons.tsx`

- [ ] **Step 1: Create share buttons component**

Create `components/share-buttons.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trackShared } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

interface ShareButtonsProps {
  messages: {
    prompt: string;
    whatsappMessage: string;
    telegramMessage: string;
    linkCopied: string;
  };
  locale: Locale;
}

export function ShareButtons({ messages, locale }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare("share" in navigator);
  }, []);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}`
      : "";

  function shareWhatsApp() {
    trackShared("whatsapp", locale);
    const text = encodeURIComponent(`${messages.whatsappMessage} ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareTelegram() {
    trackShared("telegram", locale);
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(messages.telegramMessage);
    window.open(
      `https://t.me/share/url?url=${url}&text=${text}`,
      "_blank",
    );
  }

  async function copyLink() {
    trackShared("copy", locale);
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (!navigator.share) return;
    trackShared("native", locale);
    try {
      await navigator.share({ url: shareUrl, text: messages.whatsappMessage });
    } catch {
      // User cancelled — do nothing
    }
  }

  return (
    <div className="mt-8">
      <p className="text-sm text-white/40 mb-4">{messages.prompt}</p>
      <div className="flex items-center justify-center gap-4">
        {/* WhatsApp */}
        <button
          onClick={shareWhatsApp}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition-colors hover:bg-[#25D366]/20 min-h-[44px] min-w-[44px]"
          aria-label="Share on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>

        {/* Telegram */}
        <button
          onClick={shareTelegram}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0088cc]/10 text-[#0088cc] transition-colors hover:bg-[#0088cc]/20 min-h-[44px] min-w-[44px]"
          aria-label="Share on Telegram"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </button>

        {/* Copy link */}
        <button
          onClick={copyLink}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 min-h-[44px] min-w-[44px]"
          aria-label="Copy link"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          )}
        </button>

        {/* Native share (mobile only — detected after hydration) */}
        {canNativeShare && (
          <button
            onClick={nativeShare}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 min-h-[44px] min-w-[44px]"
            aria-label="Share"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        )}
      </div>

      {copied && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-white/40"
        >
          {messages.linkCopied}
        </motion.p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create invitation screen**

Create `components/invitation-screen.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { ShareButtons } from "@/components/share-buttons";
import {
  trackInvitationResponse,
  trackResourceClicked,
} from "@/lib/analytics";
import type { GameState, InvitationResponse, Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface InvitationScreenProps {
  messages: Messages;
  locale: Locale;
  state: GameState;
}

export function InvitationScreen({
  messages,
  locale,
  state,
}: InvitationScreenProps) {
  const dispatch = useGameDispatch();
  const { invitation, share } = messages;

  function handleResponse(response: InvitationResponse) {
    const totalTime = Date.now() - state.startedAt;
    trackInvitationResponse(response, totalTime);
    dispatch({ type: "SET_INVITATION_RESPONSE", response });
  }

  function handleResourceClick(name: string, url: string) {
    trackResourceClicked(name, url);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-bold sm:text-4xl"
        >
          {invitation.heading}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 rounded-lg border border-white/10 bg-white/[0.02] p-6 text-left"
        >
          <p className="text-base leading-relaxed text-white/70 whitespace-pre-line">
            {invitation.prayer}
          </p>
        </motion.div>

        {!state.invitationResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 flex flex-col gap-3"
          >
            <button
              onClick={() => handleResponse("prayed")}
              className="rounded-lg border border-gold/30 px-6 py-4 text-base font-medium text-gold transition-colors hover:bg-gold/5 active:bg-gold/10 min-h-[44px]"
            >
              {invitation.responses.prayed}
            </button>
            <button
              onClick={() => handleResponse("thinking")}
              className="rounded-lg border border-white/20 px-6 py-4 text-base font-medium text-white/60 transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px]"
            >
              {invitation.responses.thinking}
            </button>
            <button
              onClick={() => handleResponse("dismissed")}
              className="px-6 py-3 text-sm text-white/30 transition-colors hover:text-white/50 min-h-[44px]"
            >
              {invitation.responses.dismissed}
            </button>
          </motion.div>
        )}

        {state.invitationResponse && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8"
          >
            {/* Resources */}
            <div className="flex flex-col gap-2 mt-6">
              {invitation.resources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleResourceClick(resource.name, resource.url)
                  }
                  className="rounded-lg border border-white/10 px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
                >
                  {resource.name} &rarr;
                </a>
              ))}
            </div>

            {/* Share buttons */}
            <ShareButtons messages={share} locale={locale} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify full game flow end-to-end**

Run: `npm run dev`, play through all phases in both `/en` and `/pt`.
Expected: Landing → Questions → Verdict → Grace → Invitation → Share. All text displays in correct language.

- [ ] **Step 4: Commit**

```bash
git add components/invitation-screen.tsx components/share-buttons.tsx
git commit -m "feat: add invitation screen with prayer, responses, share buttons"
```

---

## Task 14: Reduced Motion, Sentry Breadcrumbs, Scroll Tracking & Accessibility

**Files:**
- Modify: `lib/utils.ts`
- Modify: `lib/analytics.ts`
- Modify: `components/game-shell.tsx`
- Modify: `components/grace-screen.tsx`
- Modify: `components/score-bar.tsx`
- Modify: `components/crack-overlay.tsx`
- Modify: `app/[locale]/layout.tsx`
- Create: `app/[locale]/not-found.tsx`

- [ ] **Step 1: Add prefers-reduced-motion hook**

Add to `lib/utils.ts`:
```ts
import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return prefersReducedMotion;
}
```

- [ ] **Step 2: Wire reduced motion into animation components**

In each animated component (`score-bar.tsx`, `crack-overlay.tsx`, `grace-screen.tsx`, `question-card.tsx`), import and use the hook:

```tsx
import { usePrefersReducedMotion } from "@/lib/utils";

// Inside the component:
const prefersReducedMotion = usePrefersReducedMotion();

// Then use it in framer-motion transitions:
// e.g., transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
```

For `score-bar.tsx`: set `transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}`.
For `crack-overlay.tsx`: if reduced motion, skip SVG path animations — just show the final state.
For `grace-screen.tsx`: reduce all delays to 0 and durations to 0.2.
For `question-card.tsx`: disable slide animations, use simple opacity fade.

- [ ] **Step 3: Add Sentry breadcrumbs for phase transitions**

In `components/game-shell.tsx`, add a `useEffect` that watches `state.phase`:

```tsx
import * as Sentry from "@sentry/nextjs";

// Inside GameShell component:
useEffect(() => {
  Sentry.addBreadcrumb({
    category: "game",
    message: `Phase: ${state.phase}`,
    level: "info",
    data: { phase: state.phase, score: state.score },
  });
}, [state.phase, state.score]);
```

- [ ] **Step 4: Update grace_viewed tracking with scroll depth**

Update `lib/analytics.ts` — change `trackGraceViewed` signature:

```ts
export function trackGraceViewed(timeSpent: number, scrollDepth: number) {
  posthog.capture("grace_viewed", {
    time_spent_ms: timeSpent,
    scroll_depth_percent: scrollDepth,
  });
}
```

In `components/grace-screen.tsx`, add scroll depth tracking:

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const maxScrollDepth = useRef(0);

useEffect(() => {
  function handleScroll() {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const depth = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    if (depth > maxScrollDepth.current) maxScrollDepth.current = depth;
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", handleScroll);
    trackGraceViewed(Date.now() - startTime.current, maxScrollDepth.current);
  };
}, []);
```

Remove the previous `useEffect` cleanup that called `trackGraceViewed` with only one arg.

- [ ] **Step 5: Configure Sentry source maps in next.config.ts**

Wrap the Next.js config with `withSentryConfig`:

```ts
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = { /* existing config */ };

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

- [ ] **Step 6: Add noscript fallback (bilingual)**

In `app/[locale]/layout.tsx`, add inside `<body>`:
```tsx
<noscript>
  <div style={{ padding: "2rem", textAlign: "center", color: "white", background: "black" }}>
    <h1>Are You a Good Person? / Tu es uma boa pessoa?</h1>
    <p>This experience requires JavaScript. / Esta experiencia requer JavaScript.</p>
    <p>For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life. — John 3:16</p>
    <p>Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna. — Joao 3:16</p>
  </div>
</noscript>
```

- [ ] **Step 7: Create not-found page**

Create `app/[locale]/not-found.tsx`:
```tsx
export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-white/40">Page not found</p>
    </div>
  );
}
```

- [ ] **Step 8: Verify keyboard navigation works through all phases**

Test: Tab through buttons on landing, questions, invitation. Enter/Space to activate.
Expected: All interactive elements reachable and activatable via keyboard.

- [ ] **Step 9: Commit**

```bash
git add lib/utils.ts lib/analytics.ts components/ app/[locale]/ next.config.ts
git commit -m "feat: add reduced motion, Sentry breadcrumbs, scroll tracking, a11y pass"
```

---

## Task 15: OG Images & Metadata

**Files:**
- Create: `public/og-image-en.png` (placeholder)
- Create: `public/og-image-pt.png` (placeholder)
- Create: `app/favicon.ico` (placeholder)

- [ ] **Step 1: Create placeholder OG images**

For now, create simple dark placeholder images. These can be replaced with proper designs later.

Run:
```bash
# Create a simple 1200x630 black PNG with text using a tool or just use a placeholder
# For now, create empty placeholder files
touch public/og-image-en.png public/og-image-pt.png
```

Note: Replace these with actual designed OG images before launch. Should be 1200x630px, dark background, with "Are you a good person?" / "Tu es uma boa pessoa?" in bold white text.

- [ ] **Step 2: Verify OG tags render correctly**

Run: `npm run dev`, check page source at `/en` for og:title, og:description, og:image.
Expected: Locale-specific metadata present in HTML head.

- [ ] **Step 3: Commit**

```bash
git add public/ app/favicon.ico
git commit -m "feat: add placeholder OG images and favicon"
```

---

## Task 16: Game Abandonment Tracking

**Files:**
- Modify: `components/game-shell.tsx`

- [ ] **Step 1: Add beforeunload tracking for game abandonment**

In `components/game-shell.tsx`, add an effect that fires `game_abandoned` when the user leaves during the "playing" phase:

```tsx
// Add to GameShell component
useEffect(() => {
  function handleBeforeUnload() {
    if (state.phase === "playing") {
      const currentConfig = QUESTION_CONFIGS[state.currentQuestion];
      trackGameAbandoned(
        currentConfig?.id ?? 0,
        state.score,
        Date.now() - state.startedAt,
        locale,
      );
    }
  }

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [state.phase, state.currentQuestion, state.score, state.startedAt, locale]);
```

Add the necessary imports for `trackGameAbandoned` from `@/lib/analytics` and `QUESTION_CONFIGS` from `@/lib/questions`.

- [ ] **Step 2: Commit**

```bash
git add components/game-shell.tsx
git commit -m "feat: track game abandonment on page exit during play"
```

---

## Task 17: Build Verification & Type Check

- [ ] **Step 1: Run TypeScript type check**

Run:
```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Step 2: Run production build**

Run:
```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Test production build locally**

Run:
```bash
npm run start
```
Navigate to `http://localhost:3000/en` and `http://localhost:3000/pt`. Play through full flow on both.
Expected: Full game works in both languages, all animations smooth, share buttons work.

- [ ] **Step 4: Test root redirect**

Navigate to `http://localhost:3000/`.
Expected: Redirects to `/en` (or `/pt` if browser language is Portuguese).

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build and type-check issues"
```

---

## Task 18: Deploy to Vercel

- [ ] **Step 1: Link project to Vercel**

Run:
```bash
vercel link
```

Follow the prompts to create or link to a Vercel project.

- [ ] **Step 2: Set up PostHog integration**

Run:
```bash
vercel integration add posthog
```

Or manually add env vars:
```bash
vercel env add NEXT_PUBLIC_POSTHOG_KEY
vercel env add NEXT_PUBLIC_POSTHOG_HOST
```

- [ ] **Step 3: Set up Sentry integration**

Run:
```bash
vercel integration add sentry
```

Or manually add:
```bash
vercel env add NEXT_PUBLIC_SENTRY_DSN
vercel env add SENTRY_AUTH_TOKEN
```

- [ ] **Step 4: Pull env vars locally**

Run:
```bash
vercel env pull
```

- [ ] **Step 5: Deploy to preview**

Run:
```bash
vercel
```

Expected: Preview deployment URL. Test full flow on the preview URL.

- [ ] **Step 6: Deploy to production**

Run:
```bash
vercel --prod
```

- [ ] **Step 7: Verify production deployment**

Navigate to the production URL. Test:
- `/` redirects to locale
- `/en` full game flow in English
- `/pt` full game flow in Portuguese
- Share buttons generate correct locale-specific URLs
- Analytics events appear in PostHog dashboard
- No errors in Sentry

- [ ] **Step 8: Commit any deployment config changes**

```bash
git add -A
git commit -m "chore: add Vercel deployment configuration"
```
