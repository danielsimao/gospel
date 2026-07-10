"use client";

import { useEffect, useState } from "react";
import { subscribeToStorage } from "./client-storage";
import { readJourney, deriveStage, type JourneyStage } from "./journey-storage";
import { readProgress, getCompletedCount } from "./reading-storage";
import { isTopicCompleted } from "./learn-progress-storage";

export const TOTAL_READING_DAYS = 7;

export interface JourneySnapshot {
  stage: JourneyStage;
  readingDone: number;
  learnDone: number;
  /** false on the server and the first client render; true once localStorage has been read. */
  ready: boolean;
}

const EMPTY_SNAPSHOT: JourneySnapshot = {
  stage: "visitor",
  readingDone: 0,
  learnDone: 0,
  ready: false,
};

/** Pure snapshot read for init-once call sites that don't need subscriptions. */
export function computeJourneySnapshot(
  topicSlugs: readonly string[],
): JourneySnapshot {
  try {
    return {
      stage: deriveStage(readJourney()),
      readingDone: getCompletedCount(readProgress(), TOTAL_READING_DAYS),
      learnDone: topicSlugs.reduce(
        (n, slug) => (isTopicCompleted(slug) ? n + 1 : n),
        0,
      ),
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
 */
export function useJourney(
  topicSlugs: readonly string[] = [],
): JourneySnapshot {
  const [snapshot, setSnapshot] = useState<JourneySnapshot>(EMPTY_SNAPSHOT);
  const slugsKey = topicSlugs.join(",");

  useEffect(() => {
    const slugs = slugsKey ? slugsKey.split(",") : [];
    const update = () => setSnapshot(computeJourneySnapshot(slugs));
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
