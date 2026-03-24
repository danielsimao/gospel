# AI Conversation Experience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stage-managed AI chat experience at `/[locale]/chat` where an AI walks users through the gospel using Ray Comfort's method, alongside the existing Verdict game.

**Architecture:** AI SDK v6 `useChat` with a Route Handler that calls `streamText` via AI Gateway. Client-side stage machine (useState) tracks conversation progression. The AI calls an `advance_stage` tool to signal stage transitions. Existing `InvitationScreen` is refactored to accept props and reused at the end.

**Tech Stack:** AI SDK v6 (`ai`, `@ai-sdk/react`), AI Gateway (`anthropic/claude-haiku-4.5`), Next.js 16 App Router, existing Tailwind v4 + Framer Motion stack

**Spec:** `docs/superpowers/specs/2026-03-24-ai-conversation-design.md`

---

## File Structure

```
src/
├── app/[locale]/
│   ├── chat/
│   │   ├── page.tsx                # Server component — loads messages, renders ChatShell
│   │   └── api/
│   │       └── route.ts            # Route Handler — streamText with stage-specific prompt
│   └── page.tsx                    # Existing Verdict (unchanged)
├── components/
│   ├── chat/
│   │   ├── chat-shell.tsx          # Stage machine + useChat + phase routing
│   │   ├── chat-landing.tsx        # "Have a conversation" CTA
│   │   ├── chat-messages.tsx       # Message list with scroll management
│   │   ├── chat-input.tsx          # Text input + send button
│   │   ├── chat-bubble.tsx         # Single message bubble (user or AI)
│   │   ├── typing-indicator.tsx    # Pulsing dots while streaming
│   │   └── stage-divider.tsx       # Subtle divider between stages
│   ├── invitation-screen.tsx       # MODIFIED — props instead of context
│   └── game-shell.tsx              # MODIFIED — passes new props to InvitationScreen
├── lib/
│   ├── types.ts                    # MODIFIED — add ChatStage, ChatMessages
│   ├── chat-analytics.ts           # Chat-specific PostHog event helpers
│   ├── chat-prompts.ts             # System prompt builder (guardrails + stage + locale)
│   └── i18n.ts                     # MODIFIED — optional chat validation
├── messages/
│   ├── en.json                     # MODIFIED — add chat key
│   └── pt.json                     # MODIFIED — add chat key
```

---

## Task 1: Install AI SDK Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install AI SDK packages**

```bash
npm install ai @ai-sdk/react
```

- [ ] **Step 2: Verify install succeeded**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install AI SDK v6 dependencies (ai, @ai-sdk/react)"
```

---

## Task 2: Extend Types — ChatStage, ChatMessages

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add chat types to types.ts**

Add at the end of `src/lib/types.ts`:

```ts
// Chat experience types
export type ChatStage = "landing" | "intro" | "commandments" | "conviction" | "grace" | "invitation";

export interface ChatMessages {
  landing: { title: string; subtitle: string; cta: string };
  input: { placeholder: string; send: string };
  stageDivider: string;
  typing: string;
  systemPrompts: Partial<Record<ChatStage, string>>;
  meta: { title: string; description: string };
  share: { whatsappMessage: string; telegramMessage: string };
}
```

- [ ] **Step 2: Make `chat` optional in `Messages`**

Add to the `Messages` interface:

```ts
export interface Messages {
  // ... existing fields unchanged
  chat?: ChatMessages;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add ChatStage and ChatMessages types"
```

---

## Task 3: Add Chat i18n Content

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/pt.json`
- Modify: `src/lib/i18n.ts`

- [ ] **Step 1: Add chat content to en.json**

Add a `"chat"` key at the end of `src/messages/en.json` (before the closing `}`):

```json
"chat": {
  "landing": {
    "title": "Have a conversation",
    "subtitle": "An honest talk about life, morality, and what comes after.",
    "cta": "Start talking"
  },
  "input": {
    "placeholder": "Type your answer...",
    "send": "Send"
  },
  "stageDivider": "·  ·  ·",
  "typing": "Thinking...",
  "systemPrompts": {
    "intro": "You are a warm, thoughtful person having a genuine conversation about morality and faith. Your approach is inspired by Ray Comfort's street evangelism — gentle, curious, and question-driven.\n\nStart by warmly greeting the person and asking: 'Do you think you're a good person?'\n\nKeep your opening short — one or two sentences max. Be warm and casual, like you're chatting on the street.\n\nRespond in English. Use the NKJV Bible version for any Scripture references.",
    "commandments": "You are continuing a conversation about morality. The person has shared their view on being a good person.\n\nYour goal: Walk them through the Ten Commandments naturally. Ask if they've ever:\n- Told a lie (9th commandment)\n- Stolen anything, even small (8th commandment)\n- Looked at someone with lust (7th — Jesus said this is adultery of the heart, Matthew 5:28)\n- Been angry enough to wish someone harm (6th — Jesus said this is murder of the heart, Matthew 5:22)\n- Used God's name as a curse word (3rd commandment)\n- Coveted what belongs to others (10th commandment)\n\nDo NOT list all commandments at once. Weave them naturally into the conversation, one or two at a time. If they deny something, gently probe with real-world examples (like Ray Comfort does).\n\nAfter covering at least 4 commandments, call the advance_stage tool.\n\nRespond in English. Use NKJV for Scripture.",
    "conviction": "You are helping someone see the weight of what they've admitted in the conversation.\n\nSummarize what they confessed — they admitted to lying (making them a liar), stealing (a thief), lusting (an adulterer at heart), etc. Use their own words where possible.\n\nThen ask: 'If God judged you by the Ten Commandments on Judgment Day, would you be innocent or guilty?'\n\nLet them answer. If they say guilty, acknowledge the weight of that. If they resist, gently remind them of what they admitted.\n\nDo NOT present the gospel yet. Stay in conviction. Once they've acknowledged guilt or you've clearly presented the verdict, call advance_stage.\n\nRespond in English. Use NKJV for Scripture.",
    "grace": "You are now sharing the gospel — the good news — with someone who has acknowledged they've broken God's law.\n\nShift your tone to warm and hopeful. Use the courtroom analogy:\n- They're guilty before a just Judge\n- The fine is enormous — more than they could ever pay\n- But someone stepped in and paid their fine in full\n- That someone is Jesus Christ\n\nExplain: God came to earth as Jesus Christ, lived a perfect life, and willingly died on the cross to take the punishment we deserve. He paid the fine so God could legally dismiss our case — not because we earned it, but because He loves us. Three days later, He rose from the dead.\n\nQuote John 3:16 (NKJV): 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.'\n\nAfter presenting the full gospel, call advance_stage.\n\nRespond in English. Use NKJV for Scripture."
  },
  "meta": {
    "title": "Have an Honest Conversation | Good Person Test",
    "description": "A personal conversation about life, morality, and what comes after."
  },
  "share": {
    "whatsappMessage": "Have an honest conversation about life and morality:",
    "telegramMessage": "Have an honest conversation about life and morality:"
  }
}
```

- [ ] **Step 2: Add chat content to pt.json**

Add a `"chat"` key at the end of `src/messages/pt.json` (before the closing `}`). Same structure but in Portuguese with ACF Bible references. System prompts instruct the AI to respond in Portuguese and use ACF.

```json
"chat": {
  "landing": {
    "title": "Tem uma conversa",
    "subtitle": "Uma conversa honesta sobre a vida, a moralidade e o que vem depois.",
    "cta": "Comecar a conversa"
  },
  "input": {
    "placeholder": "Escreve a tua resposta...",
    "send": "Enviar"
  },
  "stageDivider": "·  ·  ·",
  "typing": "A pensar...",
  "systemPrompts": {
    "intro": "Es uma pessoa calorosa e atenciosa a ter uma conversa genuina sobre moralidade e fe. A tua abordagem e inspirada no evangelismo de rua de Ray Comfort — gentil, curiosa e baseada em perguntas.\n\nComeca por cumprimentar calorosamente a pessoa e pergunta: 'Achas que es uma boa pessoa?'\n\nMantém a abertura curta — uma ou duas frases no maximo. Se caloroso e casual.\n\nResponde em Portugues de Portugal. Usa a versao ACF da Biblia para qualquer referencia biblica.",
    "commandments": "Estas a continuar uma conversa sobre moralidade. A pessoa partilhou a sua opiniao sobre ser uma boa pessoa.\n\nO teu objetivo: Guia-a pelos Dez Mandamentos naturalmente. Pergunta se alguma vez:\n- Mentiu (9o mandamento)\n- Roubou algo, mesmo pequeno (8o mandamento)\n- Olhou para alguem com desejo impuro (7o — Jesus disse que isto e adulterio no coracao, Mateus 5:28)\n- Teve tanta raiva que desejou mal a alguem (6o — Jesus disse que isto e homicidio no coracao, Mateus 5:22)\n- Usou o nome de Deus como palavrao (3o mandamento)\n- Cobicou o que pertence a outros (10o mandamento)\n\nNAO listes todos os mandamentos de uma vez. Integra-os naturalmente na conversa, um ou dois de cada vez.\n\nDepois de cobrir pelo menos 4 mandamentos, chama a ferramenta advance_stage.\n\nResponde em Portugues de Portugal. Usa ACF para as Escrituras.",
    "conviction": "Estas a ajudar alguem a ver o peso do que admitiu na conversa.\n\nResume o que confessaram — admitiram mentir (o que os torna mentirosos), roubar (ladroes), cobicar (adulteros de coracao), etc. Usa as palavras deles quando possivel.\n\nDepois pergunta: 'Se Deus te julgasse pelos Dez Mandamentos no Dia do Juizo, serias inocente ou culpado?'\n\nDeixa-os responder. Se disserem culpado, reconhece o peso disso. Se resistirem, lembra gentilmente o que admitiram.\n\nNAO apresentes o evangelho ainda. Fica na conviccao. Quando reconhecerem a culpa, chama advance_stage.\n\nResponde em Portugues de Portugal. Usa ACF para as Escrituras.",
    "grace": "Estas agora a partilhar o evangelho — as boas novas — com alguem que reconheceu ter quebrado a lei de Deus.\n\nMuda o tom para caloroso e esperancoso. Usa a analogia do tribunal:\n- Sao culpados perante um Juiz justo\n- A multa e enorme — mais do que alguma vez poderiam pagar\n- Mas alguem se levantou e pagou a multa por inteiro\n- Esse alguem e Jesus Cristo\n\nExplica: Deus veio a terra como Jesus Cristo, viveu uma vida perfeita e voluntariamente morreu na cruz para tomar sobre Si o castigo que mereciamos. Ele pagou a multa para que Deus pudesse legalmente absolver o nosso caso — nao porque o merecemos, mas porque nos ama. Tres dias depois, ressuscitou dos mortos.\n\nCita Joao 3:16 (ACF): 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.'\n\nDepois de apresentar o evangelho completo, chama advance_stage.\n\nResponde em Portugues de Portugal. Usa ACF para as Escrituras."
  },
  "meta": {
    "title": "Tem uma Conversa Honesta | Teste da Boa Pessoa",
    "description": "Uma conversa pessoal sobre a vida, a moralidade e o que vem depois."
  },
  "share": {
    "whatsappMessage": "Tem uma conversa honesta sobre a vida e a moralidade:",
    "telegramMessage": "Tem uma conversa honesta sobre a vida e a moralidade:"
  }
}
```

- [ ] **Step 3: Update validateMessages to optionally validate chat**

In `src/lib/i18n.ts`, add chat validation at the end of `validateMessages()`:

```ts
if (m.chat) {
  if (!m.chat.landing?.title || !m.chat.landing?.cta) {
    throw new Error(`[i18n] Missing chat landing content for locale "${locale}"`);
  }
  const requiredPrompts = ["intro", "commandments", "conviction", "grace"];
  for (const stage of requiredPrompts) {
    if (!m.chat.systemPrompts?.[stage as keyof typeof m.chat.systemPrompts]) {
      throw new Error(`[i18n] Missing chat system prompt "${stage}" for locale "${locale}"`);
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/pt.json src/lib/types.ts src/lib/i18n.ts
git commit -m "feat: add chat i18n content (EN/PT) and ChatMessages types"
```

---

## Task 4: Refactor InvitationScreen to Accept Props

**Files:**
- Modify: `src/components/invitation-screen.tsx`
- Modify: `src/components/game-shell.tsx`

This is the critical refactor — `InvitationScreen` must work for both Verdict and Chat.

- [ ] **Step 1: Refactor InvitationScreen to use props instead of context**

Replace `src/components/invitation-screen.tsx` with:

```tsx
"use client";

import { motion } from "framer-motion";
import { ShareButtons } from "@/components/share-buttons";
import {
  trackInvitationResponse,
  trackResourceClicked,
} from "@/lib/analytics";
import type { InvitationResponse, Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface InvitationScreenProps {
  messages: Messages;
  locale: Locale;
  startedAt: number;
  invitationResponse: InvitationResponse | null;
  onResponse: (response: InvitationResponse) => void;
  shareMessages?: { prompt: string; whatsappMessage: string; telegramMessage: string; linkCopied: string };
}

export function InvitationScreen({
  messages,
  locale,
  startedAt,
  invitationResponse,
  onResponse,
  shareMessages,
}: InvitationScreenProps) {
  const { invitation, share } = messages;
  const activeShareMessages = shareMessages || share;

  function handleResponse(response: InvitationResponse) {
    const totalTime = Date.now() - startedAt;
    trackInvitationResponse(response, totalTime);
    onResponse(response);
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

        {!invitationResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 flex flex-col gap-3"
          >
            <button
              onClick={() => handleResponse("prayed")}
              className="rounded-lg border border-[#D4A843]/30 px-6 py-4 text-base font-medium text-[#D4A843] transition-colors hover:bg-[#D4A843]/5 active:bg-[#D4A843]/10 min-h-[44px]"
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

        {invitationResponse && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8"
          >
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

            <ShareButtons messages={activeShareMessages} locale={locale} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update GameShell to pass props to InvitationScreen**

In `src/components/game-shell.tsx`, change the InvitationScreen usage from:

```tsx
<InvitationScreen
  messages={messages}
  locale={locale}
  state={state}
/>
```

To:

```tsx
<InvitationScreen
  messages={messages}
  locale={locale}
  startedAt={state.startedAt}
  invitationResponse={state.invitationResponse}
  onResponse={(response) => dispatch({ type: "SET_INVITATION_RESPONSE", response })}
/>
```

Also add `useGameDispatch` import and call it in the component:
```tsx
const dispatch = useGameDispatch();
```

- [ ] **Step 3: Verify Verdict game still works**

Run: `npm run dev`, navigate to `/en`, play through all phases.
Expected: Full Verdict flow works unchanged — landing → questions → verdict → grace → invitation with response buttons and share.

- [ ] **Step 4: Commit**

```bash
git add src/components/invitation-screen.tsx src/components/game-shell.tsx
git commit -m "refactor: InvitationScreen accepts props instead of context (for chat reuse)"
```

---

## Task 5: Chat Analytics Helpers

**Files:**
- Create: `src/lib/chat-analytics.ts`

- [ ] **Step 1: Create chat-specific analytics helpers**

Create `src/lib/chat-analytics.ts`:

```ts
import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app
  }
}

export function trackChatStarted(locale: string) {
  safeCapture("chat_started", {
    locale,
    referral_source: typeof document !== "undefined" ? document.referrer || "direct" : "unknown",
    device_type: typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    utm_source: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_source") : null,
    utm_medium: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_medium") : null,
  });
}

export function trackChatMessageSent(stage: string, messageLength: number, timeSinceLastMessage: number) {
  safeCapture("chat_message_sent", {
    stage,
    message_length: messageLength,
    time_since_last_message_ms: timeSinceLastMessage,
  });
}

export function trackChatStageAdvanced(fromStage: string, toStage: string, messagesInStage: number, timeInStage: number) {
  safeCapture("chat_stage_advanced", {
    from_stage: fromStage,
    to_stage: toStage,
    messages_in_stage: messagesInStage,
    time_in_stage_ms: timeInStage,
  });
}

export function trackChatAbandoned(lastStage: string, totalMessages: number, totalTime: number, locale: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (posthogKey) {
        navigator.sendBeacon(
          `${posthogHost}/capture/`,
          JSON.stringify({
            api_key: posthogKey,
            event: "chat_abandoned",
            properties: {
              last_stage: lastStage,
              total_messages: totalMessages,
              total_time_ms: totalTime,
              locale,
              distinct_id: posthog.get_distinct_id?.() || "anonymous",
            },
          }),
        );
        return;
      }
    }
  } catch {
    // Fall through
  }
  safeCapture("chat_abandoned", { last_stage: lastStage, total_messages: totalMessages, total_time_ms: totalTime, locale });
}

export function trackChatInvitationReached(totalMessages: number, totalTime: number) {
  safeCapture("chat_invitation_reached", {
    total_messages: totalMessages,
    total_time_ms: totalTime,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/chat-analytics.ts
git commit -m "feat: add chat-specific PostHog analytics helpers"
```

---

## Task 6: System Prompt Builder

**Files:**
- Create: `src/lib/chat-prompts.ts`

- [ ] **Step 1: Create the prompt builder**

Create `src/lib/chat-prompts.ts`:

```ts
import type { ChatStage, ChatMessages } from "./types";

const UNIVERSAL_GUARDRAILS = `
IMPORTANT CONSTRAINTS — you MUST follow these at all times:
- Never deny the deity of Christ, the resurrection, or substitutionary atonement.
- Never say "you're probably fine" or minimize sin in any way.
- Never add to or subtract from the gospel message.
- If the user asks off-topic questions, gently redirect to the current topic.
- Do not debate or argue — guide with questions, not lectures.
- If the user becomes hostile, remain gentle and respectful.
- Keep responses concise — 2-4 sentences per message. This is a conversation, not a sermon.
- You have a tool called "advance_stage". Call it ONLY when you've completed the objective for your current stage. Include a brief summary of what was covered.
`;

const STAGE_ORDER: ChatStage[] = ["intro", "commandments", "conviction", "grace", "invitation"];

function getNextStage(current: ChatStage): ChatStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function buildSystemPrompt(
  stage: ChatStage,
  chatMessages: ChatMessages,
  stageSummaries: string[],
): string {
  const stagePrompt = chatMessages.systemPrompts[stage];
  if (!stagePrompt) return UNIVERSAL_GUARDRAILS;

  const nextStage = getNextStage(stage);
  const transitionHint = nextStage
    ? `\nWhen you're ready to move on, call the advance_stage tool. The next stage is "${nextStage}".`
    : "";

  const contextSection = stageSummaries.length > 0
    ? `\nPrevious conversation summary:\n${stageSummaries.map((s, i) => `- Stage ${i + 1}: ${s}`).join("\n")}\n`
    : "";

  return `${stagePrompt}\n${UNIVERSAL_GUARDRAILS}${contextSection}${transitionHint}`;
}

export { STAGE_ORDER, getNextStage };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/chat-prompts.ts
git commit -m "feat: add system prompt builder with guardrails and stage context"
```

---

## Task 7: API Route Handler

**Files:**
- Create: `src/app/[locale]/chat/api/route.ts`

- [ ] **Step 1: Create the Route Handler**

Create the directory and file `src/app/[locale]/chat/api/route.ts`:

```ts
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { isValidLocale, getMessages, type Locale } from "@/lib/i18n";
import { buildSystemPrompt, getNextStage } from "@/lib/chat-prompts";
import type { ChatStage } from "@/lib/types";

const VALID_STAGES: ChatStage[] = ["intro", "commandments", "conviction", "grace"];
const MAX_MESSAGES = 20; // Message windowing

export async function POST(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    return new Response("Invalid locale", { status: 400 });
  }

  const body = await request.json();
  const { messages, stage, stageSummaries = [] } = body as {
    messages: Array<{ role: string; content: string }>;
    stage: ChatStage;
    stageSummaries: string[];
  };

  if (!VALID_STAGES.includes(stage)) {
    return new Response("Invalid stage", { status: 400 });
  }

  const allMessages = await getMessages(locale as Locale);
  if (!allMessages.chat) {
    return new Response("Chat not configured for this locale", { status: 500 });
  }

  const systemPrompt = buildSystemPrompt(stage, allMessages.chat, stageSummaries);

  // Message windowing — only send last N messages
  const windowedMessages = messages.slice(-MAX_MESSAGES);

  const result = streamText({
    model: "anthropic/claude-haiku-4.5" as any,
    system: systemPrompt,
    messages: windowedMessages as any,
    tools: {
      advance_stage: tool({
        description: "Call when you've completed the current stage's objective and are ready to move to the next stage.",
        parameters: z.object({
          summary: z.string().describe("Brief summary of what was covered in this stage"),
        }),
        execute: async ({ summary }) => {
          const next = getNextStage(stage);
          return `Stage advanced to ${next}. ${summary}. Continue the conversation with the new tone.`;
        },
      }),
    },
    stopWhen: stepCountIs(2),
  });

  return result.toUIMessageStreamResponse();
}
```

Note: The `model` string `"anthropic/claude-haiku-4.5"` routes through AI Gateway automatically when OIDC is configured. The `as any` cast is needed because the AI Gateway model string isn't a typed provider — this is the documented pattern.

- [ ] **Step 2: Verify route compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/\\[locale\\]/chat/api/route.ts
git commit -m "feat: add chat API route handler with streaming and advance_stage tool"
```

---

## Task 8: Chat UI Components (Bubble, Input, Typing Indicator, Stage Divider)

**Files:**
- Create: `src/components/chat/chat-bubble.tsx`
- Create: `src/components/chat/chat-input.tsx`
- Create: `src/components/chat/typing-indicator.tsx`
- Create: `src/components/chat/stage-divider.tsx`

- [ ] **Step 1: Create ChatBubble**

Create `src/components/chat/chat-bubble.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isGraceStage?: boolean;
}

export function ChatBubble({ role, content, isGraceStage = false }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
          isUser
            ? "bg-white/10 text-white"
            : isGraceStage
              ? "bg-[#D4A843]/10 text-white/90"
              : "text-white/80"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create ChatInput**

Create `src/components/chat/chat-input.tsx`:

```tsx
"use client";

import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
}

const MAX_LENGTH = 500;

export function ChatInput({ onSend, placeholder, sendLabel, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 backdrop-blur-sm p-4"
    >
      <div className="flex items-end gap-3 max-w-2xl mx-auto">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-white/30 outline-none focus:border-white/20 min-h-[44px] disabled:opacity-50"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="rounded-lg bg-white/10 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/15 active:bg-white/20 disabled:opacity-30 min-h-[44px] min-w-[44px]"
        >
          {sendLabel}
        </button>
      </div>
      {text.length > MAX_LENGTH - 50 && (
        <p className="text-xs text-white/30 text-right mt-1 max-w-2xl mx-auto">
          {text.length}/{MAX_LENGTH}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Create TypingIndicator**

Create `src/components/chat/typing-indicator.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

interface TypingIndicatorProps {
  label: string;
}

export function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 px-4 py-3 text-white/40">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/40"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create StageDivider**

Create `src/components/chat/stage-divider.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

interface StageDividerProps {
  text: string;
}

export function StageDivider({ text }: StageDividerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center py-4"
    >
      <div className="h-px flex-1 bg-white/10" />
      <span className="px-4 text-xs text-white/20">{text}</span>
      <div className="h-px flex-1 bg-white/10" />
    </motion.div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/
git commit -m "feat: add chat UI primitives (bubble, input, typing indicator, divider)"
```

---

## Task 9: Chat Messages List

**Files:**
- Create: `src/components/chat/chat-messages.tsx`

- [ ] **Step 1: Create ChatMessages component**

Create `src/components/chat/chat-messages.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { StageDivider } from "@/components/chat/stage-divider";
import type { ChatStage } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  stageDividerBefore?: boolean;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  stage: ChatStage;
  typingLabel: string;
  stageDividerText: string;
}

export function ChatMessages({
  messages,
  isStreaming,
  stage,
  typingLabel,
  stageDividerText,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isGraceStage = stage === "grace";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-8 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.stageDividerBefore && (
              <StageDivider text={stageDividerText} />
            )}
            <ChatBubble
              role={message.role}
              content={message.content}
              isGraceStage={isGraceStage}
            />
          </div>
        ))}

        {isStreaming && <TypingIndicator label={typingLabel} />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/chat-messages.tsx
git commit -m "feat: add chat messages list with auto-scroll and stage dividers"
```

---

## Task 10: Chat Landing

**Files:**
- Create: `src/components/chat/chat-landing.tsx`

- [ ] **Step 1: Create ChatLanding**

Create `src/components/chat/chat-landing.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

interface ChatLandingProps {
  messages: { title: string; subtitle: string; cta: string };
  onStart: () => void;
}

export function ChatLanding({ messages, onStart }: ChatLandingProps) {
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

      <p className="mt-4 text-lg text-white/50 max-w-md">
        {messages.subtitle}
      </p>

      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        className="mt-12 rounded-full border border-white/20 px-8 py-4 text-lg font-medium transition-colors hover:bg-white/5 active:bg-white/10 min-h-[44px]"
      >
        {messages.cta}
      </motion.button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/chat-landing.tsx
git commit -m "feat: add chat landing screen"
```

---

## Task 11: Chat Shell — The Main Orchestrator

**Files:**
- Create: `src/components/chat/chat-shell.tsx`

This is the most complex component — it manages the stage machine, `useChat`, tool call handling, abandonment tracking, and the invitation handoff.

- [ ] **Step 1: Create ChatShell**

Create `src/components/chat/chat-shell.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import * as Sentry from "@sentry/nextjs";
import { ChatLanding } from "@/components/chat/chat-landing";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { InvitationScreen } from "@/components/invitation-screen";
import {
  trackChatStarted,
  trackChatMessageSent,
  trackChatStageAdvanced,
  trackChatAbandoned,
  trackChatInvitationReached,
} from "@/lib/chat-analytics";
import { STAGE_ORDER } from "@/lib/chat-prompts";
import type { ChatStage, ChatMessages as ChatMessagesType, InvitationResponse, Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

const MAX_MESSAGES_PER_STAGE = 10;
const MAX_TOTAL_MESSAGES = 40;

interface ChatShellProps {
  messages: Messages;
  chatMessages: ChatMessagesType;
  locale: Locale;
}

export function ChatShell({ messages, chatMessages, locale }: ChatShellProps) {
  const [stage, setStage] = useState<ChatStage>("landing");
  const [startedAt, setStartedAt] = useState(0);
  const [stageSummaries, setStageSummaries] = useState<string[]>([]);
  const [stageStartedAt, setStageStartedAt] = useState(0);
  const [stageMessageCount, setStageMessageCount] = useState(0);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [invitationResponse, setInvitationResponse] = useState<InvitationResponse | null>(null);
  const lastMessageTime = useRef(Date.now());
  const [stageDividerIndices, setStageDividerIndices] = useState<Set<number>>(new Set());

  const {
    messages: chatMsgs,
    sendMessage,
    status,
    error,
  } = useChat({
    api: `/${locale}/chat/api`,
    body: { stage, stageSummaries },
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === "advance_stage") {
        const args = toolCall.args as { summary: string };
        const nextIdx = STAGE_ORDER.indexOf(stage) + 1;
        const nextStage = STAGE_ORDER[nextIdx] as ChatStage | undefined;

        if (nextStage) {
          trackChatStageAdvanced(stage, nextStage, stageMessageCount, Date.now() - stageStartedAt);

          setStageSummaries((prev) => [...prev, args.summary]);
          setStageDividerIndices((prev) => new Set([...prev, chatMsgs.length]));
          setStage(nextStage);
          setStageStartedAt(Date.now());
          setStageMessageCount(0);
          setShowContinueButton(false);

          Sentry.addBreadcrumb({
            category: "chat",
            message: `Stage: ${nextStage}`,
            level: "info",
          });

          if (nextStage === "invitation") {
            trackChatInvitationReached(chatMsgs.length, Date.now() - startedAt);
          }
        }

        return `Stage advanced to ${nextStage}. Continue the conversation.`;
      }
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Track per-stage message count and show continue button
  useEffect(() => {
    const userMessages = chatMsgs.filter((m) => m.role === "user").length;
    setStageMessageCount(userMessages);
    if (userMessages >= MAX_MESSAGES_PER_STAGE) {
      setShowContinueButton(true);
    }
  }, [chatMsgs.length]);

  // Global message limit
  useEffect(() => {
    if (chatMsgs.length >= MAX_TOTAL_MESSAGES && stage !== "invitation") {
      setStage("invitation");
      trackChatInvitationReached(chatMsgs.length, Date.now() - startedAt);
    }
  }, [chatMsgs.length, stage, startedAt]);

  // Abandonment tracking
  useEffect(() => {
    function handleBeforeUnload() {
      if (stage !== "landing" && stage !== "invitation") {
        trackChatAbandoned(stage, chatMsgs.length, Date.now() - startedAt, locale);
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stage, chatMsgs.length, startedAt, locale]);

  function handleStart() {
    const now = Date.now();
    setStartedAt(now);
    setStageStartedAt(now);
    setStage("intro");
    trackChatStarted(locale);

    Sentry.addBreadcrumb({ category: "chat", message: "Stage: intro", level: "info" });
  }

  const handleSend = useCallback(
    (text: string) => {
      const now = Date.now();
      trackChatMessageSent(stage, text.length, now - lastMessageTime.current);
      lastMessageTime.current = now;
      sendMessage({ text });
    },
    [stage, sendMessage],
  );

  function handleManualAdvance() {
    const nextIdx = STAGE_ORDER.indexOf(stage) + 1;
    const nextStage = STAGE_ORDER[nextIdx] as ChatStage | undefined;
    if (nextStage) {
      trackChatStageAdvanced(stage, nextStage, stageMessageCount, Date.now() - stageStartedAt);
      setStageDividerIndices((prev) => new Set([...prev, chatMsgs.length]));
      setStage(nextStage);
      setStageStartedAt(Date.now());
      setStageMessageCount(0);
      setShowContinueButton(false);

      if (nextStage === "invitation") {
        trackChatInvitationReached(chatMsgs.length, Date.now() - startedAt);
      }
    }
  }

  function handleErrorSkip() {
    setStage("invitation");
    trackChatInvitationReached(chatMsgs.length, Date.now() - startedAt);
  }

  // Prepare messages with stage divider markers
  const displayMessages = chatMsgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, i) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") ?? "",
      stageDividerBefore: stageDividerIndices.has(i),
    }));

  // Landing
  if (stage === "landing") {
    return <ChatLanding messages={chatMessages.landing} onStart={handleStart} />;
  }

  // Invitation — reuse existing component
  if (stage === "invitation") {
    const shareMsgs = {
      prompt: messages.share.prompt,
      whatsappMessage: chatMessages.share.whatsappMessage,
      telegramMessage: chatMessages.share.telegramMessage,
      linkCopied: messages.share.linkCopied,
    };

    return (
      <InvitationScreen
        messages={messages}
        locale={locale}
        startedAt={startedAt}
        invitationResponse={invitationResponse}
        onResponse={setInvitationResponse}
        shareMessages={shareMsgs}
      />
    );
  }

  // Active chat
  return (
    <main className="relative min-h-dvh flex flex-col">
      {stage === "grace" && (
        <div className="pointer-events-none fixed inset-0 z-0">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 40%, transparent 0deg, rgba(212, 168, 67, 0.3) 15deg, transparent 30deg, transparent 150deg, rgba(212, 168, 67, 0.25) 165deg, transparent 180deg, transparent 330deg, rgba(212, 168, 67, 0.2) 345deg, transparent 360deg)",
              filter: "blur(40px)",
            }}
          />
        </div>
      )}

      <ChatMessages
        messages={displayMessages}
        isStreaming={isStreaming}
        stage={stage}
        typingLabel={chatMessages.typing}
        stageDividerText={chatMessages.stageDivider}
      />

      {error && (
        <div className="px-4 pb-2">
          <div className="max-w-2xl mx-auto flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <span>Something went wrong.</span>
            <button onClick={handleErrorSkip} className="underline text-white/60 hover:text-white/80">
              Skip to invitation
            </button>
          </div>
        </div>
      )}

      {showContinueButton && !isStreaming && (
        <div className="px-4 pb-2">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleManualAdvance}
              className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white/50 transition-colors hover:bg-white/5"
            >
              Continue &rarr;
            </button>
          </div>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        placeholder={chatMessages.input.placeholder}
        sendLabel={chatMessages.input.send}
        disabled={isStreaming}
      />
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/chat-shell.tsx
git commit -m "feat: add ChatShell orchestrator with stage machine, useChat, and invitation handoff"
```

---

## Task 12: Chat Page & Layout

**Files:**
- Create: `src/app/[locale]/chat/page.tsx`

- [ ] **Step 1: Create chat page**

Create `src/app/[locale]/chat/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { isValidLocale, getMessages, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { ChatShell } from "@/components/chat/chat-shell";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const messages = await getMessages(locale);

  if (!messages.chat) return {};

  return {
    title: messages.chat.meta.title,
    description: messages.chat.meta.description,
    openGraph: {
      title: messages.chat.meta.title,
      description: messages.chat.meta.description,
    },
  };
}

export default async function ChatPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const messages = await getMessages(locale as Locale);

  if (!messages.chat) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-white/40">Chat not available for this locale.</p>
      </div>
    );
  }

  return <ChatShell messages={messages} chatMessages={messages.chat} locale={locale as Locale} />;
}
```

- [ ] **Step 2: Verify the page loads**

Run: `npm run dev`, navigate to `http://localhost:3000/en/chat`.
Expected: Chat landing page with "Have a conversation" title and "Start talking" button.

- [ ] **Step 3: Commit**

```bash
git add src/app/\\[locale\\]/chat/page.tsx
git commit -m "feat: add chat page with locale-specific metadata"
```

---

## Task 13: Build Verification & End-to-End Test

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Test Verdict game still works**

Run: `npm run dev`, navigate to `/en`. Play through full Verdict flow.
Expected: Landing → Questions → Verdict → Grace → Invitation works unchanged.

- [ ] **Step 4: Test chat landing pages**

Navigate to `/en/chat` and `/pt/chat`.
Expected: Both show chat landing with correct locale text.

- [ ] **Step 5: Test root redirect**

Navigate to `/`.
Expected: Redirects to `/en` (or `/pt` based on Accept-Language).

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build and type-check issues for chat feature"
```

---

## Task 14: Push to Remote

- [ ] **Step 1: Push all changes**

```bash
git push origin main
```
