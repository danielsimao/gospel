import { capture as safeCapture } from "@/lib/posthog";

export function trackNextStepsViewed(track: "committed" | "thinking", locale: string) {
  safeCapture("next_steps_viewed", { track, locale });
}

export function trackNextStepsActionClicked(
  action: "read" | "pray" | "community" | "share" | "reading_plan" | "learn" | "talk",
  track: "committed" | "thinking",
) {
  safeCapture("next_steps_action_clicked", { action, track });
}

export function trackReadingPlanLearnClicked(locale: string) {
  safeCapture("reading_plan_learn_clicked", { locale });
}

export function trackReadingPlanReset(locale: string) {
  safeCapture("reading_plan_reset", { locale });
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
