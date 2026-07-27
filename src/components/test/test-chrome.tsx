"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useGameState, useGameDispatch } from "@/components/game-provider";
import { trackGameAbandoned } from "@/lib/analytics";
import { QUESTION_CONFIGS } from "@/lib/questions";
import { readSession } from "@/lib/test-session-storage";
import { markTestCompleted } from "@/lib/journey-storage";
import { furthestPhase, isBeyond, routeForPhase } from "@/lib/test-routes";
import type { GamePhase } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/** null is the index segment: landing + questions live on /test itself. */
function phaseFromSegment(segment: string | null): GamePhase {
  if (segment === "verdict") return "verdict";
  if (segment === "grace") return "grace";
  if (segment === "decision") return "invitation";
  return "landing";
}

interface TestChromeProps {
  backLabel: string;
  locale: Locale;
  children: ReactNode;
}

/**
 * Everything that wraps a phase but must not remount when you move between
 * phases: the page frame, the vignette, the Exit link, and the effects keyed
 * on where you are. Lives in the test layout, so navigating /test → /test/grace
 * leaves all of it — and the reducer above it — untouched.
 *
 * The route is the single source of truth for the phase. It is deliberately
 * never written back into the reducer: an earlier draft mirrored it via a
 * SYNC_PHASE action, which bought nothing and created a render where the URL
 * and the state disagreed.
 */
export function TestChrome({ backLabel, locale, children }: TestChromeProps) {
  const segment = useSelectedLayoutSegment();
  const phase = phaseFromSegment(segment);
  const state = useGameState();
  const dispatch = useGameDispatch();
  const router = useRouter();

  /*
   * Children are held until the saved session has been read. Phase pages SSR
   * a shell while the reducer is still initialGameState, so without this gate
   * a cold load of /test/verdict paints the verdict against zero answers —
   * buildConfession([]) returns noneLabel, so "Guilty still." flashes.
   *
   * The same read also silently restores a refresh taken mid-flow. Landing on
   * a phase route with a saved session but an empty reducer is a page reload,
   * not a return visit: the reader never left, so there is nothing to ask them
   * about. The resume *dialog* belongs to /test, which is where someone who
   * genuinely went away comes back to.
   */
  const [ready, setReady] = useState(false);
  // Guards the restore to a single run. A mid-flow reload rehydrates once;
  // re-running on a later segment change would overwrite live state with
  // whatever storage last held. A ref rather than an empty dep array so the
  // dependencies stay honest.
  //
  // The flag is raised inside the frame, not beside the scheduling call. Raised
  // early it contradicted the cleanup below: React re-invokes an effect after
  // cleanup on the same mount (StrictMode does this in dev), so pass one
  // scheduled a frame and raised the flag, the cleanup cancelled that frame,
  // and pass two returned early — leaving `ready` false forever and the whole
  // test route blank on any client-side navigation into it.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;

    const id = requestAnimationFrame(() => {
      hydratedRef.current = true;
      const saved = readSession();
      if (saved && segment !== null) {
        dispatch({
          type: "RESUME_SESSION",
          session: {
            phase: saved.phase,
            currentQuestion: saved.currentQuestion,
            score: saved.score,
            answers: saved.answers,
            currentAnswer: saved.currentAnswer,
            showFollowUp: saved.showFollowUp,
            startedAt: saved.startedAt,
            completedAt: saved.completedAt,
            questionStartedAt: saved.questionStartedAt,
            savedAt: saved.savedAt,
            graceReached: saved.graceReached,
            graceBeatsRevealed: saved.graceBeatsRevealed,
            invitationReached: saved.invitationReached,
            invitationResponse: saved.invitationResponse,
          },
        });
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [dispatch, segment]);

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "game",
      message: `Phase: ${phase}`,
      level: "info",
      data: { phase, score: state.score },
    });
    // Persist completion so other pages (home, learn, nav) can check.
    if (phase === "verdict" || phase === "grace" || phase === "invitation") {
      markTestCompleted();
    }
    // Scroll to top so focus lands on the new content. App Router restores
    // scroll on back, which is correct — this only covers forward moves.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, state.score]);

  useEffect(() => {
    function handleBeforeUnload() {
      // Any phase past landing counts as abandonment, except once a response
      // has been recorded — that is a completed session, not an exit.
      if (phase === "landing") return;
      if (phase === "invitation" && state.invitationResponse) return;

      const currentConfig = QUESTION_CONFIGS[state.currentQuestion];
      trackGameAbandoned(
        currentConfig?.id ?? 0,
        state.score,
        Date.now() - state.startedAt,
        locale,
        phase,
      );
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, state.currentQuestion, state.score, state.startedAt, state.invitationResponse, locale]);

  // The sticky deaths-today bar sits in the (immersive) layout, outside this
  // provider's tree, so it cannot read the phase through React. Publishing it
  // on <html> lets globals.css retire the bar once the verdict takes the count.
  useEffect(() => {
    document.documentElement.dataset.gamePhase = phase;
    return () => {
      delete document.documentElement.dataset.gamePhase;
    };
  }, [phase]);

  /*
   * Deep-link guard. A reader may always go back to a phase they have reached,
   * and never forward past one they have not — so a cold /test/grace with no
   * session lands on /test, and with a half-finished test lands on the verdict
   * only if the verdict was actually reached.
   *
   * replace, not push, so a rejected deep link leaves no history entry to press
   * back into.
   */
  useEffect(() => {
    if (!ready || phase === "landing") return;
    const furthest = furthestPhase(state);
    if (isBeyond(phase, furthest)) {
      router.replace(routeForPhase(furthest, locale));
    }
  }, [ready, phase, state, locale, router]);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#060404] flex flex-col">
      {/* Radial vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060404_75%)]" />

      <Link
        href={`/${locale}`}
        aria-label={backLabel}
        className="fixed left-3 top-12 z-40 flex items-center gap-1 rounded-md border border-white/[0.06] bg-[#060404]/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[2px] text-white/70 backdrop-blur-sm transition-colors hover:border-white/15 hover:text-white/80 sm:left-4 sm:top-14 sm:text-[10px]"
      >
        <span aria-hidden="true">&larr;</span>
        <span>{backLabel}</span>
      </Link>

      {/* Content (offset below the sticky bar) */}
      <div className="relative z-[1] flex flex-1 flex-col pt-10">
        {ready ? children : null}
      </div>
    </main>
  );
}
