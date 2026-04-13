import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app
  }
}

export function trackTestResumed(phase: string, locale: string) {
  safeCapture("test_resumed", { phase, locale });
}

export function trackTestRestarted(locale: string) {
  safeCapture("test_restarted", { locale });
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

export function trackFollowupShown(questionId: number) {
  safeCapture("question_followup_shown", { questionId });
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
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (posthogKey) {
        navigator.sendBeacon(
          `${posthogHost}/capture/`,
          JSON.stringify({
            api_key: posthogKey,
            event: "game_abandoned",
            properties: {
              ...payload.properties,
              distinct_id: posthog.get_distinct_id?.() || "anonymous",
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

export function trackGraceViewed(timeSpent: number, scrollDepth: number) {
  safeCapture("grace_viewed", {
    time_spent_ms: timeSpent,
    scroll_depth_percent: scrollDepth,
  });
}

export function trackInvitationResponse(
  response: "prayed" | "thinking" | "dismissed",
  totalTime: number,
) {
  safeCapture("invitation_response", {
    response,
    total_time_ms: totalTime,
  });
}

export function trackInvitationLearnMoreClicked(
  response: "prayed" | "thinking" | "dismissed",
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
