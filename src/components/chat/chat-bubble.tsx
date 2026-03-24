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
