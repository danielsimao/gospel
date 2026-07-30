"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect on the client, useEffect on the server. React warns that
 * useLayoutEffect does nothing during SSR; this keeps the pre-paint timing
 * where it matters without the warning where it does not.
 *
 * Reach for this when an effect reads persisted state that decides what the
 * reader sees. useEffect runs after the browser has painted, so the correction
 * arrives as a second, visible paint of the right content over the wrong one.
 *
 * Know its bound. This removes that extra paint. It does NOT stop the server's
 * own HTML being painted first — hydration itself happens after that paint, so
 * nothing running inside React can get ahead of it, and for anything held in
 * localStorage the server's assumption is always "new visitor". Closing that
 * first gap needs a blocking inline script; see `stage-prepaint-script.ts` and
 * the pre-paint script in `death-counter.tsx` for the two places this app does
 * that. Measured on the homepage, the switch from useEffect to this narrowed
 * the wrong content from 28ms to 14ms and did not remove it.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
