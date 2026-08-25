import { capture as safeCapture, getDistinctId, POSTHOG_HOST, POSTHOG_KEY } from "@/lib/posthog";

export function trackTestBack(from: string, to: string, via: "link" | "browser") {
  safeCapture("test_back", { from, to, via });
}

/**
 * Leaving the flow by the exit control, which until now produced no event at
 * all: it is a client-side <Link>, so the document never unloads and
 * `beforeunload` — the only abandonment hook — does not fire. Exits were
 * therefore invisible, and the two-step reveal in front of this exists to
 * prevent accidental ones. Without a count there is no way to know whether it
 * helped or merely cost every deliberate leaver a tap, hence: the phase they
 * left from, and whether the exit went through the reveal or straight out.
 */
export function trackTestExit(
  phase: string,
  locale: string,
  /**
   * "revealed" — a pointer exit that went through the two-step: one tap to
   * name the action, a second to commit. "direct" — an activation that skips
   * it by design, which is keyboard, voice and assistive tech (they report
   * `detail: 0`, and taxing them with a confirmation step would be the wrong
   * trade). Without this the event could not answer the question the two-step
   * was built to settle, since every exit would look alike.
   */
  via: "revealed" | "direct",
) {
  safeCapture("test_exit", { phase, locale, via });
}

/**
 * A same-sitting session restored without asking. Replaces the two events the
 * resume dialog used to emit; the phase is what says whether readers are losing
 * their place mid-question or mid-argument.
 */
export function trackTestRestored(phase: string, locale: string) {
  safeCapture("test_restored_silently", { phase, locale });
}

export function trackGameStarted(locale: string) {
  safeCapture("game_started", {
    locale,
    referral_source: typeof document !== "undefined" ? document.referrer || "direct" : "unknown",
    device_type: typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    utm_source: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_source") : null,
    utm_medium: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_medium") : null,
    utm_campaign: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_campaign") : null,
  });
}

export function trackQuestionAnswered(
  questionId: number,
  commandment: string,
  answerType: "honest" | "justify",
  scoreAfter: number,
  timeOnQuestion: number,
) {
  safeCapture("question_answered", {
    questionId,
    commandment,
    answer_type: answerType,
    score_after: scoreAfter,
    time_on_question_ms: timeOnQuestion,
  });
}

/**
 * The reader's own claim, and which door they answered it at. Recorded because
 * the gap between what people claim here and what the six answers show is the
 * one number that says whether the Law is landing.
 */
export function trackSelfRating(
  rating: "yes" | "mostly" | "no",
  source: "homepage" | "test_landing",
) {
  safeCapture("self_rating_given", { rating, source });
}

/**
 * A reader correcting their claim on the reply screen. Worth its own event:
 * a high rate here means the chips are being mis-tapped, which is a layout
 * problem, not a change of heart.
 */
export function trackSelfRatingChanged(from: "yes" | "mostly" | "no") {
  safeCapture("self_rating_changed", { from });
}

export function trackFollowupShown(questionId: number) {
  safeCapture("question_followup_shown", { questionId });
}

export function trackAnswerChanged(questionId: number, from: "honest" | "justify") {
  safeCapture("answer_changed", { questionId, from });
}

export function trackGameAbandoned(
  lastQuestionId: number,
  scoreAtExit: number,
  totalTime: number,
  locale: string,
  phase: string = "playing",
) {
  // Use sendBeacon for reliability during page unload
  const payload = {
    event: "game_abandoned",
    properties: {
      last_question_id: lastQuestionId,
      score_at_exit: scoreAtExit,
      total_time_ms: totalTime,
      locale,
      phase,
    },
  };

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const posthogHost = POSTHOG_HOST;
      const posthogKey = POSTHOG_KEY;
      if (posthogKey) {
        navigator.sendBeacon(
          `${posthogHost}/capture/`,
          JSON.stringify({
            api_key: posthogKey,
            event: "game_abandoned",
            properties: {
              ...payload.properties,
              distinct_id: getDistinctId() || "anonymous",
            },
          }),
        );
        return;
      }
    }
  } catch {
    // Fall through to regular capture
  }

  safeCapture("game_abandoned", payload.properties);
}

export function trackVerdictReached(
  totalHonest: number,
  totalJustify: number,
  totalTime: number,
) {
  safeCapture("verdict_reached", {
    total_honest: totalHonest,
    total_justify: totalJustify,
    total_time_ms: totalTime,
  });
}

/**
 * Where the ledger's proof-of-trial lives between the two ends of the test.
 *
 * sessionStorage, not localStorage: a token is for the trial being stood
 * right now, and one left behind in a tab from yesterday should expire with
 * the session rather than sit there waiting to be spent. (The server's own
 * MAX_AGE_MS is the real bound; this just keeps the client tidy.)
 */
const VERDICT_TOKEN_KEY = "gospel-verdict-token";

/**
 * Asks for the token that a verdict row will need, at the moment the reader
 * steps into the Law. Fired from landing.tsx's handleBegin, beside the
 * anonymous trial beacon.
 *
 * Failure is silent and total: no token means no row at the other end, which
 * costs the ledger one entry and costs the reader nothing. The transition
 * into the Law must never wait on this.
 */
export function requestVerdictToken() {
  try {
    fetch("/api/trial-token", { method: "POST" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (typeof data?.token === "string") {
          sessionStorage.setItem(VERDICT_TOKEN_KEY, data.token);
        }
      })
      .catch(() => {});
  } catch {
    // Analytics can never break the app.
  }
}

/**
 * The score band's own row, written alongside `verdict_reached` rather than
 * instead of it — PostHog still gets the full event for every other kind of
 * analysis; this is only the ledger's read-side dependency being moved off
 * PostHog's query API (see api/verdict/route.ts and test-stats.ts's own
 * comments on why).
 *
 * Two things have to be true for a row to be written, and they guard
 * different things. `getDistinctId()` returns null until the PostHog client
 * has been initialised, which only happens once consent is granted (see
 * consent-banner.tsx) — the same trust boundary `trackVerdictReached` above
 * already crosses. The token is the server's own check that a trial was
 * actually stood, because the visitor id is client-supplied and proves
 * nothing on its own (src/lib/verdict-token.ts).
 *
 * The token is cleared as it is spent: the server enforces single use via
 * the nonce's unique constraint, and holding on to a spent token client-side
 * would only mean a retake silently writing nothing.
 */
export function trackVerdictRow() {
  const visitorId = getDistinctId();
  if (!visitorId) return;
  try {
    const token = sessionStorage.getItem(VERDICT_TOKEN_KEY);
    if (!token) return;
    sessionStorage.removeItem(VERDICT_TOKEN_KEY);
    fetch("/api/verdict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, token }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics can never break the app.
  }
}

/**
 * A horizontal swipe on the verdict surface — the direction that advances and
 * the direction that is refused. Ruled by the owner (2026-08-23): left advances
 * like a tap, right does nothing. A refused gesture is still a reader saying
 * what they expected the screen to do, so both directions are recorded, with
 * the beat they landed on.
 *
 * start_x_fraction is the Android question. Gesture navigation answers a swipe
 * that begins at the screen edge with history back before the page ever sees
 * it, and the verdict is the history baseline (game-shell.tsx) — back from
 * here leaves /test entirely. Those swipes cannot be counted from inside the
 * page; how tightly the delivered ones cluster toward the edges is the nearest
 * measurable proxy for how often that ejection is happening just beyond them.
 */
export function trackVerdictSwipe(
  direction: "left" | "right",
  beat: string,
  startXFraction: number,
) {
  safeCapture("verdict_swiped", {
    direction,
    beat,
    start_x_fraction: startXFraction,
  });
}

export function trackGraceViewed(timeSpent: number, scrollDepth: number) {
  safeCapture("grace_viewed", {
    time_spent_ms: timeSpent,
    scroll_depth_percent: scrollDepth,
  });
}

export function trackInvitationResponse(
  response: "committed" | "thinking" | "dismissed",
  totalTime: number,
) {
  safeCapture("invitation_response", {
    response,
    total_time_ms: totalTime,
  });
}

export function trackInvitationLearnMoreClicked(
  response: "committed" | "thinking" | "dismissed",
  locale: string,
) {
  safeCapture("invitation_learn_more_clicked", {
    response,
    locale,
  });
}

export function trackResourceClicked(name: string, url: string) {
  safeCapture("resource_clicked", { resource_name: name, resource_url: url });
}

export function trackShared(
  method: "whatsapp" | "telegram" | "copy" | "native",
  locale: string,
) {
  safeCapture("shared", { share_method: method, locale });
}
