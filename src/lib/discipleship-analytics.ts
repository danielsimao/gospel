import { capture as safeCapture } from "@/lib/posthog";

export function trackNextStepsViewed(track: "committed" | "thinking", locale: string) {
  safeCapture("next_steps_viewed", { track, locale });
}

/**
 * `leaving` marks the actions whose click is immediately followed by a same-tab
 * navigation off the site — today only "read", which opens bible.com. Those get
 * the beacon for the same reason trackScriptureOpened does; the rest stay on the
 * default transport, since sendBeacon has a payload ceiling and no response and
 * is the wrong default for events with no teardown to survive.
 */
export function trackNextStepsActionClicked(
  action: "read" | "pray" | "community" | "share" | "reading_plan" | "learn" | "talk" | "cards",
  track: "committed" | "thinking",
  leaving = false,
) {
  safeCapture(
    "next_steps_action_clicked",
    { action, track },
    leaving ? { transport: "sendBeacon" } : undefined,
  );
}

/**
 * A reader leaving for the chapter itself.
 *
 * Paired with `reading_plan_day_completed`, this answers the one question the
 * whole reading plan turns on: does a reader who goes to read come back and
 * say they did. Nobody publishes that number, so it has to be our own.
 *
 * Deliberately modest about what it can prove. At this site's traffic the
 * comparison is descriptive, not decision-grade — it will not carry a verdict
 * on whether the handoff loses people for a long time yet, and a design that
 * rests on it being conclusive is resting on nothing.
 *
 * `day` is the plan day being opened, or null where the link is not a plan day
 * (the thinking track's John 3, the continue-reading door past day seven).
 *
 * Fired from an onClick that immediately precedes a same-tab navigation to
 * bible.com — the default transport is an in-flight request the browser
 * cancels on teardown, so this is exactly the event most likely to be
 * dropped. sendBeacon survives it.
 */
export function trackScriptureOpened(
  surface: "next_steps_committed" | "next_steps_thinking" | "reading_plan_day" | "reading_plan_continue",
  day: number | null,
  locale: string,
) {
  safeCapture("scripture_opened", { surface, day, locale }, { transport: "sendBeacon" });
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

export function trackReadingPlanDayCompleted(
  day: number,
  locale: string,
  surface: "reading_plan" | "next_steps",
) {
  safeCapture("reading_plan_day_completed", { day, locale, surface });
}

export function trackReadingPlanCompleted(locale: string) {
  safeCapture("reading_plan_completed", { total_days: 7, locale });
}
