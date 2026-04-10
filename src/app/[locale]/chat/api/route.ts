import { gateway, streamText, tool, stepCountIs, type ModelMessage } from "ai";
import { z } from "zod";
import { isValidLocale, getMessages, type Locale } from "@/lib/i18n";
import { buildSystemPrompt, getNextStage } from "@/lib/chat-prompts";
import type { ChatStage } from "@/lib/types";

const VALID_STAGES: ChatStage[] = ["intro", "commandments", "conviction", "grace"];
const MAX_MESSAGES = 20;
const VALID_MESSAGE_ROLES = new Set(["user", "assistant", "system"]);

interface ChatRequestBody {
  messages: Array<{ role: string; content: string }>;
  stage: ChatStage;
  stageSummaries?: string[];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    return new Response("Invalid locale", { status: 400 });
  }

  const body = (await request.json()) as ChatRequestBody;
  const { messages, stage, stageSummaries = [] } = body;

  if (!VALID_STAGES.includes(stage)) {
    return new Response("Invalid stage", { status: 400 });
  }

  const invalidMessage = messages.find(
    (message) =>
      !VALID_MESSAGE_ROLES.has(message.role) ||
      typeof message.content !== "string",
  );
  if (invalidMessage) {
    return new Response("Invalid messages", { status: 400 });
  }

  const allMessages = await getMessages(locale as Locale);
  if (!allMessages.chat) {
    return new Response("Chat not configured for this locale", { status: 500 });
  }

  const systemPrompt = buildSystemPrompt(stage, allMessages.chat, stageSummaries);
  const windowedMessages: ModelMessage[] = messages.slice(-MAX_MESSAGES).map((message) => ({
    role: message.role as "user" | "assistant" | "system",
    content: message.content,
  }));

  const result = streamText({
    model: gateway("anthropic/claude-haiku-4.5"),
    system: systemPrompt,
    messages: windowedMessages,
    tools: {
      advance_stage: tool({
        description: "Call when you've completed the current stage's objective and are ready to move to the next stage.",
        inputSchema: z.object({
          summary: z.string().describe("Brief summary of what was covered in this stage"),
        }),
        execute: async ({ summary }: { summary: string }) => {
          const next = getNextStage(stage);
          return `Stage advanced to ${next}. ${summary}. Continue the conversation with the new tone.`;
        },
      }),
    },
    stopWhen: stepCountIs(2),
  });

  return result.toUIMessageStreamResponse();
}
