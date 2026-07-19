"use client";

import { m } from "framer-motion";
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
  onBack: () => void;
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
  onBack,
  shareMessages,
}: InvitationScreenProps) {
  const { invitation, share } = messages;

  function handleResponse(response: InvitationResponse) {
    const totalTime = Date.now() - startedAt;
    trackInvitationResponse(response, totalTime);
    onResponse(response);
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
      {/* Crossroads atmosphere — judgment above, the door below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 12%, rgba(239,68,68,0.05) 0%, transparent 55%), radial-gradient(ellipse at 50% 72%, rgba(212,168,67,0.07) 0%, transparent 60%)",
          filter: "blur(36px)",
        }}
      />
      <div className="relative max-w-lg w-full text-center">
        {/* Eyebrow — red meets gold at the crossroads */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-4 flex items-center justify-center gap-2"
        >
          <span className="h-px w-6 bg-red-500/40" />
          <span className="font-mono text-[9px] uppercase tracking-[3px] text-white/60">
            {invitation.eyebrow}
          </span>
          <span className="h-px w-6 bg-[#D4A843]/40" />
        </m.div>

        {/* Heading — the question yields once answered */}
        <m.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: invitationResponse ? 0.4 : 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={
            invitationResponse
              ? "text-xl font-semibold text-white/70 sm:text-2xl"
              : "text-3xl font-bold sm:text-4xl"
          }
        >
          {invitation.heading}
        </m.h2>

        {/* The fact, pressed before the choice — the form itself stays fully
            released (Living Waters: never gate the answer, never confirm-shame
            the exit). Yields with the heading once answered. */}
        {!invitationResponse && (
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto mt-4 max-w-sm text-[13px] italic leading-relaxed text-white/50"
          >
            {invitation.urgencyLine}
          </m.p>
        )}

        {/* Response buttons — no text block, straight to the decision */}
        {!invitationResponse && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <Button variant="gold" mist onClick={() => handleResponse("committed")} className="w-full max-w-sm">
              {invitation.responses.committed}
            </Button>
            <Button variant="ghost" onClick={() => handleResponse("thinking")} className="w-full max-w-sm">
              {invitation.responses.thinking}
            </Button>
            <Button variant="text" onClick={() => handleResponse("dismissed")}>
              {invitation.responses.dismissed}
            </Button>
            <button
              type="button"
              onClick={onBack}
              className="mt-3 text-[11px] text-white/30 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/50"
            >
              {invitation.rereadGrace}
            </button>
          </m.div>
        )}

        {/* Post-response */}
        {invitationResponse && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-10"
          >
            {/* Encouragement — now the lead voice; the question above has yielded */}
            {invitationResponse === "committed" && (
              <p
                className="text-2xl font-bold tracking-tight text-[#D4A843] sm:text-3xl"
                style={{ textShadow: "0 0 50px rgba(212,168,67,0.25)" }}
              >
                {invitation.committedEncouragement}
              </p>
            )}
            {invitationResponse === "thinking" && (
              <p className="text-xl font-semibold text-white/80 sm:text-2xl">
                {invitation.thinkingEncouragement}
              </p>
            )}
            {invitationResponse === "dismissed" && invitation.dismissedEncouragement && (
              <p className="text-xl font-semibold text-white/80 sm:text-2xl">
                {invitation.dismissedEncouragement}
              </p>
            )}

            {/* What now? CTA */}
            {invitationResponse !== "dismissed" && (
              <Link href={`/${locale}/next-steps`} className="mt-6 block">
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

            <ShareButtons
              messages={shareMessages || share}
              locale={locale}
              sharePath={`/${locale}/test`}
              utmCampaign="invitation"
            />
          </m.div>
        )}
      </div>
    </div>
  );
}
