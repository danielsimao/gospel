/**
 * The rules for moving through a sequence of beats — the verdict's five and
 * grace's seven — kept free of React and the DOM so they can be tested as rules.
 *
 * One contract for both screens: whatever a reader reaches for means "next",
 * and "next" is always exactly one beat. A tap, a swipe up, a wheel or
 * trackpad scroll, Space, Enter, ↓ or →. The opposite gestures go back one.
 * The reader never has to work out which instrument this screen wants, which
 * is attention the beat on screen does not get.
 *
 * See lib/use-beat-gestures for where these are wired to real events.
 */

export type BeatDirection = "next" | "prev";

/** What moved the reader, for analytics and for the overflow rule below. */
export type BeatInput = "tap" | "key" | "swipe" | "wheel";

/**
 * How long after a move further moves are ignored.
 *
 * A double tap must not skip a beat. Without this, the second tap of a
 * habitual double lands on the beat that has only just started arriving —
 * "That someone is Jesus Christ" gone before its first word is legible. 400ms
 * is shorter than either screen's entrance, so a reader going at their own
 * pace never meets it.
 */
export const BEAT_LOCK_MS = 400;

/**
 * How far a press may travel and still be a tap — the slop a native tap allows.
 * Past it the press was a swipe, and the swipe rules decide.
 */
export const TAP_SLOP_PX = 10;

/** How far a finger must travel, mostly vertically, to count as a swipe. */
export const SWIPE_MIN_PX = 48;

/**
 * Wheel events closer together than this belong to one gesture.
 *
 * A trackpad fling emits a stream of events for a second or more as its
 * inertia decays; a mouse wheel emits one per notch. Treating each stream as
 * one gesture is what makes a fling move one beat rather than seven.
 */
export const WHEEL_GAP_MS = 200;

/** How much wheel travel a gesture needs before it means anything. */
export const WHEEL_MIN_PX = 40;

export function isTap(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) <= TAP_SLOP_PX;
}

interface KeyLike {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  repeat: boolean;
}

/**
 * The keys that move a beat, in the directions a reader already knows them
 * from a document: Space and ↓ go on, Shift+Space and ↑ go back.
 *
 * A held key is not a series of decisions, so auto-repeat moves nothing.
 * Modified keys belong to the browser and the system.
 */
export function keyDirection(event: KeyLike): BeatDirection | null {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return null;
  switch (event.key) {
    case " ":
      return event.shiftKey ? "prev" : "next";
    case "Enter":
    case "ArrowDown":
    case "ArrowRight":
    case "PageDown":
      return "next";
    case "ArrowUp":
    case "ArrowLeft":
    case "PageUp":
      return "prev";
    default:
      return null;
  }
}

/**
 * Where the page sat when a gesture began.
 *
 * A beat is one screen, but not always: a landscape phone or a large system
 * font can push one past the viewport. Then a swipe or a wheel has to scroll
 * that beat first, and only a gesture that STARTS with nothing left to scroll
 * in its direction moves to the next one. Sampled at the start, because by the
 * end of a fling the page has reached the edge and every gesture would look
 * like one that meant to leave.
 */
export interface ScrollEdges {
  /** Nothing above: a gesture back may leave this beat. */
  atStart: boolean;
  /** Nothing below: a gesture forward may leave this beat. */
  atEnd: boolean;
}

/**
 * A finger's travel, as a beat move or nothing.
 *
 * `dy` is start minus end, so a finger moving UP the glass is positive — the
 * same direction a page moves to show what is below.
 */
export function swipeDirection(dx: number, dy: number, edges: ScrollEdges): BeatDirection | null {
  if (Math.abs(dy) < SWIPE_MIN_PX) return null;
  // Mostly vertical: a sideways drag is the system's back gesture, or nothing.
  if (Math.abs(dy) < Math.abs(dx) * 1.5) return null;
  if (dy > 0) return edges.atEnd ? "next" : null;
  return edges.atStart ? "prev" : null;
}

/** Wheel delta in pixels, whatever unit the device reported it in. */
export function wheelPixels(deltaY: number, deltaMode: number, viewportHeight: number): number {
  if (deltaMode === 1) return deltaY * 16; // lines
  if (deltaMode === 2) return deltaY * viewportHeight; // pages
  return deltaY;
}

export interface WheelBurst extends ScrollEdges {
  /** Timestamp of the latest event in this burst. */
  last: number;
  /** Travel accumulated before the burst decided anything. */
  travel: number;
  /** Decided already — every later event in the burst is inertia. */
  spent: boolean;
}

/**
 * One wheel event, folded into the gesture it belongs to.
 *
 * Each burst decides once. It accumulates until it has travelled far enough to
 * mean something, then either moves a beat or — when the beat still has
 * something to scroll in that direction — leaves the whole burst to the
 * browser. Either way the rest of the burst is spent.
 */
export function feedWheel(
  burst: WheelBurst | null,
  now: number,
  deltaPx: number,
  edges: ScrollEdges,
): { burst: WheelBurst; fire: BeatDirection | null } {
  const current: WheelBurst =
    burst && now - burst.last <= WHEEL_GAP_MS
      ? { ...burst, last: now }
      : { last: now, travel: 0, spent: false, ...edges };

  if (current.spent) return { burst: current, fire: null };

  current.travel += deltaPx;
  if (Math.abs(current.travel) < WHEEL_MIN_PX) return { burst: current, fire: null };

  current.spent = true;
  const direction: BeatDirection = current.travel > 0 ? "next" : "prev";
  const free = direction === "next" ? current.atEnd : current.atStart;
  return { burst: current, fire: free ? direction : null };
}
