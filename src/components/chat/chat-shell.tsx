"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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
import type {
  ChatStage,
  ChatMessages as ChatMessagesType,
  InvitationResponse,
  Messages,
} from "@/lib/types";
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
  const [messagesInCurrentStage, setMessagesInCurrentStage] = useState(0);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [invitationResponse, setInvitationResponse] = useState<InvitationResponse | null>(null);
  const [stageDividerIndices, setStageDividerIndices] = useState<Set<number>>(new Set());
  const lastMessageTime = useRef(Date.now());

  // Keep a ref to stage/summaries so the stable transport can access current values
  const stageRef = useRef(stage);
  const stageSummariesRef = useRef(stageSummaries);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { stageSummariesRef.current = stageSummaries; }, [stageSummaries]);

  const {
    messages: chatMsgs,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `/${locale}/chat/api`,
      body: { get stage() { return stageRef.current; }, get stageSummaries() { return stageSummariesRef.current; } },
    }),
    onToolCall({ toolCall }) {
      // The server executes the tool — we observe the call here for client state updates
      if (toolCall.toolName === "advance_stage") {
        const args = toolCall.input as { summary: string };
        const currentStage = stageRef.current;
        const nextIdx = STAGE_ORDER.indexOf(currentStage) + 1;
        const nextStage = STAGE_ORDER[nextIdx] as ChatStage | undefined;

        if (nextStage) {
          trackChatStageAdvanced(
            currentStage,
            nextStage,
            messagesInCurrentStage,
            Date.now() - stageStartedAt,
          );

          setStageSummaries((prev) => [...prev, args.summary]);
          setStageDividerIndices((prev) => new Set([...prev, chatMsgs.length]));
          setStage(nextStage);
          setStageStartedAt(Date.now());
          setMessagesInCurrentStage(0);
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
      }
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Track per-stage message count and show continue button
  useEffect(() => {
    const userMsgCount = chatMsgs.filter((m) => m.role === "user").length;
    setMessagesInCurrentStage(userMsgCount);
    if (userMsgCount >= MAX_MESSAGES_PER_STAGE) {
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
      trackChatStageAdvanced(stage, nextStage, messagesInCurrentStage, Date.now() - stageStartedAt);
      setStageDividerIndices((prev) => new Set([...prev, chatMsgs.length]));
      setStage(nextStage);
      setStageStartedAt(Date.now());
      setMessagesInCurrentStage(0);
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

  // Extract text from message parts (AI SDK v6 UIMessage pattern)
  const displayMessages = chatMsgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, i) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(""),
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
            <button
              onClick={handleErrorSkip}
              className="underline text-white/60 hover:text-white/80"
            >
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
