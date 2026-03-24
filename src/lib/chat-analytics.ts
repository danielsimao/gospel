import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app
  }
}

export function trackChatStarted(locale: string) {
  safeCapture("chat_started", {
    locale,
    referral_source: typeof document !== "undefined" ? document.referrer || "direct" : "unknown",
    device_type: typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    utm_source: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_source") : null,
    utm_medium: typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_medium") : null,
  });
}

export function trackChatMessageSent(stage: string, messageLength: number, timeSinceLastMessage: number) {
  safeCapture("chat_message_sent", {
    stage,
    message_length: messageLength,
    time_since_last_message_ms: timeSinceLastMessage,
  });
}

export function trackChatStageAdvanced(fromStage: string, toStage: string, messagesInStage: number, timeInStage: number) {
  safeCapture("chat_stage_advanced", {
    from_stage: fromStage,
    to_stage: toStage,
    messages_in_stage: messagesInStage,
    time_in_stage_ms: timeInStage,
  });
}

export function trackChatAbandoned(lastStage: string, totalMessages: number, totalTime: number, locale: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (posthogKey) {
        navigator.sendBeacon(
          `${posthogHost}/capture/`,
          JSON.stringify({
            api_key: posthogKey,
            event: "chat_abandoned",
            properties: {
              last_stage: lastStage,
              total_messages: totalMessages,
              total_time_ms: totalTime,
              locale,
              distinct_id: posthog.get_distinct_id?.() || "anonymous",
            },
          }),
        );
        return;
      }
    }
  } catch {
    // Fall through
  }
  safeCapture("chat_abandoned", { last_stage: lastStage, total_messages: totalMessages, total_time_ms: totalTime, locale });
}

export function trackChatInvitationReached(totalMessages: number, totalTime: number) {
  safeCapture("chat_invitation_reached", {
    total_messages: totalMessages,
    total_time_ms: totalTime,
  });
}
