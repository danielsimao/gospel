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

export function InvitationScreen({ messages, locale }: InvitationScreenProps) {
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
    /*
     * Released immediately for every answer but the committed one.
     *
     * A review called this branch dead, and it was — but only because the
     * routing bug above had narrowed the gate to `committed &&`, so nothing
     * else ever read the flag. Restoring "thinking" to its /next-steps track
     * makes it load-bearing again: without this, a reader who is still
     * deciding waits on a flag that never flips and never gets a way on.
     *
     * The hold is for a profession of faith. Someone still deciding has not
     * made one, so there is no beat to protect.
     */
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

      {/*
       * Centred, like the two screens the reader arrives from.
       *
       * This was ranged left, and the reason given was that the reader "has
       * spent the whole flow reading from one edge". That is true of the
       * landing and the six questions and false of the two screens either side
       * of this one: the verdict and grace both centre their column and their
       * display type, so the reader crosses from a centred screen to a left
       * one at the exact moment the flow should feel most continuous.
       *
       * The half of that argument that was right — centred body text gives the
       * eye no edge to return to — survives where it applies. The urgency line
       * is the only real reading matter here and keeps its left edge on the
       * Law's hairline, which is what grace already does with its scripture
       * inside the same centred column.
       */}
      {/*
       * The door, behind the decision — the one screen whose copy already
       * holds it: the dismissed response is told "A porta continua aberta",
       * and this is that sentence as a picture, present before it is needed.
       * John 10:9 without a caption.
       *
       * Generated for this screen specifically (portrait, gap centred at 50%
       * and 8.6% wide, brightness capped so type can sit over it — the
       * measurements are in docs/graphics/PROMPTS.md §8). The landscape OG
       * door could not serve here: its light lives at 76-80% across by
       * design, exactly where a centred mask erases it.
       *
       * data-flow-graphic rather than decoration-by-css: it needs the AVIF/
       * WebP pair, and the tests pin it to this screen and this screen only.
       */}
      <div aria-hidden="true" data-flow-graphic className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]">
        <picture>
          <source srcSet="/graphics/door-decision.avif" type="image/avif" />
          <img
            src="/graphics/door-decision.webp"
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-center"
          />
        </picture>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-16">
        <div className="w-full max-w-lg lg:max-w-2xl">
          {!invitationResponse && (
            <>
              {/*
               * The eyebrow, alone.
               *
               * A "re-read grace" link used to sit beside it, justified as the
               * method's requirement that leaving be possible and visible. That
               * justification does not hold: leaving IS visible here, as the
               * third response — "Not for me" — which is a button on this
               * screen. Re-reading is not declining, so the link was carrying an
               * argument that belongs to something else.
               *
               * What it actually did was offer retreat at the moment of
               * commitment, on the one screen whose entire design is a single
               * choice. Back still works — the shell's history is indexed and
               * direction-aware, so the browser gesture people already use is
               * the affordance — and grace itself ends with a walk-back to the
               * verdict, so the reader has just been shown that going back
               * exists, one screen earlier.
               */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="flex items-center justify-center"
              >
                <span className="font-mono text-[9.5px] uppercase tracking-[3px] text-[#D4A843]/70">
                  {invitation.eyebrow}
                </span>
              </m.div>

              {/* The question, at the size the two screens before it set. The
                  verdict's confession and grace's answer were both the largest
                  thing on their screen; this is the third — and now the third
                  set the same way, centred like the two it answers to. */}
              <m.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_STRONG }}
                className="mt-4 text-balance font-score text-[38px] font-bold leading-[1.08] tracking-[0.005em] text-white/95 sm:text-[48px] lg:text-[58px]"
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
                  who wants the reason and skippable by anyone who does not.
                  Ranged left inside a centred column, because a hairline is an
                  edge and text centred against one reads as neither. */}
              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-8 border-l border-red-500/35 pl-4 text-left text-[13px] leading-relaxed text-white/45 sm:text-sm"
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
               * The way on, for the two answers /next-steps has a track for.
               *
               * This briefly routed "thinking" to the reading plan instead, on
               * the reading that `!== "dismissed"` was a category error handing
               * an undecided reader a discipleship task list. It was not.
               * /next-steps picks a track (next-steps/client.tsx), and
               * TrackThinking is written for exactly this reader: "That's
               * honest. Here are some things worth thinking about", three
               * reflection questions, and John 3 — chosen because it is a
               * conversation with a man who had questions. The reading plan
               * links out to bible.com and keeps a progress record; trackB is
               * the better answer and it already existed.
               *
               * The hold applies only to committed. A reader who is still
               * deciding has not just professed anything, so there is no beat
               * to protect — onwardReady is true immediately for them.
               *
               * onwardReady gates the element rather than its opacity — a
               * button at opacity 0 is an invisible click target, which this
               * codebase has been caught by before.
               */}
              {invitationResponse !== "dismissed" && onwardReady && (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE_OUT_STRONG }}
                  className="mt-10"
                >
                  <Link href={`/${locale}/next-steps`} className="block">
                    <Button variant="gold" mist className="w-full sm:w-auto">
                      {messages.nextSteps.cta}
                      <ButtonArrow />
                    </Button>
                  </Link>
                </m.div>
              )}

              {/* Dismissed gets no track at /next-steps, deliberately — someone
                  who said "not for me" should not be handed a task list. Their
                  door is this one, and it is conditional by construction:
                  "Changed your mind? The reading plan is waiting." */}
              {invitationResponse === "dismissed" && messages.nextSteps.dismissedReturn && (
                <p className="mt-8 text-[14px] leading-relaxed text-white/60">
                  <Link
                    href={`/${locale}/reading-plan`}
                    className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
                  >
                    {messages.nextSteps.dismissedReturn}
                  </Link>
                </p>
              )}

              {/*
               * Learn more stays on dismissed alone.
               *
               * For committed and thinking it duplicates what their /next-steps
               * track already carries — trackA has a Learn band and trackB has
               * "Want the foundations?". Dismissed has no track there at all,
               * so this and the reading-plan line above are the only doors it
               * has, and a quiet non-committal one is the right thing to leave
               * open.
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
