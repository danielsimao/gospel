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
