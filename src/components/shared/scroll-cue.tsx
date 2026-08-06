"use client";

import { advanceSection } from "@/lib/advance-section";

/**
 * "There is more below this" — and it answers a tap, not only a scroll.
 *
 * Two screens need it and they must not drift apart, because they are the same
 * promise made twice: grace opens with a full viewport and the argument beneath
 * it, and the verdict in re-read mode puts its only forward control 34px below
 * the fold. Both were measured as false bottoms at 390×844 — a section that
 * fills the viewport exactly, with nothing intruding, reads as the end of the
 * page.
 *
 * Why it moves. Grace's cue used to be a static 10px mark. Static arrows are
 * routinely missed; motion is pre-attentive — the eye is drawn to it without
 * deciding to look. The travel is deliberately small: 6px registers in
 * peripheral vision without competing with the gold headline above it, which is
 * the one thing on that screen that must dominate.
 *
 * Why it is tappable, which is the part that matters most. A chevron under a
 * headline looks like a control, and readers said so — they tapped, and nothing
 * happened. Two ways to read the same shape, and only one of them worked.
 * Rather than spend a word telling people which (a word only helps the reader
 * who reads it, and "tap" would be a lie on a page that scrolls), the cue now
 * honours both: scroll past it, or tap it and be taken down. Neither instinct is
 * punished, which serves the reader who reaches for a gesture that is not there
 * — often the least confident one — better than any label could.
 *
 * It stays OUT of the accessibility tree on purpose, and that is not an
 * oversight. It is a shortcut, never the only route: everything it scrolls to is
 * already in the DOM, in reading order, immediately after it. A screen reader
 * meets the argument itself next and does not need to be told to scroll; a
 * keyboard reader tabs straight to the real controls. Naming it would add a
 * string in two locales to announce a gesture neither of them uses.
 *
 * Reduced motion is handled twice: the bob is stopped in globals.css against
 * `data-slot="scroll-cue"` (stops moving, stays visible — the fact crawl's
 * precedent), and the scroll this performs is instant rather than smooth.
 */
export function ScrollCue({ className = "" }: { className?: string }) {
  function handleActivate(event: React.MouseEvent<HTMLButtonElement>) {
    if (typeof window === "undefined") return;
    /*
     * The hop itself lives in lib/advance-section, because grace's tap surface
     * performs the identical move from an invisible control covering the whole
     * screen. Two copies of "what counts as the next section" is how the shape
     * and the control start disagreeing about where a tap goes.
     */
    /*
     * Clicking a <button> focuses it, and `tabIndex={-1}` does not stop that —
     * it only removes the element from tab order. A FOCUSED aria-hidden element
     * makes the browser refuse the hiding outright ("Blocked aria-hidden on an
     * element because its descendant retained focus"), which puts an unnamed
     * button into the accessibility tree — the precise outcome aria-hidden was
     * chosen to avoid. Caught in the console, not by reading the code.
     *
     * The mousedown handler stops the focus from happening on pointer devices;
     * this blur covers touch, where the focus arrives by a different route.
     */
    event.currentTarget.blur();
    advanceSection();
  }

  return (
    <button
      type="button"
      // Hidden from assistive tech and removed from tab order together: an
      // element that is aria-hidden but still focusable is a keyboard trap that
      // announces nothing. See the note above for why that is the right call
      // here rather than naming it.
      aria-hidden="true"
      tabIndex={-1}
      data-slot="scroll-cue"
      onClick={handleActivate}
      // Keeps the click from focusing it in the first place; see handleActivate.
      onMouseDown={(event) => event.preventDefault()}
      // pointer-events-auto because the verdict places this inside a
      // pointer-events-none overlay, so that the rest of the document below it
      // stays clickable.
      className={`pointer-events-auto flex cursor-pointer flex-col items-center gap-2 bg-transparent p-2 animate-[scroll-cue_2.1s_ease-in-out_infinite] ${className}`}
    >
      <span className="h-8 w-px bg-gradient-to-b from-transparent to-[#D4A843]/40" />
      {/* Two borders on a rotated square. An SVG would need a title to satisfy
          the a11y lint, and titling a decoration is worse than not having one —
          this has no accessible surface at all. */}
      <span className="size-4 rotate-45 border-r border-b border-[#D4A843]/70" />
    </button>
  );
}
