"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect on the client, useEffect on the server. React warns that
 * useLayoutEffect does nothing during SSR; this keeps the pre-paint timing
 * where it matters without the warning where it does not.
 *
 * Reach for this when an effect reads persisted state that decides what the
 * reader sees. useEffect runs after the browser has painted, so the first
 * frame shows whatever the server assumed — and for anything stored in
 * localStorage the server's assumption is always "new visitor". The correction
 * then arrives as a visible flash of the wrong content.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
