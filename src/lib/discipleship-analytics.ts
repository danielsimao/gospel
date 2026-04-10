import posthog from "posthog-js";

function safeCapture(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.warn("[discipleship-analytics] Capture failed:", error);
  }
}

export function trackNextStepsViewed(track: "prayed" | "thinking", locale: string) {
  safeCapture("next_steps_viewed", { track, locale });
}

export function trackNextStepsActionClicked(
  action: "read" | "pray" | "community" | "share" | "reading_plan" | "learn",
  track: "prayed" | "thinking",
) {
  safeCapture("next_steps_action_clicked", { action, track });
}

export function trackReadingPlanLearnClicked(locale: string) {
  safeCapture("reading_plan_learn_clicked", { locale });
}

export function trackReadingPlanViewed(locale: string) {
  safeCapture("reading_plan_viewed", { locale });
}

export function trackReadingPlanDayCompleted(day: number, locale: string) {
  safeCapture("reading_plan_day_completed", { day, locale });
}

export function trackReadingPlanCompleted(locale: string) {
  safeCapture("reading_plan_completed", { total_days: 7, locale });
}
