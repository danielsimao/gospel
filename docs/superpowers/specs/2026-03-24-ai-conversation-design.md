# The Good Person Test — AI Conversational Experience

## Summary

A chat-based experience where an AI conducts a natural conversation modeled after Ray Comfort's street evangelism method. The AI adapts to the user's responses while following a strict stage progression: intro → commandments → conviction → grace → invitation. Lives at `/[locale]/chat` as an independent experience alongside the existing Verdict game.

## Target Audience

- **Primary:** Non-believers receiving a link (same as Verdict game)
- **Context:** Cold share or warm follow-up. Works independently — no need to play Verdict first.
- **Session:** Single sitting, 5-10 minutes. Longer than Verdict due to free-form conversation.

## Core Principles

- **Law before Grace** — same Ray Comfort principle as the Verdict game
- **Strict stages, adaptive responses** — the AI follows a defined progression but adapts its wording to what the user says
- **Theologically guardrailed** — system prompts enforce doctrinal accuracy at every stage
- **Never block the gospel** — AI failures must not prevent the user from reaching the invitation

## Relationship to Verdict Game

- **Separate route:** `/[locale]/chat` (Verdict stays at `/[locale]`)
- **Shared ending:** Reuses `InvitationScreen` — but the component must be refactored to accept dependencies via props (callbacks, timestamps) instead of reaching into `GameProvider` context. A thin adapter or prop interface change is needed so both Verdict and Chat can use it.
- **Shared infrastructure:** Same providers (PostHog, Sentry, Vercel Analytics), same i18n pattern, same design language
- **Independent experiences:** Each has its own landing, own shareable URL, own OG metadata

## Conversation Stages

### Stage Machine

```
intro → commandments → conviction → grace → invitation (InvitationScreen)
```

Transitions are explicit — the AI calls an `advance_stage` tool when it's completed the current stage's objective.

### Stage Definitions

| Stage | Goal | AI Behavior | Min Messages | Transitions When |
|-------|------|-------------|-------------|-----------------|
| `intro` | Build rapport, ask "Do you think you're a good person?" | Warm, casual, curious. One opening message. | 1 AI + 1 user | User responds to the opening question |
| `commandments` | Walk through commandments naturally | Picks up on user's answers. Probes honesty gently. Covers 4-6 commandments based on conversation flow. Uses follow-up questions like Ray Comfort. | 4-8 exchanges | AI calls `advance_stage` after covering min 4 commandments |
| `conviction` | Help user see the weight of their answers | Summarizes what the user admitted. Asks "If God judged you by that standard, would you be innocent or guilty?" | 2-4 exchanges | AI calls `advance_stage` after presenting the verdict clearly |
| `grace` | Present the gospel — courtroom analogy, Jesus paid the fine | Shifts tone to warm/hopeful. Presents the gospel using the user's own admissions as context. Uses NKJV/ACF Scripture. | 2-4 exchanges | AI calls `advance_stage` after presenting the full gospel message |
| `invitation` | Hand off to existing InvitationScreen | N/A — client renders `InvitationScreen` component directly | N/A | Terminal state |

### The `advance_stage` Tool

```ts
{
  name: "advance_stage",
  description: "Call when you've completed the current stage's objective and are ready to move to the next stage.",
  inputSchema: z.object({
    summary: z.string().describe("Brief summary of what was covered in this stage")
  })
}
```

When the AI calls this tool:
1. `useChat`'s `onToolCall` callback intercepts the call
2. Callback updates `ChatState.stage` via `setState`
3. Callback returns a confirmation string (e.g., "Stage advanced to {next_stage}. Continue the conversation.") so the AI continues generating in the new stage's tone
4. Stage transition is logged to analytics
5. The *current* stream continues with the AI's follow-up in the new tone. The *next* API call will use the new stage's system prompt.
6. Note: the stage advance happens mid-stream — the AI will naturally transition its tone after receiving the tool result

### Theological Guardrails

Every system prompt includes these universal constraints:
- Never deny core doctrines (deity of Christ, resurrection, substitutionary atonement)
- Never say "you're probably fine" or minimize sin
- Never add to or subtract from the gospel message
- If the user asks off-topic questions, gently redirect to the current stage
- Use Scripture from the correct Bible version (NKJV for English, ACF for Portuguese)
- Respond in the user's language (determined by locale)
- Do not debate or argue — guide with questions, not lectures
- If the user becomes hostile, remain gentle and respectful

### System Prompt Structure

Each stage's system prompt is built from:
1. **Universal guardrails** (shared across all stages) — in `lib/chat-prompts.ts`
2. **Stage-specific instructions** (from locale message files) — tone, objective, transition criteria
3. **Conversation context** — what stage we're in, what's been covered

The locale message files contain the stage-specific prompt text in the correct language. The guardrails are in code (English) since they're instructions to the AI, not user-facing.

## Tech Stack

- **AI SDK v6:** `useChat` hook + `streamText` in Route Handler
- **AI Gateway:** `anthropic/claude-haiku-4-5` (upgradeable to Sonnet/Opus with one line change)
- **Streaming:** SSE via AI SDK transport
- **State:** React `useState` for chat stage (not useReducer — simpler for this use case)
- **Messages:** Managed by `useChat` hook (no custom message state)

## API Route

**`app/[locale]/chat/api/route.ts`**

Accepts POST with:
```ts
{
  messages: UIMessage[],   // conversation history from useChat
  stage: ChatStage,        // current stage
  locale: Locale           // for prompt language selection
}
```

Returns: streaming response via `toUIMessageStreamResponse()`

The route:
1. Validates `stage` is a valid `ChatStage` and that `locale` is supported
2. Loads locale-specific system prompt for the current stage
3. Combines with universal guardrails
4. Applies message windowing: sends only the last 20 messages plus stage summaries from `advance_stage` tool calls in prior messages — prevents context window overflow for long conversations
5. Calls `streamText` with AI Gateway model string (`anthropic/claude-haiku-4-5`)
6. Registers the `advance_stage` tool
7. Returns streaming response

**Stage trust boundary:** The `stage` field from the client is accepted as-is for v1. This is an accepted risk — the user can only skip *ahead* to the gospel (which is the goal anyway). They cannot cause harm or access restricted content by manipulating the stage. If abuse becomes an issue, server-side session tracking can be added later.

**Message windowing:** To avoid exceeding the context window, only the last 20 messages are sent to the AI. Previous stage summaries (from `advance_stage` tool calls) are injected into the system prompt to maintain context without sending the full history.

**Global conversation limit:** Maximum 40 total messages. After 40 messages, the client auto-advances to the invitation stage regardless of current stage. This prevents runaway costs and context window issues.

## UI Design

### Visual Style

Minimalist, matching the existing app. Black background, white text.

- **User messages:** Right-aligned, `bg-white/10` rounded bubble
- **AI messages:** Left-aligned, no background, white text
- **Grace stage:** AI messages get `bg-[#D4A843]/10` tint, subtle gold light rays in background
- **Typing indicator:** Three pulsing dots while AI is streaming
- **Stage divider:** Thin `white/10` horizontal line between stages

### Layout

- Full-screen, no nav bar — same immersive feel as Verdict
- Messages scroll vertically, newest at bottom
- Input fixed at bottom: text field + send button
- Min 44px touch targets on all interactive elements

### Chat Landing (`/[locale]/chat`)

- Same dark background as Verdict landing
- Title: "Have a conversation" / "Tem uma conversa"
- Subtitle: "An honest talk about life, morality, and what comes after."
- CTA button: "Start talking" / "Comecar a conversa"

### Invitation Handoff

When the grace stage completes:
1. Chat UI fades out (opacity transition)
2. `InvitationScreen` fades in
3. Same prayer, response buttons, resources, share buttons as Verdict
4. Share URL is `/[locale]/chat` (links to the chat experience, not Verdict)

### Mobile

- Virtual keyboard pushes chat up
- Auto-scroll to latest message
- Input stays above keyboard
- Large touch targets on send button

## Data Model

### Client State

```ts
type ChatStage = "landing" | "intro" | "commandments" | "conviction" | "grace" | "invitation";

interface ChatState {
  stage: ChatStage;
  startedAt: number;
  stageHistory: Array<{ stage: ChatStage; enteredAt: number; summary?: string }>;
}
```

Messages are managed by `useChat` hook — not duplicated in ChatState.

### Analytics Events

| Event | Properties | Purpose |
|-------|-----------|---------|
| `chat_started` | locale, referral source, device type, utm params | Traffic tracking |
| `chat_message_sent` | stage, message_length, time_since_last_message | Engagement depth |
| `chat_stage_advanced` | from_stage, to_stage, messages_in_stage, time_in_stage_ms | Stage funnel |
| `chat_abandoned` | last_stage, total_messages, total_time_ms, locale | Drop-off (sendBeacon) |
| `chat_invitation_reached` | total_messages, total_time_ms | Completion rate |
| `invitation_response` | (reused from existing) | Key conversion metric |
| `shared` | (reused from existing) | Viral tracking |

**PostHog funnels:**
1. Chat Journey: chat_started → commandments → conviction → grace → invitation_reached
2. Chat vs Verdict comparison: completion rates across experiences

**No conversation content stored.** Conversations are intentionally not persisted to protect user privacy. Messages exist only in client React state — no server-side storage, no database, no chat logs.

## Component Architecture

```
src/
├── app/[locale]/
│   ├── chat/
│   │   ├── page.tsx              # Server component — loads messages, renders ChatShell
│   │   └── api/
│   │       └── route.ts          # Route Handler — streamText with stage-specific prompt
│   └── page.tsx                  # Existing Verdict game (unchanged)
├── components/
│   ├── chat/
│   │   ├── chat-shell.tsx        # Stage machine + useChat + phase routing
│   │   ├── chat-landing.tsx      # "Have a conversation" CTA
│   │   ├── chat-messages.tsx     # Message list with scroll management
│   │   ├── chat-input.tsx        # Text input with send button
│   │   ├── chat-bubble.tsx       # Single message bubble (user or AI)
│   │   ├── typing-indicator.tsx  # Pulsing dots during streaming
│   │   └── stage-divider.tsx     # Subtle divider between stages
│   ├── invitation-screen.tsx     # Existing (reused, unchanged)
│   └── share-buttons.tsx         # Existing (reused, unchanged)
├── lib/
│   ├── chat-analytics.ts         # Chat-specific PostHog event helpers
│   ├── chat-prompts.ts           # System prompt builder (stage + locale + guardrails)
│   └── types.ts                  # Extended with ChatStage, ChatState
```

### InvitationScreen Refactor

The existing `InvitationScreen` depends on `useGameDispatch()` and `GameState`. To reuse it from the chat context, refactor it to accept props instead of reaching into context:

```ts
interface InvitationScreenProps {
  messages: Messages;
  locale: Locale;
  startedAt: number;
  invitationResponse: InvitationResponse | null;
  onResponse: (response: InvitationResponse) => void;
}
```

The Verdict game's `GameShell` passes these props by reading from `GameState` and dispatching. The chat's `ChatShell` passes them from its own `ChatState` and a local `useState`. The component itself no longer imports `useGameDispatch` or `useGameState`.

### What Stays Unchanged
- All existing Verdict game components (except `InvitationScreen` prop interface — see above)
- `ShareButtons` (reused as-is)
- `providers.tsx` (already wraps all routes)
- `analytics.ts` (existing events stay, chat gets its own file)
- Existing message file structure (new `chat` key added, existing keys untouched)

## i18n

### New Content in Message Files

Added under a `chat` key in `en.json` / `pt.json`:

```json
{
  "chat": {
    "landing": { "title": "...", "subtitle": "...", "cta": "..." },
    "input": { "placeholder": "...", "send": "..." },
    "stageDivider": "·  ·  ·",
    "typing": "...",
    "systemPrompts": {
      "intro": "...(full stage prompt in locale language)...",
      "commandments": "...",
      "conviction": "...",
      "grace": "..."
    },
    "meta": { "title": "...", "description": "..." }
  }
}
```

System prompts are locale-specific — the AI responds in the user's language with the correct Bible version.

### Extended Messages Type

The `chat` field is optional in `Messages` so the Verdict game pages don't break if loaded without chat content. The chat `page.tsx` must check for `messages.chat` and show a fallback if missing.

```ts
export interface ChatMessages {
  landing: { title: string; subtitle: string; cta: string };
  input: { placeholder: string; send: string };
  stageDivider: string;
  typing: string;
  systemPrompts: Partial<Record<ChatStage, string>>; // excludes "landing" and "invitation"
  meta: { title: string; description: string };
  share: { whatsappMessage: string; telegramMessage: string };
}

export interface Messages {
  // ... existing fields (landing, questions, verdict, grace, invitation, share, meta)
  chat?: ChatMessages; // optional — only required for chat pages
}
```

### i18n Validation

Update `validateMessages()` in `lib/i18n.ts` to validate `chat` when present: check `chat.landing.title`, `chat.systemPrompts` has at least intro/commandments/conviction/grace keys. The validation should not fail if `chat` is absent — it's optional.

## Edge Cases & Error Handling

- **AI fails to respond:** Show "Something went wrong. Let me try again." with a retry button. If retry fails, skip to the InvitationScreen directly — never let an AI failure prevent the gospel from being shown.
- **AI refuses to call `advance_stage`:** After 10 messages in a single stage, the client shows a "Continue" button that manually advances the stage.
- **User sends empty messages:** Input validation prevents sending empty strings.
- **User sends very long messages:** Truncate at 500 characters with a visual indicator.
- **Rate limiting:** AI Gateway handles this. If rate limited, show a brief "Please wait a moment" message.
- **Offline:** Chat requires connectivity. If offline, show "You need an internet connection for this experience."

## Acceptance Criteria (v1)

**Must-have:**
- [ ] Chat landing page at `/[locale]/chat` with CTA
- [ ] Streaming AI conversation using AI Gateway + Claude Haiku
- [ ] 5 stages: intro → commandments → conviction → grace → invitation
- [ ] `advance_stage` tool for explicit stage transitions
- [ ] Stage-specific system prompts with theological guardrails
- [ ] Chat UI: message bubbles, typing indicator, input field
- [ ] Gold visual shift during grace stage
- [ ] Refactor InvitationScreen to accept props (not context) — used by both Verdict and Chat
- [ ] Handoff to InvitationScreen at end of chat
- [ ] i18n: English (NKJV) and Portuguese (ACF)
- [ ] Locale-specific OG metadata for `/[locale]/chat`
- [ ] PostHog analytics for all chat events
- [ ] Sentry breadcrumbs for stage transitions
- [ ] Error fallback: skip to InvitationScreen if AI fails
- [ ] Manual "Continue" button after 10 messages in one stage
- [ ] Global 40-message limit with auto-advance to invitation
- [ ] Message windowing (last 20 messages + stage summaries)
- [ ] Mobile-responsive chat layout

**Nice-to-have (v1.1):**
- [ ] Cross-promotion between Verdict and Chat experiences
- [ ] Conversation summary shared via WhatsApp/Telegram
- [ ] Model upgrade to Sonnet based on quality feedback

## Configuration

### Environment Variables

| Variable | Purpose | How to get |
|----------|---------|-----------|
| `VERCEL_OIDC_TOKEN` | AI Gateway authentication (auto-refreshed on Vercel) | `vercel env pull` after enabling AI Gateway in dashboard |

No provider-specific API keys needed — AI Gateway uses OIDC. For local dev, `vercel env pull` provisions a short-lived token (~24h). Re-run if it expires.

### Model String

```ts
model: "anthropic/claude-haiku-4-5"
```

To upgrade quality later, change to `"anthropic/claude-sonnet-4-6"` or `"anthropic/claude-opus-4-6"`. One line change, no other config needed.

### Share Messages

The chat experience uses its own share messages (under `chat.share` in the i18n files) since the existing Verdict share copy ("Take this test") doesn't apply. The `ShareButtons` component receives share messages as props, so no component changes are needed — just pass `messages.chat.share` instead of `messages.share`.

## Dependencies

- `ai` (AI SDK core) — for `streamText`, `convertToModelMessages`
- `@ai-sdk/react` — for `useChat` hook and `DefaultChatTransport`
- AI Gateway enabled on Vercel project (dashboard toggle + `vercel env pull`)
