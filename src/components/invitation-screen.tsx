"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShareButtons } from "@/components/share-buttons";
import { Button, ButtonArrow } from "@/components/ui/button";
import {
  trackInvitationResponse,
  trackInvitationLearnMoreClicked,
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Heading — the question */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-bold sm:text-4xl"
        >
          {invitation.heading}
        </motion.h2>

        {/* Response buttons — no text block, straight to the decision */}
        {!invitationResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <Button variant="gold" mist onClick={() => handleResponse("prayed")} className="w-full max-w-sm">
              {invitation.responses.prayed}
            </Button>
            <Button variant="ghost" onClick={() => handleResponse("thinking")} className="w-full max-w-sm">
              {invitation.responses.thinking}
            </Button>
            <Button variant="text" onClick={() => handleResponse("dismissed")}>
              {invitation.responses.dismissed}
            </Button>
          </motion.div>
        )}

        {/* Post-response */}
        {invitationResponse && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-10"
          >
            {/* Encouragement line */}
            {invitationResponse === "prayed" && (
              <p className="text-lg font-medium text-[#D4A843]">
                {invitation.prayedEncouragement}
              </p>
            )}
            {invitationResponse === "thinking" && (
              <p className="text-base text-white/60">
                {invitation.thinkingEncouragement}
              </p>
            )}

            {/* What now? CTA */}
            {invitationResponse !== "dismissed" && (
              <Link href={`/${locale}/next-steps?track=${invitationResponse === "prayed" ? "prayed" : "thinking"}`} className="mt-6 block">
                <Button variant="gold" mist className="w-full">
                  {messages.nextSteps?.cta ?? "What now?"}
                  <ButtonArrow />
                </Button>
              </Link>
            )}

            {invitationResponse === "dismissed" && messages.nextSteps?.dismissedReturn && (
              <p className="text-center text-sm text-white/60">
                <Link href={`/${locale}/reading-plan`} className="underline transition-colors hover:text-white/50">
                  {messages.nextSteps.dismissedReturn}
                </Link>
              </p>
            )}

            {invitation.learnMoreLabel && (
              <p className="mt-4 text-center text-sm text-white/60">
                <Link
                  href={`/${locale}/learn`}
                  onClick={() => trackInvitationLearnMoreClicked(invitationResponse, locale)}
                  className="underline transition-colors hover:text-white/50"
                >
                  {invitation.learnMoreLabel}
                </Link>
              </p>
            )}

            <ShareButtons messages={shareMessages || share} locale={locale} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
