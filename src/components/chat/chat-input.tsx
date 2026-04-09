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
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-white/60 outline-none focus:border-white/20 min-h-[44px] disabled:opacity-50"
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
