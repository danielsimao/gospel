"use client";

import { useState } from "react";
import { subscribeToStorage } from "./client-storage";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";
import { readJourney, deriveStage, migrateLegacyJourney, type JourneyStage } from "./journey-storage";
import { readProgress, getCompletedCount } from "./reading-storage";
import { isTopicCompleted } from "./learn-progress-storage";

export const TOTAL_READING_DAYS = 7;

export interface JourneySnapshot {
  stage: JourneyStage;
  readingDone: number;
  learnDone: number;
  /** Whole days since the verdict was reached; null before the test. */
  daysSinceTest: number | null;
  /** Whole days since the invitation response; null before a response. */
  daysSinceResponse: number | null;
  /** false on the server and the first client render; true once localStorage has been read. */
  ready: boolean;
}

const EMPTY_SNAPSHOT: JourneySnapshot = {
  stage: "visitor",
  readingDone: 0,
  learnDone: 0,
  daysSinceTest: null,
  daysSinceResponse: null,
  ready: false,
};

const DAY_MS = 86_400_000;

function daysSince(timestamp: number | null): number | null {
  if (typeof timestamp !== "number") return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / DAY_MS));
}

/** Pure snapshot read for init-once call sites that don't need subscriptions. */
export function computeJourneySnapshot(
  topicSlugs: readonly string[],
): JourneySnapshot {
  try {
    const record = readJourney();
    return {
      stage: deriveStage(record),
      readingDone: getCompletedCount(readProgress(), TOTAL_READING_DAYS),
      learnDone: topicSlugs.reduce(
        (n, slug) => (isTopicCompleted(slug) ? n + 1 : n),
        0,
      ),
      daysSinceTest: daysSince(record.testCompletedAt),
      daysSinceResponse: daysSince(record.respondedAt),
      ready: true,
    };
  } catch {
    return { ...EMPTY_SNAPSHOT, ready: true };
  }
}

/**
 * Journey snapshot with live updates. Server render and first client render
 * return EMPTY_SNAPSHOT so hydration output is stable; the effect swaps in
 * the real snapshot post-mount and re-reads on storage changes and bfcache
 * restores (pageshow).
 *
 * That swap happens before the browser paints, not after. EMPTY_SNAPSHOT says
 * "visitor", which is the one thing a returning reader is not — and read in a
 * plain effect, the correction landed after the first paint, so every refresh
 * of the homepage showed a committed reader the stranger's front door for a
 * frame before replacing it with their own stage. Their word for it was
 * flicker. A layout effect puts the read on the near side of that paint.
 */
export function useJourney(
  topicSlugs: readonly string[] = [],
): JourneySnapshot {
  const [snapshot, setSnapshot] = useState<JourneySnapshot>(EMPTY_SNAPSHOT);
  const slugsKey = topicSlugs.join(",");

  useIsomorphicLayoutEffect(() => {
    const slugs = slugsKey ? slugsKey.split(",") : [];
    const update = () => setSnapshot(computeJourneySnapshot(slugs));
    migrateLegacyJourney();
    update();
    window.addEventListener("pageshow", update);
    const unsubscribe = subscribeToStorage(update);
    return () => {
      window.removeEventListener("pageshow", update);
      unsubscribe();
    };
  }, [slugsKey]);

  return snapshot;
}
