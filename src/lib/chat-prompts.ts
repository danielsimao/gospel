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
