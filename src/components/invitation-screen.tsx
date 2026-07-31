"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import Link from "next/link";
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
  /** Walks back one history entry, so the browser stack and the reducer agree. */
  onBack: () => void;
}

/*
 * How long the way forward is withheld after a profession of faith.
 *
 * The verdict withholds its exit for four beats to build pressure. This
 * withholds it once, to do the opposite: the app has been talking for fifteen
 * taps, and answering "I will repent and trust in Christ" with an itinerary in
 * the same frame is the wrong reply. Two seconds of a screen with one line on
 * it is the only place in the flow where nothing is being asked.
 */
const COMMITTED_HOLD_MS = 2000;

export function InvitationScreen({ messages, locale, onBack }: InvitationScreenProps) {
  const { invitation } = messages;
  const state = useGameState();
  const dispatch = useGameDispatch();
  const invitationResponse = state.invitationResponse;

  // Arriving marks the phase reached — this is what tells the grace screen not
  // to replay its beats on a re-read. Idempotent: grace's continue button is
  // what dispatches it, and the reducer refuses it from any other phase.
  useEffect(() => {
    dispatch({ type: "SHOW_INVITATION" });
  }, [dispatch]);

  /*
   * The hold runs on the transition into "committed", never on arrival at a
   * screen that already carries one. A reader coming back to their own answer
   * would otherwise wait two seconds to be shown the way on again.
   */
  const answeredAtMount = useRef(invitationResponse !== null);
  const [onwardReady, setOnwardReady] = useState(answeredAtMount.current);
  useEffect(() => {
    if (!invitationResponse || answeredAtMount.current) return;
    if (invitationResponse !== "committed") {
      setOnwardReady(true);
      return;
    }
    const t = setTimeout(() => setOnwardReady(true), COMMITTED_HOLD_MS);
    return () => clearTimeout(t);
  }, [invitationResponse]);

  function handleResponse(response: InvitationResponse) {
    const totalTime = Date.now() - state.startedAt;
    trackInvitationResponse(response, totalTime);
    saveInvitationResponse(response);
    dispatch({ type: "SET_INVITATION_RESPONSE", response });
  }

  const committed = invitationResponse === "committed";

  return (
    /*
     * The seam is the screen.
     *
     * A 1px, 40px gradient used to sit between the question and the buttons —
     * the only place in the app where red and gold are both legitimate at once,
     * drawn as the smallest thing on it. It now runs the full height of the
     * left edge: red where the reader came from, gold where they are going, and
     * the content ranged against it.
     *
     * Two layers rather than an animated gradient, because background-image
     * does not transition. Gold underneath, the red-to-gold pass on top, and on
     * a profession of faith the top layer fades out and the seam resolves to
     * gold. Nothing announces that; it is simply true afterwards.
     */
    <div className="relative flex flex-1">
      <div aria-hidden="true" className="relative w-[3px] shrink-0 bg-[#D4A843] sm:w-[5px]">
        <div
          className={`absolute inset-0 bg-gradient-to-b from-red-500 via-red-500 to-[#D4A843] transition-opacity duration-1000 ease-[var(--ease-out-strong)] motion-reduce:transition-none ${
            committed ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {/* Crossroads atmosphere — judgment above, the door below. Both stops stay
          deliberately below their neighbours: the verdict is the reddest screen
          in the flow and grace the goldest, and this is the hinge, so it must
          not out-red the verdict or out-gold grace. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 8%, rgba(239,68,68,0.09) 0%, transparent 55%), radial-gradient(ellipse at 30% 82%, rgba(212,168,67,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
        <div className="w-full max-w-lg lg:max-w-2xl">
          {!invitationResponse && (
            <>
              {/* The eyebrow, and the way back beside it. A way back is only
                  useful before the choice; under the options it arrived after
                  the reader had already made one. It stays a link and not a
                  button — a fourth control would compete with the three that
                  are the point — but it is here because the method requires
                  that leaving be possible and be visible, not because anyone
                  needs help finding the back gesture. */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <span className="font-mono text-[9.5px] uppercase tracking-[3px] text-[#D4A843]/70">
                  {invitation.eyebrow}
                </span>
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex min-h-[32px] items-center text-[11px] text-white/50 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
                >
                  {invitation.rereadGrace}
                </button>
              </m.div>

              {/* The question, at the size the two screens before it set. The
                  verdict's confession and grace's answer were both the largest
                  thing on their screen; this is the third. Ranged left, because
                  centred body text gives the eye no edge to return to and the
                  reader has spent the whole flow reading from one. */}
              <m.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_STRONG }}
                className="mt-4 text-balance text-[34px] font-semibold leading-[1.16] tracking-[-0.03em] text-white/95 sm:text-[42px] lg:text-[52px]"
              >
                {invitation.heading}
              </m.h2>

              {/*
               * Three answers, three buttons.
               *
               * "Not for me" was a bare text link at 55% white under two solid
               * buttons — hierarchy doing persuasion, on the one screen where
               * the method is explicit that nothing may push. All three are
               * now findable. Gold still marks what is being offered, which is
               * honest; the other two share a treatment because they are the
               * same answer at different temperatures, and neither is a no.
               */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mt-9 flex flex-col gap-2.5"
              >
                <Button variant="gold" mist onClick={() => handleResponse("committed")} className="w-full">
                  {invitation.responses.committed}
                </Button>
                <Button variant="ghost" onClick={() => handleResponse("thinking")} className="w-full">
                  {invitation.responses.thinking}
                </Button>
                <Button variant="ghost" onClick={() => handleResponse("dismissed")} className="w-full">
                  {invitation.responses.dismissed}
                </Button>
              </m.div>

              {/* The stake, below the choice rather than between the question
                  and the answer. Same words. Directly above the buttons it
                  could only be read as question, pressure, choose; here it is
                  what is true, on the Law's own hairline, available to anyone
                  who wants the reason and skippable by anyone who does not. */}
              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-8 border-l border-red-500/35 pl-4 text-[13px] leading-relaxed text-white/45 sm:text-sm"
              >
                {invitation.urgencyLine}
              </m.p>
            </>
          )}

          {/*
           * The answer, and three genuinely different things that just
           * happened.
           *
           * The route used to be chosen by `invitationResponse !== "dismissed"`,
           * which handed a reader who said "I want to think about it" the same
           * discipleship task list as one who said "I will repent and trust in
           * Christ". The comment that used to sit here already made the
           * argument for the third answer — someone who said "not for me"
           * should not be handed a task list — and did not apply it one row up.
           * There is no "now" yet for a person still thinking.
           */}
          {invitationResponse && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
            >
              {/* The line, at the size of the moment. Committed carries the
                  screen; the other two are answers, not events. */}
              <p
                className={
                  committed
                    ? "text-[30px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#D4A843] sm:text-[42px] lg:text-[52px]"
                    : "text-[22px] font-medium leading-[1.32] tracking-[-0.02em] text-white/85 sm:text-[28px] lg:text-[32px]"
                }
                style={committed ? { textShadow: "0 0 60px rgba(212,168,67,0.28)" } : undefined}
              >
                {committed
                  ? invitation.committedEncouragement
                  : invitationResponse === "thinking"
                    ? invitation.thinkingEncouragement
                    : invitation.dismissedEncouragement}
              </p>

              {/*
               * Committed: the way on, held.
               *
               * onwardReady gates the element rather than its opacity — a
               * button at opacity 0 is an invisible click target, which this
               * codebase has been caught by before. For two seconds there is
               * nothing here at all.
               */}
              {committed && onwardReady && (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
                  className="mt-10"
                >
                  <Link href={`/${locale}/next-steps`} className="block">
                    <Button variant="gold" mist className="w-full sm:w-auto">
                      {messages.nextSteps?.cta ?? "What now?"}
                      <ButtonArrow />
                    </Button>
                  </Link>
                </m.div>
              )}

              {/*
               * Thinking and dismissed: the primary source, not a task list.
               *
               * Someone still deciding needs the thing to decide with, so both
               * go to the reading plan. A quiet link and not a gold button —
               * nothing here should look like the app has read their answer as
               * a yes.
               */}
              {!committed && messages.readingPlan?.heading && (
                <p className="mt-8">
                  <Link
                    href={`/${locale}/reading-plan`}
                    className="inline-flex min-h-[44px] items-center text-[15px] text-[#D4A843] underline decoration-[#D4A843]/30 underline-offset-[5px] transition-colors hover:decoration-[#D4A843]/60"
                  >
                    {messages.readingPlan.heading} &rarr;
                  </Link>
                </p>
              )}

              {/*
               * Learn more stays on the answer that has nowhere else to go.
               *
               * For committed it duplicates what /next-steps already carries,
               * and for thinking the reading plan above is the better door —
               * it is the text itself rather than an explanation of it.
               */}
              {invitationResponse === "dismissed" && invitation.learnMoreLabel && (
                <p className="mt-5">
                  <Link
                    href={`/${locale}/learn`}
                    onClick={() => trackInvitationLearnMoreClicked(invitationResponse, locale)}
                    className="inline-flex min-h-[32px] items-center text-[13px] text-white/50 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/75"
                  >
                    {invitation.learnMoreLabel}
                  </Link>
                </p>
              )}
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
}
