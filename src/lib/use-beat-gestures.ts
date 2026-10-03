"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  BEAT_LOCK_MS,
  feedWheel,
  isTap,
  keyDirection,
  swipeDirection,
  wheelPixels,
  type BeatDirection,
  type BeatInput,
  type ScrollEdges,
  type WheelBurst,
} from "@/lib/beat-gestures";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

/**
 * Controls that answer their own keys and touches. A gesture that starts on one
 * of these belongs to it, not to the beat — except the beat's own surface,
 * which is a <button> because that is what makes it reachable by Tab.
 */
const OWN_CONTROLS =
  'a[href], button, input, select, textarea, summary, [contenteditable=""], [contenteditable="true"], [role="button"], [role="link"]';

/** The full-screen control each beat screen renders. */
export const BEAT_SURFACE_SLOT = "beat-surface";

/** A swipe that starts on a field or a link is that control's gesture. */
const SWIPE_EXEMPT = 'a[href], input, select, textarea, [contenteditable=""], [contenteditable="true"]';

/**
 * Marks the element holding a beat's words, on both screens. Only one beat
 * screen is ever mounted, and it renders one beat at a time.
 */
export const BEAT_WORDS_ATTR = "data-beat-words";

/**
 * Whether the beat's WORDS run past the screen — not whether the page can
 * scroll. Measured on a landscape phone the two differ: a beat that scrolled by
 * 7px or 31px had every word on screen, the overflow being the frame's own
 * bottom padding, and a tap that paged through "the rest" of it moved the page
 * a few pixels and nothing else. A gesture is a dud the reader has to repeat.
 */
function scrollEdges(): ScrollEdges {
  const words = document.querySelector(`[${BEAT_WORDS_ATTR}]`);
  if (words) {
    const { top, bottom } = words.getBoundingClientRect();
    return { atStart: top >= -1, atEnd: bottom <= window.innerHeight + 1 };
  }
  // 2px of tolerance: a fractional device pixel ratio leaves the bottom a
  // hair short of scrollHeight even when nothing more can be shown.
  const { scrollHeight } = document.documentElement;
  return {
    atStart: window.scrollY <= 2,
    atEnd: window.scrollY + window.innerHeight >= scrollHeight - 2,
  };
}

interface Options {
  /** The beat on screen. A change returns the page to its top. */
  beat: number;
  canNext: boolean;
  canPrev: boolean;
  onMove: (direction: BeatDirection, input: BeatInput) => void;
}

/**
 * Every way a reader says "go on" or "go back" on a beat screen, wired to one
 * move — see lib/beat-gestures for the rules and why there is only one.
 *
 * Returns the props for the screen's full-screen surface. Keys, swipes and the
 * wheel are listened for on the window, because a reader's thumb does not aim.
 */
export function useBeatGestures({ beat, canNext, canPrev, onMove }: Options) {
  /*
   * The listeners register once; what they consult is kept current here.
   * Re-registering on every beat would drop a gesture that happened to span
   * the change — a fling's inertia arriving at a listener that no longer
   * holds its burst.
   */
  const latest = useRef({ canNext, canPrev, onMove });
  useIsomorphicLayoutEffect(() => {
    latest.current = { canNext, canPrev, onMove };
  });

  const lockedUntil = useRef(0);

  const move = useCallback((direction: BeatDirection, input: BeatInput) => {
    const { canNext: next, canPrev: prev, onMove: handler } = latest.current;
    if (direction === "next" ? !next : !prev) return;
    const now = performance.now();
    if (now < lockedUntil.current) return;
    lockedUntil.current = now + BEAT_LOCK_MS;

    /*
     * A beat taller than the screen is shown in full before it is left. A tap
     * or a key that would skip text the reader has not been shown pages
     * through it instead. Swipes and the wheel already respect this — they
     * leave a beat only from its edge.
     */
    if (input === "tap" || input === "key") {
      const edges = scrollEdges();
      if (direction === "next" && !edges.atEnd) {
        window.scrollBy({ top: window.innerHeight * 0.85, behavior: "auto" });
        return;
      }
      if (direction === "prev" && !edges.atStart) {
        window.scrollBy({ top: -window.innerHeight * 0.85, behavior: "auto" });
        return;
      }
    }

    handler(direction, input);
  }, []);

  // Each beat opens at its own top. Instant, never smooth: a scroll animation
  // is something a reader's next gesture has to fight.
  const firstBeat = useRef(true);
  useIsomorphicLayoutEffect(() => {
    if (firstBeat.current) {
      firstBeat.current = false;
      return;
    }
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "auto" });
  }, [beat]);

  useEffect(() => {
    /*
     * A swipe down at the top of the page is Chrome's pull-to-refresh, and here
     * it is also "go back a beat". Without this the gesture that walks back
     * reloads the test instead.
     */
    const root = document.documentElement;
    const previousOverscroll = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "none";

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const direction = keyDirection(event);
      if (!direction) return;
      const target = event.target instanceof Element ? event.target : null;
      const onSurface = target?.closest(`[data-slot="${BEAT_SURFACE_SLOT}"]`);
      // Another control keeps its keys — Space on the exit, Enter on a dot.
      if (!onSurface && target?.closest(OWN_CONTROLS)) return;
      // The surface is a <button>: Space and Enter already click it, and the
      // click is the move. Handling them here as well would move twice.
      if (onSurface && (event.key === " " || event.key === "Enter")) return;
      const { canNext: next, canPrev: prev } = latest.current;
      // Not ours to take: where a beat cannot be left by this key, the browser
      // keeps its own meaning for it — Space still scrolls the page.
      if (direction === "next" ? !next : !prev) return;
      event.preventDefault();
      move(direction, "key");
    }

    let touch: ({ x: number; y: number } & ScrollEdges) | null = null;

    function onTouchStart(event: TouchEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (event.touches.length !== 1 || target?.closest(SWIPE_EXEMPT)) {
        touch = null;
        return;
      }
      const point = event.touches[0]!;
      touch = { x: point.clientX, y: point.clientY, ...scrollEdges() };
    }

    function onTouchMove(event: TouchEvent) {
      // A second finger makes it a pinch or a pan, never a beat.
      if (event.touches.length > 1) touch = null;
    }

    function onTouchEnd(event: TouchEvent) {
      const start = touch;
      touch = null;
      const point = event.changedTouches[0];
      if (!start || !point) return;
      const direction = swipeDirection(point.clientX - start.x, start.y - point.clientY, start);
      if (direction) move(direction, "swipe");
    }

    function onTouchCancel() {
      touch = null;
    }

    let burst: WheelBurst | null = null;

    function onWheel(event: WheelEvent) {
      // Ctrl+wheel is a trackpad pinch: the reader is zooming, not reading on.
      if (event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const result = feedWheel(
        burst,
        event.timeStamp || performance.now(),
        wheelPixels(event.deltaY, event.deltaMode, window.innerHeight),
        scrollEdges(),
      );
      burst = result.burst;
      if (result.fire) move(result.fire, "wheel");
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      root.style.overscrollBehaviorY = previousOverscroll;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("wheel", onWheel);
    };
  }, [move]);

  /*
   * The surface's tap. A press that travelled was a swipe, and the swipe
   * listener above has already decided what it meant — some browsers still
   * deliver a click at the end of a short drag, and counting it would move the
   * reader twice for one gesture.
   *
   * `detail === 0` is a click from the keyboard or assistive technology, which
   * has no travel to measure and always counts.
   */
  const press = useRef<{ x: number; y: number } | null>(null);
  const surfaceProps = {
    "data-slot": BEAT_SURFACE_SLOT,
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      press.current = event.isPrimary ? { x: event.clientX, y: event.clientY } : null;
    },
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      const start = press.current;
      press.current = null;
      if (event.detail > 0) {
        if (start && !isTap(event.clientX - start.x, event.clientY - start.y)) return;
        move("next", "tap");
        return;
      }
      move("next", "key");
    },
  };

  return { surfaceProps };
}
