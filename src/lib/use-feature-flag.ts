"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { isPostHogInitialized } from "./posthog";

/**
 * Reads a PostHog feature flag, with the default winning until flags arrive.
 *
 * Used as a kill switch rather than an experiment splitter: ship at 100% with
 * `defaultValue: true`, and flip the flag off to revert in seconds without a
 * deploy. Traffic is currently far too low for an A/B test to reach
 * significance — detecting even a 10-point conversion swing needs roughly 600
 * homepage visitors — so splitting would produce noise that reads as data.
 *
 * Degrades to `defaultValue` whenever PostHog is absent: consent declined, a
 * content blocker, or a server render. That is deliberate — a kill switch that
 * fails closed would hide a shipped feature from anyone who declined
 * analytics.
 */
export function useFeatureFlag(key: string, defaultValue: boolean): boolean {
  const [enabled, setEnabled] = useState(defaultValue);

  useEffect(() => {
    if (!isPostHogInitialized()) return;

    const apply = () => {
      const value = posthog.isFeatureEnabled(key);
      // undefined means "not loaded yet" — keep the default rather than
      // flashing the other variant.
      if (typeof value === "boolean") setEnabled(value);
    };

    apply();
    return posthog.onFeatureFlags(apply);
  }, [key]);

  return enabled;
}
