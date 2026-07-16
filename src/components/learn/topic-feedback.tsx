"use client";

import { useEffect, useState } from "react";
import { trackTopicFeedback } from "@/lib/learn-analytics";

interface TopicFeedbackMessages {
  question: string;
  yes: string;
  no: string;
  thanks: string;
  followup: string;
}

interface TopicFeedbackProps {
  slug: string;
  locale: string;
  messages: TopicFeedbackMessages;
}

const STORAGE_PREFIX = "learn-feedback-";

/**
 * One-tap feedback at the end of a topic. Every topic's title is literally
 * a question, so the prompt is "Did this answer your question?" — not a
 * product-y helpfulness rating. Answers go to analytics only (no backend);
 * "Not really" surfaces the contact address. Asked once per topic per
 * visitor; previously-answered topics render nothing.
 */
export function TopicFeedback({ slug, locale, messages }: TopicFeedbackProps) {
  // Three states: null = undetermined (SSR/first render — render nothing,
  // zero-shift), "ask" = show the prompt, "yes"/"no" = just answered.
  const [state, setState] = useState<null | "ask" | "yes" | "no">(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setState(localStorage.getItem(STORAGE_PREFIX + slug) ? null : "ask");
      } catch {
        setState("ask");
      }
    });
    return () => cancelAnimationFrame(id);
  }, [slug]);

  function answer(value: "yes" | "no") {
    trackTopicFeedback(slug, locale, value);
    try {
      localStorage.setItem(STORAGE_PREFIX + slug, value);
    } catch {
      // Private mode — the session still records the answer visually
    }
    setState(value);
  }

  if (state === null) return null;

  return (
    <div className="mt-14 flex min-h-[64px] flex-col items-center justify-center border-t border-white/[0.06] pt-8 text-center">
      {state === "ask" ? (
        <>
          <p className="font-mono text-[10px] uppercase tracking-[2.5px] text-white/50">
            {messages.question}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => answer("yes")}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-1.5 text-[13px] text-white/70 transition-colors hover:border-[#D4A843]/30 hover:text-white/90"
            >
              {messages.yes}
            </button>
            <button
              type="button"
              onClick={() => answer("no")}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-1.5 text-[13px] text-white/70 transition-colors hover:border-white/25 hover:text-white/90"
            >
              {messages.no}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-white/60">{messages.thanks}</p>
          {state === "no" && (
            <a
              href="mailto:contact@ifyoudiedtoday.com"
              className="mt-2 text-[13px] text-[#D4A843]/70 underline decoration-[#D4A843]/25 underline-offset-4 transition-colors hover:text-[#D4A843]"
            >
              {messages.followup}
            </a>
          )}
        </>
      )}
    </div>
  );
}
