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
  shareMessages?: {
    prompt: string;
    whatsappMessage: string;
    telegramMessage: string;
    linkCopied: string;
  };
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
            {invitationResponse !== "dismissed" && (
              <a
                href={`/${locale}/next-steps?track=${invitationResponse === "prayed" ? "prayed" : "thinking"}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4A843]/35 bg-[#D4A843]/[0.04] px-6 py-3.5 text-base font-semibold tracking-wide text-[#D4A843] shadow-[0_0_24px_rgba(212,168,67,0.08)] transition-all hover:border-[#D4A843]/50 hover:bg-[#D4A843]/[0.08] min-h-[48px]"
              >
                {messages.nextSteps?.cta ?? "What now?"} <span aria-hidden="true">→</span>
              </a>
            )}

            {invitationResponse === "dismissed" && messages.nextSteps?.dismissedReturn && (
              <p className="text-center text-sm text-white/30">
                <a href={`/${locale}/reading-plan`} className="underline transition-colors hover:text-white/50">
                  {messages.nextSteps.dismissedReturn}
                </a>
              </p>
            )}

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

            <ShareButtons messages={shareMessages || share} locale={locale} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
