/**
 * Move the page on by one section.
 *
 * Two callers share this and must not drift apart: the scroll cue's chevron,
 * and grace's full-screen tap surface. They are the same promise — "there is
 * more below, and a tap will take you there" — made by a shape and by an
 * invisible control over the same page.
 */

/**
 * Sections that are `position: fixed` are chrome, not content.
 *
 * The consent banner renders as a `<section>` — deliberately, so its text
 * belongs to a landmark — and it is fixed to the bottom of the viewport and
 * last in document order. A reader on the final section of grace has no real
 * section below them, so an unfiltered query matches the banner instead, and
 * `scrollIntoView` on a fixed element does nothing at all. The tap looks broken.
 *
 * The filter runs rather than only scoping to a root because the verdict's
 * re-read document passes no root and hit the same banner.
 */
function isContentSection(section: HTMLElement): boolean {
  return getComputedStyle(section).position !== "fixed";
}

/**
 * Scrolls to the next section below the reader, or on by most of a viewport if
 * there is none. Returns the section it moved to, or null if it used the
 * fallback — callers use that to report which movement was reached.
 *
 * @param root Where to look for sections. Grace passes its own container; the
 *   verdict document has no sections of its own and passes nothing.
 */
export function advanceSection(root?: ParentNode | null): HTMLElement | null {
  if (typeof window === "undefined") return null;

  /*
   * Instant, always — and this is the fix for a whole class of bug rather than
   * a taste.
   *
   * A smooth scroll is an animation the reader cannot cleanly interrupt. Tap,
   * then reach to drag inside those few hundred milliseconds, and the animation
   * wins: measured at 390x844, taking over 120ms in put the page at 15px and it
   * was hauled back to 126 and held. Cancelling on the press got the common
   * case to zero, but the race is structural — every fix is a bet against
   * frames already committed to the compositor.
   *
   * Nothing is lost by removing it. The verdict, which the reader has just
   * tapped through five times, never travels the viewport at all: it replaces
   * its content in place with opacity 0->1 and y 10->0 over 0.55-0.7s. Grace's
   * sections carry the same reveal — translate-y-3/opacity-0 to
   * translate-y-0/opacity-100, 700ms, the same easing token — so a tap that
   * jumps lands on a section that then fades in exactly as a verdict beat does.
   * The glide was the odd one out, not the animation.
   */
  const behavior = "auto" as const;

  /*
   * "Starts in the lower half of the screen" is the test for what is next.
   *
   * `top > 0` is not, and that was the first version's bug: the shell pads the
   * flow by 12px, so the section the reader is ALREADY looking at reports a top
   * of 12 and matched — one tap re-centred the announcement instead of
   * advancing past it.
   */
  /*
   * No in-flight destination to reason about, which is the second thing the
   * instant hop bought. While the scroll was animated, its target spent most of
   * the animation still below half the viewport — so it still answered "what is
   * next", and a second tap re-aimed at the section already being travelled to.
   * That needed a remembered target, a settle deadline and a scrollend listener
   * to correct. Landing immediately, the section a tap arrives at is at the top
   * of the screen and no longer a candidate, so the next tap finds the next one
   * with no bookkeeping at all.
   */
  const next = [...(root ?? document).querySelectorAll("section")].find(
    (section) =>
      isContentSection(section as HTMLElement) &&
      section.getBoundingClientRect().top > window.innerHeight / 2,
  ) as HTMLElement | undefined;

  if (next) {
    /*
     * Move by a SECTION, not by a viewport.
     *
     * A flat 0.9-viewport hop was the first version and it was wrong, because
     * grace's movements are 832, 509, 692, 529, 506, 104, 440 and 248px tall —
     * no fixed distance can land well against that. Measured: one tap put the
     * announcement still occupying the top of the screen AND two movements'
     * text in view at once, which is the opposite of the one-beat-at-a-time
     * reading this argument is built for.
     *
     * Centred rather than aligned to the top: every movement is shorter than
     * the viewport, and each carries 135-241px of its own padding, so aligning
     * tops would park a screenful of empty padding while the words sat below.
     */
    next.scrollIntoView({ block: "center", behavior });
    return next;
  }

  /*
   * No sections below — the verdict's re-read document, which is built from
   * divs and overflows by only 244px. One viewport of scroll clamps at the end
   * of the document there, which is exactly enough to bring its forward control
   * into view.
   */
  window.scrollBy({ top: window.innerHeight * 0.9, behavior });
  return null;
}
