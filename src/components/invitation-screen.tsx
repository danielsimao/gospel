"use client";

import { useEffect } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { saveInvitationResponse } from "@/lib/journey-storage";
import { Button, ButtonArrow } from "@/components/ui/button";
import {
  trackInvitationResponse,
  trackInvitationLearnMoreClicked,
} from "@/lib/analytics";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { InvitationResponse, Messages } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface InvitationScreenProps {
  messages: Messages;
  locale: Locale;
}

export function InvitationScreen({ messages, locale }: InvitationScreenProps) {
  const { invitation } = messages;
  const state = useGameState();
  const dispatch = useGameDispatch();
  const router = useRouter();
  const invitationResponse = state.invitationResponse;

  // Arriving marks the phase reached — this is what tells the grace screen not
  // to replay its beats on a re-read. The reducer used to do it via
  // SHOW_INVITATION; the route owns the transition now, so the screen records it.
  useEffect(() => {
    dispatch({ type: "SHOW_INVITATION" });
  }, [dispatch]);

  function handleResponse(response: InvitationResponse) {
    const totalTime = Date.now() - state.startedAt;
    trackInvitationResponse(response, totalTime);
    saveInvitationResponse(response);
    dispatch({ type: "SET_INVITATION_RESPONSE", response });
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
      {/* Crossroads atmosphere — judgment above, the door below. This screen is
          the hinge of the whole flow (red law → gold grace) and the gradient
          was already here, just pitched at 0.05/0.07 behind a 36px blur, which
          made it undetectable. Alphas raised and the blur dropped: both stops
          already fade to transparent, so blurring only bought a composited
          layer. Same reasoning as the verdict wash.

          Both stops stay deliberately below their neighbours: the verdict is
          the reddest screen in the flow and grace is the goldest (its wash is
          0.08 at opacity-70, ≈0.056 effective). This is the hinge, so it must
          not out-red the verdict or out-gold grace. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 8%, rgba(239,68,68,0.09) 0%, transparent 55%), radial-gradient(ellipse at 50% 78%, rgba(212,168,67,0.08) 0%, transparent 60%)",
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

        {/* Heading — retired once answered rather than dimmed to 0.4. A ghost
            question sitting above the answer reads as leftover, not as
            resolution; the eyebrow above still labels the section. */}
        {!invitationResponse && (
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-balance text-3xl font-bold sm:text-4xl"
          >
            {invitation.heading}
          </m.h2>
        )}

        {/* The fact, pressed before the choice — the form itself stays fully
            released (Living Waters: never gate the answer, never confirm-shame
            the exit).

            This is the only argument on the screen and it used to be its
            smallest, dimmest text — 13px italic white/60 under a 36px heading,
            so the question shouted and the reason whispered. Now sized as a
            statement, and no longer italic: italic is this app's aside/scripture
            treatment, and this is neither. */}
        {!invitationResponse && (
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-white/75 sm:text-base"
          >
            {invitation.urgencyLine}
          </m.p>
        )}

        {/* The hinge, drawn. Red at the top, gold at the bottom, growing
            downward — the flow's whole arc in 40px. Composite-only (scaleY). */}
        {!invitationResponse && (
          <m.div
            aria-hidden="true"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT_STRONG }}
            className="mx-auto mt-8 h-10 w-px origin-top bg-gradient-to-b from-red-500/70 to-[#D4A843]/70"
          />
        )}

        {/* Response buttons — no text block, straight to the decision */}
        {!invitationResponse && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-8 flex flex-col items-center gap-3"
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
            {/* Pushes the named route rather than router.back(): the resume
                dialog can push straight to this screen, and there back landed
                on the front door instead of grace. */}
            <button
              type="button"
              onClick={() => router.push(`/${locale}/test/grace`)}
              className="mt-3 text-[11px] text-white/60 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
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
              <p className="mt-6 text-center text-sm leading-relaxed text-white/60">
                <Link href={`/${locale}/reading-plan`} className="underline transition-colors hover:text-white/75">
                  {messages.nextSteps.dismissedReturn}
                </Link>
              </p>
            )}

            {invitation.learnMoreLabel && (
              <p className="mt-4 text-center text-sm text-white/60">
                <Link
                  href={`/${locale}/learn`}
                  onClick={() => trackInvitationLearnMoreClicked(invitationResponse, locale)}
                  className="underline transition-colors hover:text-white/75"
                >
                  {invitation.learnMoreLabel}
                </Link>
              </p>
            )}

            {/* No share row here, for any of the three answers. Sharing is a
                next step, and /next-steps owns it — track-committed carries the
                share block and the story graphic, while track-thinking
                deliberately carries none. Asking someone who just said "I want
                to think about it", or "Not for me", to post this reads as
                farming them, and it was rendering for the dismissed path too.
                Leaves every answer with exactly one primary route. */}
          </m.div>
        )}
      </div>
    </div>
  );
}
