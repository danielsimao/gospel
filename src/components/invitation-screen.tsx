"use client";

import { motion } from "framer-motion";
import { useGameDispatch } from "@/components/game-provider";
import { ShareButtons } from "@/components/share-buttons";
import {
  trackInvitationResponse,
  trackResourceClicked,
} from "@/lib/analytics";
import type { GameState, InvitationResponse, Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface InvitationScreenProps {
  messages: Messages;
  locale: Locale;
  state: GameState;
}

export function InvitationScreen({
  messages,
  locale,
  state,
}: InvitationScreenProps) {
  const dispatch = useGameDispatch();
  const { invitation, share } = messages;

  function handleResponse(response: InvitationResponse) {
    const totalTime = Date.now() - state.startedAt;
    trackInvitationResponse(response, totalTime);
    dispatch({ type: "SET_INVITATION_RESPONSE", response });
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

        {!state.invitationResponse && (
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

        {state.invitationResponse && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8"
          >
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

            <ShareButtons messages={share} locale={locale} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
