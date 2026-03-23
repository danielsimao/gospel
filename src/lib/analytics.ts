import posthog from "posthog-js";

export function trackGameStarted(locale: string) {
  posthog.capture("game_started", {
    locale,
    referral_source: document.referrer || "direct",
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    utm_source: new URLSearchParams(window.location.search).get("utm_source"),
    utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
    utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
  });
}

export function trackQuestionAnswered(
  questionId: number,
  commandment: string,
  answerType: "honest" | "justify",
  scoreAfter: number,
  timeOnQuestion: number,
) {
  posthog.capture("question_answered", {
    questionId,
    commandment,
    answer_type: answerType,
    score_after: scoreAfter,
    time_on_question_ms: timeOnQuestion,
  });
}

export function trackFollowupShown(questionId: number) {
  posthog.capture("question_followup_shown", { questionId });
}

export function trackGameAbandoned(
  lastQuestionId: number,
  scoreAtExit: number,
  totalTime: number,
  locale: string,
) {
  posthog.capture("game_abandoned", {
    last_question_id: lastQuestionId,
    score_at_exit: scoreAtExit,
    total_time_ms: totalTime,
    locale,
  });
}

export function trackVerdictReached(
  totalHonest: number,
  totalJustify: number,
  totalTime: number,
) {
  posthog.capture("verdict_reached", {
    total_honest: totalHonest,
    total_justify: totalJustify,
    total_time_ms: totalTime,
  });
}

export function trackGraceViewed(timeSpent: number, scrollDepth: number) {
  posthog.capture("grace_viewed", {
    time_spent_ms: timeSpent,
    scroll_depth_percent: scrollDepth,
  });
}

export function trackInvitationResponse(
  response: "prayed" | "thinking" | "dismissed",
  totalTime: number,
) {
  posthog.capture("invitation_response", {
    response,
    total_time_ms: totalTime,
  });
}

export function trackResourceClicked(name: string, url: string) {
  posthog.capture("resource_clicked", { resource_name: name, resource_url: url });
}

export function trackShared(
  method: "whatsapp" | "telegram" | "copy" | "native",
  locale: string,
) {
  posthog.capture("shared", { share_method: method, locale });
}
